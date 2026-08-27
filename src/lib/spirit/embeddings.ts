/**
 * Hugging Face semantic retrieval — pattern from sentence-transformers/all-MiniLM-L6-v2 README.
 * Uses HF Inference API feature-extraction when HF_TOKEN is set; falls back to keyword search.
 */

import { KNOWLEDGE_ARTICLES, type KnowledgeArticle } from "@/lib/knowledge/articles";
import type { SearchContext } from "@/lib/knowledge/scoring";
import { scoreArticle } from "@/lib/knowledge/scoring";

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

type EmbeddingCache = Map<string, number[]>;

let articleEmbeddings: EmbeddingCache | null = null;
let embeddingPromise: Promise<EmbeddingCache> | null = null;

function hfToken() {
  return process.env.HF_TOKEN ?? process.env.HUGGINGFACE_HUB_TOKEN ?? "";
}

function articleText(a: KnowledgeArticle) {
  return `${a.title}. ${a.summary}. ${a.body}. ${a.tags.join(" ")}`;
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * One entry per input: either an already-pooled sentence vector ([dim]) or a
 * token matrix ([seq_len][dim]) that needs mean pooling. Returns a normalized
 * vector either way.
 */
function toVector(entry: unknown): number[] | null {
  if (!Array.isArray(entry) || entry.length === 0) return null;
  const matrix = Array.isArray(entry[0]) ? (entry as number[][]) : [entry as number[]];
  const dim = matrix[0]?.length ?? 0;
  if (!dim) return null;
  const mean = new Array<number>(dim).fill(0);
  for (const row of matrix) {
    for (let i = 0; i < dim; i++) mean[i] += row[i]!;
  }
  for (let i = 0; i < dim; i++) mean[i] /= matrix.length;
  const norm = Math.sqrt(mean.reduce((s, v) => s + v * v, 0));
  return norm === 0 ? mean : mean.map((v) => v / norm);
}

/** HF Inference feature-extraction for a batch of texts, one round trip. */
async function embedBatch(texts: string[]): Promise<(number[] | null)[] | null> {
  const token = hfToken();
  if (!token || texts.length === 0) return null;
  try {
    const res = await fetch(
      `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: texts.map((t) => t.slice(0, 2000)),
          options: { wait_for_model: true },
        }),
      },
    );
    if (!res.ok) return null;
    const raw = (await res.json()) as unknown[];
    if (!Array.isArray(raw) || raw.length !== texts.length) return null;
    return raw.map(toVector);
  } catch {
    return null;
  }
}

async function embedText(text: string): Promise<number[] | null> {
  const vectors = await embedBatch([text]);
  return vectors?.[0] ?? null;
}

async function loadArticleEmbeddings(): Promise<EmbeddingCache> {
  const cache: EmbeddingCache = new Map();
  if (!hfToken()) return cache;
  const vectors = await embedBatch(KNOWLEDGE_ARTICLES.map(articleText));
  if (!vectors) return cache;
  KNOWLEDGE_ARTICLES.forEach((article, i) => {
    const vec = vectors[i];
    if (vec) cache.set(article.id, vec);
  });
  return cache;
}

async function getArticleEmbeddings() {
  if (articleEmbeddings) return articleEmbeddings;
  if (!embeddingPromise) embeddingPromise = loadArticleEmbeddings();
  articleEmbeddings = await embeddingPromise;
  return articleEmbeddings;
}

export async function hybridSearchKnowledge(ctx: SearchContext): Promise<KnowledgeArticle[]> {
  const limit = ctx.limit ?? 5;
  const keywordScored = KNOWLEDGE_ARTICLES.map((article) => ({
    article,
    score: scoreArticle(article, ctx),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const query = [ctx.query, ctx.exerciseName, ctx.exerciseId, ...(ctx.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!query || !hfToken()) {
    return keywordScored.slice(0, limit).map((x) => x.article);
  }

  const [queryVec, embeddings] = await Promise.all([embedText(query), getArticleEmbeddings()]);
  if (!queryVec || embeddings.size === 0) {
    return keywordScored.slice(0, limit).map((x) => x.article);
  }

  const semanticScored = KNOWLEDGE_ARTICLES.map((article) => {
    const vec = embeddings.get(article.id);
    const semantic = vec ? cosine(queryVec, vec) : 0;
    const keyword = keywordScored.find((k) => k.article.id === article.id)?.score ?? 0;
    return { article, score: semantic * 10 + keyword };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return semanticScored.slice(0, limit).map((x) => x.article);
}
