import { createGateway } from "@ai-sdk/gateway";
import { getPioneerConfig } from "./config";

let gateway: ReturnType<typeof createGateway> | null = null;

function getGateway() {
  if (!gateway) {
    gateway = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.OPENAI_API_KEY,
    });
  }
  return gateway;
}

export function modelForPioneer(env: Record<string, string | undefined> = process.env) {
  const id = getPioneerConfig(env).model;
  const normalized = id.includes("/") ? id : `openai/${id}`;
  return getGateway()(normalized);
}
