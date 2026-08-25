import type { ProfileRow } from "@/lib/auth";
import { coachContext } from "@/lib/coach/engine";
import { adaptiveCalories } from "@/lib/nutrition/targets";
import { todaysPlan } from "@/lib/today";

export function buildCoachContextSummary(userId: string, profile: ProfileRow) {
  const ctx = coachContext(userId, profile);
  const food = adaptiveCalories(userId, profile);
  return `Program: ${ctx.program?.name ?? "none"}, week ${profile.currentWeek}, ${profile.sessionMinutes} min sessions.
Last 14 days: ${ctx.completed.length} completed, ${ctx.missed.length} skipped.
Deload: ${ctx.deload.deload ? "yes — " + ctx.deload.reason : ctx.deload.reason}
Goal: ${profile.goal} (${food.goalTitle}: ${food.calories} kcal, ${food.protein} g protein, ${food.carbs} g carbs, ${food.fat} g fat; TDEE ${food.tdee ?? "unknown"} ${food.surplus >= 0 ? "+" : ""}${food.surplus} kcal). Diet block: ${food.diet ? `${food.diet.program.name} day ${food.diet.day}/${food.diet.program.durationDays} (${food.diet.phase.name})` : "none"}. Fitness check: ${profile.fitnessTier ?? "none"}. Injuries: ${profile.injuries.join(", ") || "none"}.
Today's fatigue check-in: ${ctx.checkin?.fatigue ?? "not logged"}/5.
Sleep logged today: ${ctx.checkin?.sleepHours ?? "not logged"} hours.`;
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
  return `${base}

Today's planned session: ${p.program.name} · ${p.day.name} · week ${p.week} · ${p.phase.name}
Focus: ${p.day.focus}
Estimated: ~${p.estimatedMinutes} min${p.overTimeBudget ? " (full session is longer than the clock cap — no drills dropped)" : ""}
Exercises:
${exerciseLines}
${plan.open ? "Status: workout in progress — resume when ready." : plan.allDone ? "Status: week complete." : "Status: ready to start."}`;
}

export function offlineBriefing(userId: string, profile: ProfileRow) {
  const ctx = coachContext(userId, profile);
  const plan = todaysPlan(userId, profile);
  const lines = [
    `*stretches paws* You're on ${ctx.program?.name ?? "no program"}, week ${profile.currentWeek}.`,
    `${ctx.completed.length} sessions in 14 days. ${ctx.deload.reason}`,
  ];
  if (plan?.planned && !plan.allDone) {
    lines.push(
      `Today: ${plan.planned.day.name} — ${plan.planned.day.focus}. ~${plan.planned.estimatedMinutes} min.`,
    );
    if (ctx.checkin?.fatigue && ctx.checkin.fatigue >= 4) {
      lines.push("Fatigue is high — keep every listed drill, lighter and honest RPE.");
    }
  }
  return lines.join("\n\n");
}

export function coachMetaSuffix(citeIds: string[]) {
  return citeIds.length ? `\n\n<!-- spirit-meta: ${JSON.stringify({ citeIds })} -->` : "";
}

export { parseCoachMeta, textFromUIMessageParts } from "./client-utils";
