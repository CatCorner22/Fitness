export type KnowledgeArticle = {
  id: string;
  title: string;
  tags: string[];
  summary: string;
  body: string;
  citations?: string[];
};

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: "rpe-rir",
    title: "RPE and reps in reserve (RIR)",
    tags: ["rpe", "rir", "autoregulation", "intensity", "helms", "zourdos"],
    summary:
      "Use the 1–10 RIR-based RPE scale on working sets. RPE 10 = 0 RIR. Most hypertrophy work lives at RPE 7–9 (1–3 RIR). Strength singles often sit at RPE 8–9.5.",
    body: `The Helms–Zourdos scale ties RPE to reps left in the tank. Accuracy is best within 0–3 RIR and on lower rep sets. Novices should run occasional AMRAP checks.
If logged RPE is ≥1 below target, add a small load next time. If above target or reps were missed, repeat or drop ~5%.
Session RPE (Foster 0–10) tracks whole-workout fatigue separately from set RPE.`,
    citations: ["Helms et al. 2016", "Zourdos et al. 2016"],
  },
  {
    id: "volume-dose",
    title: "Weekly set volume and hypertrophy",
    tags: ["volume", "hypertrophy", "sets", "schoenfeld", "mev", "mav", "mrv"],
    summary:
      "Hard sets per muscle per week have a graded dose–response. ~10+ sets/week generally beats lower volumes, with diminishing returns at very high volume.",
    body: `Schoenfeld meta-regression: each additional weekly set associates with more hypertrophy until diminishing returns. Frequency matters little when weekly volume is equated.
Landmarks (starting points): MEV ~6, productive range ~10–20, MRV varies by muscle and recovery. Inspect weekly totals — do not hide volume in a black box.`,
    citations: ["Schoenfeld 2017", "Pelland 2024"],
  },
  {
    id: "rest-periods",
    title: "Rest between sets",
    tags: ["rest", "recovery", "strength", "hypertrophy", "compound", "isolation"],
    summary:
      "Main compounds: 2–3 min (strength) or 90–150 s (hypertrophy). Isolation: 60–90 s. Short sessions can use antagonist supersets to save time without dropping volume.",
    body: `Longer rest preserves performance on heavy multi-joint lifts. Isolation and machine work tolerates shorter rest.
If RPE climbs set-to-set on the same load, extend rest 30–60 s before the next set.
Time-crunched days: pair push/pull or upper/lower supersets (Iversen et al. 2021) — not same-muscle supersets for strength goals.`,
    citations: ["Iversen et al. 2021", "Schoenfeld rest meta-analyses"],
  },
  {
    id: "concurrent-training",
    title: "Lifting + cardio (interference)",
    tags: ["cardio", "endurance", "concurrent", "conditioning", "zone2"],
    summary:
      "Moderate cardio does not meaningfully blunt max strength or hypertrophy. Explosive strength can suffer if both are done in the same session.",
    body: `Schumann 2022 meta-analysis: concurrent training did not reduce hypertrophy or max strength vs lifting alone. Explosive strength was attenuated, especially same-session.
Prefer ≥3 hours between modalities. If same day, lift first unless the session goal is endurance. Bike/row often beats heavy running before squats.`,
    citations: ["Schumann et al. 2022"],
  },
  {
    id: "glute-science",
    title: "Glute hypertrophy — what actually works",
    tags: ["glutes", "hip thrust", "squat", "rdl", "big ass", "butt"],
    summary:
      "Hip thrust and squat grow glutes similarly (MRI). Adding hip thrusts on top of leg press + RDL increased glute thickness vs those two alone in untrained women.",
    body: `Plotkin 2023: matched-volume hip thrust vs back squat → similar glute CSA; squat wins quads/adductors. Kassiano 2024: +hip thrust beat leg press + stiff-leg deadlift alone for glute max.
Program variety: horizontal thrust + squat/split pattern + hip-extension hinge (RDL) + abduction + 45° back extension. 12–20 fractional glute sets/week is a productive band for specialization.`,
    citations: ["Plotkin et al. 2023", "Kassiano et al. 2024"],
  },
  {
    id: "pole-prep",
    title: "Pole and stage athletic prep",
    tags: ["pole", "stage", "grip", "invert", "pull", "core", "shoulder"],
    summary:
      "Grip fails first, then vertical pull and isometric core. Balance pushing. Strict pulls only — no kipping. Studio technique still required.",
    body: `Off-pole prep: dead hangs, assisted→strict pull-ups, inverted rows, hollow body, hanging tucks, landmine/push-up pressing, face pulls, hip/shoulder mobility, set-endurance circuits.
Invert readiness: hanging tuck → controlled negatives → spotted inverts. Never kip without a strict base.`,
  },
  {
    id: "banned-exercises",
    title: "Exercises we do not prescribe",
    tags: ["safety", "shoulder", "bench dip", "upright row", "behind neck", "injury"],
    summary:
      "Bench dips, behind-the-neck press/pulldown, chin-height upright rows, and kipping pull-ups in prep programs are banned. Swaps must come from the registry.",
    body: `Bench dips: loaded end-range shoulder extension — McKenzie 2022 advises against regular use. Use cable pushdowns, close-grip bench, narrow push-ups instead.
Behind-the-neck work: high-five shoulder position. Upright rows to chin: Hawkins impingement position. Kipping: labrum traction without strict strength.`,
    citations: ["McKenzie et al. 2022", "NSCA shoulder strategies 2021"],
  },
  {
    id: "conjugate-overview",
    title: "Westside / Soviet-inspired conjugate (household-safe)",
    tags: ["conjugate", "westside", "max effort", "dynamic effort", "powerlifting"],
    summary:
      "Four days: ME lower, ME upper, DE/rep lower, DE/rep upper. Rotate max-effort lifts weekly. Dynamic days use 50–70% moved fast. Accessories address weak points.",
    body: `Zatsiorsky's three methods: max effort (heavy singles/triples), dynamic effort (speed with submax load), repeated effort (hypertrophy accessories).
Rotate ME lifts to avoid accommodation. This household template skips specialty-bar circus — box squat, pause bench, trap-bar pulls are fair game.`,
  },
  {
    id: "nutrition-basics",
    title: "Protein and calories for lifters",
    tags: ["nutrition", "protein", "calories", "tdee", "cut", "bulk"],
    summary:
      "Protein ~1.6–2.2 g/kg/day. Calories from Mifflin-St Jeor × activity, adjusted weekly from scale trend if logging intake.",
    body: `Prioritize protein across meals. Aggressive deficits impair performance and recovery. Adaptive TDEE uses logged intake + weigh-ins — transparent math, not a black box.
Glute/pole/strength goals still need fuel. The app will not praise crash dieting.`,
  },
  {
    id: "deload-signals",
    title: "When to deload",
    tags: ["deload", "fatigue", "recovery", "session rpe", "overtraining"],
    summary:
      "Rolling session RPE ≥8.2 with multiple very hard days, stalled loads, and high subjective fatigue → cut volume ~40% for a week.",
    body: `Deloads are productive, not lazy. Drop optional isolation first, keep movement quality on compounds at RPE 6–7.
Pain that is sharp, radiating, or worsening = stop — that is medical territory, not a deload tweak.`,
  },
  {
    id: "time-budget",
    title: "Training when time is short",
    tags: ["duration", "superset", "efficiency", "30 min", "45 min"],
    summary:
      "Keep bilateral compounds, drop lowest-priority isolation, use antagonist supersets, skip general stretching unless mobility is the goal.",
    body: `Iversen et al.: minimum effective dose includes at least one squat pattern, one pull, one push. Advanced techniques (supersets, rest-pause) can halve session time with similar volume for hypertrophy.`,
    citations: ["Iversen et al. 2021"],
  },
  {
    id: "shoulder-health",
    title: "Shoulder-friendly pressing and pulling",
    tags: ["shoulder", "prehab", "face pull", "landmine", "scapular"],
    summary:
      "Press in front, pull to chest not neck, laterals in scapular plane, face pulls and band pull-aparts for balance.",
    body: `Limit upright rows below 90° elbow height if used at all — we ban chin-height versions. Landmine and neutral-grip DB pressing tolerate irritated shoulders better than barbell BTN paths.`,
  },
  {
    id: "triceps-safe",
    title: "Triceps without bench dips",
    tags: ["triceps", "pushdown", "close grip", "elbow", "shoulder"],
    summary:
      "Default: cable pushdowns, close-grip bench, overhead cable extensions, JM press, narrow push-ups. Parallel-bar dips only with pain-free mobility.",
    body: `Bench dips shear the anterior shoulder capsule. If elbows bark on skull crushers, switch to pushdowns or neutral-grip work.`,
  },
  {
    id: "warmup",
    title: "Warm-up that respects the clock",
    tags: ["warmup", "ramp", "activation", "mobility"],
    summary:
      "Exercise-specific warm-ups only: 2–4 ramp sets on the first compound, brief activation for the session's priority muscles.",
    body: `Skip long general stretching unless flexibility is the session goal. For first heavy lift: empty bar → 50% → 70% → first working weight. Shoulder CARs before overhead/pole days.`,
  },
  {
    id: "program-splits",
    title: "Split choice — honest tradeoffs",
    tags: ["split", "ppl", "upper lower", "bro split", "frequency"],
    summary:
      "Upper/Lower or PPL usually recover better than bro splits for the same volume. Bro split works if you rarely miss days.",
    body: `When weekly sets are equated, split style barely changes hypertrophy. Pick the schedule you will actually adhere to. Conjugate and powerlifting need more specificity on competition lifts.`,
  },
];

export function getArticle(id: string) {
  return KNOWLEDGE_ARTICLES.find((a) => a.id === id);
}
