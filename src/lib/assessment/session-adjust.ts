import { and, eq } from "drizzle-orm";
import { shouldDeload } from "@/lib/autoregulation";
import { db } from "@/lib/db";
import { dailyCheckins } from "@/lib/db/schema";
import { todayISO } from "@/lib/utils";
import { planAdjustFromAssessment } from "./plan-adjust";
import type { AssessmentResult, FitnessPlanAdjust } from "./types";

/** Scale is 1 wiped → 5 ready (recovery, not subjective fatigue). */
export function isLowEnergy(energy: number | null | undefined): boolean {
  return energy != null && energy <= 2;
}

function mergeAdjust(base: FitnessPlanAdjust, extra: Partial<FitnessPlanAdjust>): FitnessPlanAdjust {
  return {
    rpeAdjust: base.rpeAdjust + (extra.rpeAdjust ?? 0),
    accessorySetAdjust: base.accessorySetAdjust + (extra.accessorySetAdjust ?? 0),
    restMultiplier: base.restMultiplier * (extra.restMultiplier ?? 1),
    squatSwap: extra.squatSwap ?? base.squatSwap,
    pressSwap: extra.pressSwap ?? base.pressSwap,
    avoidSingleLeg: base.avoidSingleLeg || (extra.avoidSingleLeg ?? false),
    easyCardio: base.easyCardio || (extra.easyCardio ?? false),
    addPlank: base.addPlank || (extra.addPlank ?? false),
    addWalk: base.addWalk || (extra.addWalk ?? false),
    notes: [...base.notes, ...(extra.notes ?? [])],
  };
}

export type SessionSignals = {
  energy?: number | null;
  deload?: { deload: boolean; reason: string };
};

function todayEnergy(userId: string): number | null {
  const row = db
    .select()
    .from(dailyCheckins)
    .where(and(eq(dailyCheckins.userId, userId), eq(dailyCheckins.date, todayISO())))
    .get();
  return row?.fatigue ?? null;
}

export function planAdjustForSession(
  userId: string,
  assessment: AssessmentResult | null,
  signals?: SessionSignals,
): FitnessPlanAdjust {
  let adjust = planAdjustFromAssessment(assessment);
  const energy = signals && "energy" in signals ? signals.energy : todayEnergy(userId);

  if (isLowEnergy(energy)) {
    adjust = mergeAdjust(adjust, {
      rpeAdjust: energy === 1 ? -1 : -0.5,
      restMultiplier: 1.15,
      easyCardio: energy === 1,
      notes: [
        energy === 1
          ? "Energy check-in: wiped — lighter loads, longer rest, honest RPE."
          : "Energy check-in: low — leave an extra rep in the tank.",
      ],
    });
  }

  const deload = signals?.deload ?? shouldDeload(userId);
  if (deload.deload) {
    adjust = mergeAdjust(adjust, {
      rpeAdjust: -1,
      accessorySetAdjust: -1,
      restMultiplier: 1.1,
      notes: [deload.reason],
    });
  }

  return adjust;
}
