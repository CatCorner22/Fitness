/**
 * Hugging Face semantic retrieval — pattern from sentence-transformers/all-MiniLM-L6-v2 README.
 * Uses HF Inference API feature-extraction when HF_TOKEN is set; falls back to keyword search.
 */

import { KNOWLEDGE_ARTICLES, type KnowledgeArticle } from "@/lib/knowledge/articles";
import type { SearchContext } from "@/lib/knowledge/search";
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

/** HF Inference feature-extraction — returns mean-pooled normalized vector. */
export async function embedText(text: string): Promise<number[] | null> {
  const token = hfToken();
  if (!token) return null;
  try {
    const res = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text.slice(0, 2000), options: { wait_for_model: true } }),
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as number[][] | number[][][];
    // Response: [seq_len][384] or [[seq_len][384]] for batch
    const tokens = Array.isArray(raw[0]?.[0]) ? (raw[0] as number[][]) : (raw as number[][]);
    if (!tokens?.length || !tokens[0]?.length) return null;
    const dim = tokens[0].length;
    const mean = new Array(dim).fill(0);
    for (const tok of tokens) {
      for (let i = 0; i < dim; i++) mean[i] += tok[i]!;
    }
    for (let i = 0; i < dim; i++) mean[i] /= tokens.length;
    const norm = Math.sqrt(mean.reduce((s, v) => s + v * v, 0));
    return norm === 0 ? mean : mean.map((v) => v / norm);
  } catch {
    return null;
  }
}

async function loadArticleEmbeddings(): Promise<EmbeddingCache> {
  const cache: EmbeddingCache = new Map();
  if (!hfToken()) return cache;
  for (const article of KNOWLEDGE_ARTICLES) {
    const vec = await embedText(articleText(article));
    if (vec) cache.set(article.id, vec);
  }
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

export { HF_MODEL };
