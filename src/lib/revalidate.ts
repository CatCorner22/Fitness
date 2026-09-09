import { revalidatePath } from "next/cache";

function revalidateAll(paths: readonly string[]) {
  for (const path of paths) revalidatePath(path);
}

export function revalidateNutrition() {
  revalidateAll(["/", "/nutrition", "/meal-plan", "/diets", "/settings", "/progress"]);
}

export function revalidateFasting() {
  revalidateAll(["/", "/nutrition", "/meal-plan", "/progress"]);
}

export function revalidateAssessment() {
  revalidateAll(["/", "/onboarding", "/onboarding/assess", "/onboarding/results", "/assess", "/settings"]);
}

export function revalidateCalendar() {
  revalidateAll(["/", "/progress"]);
}
