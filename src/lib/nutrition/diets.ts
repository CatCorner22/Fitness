import type { DietId, Goal } from "@/lib/types";

export type DietPhase = {
  startDay: number;
  endDay: number;
  name: string;
  /** kcal added to TDEE. Negative is a cut. */
  delta: number;
  proteinPerKg: number;
  carbRatio: number;
  fatRatio: number;
  note: string;
  trainingNote: string;
};

export type DietProgram = {
  id: DietId;
  name: string;
  tagline: string;
  category: "Cut" | "Surplus" | "Recomp" | "Reverse" | "Peak" | "Pattern";
  durationDays: number;
  description: string;
  evidenceNote: string;
  honestNote: string;
  /** Shown when the block's calendar is done. Defaults to reverse/recomp copy. */
  afterNote?: string;
  recommendedFor: Goal[];
  mealPlanIds: string[];
  /** Male contest-style peak. Still visible to everyone, with a hard warning. */
  extremeLean: boolean;
  phases: DietPhase[];
};

function phase(
  startDay: number,
  endDay: number,
  name: string,
  delta: number,
  proteinPerKg: number,
  carbRatio: number,
  fatRatio: number,
  note: string,
  trainingNote: string,
): DietPhase {
  return { startDay, endDay, name, delta, proteinPerKg, carbRatio, fatRatio, note, trainingNote };
}

