import type { AssessmentInput, AssessmentResult } from "./types";

function num(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseAssessment(raw: string | null | undefined): AssessmentResult | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as AssessmentResult;
    if (!value || !Array.isArray(value.domains)) return null;
    return value;
  } catch {
    return null;
  }
}

export function inputFromForm(
  form: FormData,
  profile: { age: number | null; sex: "female" | "male" | "unspecified"; heightCm: number | null; weightKg: number | null },
): AssessmentInput {
  const skipAll = String(form.get("skipAll") || "") === "1";
  const parqStop = String(form.get("parqStop") || "") === "1";
  const modeRaw = String(form.get("aerobicMode") || "skip");
  const aerobicMode = modeRaw === "walk6" || modeRaw === "step2" ? modeRaw : "skip";
  const laps = num(form.get("walkLaps"));
  const lapM = num(form.get("walkLapMeters"));
  const walkDirect = num(form.get("walkMeters"));
  const walkMeters = walkDirect ?? (laps != null && lapM != null ? laps * lapM : null);
  const squat = num(form.get("squatQuality"));
  const shoulder = num(form.get("shoulderReach"));
  const style = String(form.get("pushupStyle") || "toes") === "knees" ? "knees" : "toes";

  return {
    age: profile.age,
    sex: profile.sex,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    parqStop,
    skippedAll: skipAll,
    aerobicMode: skipAll || parqStop ? "skip" : aerobicMode,
    walkMeters: skipAll || parqStop ? null : walkMeters,
    stepCount: skipAll || parqStop ? null : num(form.get("stepCount")),
    pushups: skipAll || parqStop ? null : num(form.get("pushups")),
    pushupStyle: style,
    chairStand: skipAll || parqStop ? null : num(form.get("chairStand")),
    plankSeconds: skipAll || parqStop ? null : num(form.get("plankSeconds")),
    singleLegSeconds: skipAll || parqStop ? null : num(form.get("singleLegSeconds")),
    squatQuality: squat === 1 || squat === 2 || squat === 3 ? squat : null,
    shoulderReach: shoulder === 1 || shoulder === 2 || shoulder === 3 ? shoulder : null,
  };
}
