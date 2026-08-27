import type { ProfileRow } from "@/lib/auth";
import { isLowEnergy } from "@/lib/assessment/session-adjust";
import { coachContext } from "@/lib/coach/engine";
import { adaptiveCalories } from "@/lib/nutrition/targets";
import { todaysPlan } from "@/lib/today";

type TodayBriefingBits = {
  plan: ReturnType<typeof todaysPlan>;
  checkin: { fatigue?: number | null } | null | undefined;
  deload: { reason: string };
  completed14d: number;
};

export function buildCoachContextSummary(userId: string, profile: ProfileRow) {
  const ctx = coachContext(userId, profile);
  const food = adaptiveCalories(userId, profile);
  const deload = ctx.deload.deload ? `yes — ${ctx.deload.reason}` : ctx.deload.reason;
  const dietBlock = food.diet
    ? `${food.diet.program.name} day ${food.diet.day}/${food.diet.program.durationDays} (${food.diet.phase.name})`
    : "none";
  return [
    `Program: ${ctx.program?.name ?? "none"}, week ${profile.currentWeek}, ${profile.sessionMinutes} min sessions.`,
    `Last 14 days: ${ctx.completed.length} completed, ${ctx.missed.length} skipped.`,
    `Deload: ${deload}`,
    `Goal: ${profile.goal} (${food.goalTitle}: ${food.calories} kcal, ${food.protein} g protein, ${food.carbs} g carbs, ${food.fat} g fat; TDEE ${food.tdee ?? "unknown"} ${food.surplus >= 0 ? "+" : ""}${food.surplus} kcal). Diet block: ${dietBlock}. Fitness check: ${profile.fitnessTier ?? "none"}. Injuries: ${profile.injuries.join(", ") || "none"}.`,
    `Today's energy check-in: ${ctx.checkin?.fatigue ?? "not logged"}/5 (1 wiped · 5 ready).`,
    `Sleep logged today: ${ctx.checkin?.sleepHours ?? "not logged"} hours.`,
  ].join("\n");
}

export function buildTodayContextSummary(userId: string, profile: ProfileRow) {
  const base = buildCoachContextSummary(userId, profile);
  const plan = todaysPlan(userId, profile);
  if (!plan?.planned) {
    return `${base}\n\nToday's session: none scheduled — enroll in a program or rest day.`;
  }
  const p = plan.planned;
  const exerciseLines = p.exercises
    .map(
      (ex) =>
        `- ${ex.exercise.name}: ${ex.sets}×${ex.reps} @ RPE ${ex.targetRpe}${ex.suggestedWeightKg ? ` (~${ex.suggestedWeightKg} kg)` : ""}`,
    )
    .join("\n");
  const timeNote = p.overTimeBudget ? " (full session is longer than the clock cap — no drills dropped)" : "";
  const status = plan.open
    ? "workout in progress — resume when ready."
    : plan.allDone
      ? "week complete."
      : "ready to start.";
  return `${base}

Today's planned session: ${p.program.name} · ${p.day.name} · week ${p.week} · ${p.phase.name}
Focus: ${p.day.focus}
Estimated: ~${p.estimatedMinutes} min${timeNote}
Exercises:
${exerciseLines}
Status: ${status}`;
}

export function offlineBriefing(userId: string, profile: ProfileRow, bits?: TodayBriefingBits) {
  const ctx = bits
    ? null
    : coachContext(userId, profile);
  const plan = bits?.plan ?? todaysPlan(userId, profile);
  const completed = bits?.completed14d ?? ctx?.completed.length ?? 0;
  const deloadReason = bits?.deload.reason ?? ctx?.deload.reason ?? "";
  const energy = bits?.checkin?.fatigue ?? ctx?.checkin?.fatigue;
  const lines = [
    `*stretches paws* You're on ${plan?.program.name ?? "no program"}, week ${profile.currentWeek}.`,
    `${completed} sessions in 14 days. ${deloadReason}`,
  ];
  if (plan?.planned && !plan.allDone) {
    lines.push(`Today: ${plan.planned.day.name} — ${plan.planned.day.focus}. ~${plan.planned.estimatedMinutes} min.`);
    if (isLowEnergy(energy)) {
      lines.push("Energy is low — keep every listed drill, lighter and honest RPE.");
    }
  }
  return lines.join("\n\n");
}
