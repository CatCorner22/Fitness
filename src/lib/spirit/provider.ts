import { createGateway } from "@ai-sdk/gateway";
import { getSpiritConfig } from "./config";

let gateway: ReturnType<typeof createGateway> | null = null;

function getGateway() {
  if (!gateway) {
    gateway = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.OPENAI_API_KEY,
    });
  }
  return gateway;
}

export function resolveModelId(tier: "live" | "chat", env: Record<string, string | undefined> = process.env) {
  const cfg = getSpiritConfig(env);
  return tier === "live" ? cfg.liveModel : cfg.chatModel;
}

export function modelForTier(tier: "live" | "chat") {
  const id = resolveModelId(tier);
  const normalized = id.includes("/") ? id : `openai/${id}`;
  return getGateway()(normalized);
}

export function modelLabel(env: Record<string, string | undefined> = process.env) {
  const cfg = getSpiritConfig(env);
  const parts = [cfg.liveModel];
  if (cfg.semanticSearch) parts.push("HF:MiniLM embeddings");
  return parts.join(" · ");
}
