import { generateText, Output } from "ai";
import { formatKnowledgeForPrompt, searchKnowledgeAsync } from "@/lib/knowledge/search";
import { getPioneerConfig, PIONEER_MAX_CHARS, PIONEER_MIN_CHARS } from "./config";
import { mergeConsensus, mergeLayers } from "./consensus";
import { formatHouseholdBlock } from "./context";
import { detectInputEscape, detectOutputEscape } from "./escape";
import { gaugesToMood, instrumentObservations, measurePioneerGauges, statusLineFor } from "./instrument";
import { isPioneerKilled } from "./ladder";
import { recordPioneerEscape, readLadder } from "./persist-ladder";
import { findIdentifyingInfo } from "./privacy";
import { pioneerSystemPrompt, pioneerUserPrompt } from "./prompts";
import { modelForPioneer } from "./provider";
import { lensesFor, resolvePioneerProfile, strictPromptAddendum } from "./router";
import { PioneerReadSchema, type PioneerRead } from "./schemas";
import { parseDraftSignals } from "./signals";
import { ALLOWED_SOURCES } from "./sources";
import { PIONEER_PROMPT_VERSION, type PioneerHousehold, type PioneerKind, type PioneerObserveResult } from "./types";
import { verifyObservation } from "./verify";

function sourceList() {
  return [...ALLOWED_SOURCES, "Garanimal:<article-id>"].join(", ");
}

function instrumentOnly(
  status: PioneerObserveResult["status"],
  input: {
    text: string;
    kind: PioneerKind;
    household: PioneerHousehold;
    minChars: number;
  },
): PioneerObserveResult {
  const signals = parseDraftSignals(input.text, input.kind);
  const gauges = measurePioneerGauges(input.text, input.household, signals);
  const observations = instrumentObservations(input.text, input.household, signals, gauges);
  return {
    status,
    layer: "instrument",
    observations,
    gauges,
    mood: status === "unavailable" || status === "dark" ? "dark" : gaugesToMood(gauges),
    profile: resolvePioneerProfile(signals, input.household).id,
    reads: 0,
    promptVersion: PIONEER_PROMPT_VERSION,
    statusLine: statusLineFor({
      status,
      kind: input.kind,
      charCount: signals.charCount,
      minChars: input.minChars,
    }),
  };
}

async function readOnce(system: string, prompt: string): Promise<PioneerRead | null> {
  try {
    const result = await generateText({
      model: modelForPioneer(),
      output: Output.object({ schema: PioneerReadSchema }),
      system,
      prompt,
    });
    return result.output;
  } catch {
    return null;
  }
}

export async function observePioneer(input: {
  text: string;
  kind?: PioneerKind;
  household: PioneerHousehold;
  extraNames?: string[];
  allowPioneer: boolean;
}): Promise<PioneerObserveResult> {
  const cfg = getPioneerConfig();
  const text = input.text.slice(0, PIONEER_MAX_CHARS);
  const kind = input.kind ?? parseDraftSignals(text).kind;
  const base = { text, kind, household: input.household, minChars: cfg.minChars };

  const ladder = readLadder();
  if (isPioneerKilled(ladder) || !cfg.enabled) {
    return instrumentOnly("unavailable", base);
  }
  if (!input.allowPioneer) {
    return instrumentOnly("dark", base);
  }

  const signals = parseDraftSignals(text, kind);
  if (signals.charCount < cfg.minChars) {
    return instrumentOnly("waiting", base);
  }

  const privacy = findIdentifyingInfo(text, input.extraNames ?? []);
  const escapeIn = detectInputEscape(text);
  if (privacy.hit || escapeIn.hit) {
    return instrumentOnly("refused", base);
  }

  const profile = resolvePioneerProfile(signals, input.household);
  const gauges = measurePioneerGauges(text, input.household, signals);
  const instrument = instrumentObservations(text, input.household, signals, gauges);

  const articles = await searchKnowledgeAsync({
    query: text.slice(0, 400),
    goal: input.household.goal,
    programId: input.household.programId ?? undefined,
    injuries: input.household.injuries,
    tags: kind === "nutrition" ? ["nutrition", "protein", "diet"] : ["rpe", "volume", "safety"],
    limit: 6,
  });

  const lenses = lensesFor(kind, profile);
  const reads = Math.min(3, Math.max(profile.minReads, cfg.reads));
  const systemFor = (lens: string) =>
    pioneerSystemPrompt({
      knowledgeBlock: formatKnowledgeForPrompt(articles),
      householdBlock: formatHouseholdBlock(input.household),
      sourceList: sourceList(),
      strictAddendum: strictPromptAddendum(profile),
      lens,
    });
  const prompt = pioneerUserPrompt(text);

  const rawReads: PioneerRead[] = [];
  for (let i = 0; i < reads; i++) {
    const raw = await readOnce(systemFor(lenses[i % lenses.length]!), prompt);
    if (raw) rawReads.push(raw);
  }

  if (rawReads.length === 0) {
    return instrumentOnly("instrument", base);
  }

  let escaped = false;
  const verifiedReads = rawReads.map((read) => {
    const blob = JSON.stringify(read);
    if (detectOutputEscape(blob).hit) {
      escaped = true;
      return [];
    }
    return read.observations
      .map((row) => verifyObservation(row, text))
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  });

  if (escaped) {
    const next = recordPioneerEscape();
    return instrumentOnly(isPioneerKilled(next) ? "unavailable" : "refused", base);
  }

  const merged = mergeConsensus(verifiedReads, profile);
  if (profile.unanimous && reads > 1 && !merged.observations.length) {
    return {
      ...instrumentOnly("instrument", base),
      reads: rawReads.length,
    };
  }

  const observations = mergeLayers(instrument, merged.observations);
  return {
    status: merged.observations.length ? "pioneer" : "instrument",
    layer: merged.observations.length ? "pioneer" : "instrument",
    observations,
    gauges,
    mood: gaugesToMood(gauges),
    profile: profile.id,
    reads: rawReads.length,
    corroboration: merged.corroboration,
    promptVersion: PIONEER_PROMPT_VERSION,
    statusLine: statusLineFor({
      status: merged.observations.length ? "pioneer" : "instrument",
      kind,
      charCount: signals.charCount,
      minChars: cfg.minChars,
    }),
  };
}

export function localPioneerRead(input: {
  text: string;
  kind?: PioneerKind;
  household: PioneerHousehold;
  minChars?: number;
}): PioneerObserveResult {
  const minChars = input.minChars ?? PIONEER_MIN_CHARS;
  const kind = input.kind ?? parseDraftSignals(input.text).kind;
  return instrumentOnly("instrument", {
    text: input.text,
    kind,
    household: input.household,
    minChars,
  });
}
