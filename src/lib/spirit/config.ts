// Spirit coach deployment config — SuperByte-inspired gates without the dental cage detail.

export type SpiritConfig = {
  enabled: boolean;
  liveModel: string;
  chatModel: string;
  reads: number;
};

export function getSpiritConfig(env: Record<string, string | undefined> = process.env): SpiritConfig {
  return {
    // Only a Vercel AI Gateway key enables live mode; other provider keys
    // (OpenAI, HF) cannot authenticate against the gateway and would make
    // every AI call fail while the app claims AI is on.
    enabled: Boolean(env.AI_GATEWAY_API_KEY),
    liveModel: env.GARANIMAL_LIVE_MODEL ?? env.GARANIMAL_AI_MODEL ?? "openai/gpt-5.4",
    chatModel: env.GARANIMAL_CHAT_MODEL ?? env.GARANIMAL_AI_MODEL ?? "openai/gpt-5.4",
    reads: resolveReads(env),
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