export const DIET_PROGRAMS: DietProgram[] = [
  {
    id: "steady_cut",
    name: "Steady cut",
    tagline: "0.5–1% bodyweight a week. Protein high. A diet break at the end.",
    category: "Cut",
    durationDays: 84,
    description:
      "A 12-week fat-loss block. The deficit starts modest so training stays decent, then steps down. Week 12 is a maintenance diet break — not a binge, and not another cut week.",
    evidenceNote:
      "Helms et al. 2014: contest-prep loss of ~0.5–1% BW/week preserves more lean mass than crash cuts. Protein 1.8–2.7 g/kg (higher when leaner). Garthe 2011: slower cuts kept more LBM in athletes.",
    honestNote:
      "This will not take you to stage-lean in 12 weeks unless you started close. If the scale stalls 10+ days, the issue is usually logging, not a new crash protocol.",
    recommendedFor: ["bodybuilding", "general", "glute_specialization", "pole_stage"],
    mealPlanIds: ["cut-protein", "plant-forward", "stage-fuel"],
    extremeLean: false,
    phases: [
      phase(1, 28, "Ease in", -300, 2.0, 0.42, 0.28, "About 300 kcal under TDEE. Hold protein. Carbs around training.", "Keep main lifts. Drop junk isolation if sessions feel cooked."),
      phase(29, 56, "Working deficit", -400, 2.1, 0.4, 0.28, "A bit hungrier. Still a training diet, not a cleanse.", "RPE on compounds stays honest. No extra HIIT to 'earn' food."),
      phase(57, 77, "Leaner weeks", -450, 2.2, 0.38, 0.28, "Highest protein. If gym performance falls apart, the deficit is too big — not a willpower test.", "Optional isolation first. Keep squat/hinge/push/pull."),
      phase(78, 84, "Diet break", 0, 2.0, 0.45, 0.28, "Maintenance for a week. Water and glycogen come back. That is not fat.", "Train normally. This week is for the next block, not a PR hunt."),
    ],
  },
  {
    id: "mini_cut",
    name: "Mini-cut",
    tagline: "Four weeks. Already-lean people who need a short reset.",
    category: "Cut",
    durationDays: 28,
    description:
      "A 4-week aggressive-but-capped deficit for people who are already reasonably lean and want to shed a bulk. Then stop. Enroll Reverse or Steady cut — do not chain mini-cuts.",
    evidenceNote:
      "Mini-cuts (≈2–6 weeks) are a bodybuilding tool to limit time in a deficit (Helms; common in evidence-based prep). They are not a first diet for someone with a lot of fat to lose — use Steady cut.",
    honestNote:
      "If you are not already somewhat lean, this is the wrong block. Four weeks cannot rewrite a year of surplus.",
    recommendedFor: ["bodybuilding", "powerlifting", "glute_specialization"],
    mealPlanIds: ["cut-protein", "stage-fuel"],
    extremeLean: false,
    phases: [
      phase(1, 21, "Short deficit", -500, 2.2, 0.38, 0.28, "About 500 kcal under TDEE, floored so you still eat. Protein first.", "Keep volume, shave intensity a notch. No max-effort singles."),
      phase(22, 28, "Ease out", -250, 2.1, 0.42, 0.28, "Halve the deficit so the rebound is food, not a weekend wipeout.", "Train as usual. Next: Reverse or maintenance."),
    ],
  },
  {
    id: "lean_bulk",
    name: "Lean bulk",
    tagline: "Small surplus. Muscle with as little extra fat as patience allows.",
    category: "Surplus",
    durationDays: 84,
    description:
      "Twelve weeks at roughly +200–250 kcal. Protein stays high. The last week is maintenance so you can see what you actually built.",
    evidenceNote:
      "Surpluses above ~300–500 kcal mostly add fat once protein and training are in place (Slater, Helms). Novices can grow near maintenance; intermediates need a small surplus. Protein ~1.6–2.2 g/kg (Morton 2018).",
    honestNote:
      "If the scale is not moving for three weeks, bump food slightly. If you are gaining faster than ~0.25–0.5% BW/week, you are not 'lean bulking.'",
    recommendedFor: ["bodybuilding", "powerlifting", "glute_specialization", "general"],
    mealPlanIds: ["hypertrophy-high-carb", "glute-rebuild", "strength-plate"],
    extremeLean: false,
    phases: [
      phase(1, 56, "Build", 200, 1.9, 0.5, 0.25, "+200 kcal. Carbs around lifting. Sleep still grows more muscle than a second dessert.", "Progressive overload. This is the block to add sets or load."),
      phase(57, 77, "Push", 250, 1.9, 0.52, 0.24, "Slightly more food if recovery is good. Not a dirty bulk.", "Peak volume of the year lives here — not during a cut."),
      phase(78, 84, "Look around", 0, 1.8, 0.48, 0.26, "Maintenance week. Scale noise settles. Then decide: more bulk, mini-cut, or hold.", "Deload optional. Keep technique sharp."),
    ],
  },
  {
    id: "recomp",
    name: "Recomp / hold",
    tagline: "Maintenance calories. High protein. Slow body-composition change.",
    category: "Recomp",
    durationDays: 56,
    description:
      "Eight weeks at TDEE. Useful for pole/stage, first training months, or anyone who wants to look better without a dedicated cut or bulk.",
    evidenceNote:
      "Recomp is most real in novices, people returning from a layoff, and those with more fat to lose (Barakat 2020 review). Lean intermediates should pick a surplus or a cut instead of waiting for magic.",
    honestNote:
      "The scale may not move. Photos and lifts will. If nothing changes in eight weeks, you were not at maintenance — log food and weigh-ins.",
    recommendedFor: ["general", "pole_stage", "strength_endurance"],
    mealPlanIds: ["stage-fuel", "plant-forward", "strength-plate"],
    extremeLean: false,
    phases: [
      phase(1, 56, "Hold and train", 0, 2.0, 0.45, 0.28, "Match expenditure. Protein 2 g/kg. Put carbs near the sessions that matter.", "This is a training block. Let the gym do the composition work."),
    ],
  },
  {
    id: "reverse",
    name: "Reverse diet",
    tagline: "Climb out of a deficit without handing the fat back overnight.",
    category: "Reverse",
    durationDays: 56,
    description:
      "Eight weeks from a cut toward maintenance, then a small surplus. Weight will jump in week 1 from glycogen and water. That is expected.",
    evidenceNote:
      "Metabolic adaptation is mostly reduced NEAT and a smaller body (Trexler 2014; Rosenbaum & Leibel). 'Reverse dieting' as a special metabolism hack is oversold — adding food slowly is still the sane way to stop a cut.",
    honestNote:
      "If you just finished a peak or mini-cut, start here. Do not jump from 1500 kcal to a bulk on Monday.",
    recommendedFor: ["bodybuilding", "general", "glute_specialization", "pole_stage"],
    mealPlanIds: ["reverse-plate", "hypertrophy-high-carb", "plant-forward"],
    extremeLean: false,
    phases: [
      phase(1, 14, "First food", -150, 2.0, 0.45, 0.28, "Still a little under TDEE. Hunger should ease. Scale up 1–3 lb is water/glycogen.", "Performance should start returning. Keep loads sane."),
      phase(15, 28, "Near hold", -50, 1.9, 0.48, 0.26, "Almost maintenance. If you are still ravenous, the jump was too small — add another 100 kcal.", "Train like a bulk is coming."),
      phase(29, 42, "Maintenance", 0, 1.8, 0.48, 0.26, "True hold. This is the new normal, not a pause before another crash.", "Volume can climb."),
      phase(43, 56, "Tiny surplus", 100, 1.8, 0.5, 0.25, "Optional lean-bulk on-ramp. Skip this phase if you just wanted off the cut.", "Now you may push hypertrophy."),
    ],
  },
  {
    id: "beach_week",
    name: "Beach / photo week",
    tagline: "14 days. Look a bit tighter if you are already lean. Not a 6% transformation.",
    category: "Peak",
    durationDays: 14,
    description:
      "A short, time-capped deficit for a trip or a photo. Sodium and carbs stay consistent so you do not look flat one day and bloated the next. No water cut, no diuretics, no 24-hour starvation.",
    evidenceNote:
      "Peak-week tricks (carb deplete/load, water cut) have thin evidence and a real cramp/faint risk (Chappell contest-prep reviews; Helms). Most of the 'whoosh' in two weeks is glycogen, gut content, and a modest fat drop if you were already lean.",
    honestNote:
      "If you cannot see abs in indoor lighting, this will not make you stage-lean on the sand. Use Steady cut. Women: do not chase 6% body fat — essential fat is roughly 10–13%.",
    recommendedFor: ["bodybuilding", "general", "pole_stage", "glute_specialization"],
    mealPlanIds: ["peak-lean", "cut-protein"],
    extremeLean: false,
    phases: [
      phase(
        1,
        10,
        "Tighten",
        -400,
        2.2,
        0.36,
        0.28,
        "High protein, slightly less starch, same salt pattern every day. Drink normally.",
        "Do not add extra cardio to panic. Keep your usual sessions a bit easier.",
      ),
      phase(
        11,
        14,
        "Show up",
        -250,
        2.2,
        0.4,
        0.28,
        "Ease the deficit. Eat the meals. Sleep. A giant carb binge the night before a photo often looks worse, not better.",
        "Walk. Do not test a 1RM. After day 14, enroll Reverse or Recomp.",
      ),
    ],
  },
  {
    id: "stage_lean",
    name: "Stage lean (short peak)",
    tagline: "Three weeks toward contest-day leanness. Men, already lean, then reverse. Not a lifestyle.",
    category: "Peak",
    durationDays: 21,
    description:
      "A 21-day peak for people who are already very lean and want a short window near contest condition — including the sub-6% look some men chase for a stage or a shoot. Calories stay floored. There is no water cut in this app.",
    evidenceNote:
      "Male stage condition is often ~5–8% BF and is not a health target (Helms 2014; Chappell). DEXA/calipers routinely miss by 2–3%. Female essential fat is ~10–13%; sub-6% in women is a medical problem, not a goal. Protein 2.3–3.1 g/kg FFM is the contest-prep band (Helms). After peak: reverse. Trexler: most 'metabolic damage' talk is adaptation plus a smaller body.",
    honestNote:
      "Do not start this from average body fat. If you are not already ~8–10% (men) with abs in normal light, this is the wrong plan — use Steady cut. Women should use Beach week or Steady cut, not a 6% target. Stop for dizziness, missed periods, chest pain, fainting, or an eating-disorder history. This block ends on day 21; the next click is Reverse.",
    recommendedFor: ["bodybuilding"],
    mealPlanIds: ["peak-lean", "cut-protein"],
    extremeLean: true,
    phases: [
      phase(
        1,
        14,
        "Contest deficit",
        -550,
        2.4,
        0.34,
        0.28,
        "Hardest legal deficit in this app, still above the calorie floor. Protein is the main food. Carbs on lift days if you have calories left.",
        "Maintenance of strength, not PRs. Cut optional sets. No extra fasted cardio stack.",
      ),
      phase(
        15,
        21,
        "Hold the look",
        -400,
        2.4,
        0.36,
        0.28,
        "Do not slash water. Do not sit in a sauna to 'finish.' Eat the assigned meals. Then Reverse — sub-6% is a weekend, not a personality.",
        "Walk and easy sessions only. The photoshoot is not a meet.",
      ),
    ],
  },
  {
    id: "low_histamine",
    name: "Low histamine",
    tagline: "Fresh-cook plates. Freeze leftovers. Fermented and aged foods wait.",
    category: "Pattern",
    durationDays: 56,
    description:
      "Eight weeks of a low-histamine food pattern at maintenance calories. Weeks 1–4 stay strict: freshly cooked chicken or turkey, eggs, rice, potato, broccoli, zucchini, apple or pear. Freeze extras the day you cook. Weeks 5–6 reintroduce one avoided food every few days. Weeks 7–8 keep what you actually tolerate.",
    evidenceNote:
      "Histamine intolerance is a clinical pattern (Maintz & Novak 2007; Comas-Basté 2020 review), not a lab you can fake with a food list. Lists such as SIGHI are compatibility charts, not RCTs. Histamine rises in leftovers via bacterial decarboxylation; fermented dairy, aged cheese, spinach, avocado, and poorly stored fish are the usual eliminations. DAO enzyme talk is real biochemistry and still not a DIY diagnosis.",
    honestNote:
      "This is not a treatment for allergy, anaphylaxis, MCAS, or IBD. If you get hives, wheeze, or swelling, that is emergency medicine, not a menu. A two-month plate will not 'heal your gut.' If nothing changes, you were not histamine-limited — see a clinician instead of stacking more restrictions.",
    afterNote:
      "Keep the fresh-cook plates if they help. This was a food pattern, not a forever calorie prescription. Reintroduce foods one at a time rather than staying on elimination by habit.",
    recommendedFor: ["general", "pole_stage", "exotic_stage", "bodybuilding", "glute_specialization", "strength_endurance", "powerlifting"],
    mealPlanIds: ["low-histamine-plate", "low-histamine-oats", "low-histamine-lighter"],
    extremeLean: false,
    phases: [
      phase(
        1,
        28,
        "Strict plate",
        0,
        1.8,
        0.45,
        0.28,
        "Maintenance calories. Cook fresh, eat the same day, or freeze in meal-size packs. No yogurt, cheddar, spinach, avocado, leftover fish, or sourdough in the default plates.",
        "Train as written. A food pattern is not a reason to add extra cardio.",
      ),
      phase(
        29,
        42,
        "Reintroduce",
        0,
        1.8,
        0.45,
        0.28,
        "Add one previously avoided food every 3 days. Note sleep, gut, skin, and headache. Keep the rest of the plate boring so you can tell what changed.",
        "Same training. Do not test a new food on a meet day or amateur night.",
      ),
      phase(
        43,
        56,
        "Personal hold",
        0,
        1.8,
        0.45,
        0.28,
        "Keep the foods you tolerate. Drop the ones that clearly flare you. Calories stay at maintenance unless you enroll a cut block.",
        "This is still a training diet. Restriction is not a personality.",
      ),
    ],
  },
  {
    id: "low_histamine_cut",
    name: "Low histamine cut",
    tagline: "The same fresh-cook rules, with a modest deficit.",
    category: "Cut",
    durationDays: 56,
    description:
      "Eight weeks: low-histamine plates plus a capped fat-loss deficit. Same leftover and fermented rules as Low histamine. Protein stays high. Week 8 is a diet break at maintenance so you do not live in elimination plus a crash.",
    evidenceNote:
      "Same HIT caveats as the maintenance block (Maintz & Novak 2007; Comas-Basté 2020). Helms 2014 still applies: ~0.5–1% BW/week is the honest fat-loss pace. Stacking a tiny food list with a huge deficit is how people under-eat and then binge on the first 'trigger' food.",
    honestNote:
      "If you are not sure histamine is the issue, use Steady cut with normal food. Do not run this from already-low calories. Not medical advice. Stop for allergic symptoms.",
    afterNote:
      "Enroll Reverse or Low histamine (maintenance) next. Do not chain another elimination cut.",
    recommendedFor: ["bodybuilding", "general", "glute_specialization", "pole_stage"],
    mealPlanIds: ["low-histamine-lighter", "low-histamine-plate", "low-histamine-oats"],
    extremeLean: false,
    phases: [
      phase(
        1,
        21,
        "Fresh-cook deficit",
        -300,
        2.0,
        0.4,
        0.28,
        "About 300 kcal under TDEE. Fresh chicken or turkey, rice or potato, eggs, broccoli, zucchini, apple. Freeze extras immediately.",
        "Keep main lifts. No extra HIIT to 'earn' the restriction.",
      ),
      phase(
        22,
        49,
        "Working deficit",
        -400,
        2.1,
        0.38,
        0.28,
        "A bit hungrier. Still a training diet. If you are dizzy or the lifts collapse, the deficit is too big — not a willpower test.",
        "RPE on compounds stays honest. Optional isolation first if sessions feel cooked.",
      ),
      phase(
        50,
        56,
        "Diet break",
        0,
        2.0,
        0.45,
        0.28,
        "Maintenance for a week on the same fresh-cook foods. Glycogen and water come back. That is not a failed cut.",
        "Train normally. Next: Reverse or Low histamine hold — not another mini-cut.",
      ),
    ],
  },
];

export function getDiet(id: string | null | undefined) {
  if (!id) return undefined;
  return DIET_PROGRAMS.find((d) => d.id === id);
}

export function isLowHistamineDiet(id: string | null | undefined) {
  return id === "low_histamine" || id === "low_histamine_cut";
}

export function calorieFloorFor(sex: "female" | "male" | "unspecified", dietId?: string | null) {
  if (dietId === "stage_lean") {
    if (sex === "female") return 1600;
    if (sex === "male") return 1500;
    return 1600;
  }
  if (sex === "female") return 1400;
  if (sex === "male") return 1600;
  return 1500;
}
