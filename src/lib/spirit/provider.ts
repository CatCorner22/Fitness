import { createGateway } from "@ai-sdk/gateway";
import { getSpiritConfig } from "./config";

let gateway: ReturnType<typeof createGateway> | null = null;

function getGateway() {
  if (!gateway) {
    gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
  }
  return gateway;
}

export function modelForTier(tier: "live" | "chat") {
  const cfg = getSpiritConfig();
  const id = tier === "live" ? cfg.liveModel : cfg.chatModel;
  const normalized = id.includes("/") ? id : `openai/${id}`;
  return getGateway()(normalized);
}
