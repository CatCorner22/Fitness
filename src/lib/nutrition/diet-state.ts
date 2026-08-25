import type { ProfileRow } from "@/lib/auth";
import { todayISO } from "@/lib/utils";
import {
  calorieFloorFor,
  getDiet,
  type DietPhase,
  type DietProgram,
} from "@/lib/nutrition/diets";

export type ActiveDiet = {
  program: DietProgram;
  phase: DietPhase;
  day: number;
  week: number;
  finished: boolean;
  daysLeft: number;
};

function daysBetween(fromIsoDate: string, toIsoDate: string) {
  const from = Date.parse(`${fromIsoDate}T00:00:00`);
  const to = Date.parse(`${toIsoDate}T00:00:00`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.round((to - from) / 86400000));
}

export function activeDiet(profile: Pick<ProfileRow, "activeDietId" | "dietStartDate">): ActiveDiet | null {
  const program = getDiet(profile.activeDietId);
  if (!program) return null;
  const start = profile.dietStartDate ?? todayISO();
  const elapsed = daysBetween(start, todayISO());
  const day = elapsed + 1;
  const finished = day > program.durationDays;
  const clamped = Math.min(Math.max(1, day), program.durationDays);
  const phase =
    program.phases.find((p) => clamped >= p.startDay && clamped <= p.endDay) ??
    program.phases[program.phases.length - 1];
  return {
    program,
    phase,
    day: finished ? program.durationDays : clamped,
    week: Math.min(Math.ceil(clamped / 7), Math.ceil(program.durationDays / 7)),
    finished,
    daysLeft: Math.max(0, program.durationDays - elapsed),
  };
}

export function dietCalorieFloor(profile: Pick<ProfileRow, "sex" | "activeDietId">) {
  return calorieFloorFor(profile.sex, profile.activeDietId);
}
