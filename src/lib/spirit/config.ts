// Spirit coach deployment config — SuperByte-inspired gates without the dental cage detail.

export const SPIRIT_UNAVAILABLE =
  "*ears flatten* Signal lost on the mountain. Rules engine has you — log the set and keep moving.";

export type SpiritConfig = {
  enabled: boolean;
  liveModel: string;
  chatModel: string;
  hfFallbackModel: string | null;
  reads: number;
  semanticSearch: boolean;
};

export function getSpiritConfig(env: Record<string, string | undefined> = process.env): SpiritConfig {
  const gateway = Boolean(env.AI_GATEWAY_API_KEY);
  const openai = Boolean(env.OPENAI_API_KEY);
  const hf = Boolean(env.HF_TOKEN || env.HUGGINGFACE_HUB_TOKEN);
  return {
    enabled: gateway || openai,
    liveModel: env.GARANIMAL_LIVE_MODEL ?? env.GARANIMAL_AI_MODEL ?? "openai/gpt-5.4",
    chatModel: env.GARANIMAL_CHAT_MODEL ?? env.GARANIMAL_AI_MODEL ?? "openai/gpt-5.4",
    hfFallbackModel: hf ? (env.GARANIMAL_HF_MODEL ?? "Qwen/Qwen2.5-7B-Instruct") : null,
    reads: resolveReads(env),
    semanticSearch: hf,
  };
}

export function resolveReads(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.SPIRIT_READS);
  if (!Number.isInteger(n)) return 1;
  return Math.min(3, Math.max(1, n));
}

export function aiEnabled(env: Record<string, string | undefined> = process.env) {
  return getSpiritConfig(env).enabled;
}
