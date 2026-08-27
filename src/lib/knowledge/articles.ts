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
    title: "Pole class prep and amateur-night sets",
    tags: ["pole", "stage", "grip", "invert", "pull", "core", "shoulder", "wrist", "amateur"],
    summary:
      "Shoulder, then wrist and hamstring, take most pole injuries. Train both sides. Climbs and sits before inverts. Amateur night is a short set of skills you already own — not a handspring.",
    body: `Lee et al. 2022 (prospective, Australia): ~8.95 injuries/1000 exposure hours; shoulder ~20%, hamstring/thigh next; loaded internal rotation and front-split shapes were common mechanisms. Amateur surveys repeatedly put shoulder first (~25–27%) and wrist next (~12%). Most problems are repetitive, not one heroic fall.

Off-pole: dead hangs, assisted→strict pull-ups, inverted rows, hollow body, hanging tucks, landmine/push-up pressing, face pulls, hip mobility. On-pole class skills: walk, fireman, chair/hook, sit, basic climb, tuck prep. Equal volume both sides.

Invert readiness: hanging tuck → controlled on-pole tuck with a spot → studio invert. Never kip. Crash mat. Do not learn inverts from a phone on carpet.

Amateur night / club-style exotic: walk, eye-line, arms, hand styling, stage map (rail and corners), heel walk after the trainer walk is quiet, body wave, figure-8, hip pulse, rib isolation, shoulder shimmy, standing grind on a chair back, floor descent, tabletop, cat crawl, knee circle, floor roll, floor hip work, mermaid sit both sides, level ladder, chair approach/straddle/roll, reverse chair sit, three-part chair set (approach, body, close on furniture — not on a person), skirt work, top peel, heels-on-floor plan, rail approach, 8-counts, two-song map, song-length run-through, closing walk-off, slip recovery. Pole as prop: walk, back-to-pole, fireman, sit, climb, controlled descent. Heels later. No new tricks in the show set.

Nyx course: Watch me / With Nyx / Your turn. Each skill is a short cue, one step at a time, a diagram, a photo, an editorial plate, a sultry spoken pass with the words on screen, and a clip. Pick a channel. Replay freely. Move on when the pass line is true. We never drop a listed drill to fake a shorter clock.`,
    citations: ["Lee et al. 2022 MPPA", "Nawrocka et al. amateur pole injury surveys", "Szopa et al. 2021 Sci Rep"],
  },
  {
    id: "nyx-udl",
    title: "How Nyx teaches (multi-channel, neurodivergent-friendly)",
    tags: ["nyx", "course", "udl", "neurodivergent", "voice", "pole", "exotic", "instruction"],
    summary:
      "Each skill ships as a short cue, numbered steps, a diagram, a photo, an editorial plate, a spoken pass, and a clip. Pick any channel. Nothing is hidden. We do not infer a diagnosis from how you move.",
    body: `This copies the Universal Design for Learning idea of multiple means of representation (CAST; InPACT-at-Home / InPACT for Everyone, Hasson et al. 2024): detailed instructions, short cues, and visuals — plus audio and video.

Studio modes: Watch me (photo, plate, clip, diagram), With Nyx (cue, one step at a time, spoken pass with the transcript on screen), Your turn (practice block). First/Then strips sit on skills that have a prerequisite.

Three C’s: consistency, conciseness, clarity. Simple words. One step at a time. Count out loud if it helps. No auto-advance. No countdown on the lesson.

From the user’s P2C review doctrine we also keep: autonomy (pause, replay, skip a channel, take a break); no speed-demand “cognitive load” tricks; we do not infer disability, anxiety, or skill from style. Pain is a stop.

Nyx is a fictional adult instructor. Studio photos and editorial plates are identity-locked 85mm photographs of the same woman in a sports bra and yoga pants. Voice is a slow, low female pass you can replay. Instructional clips mux that same voice over a slow still.`,
    citations: [
      "CAST Universal Design for Learning",
      "Hasson et al. 2024 InPACT for Everyone / Frontiers in Physiology",
      "P2C research basis: cognitive-load, autonomy-support, explicit-context-only",
    ],
  },
  {
    id: "stretching-ergonomics",
    title: "Stretching that respects joints and force",
    tags: ["stretch", "mobility", "flexibility", "warmup", "hamstring", "yoga", "ergonomics"],
    summary:
      "When ROM is the goal: warm first, hinge from the hip, 30–45s holds, 2–4 rounds, 2–3 days/week. Do not dump 60+ second static stretches immediately before a max lift.",
    body: `Kay & Blazevich 2012: static stretch ≥60s per muscle before maximal strength/power is the dose most likely to reduce force; stretches under ~45s are usually quiet. Behm, Blazevich, Kay, McHugh 2016: if you stretch before sport, follow with dynamic work. A 2025 expert Delphi (Warneke et al.) agrees: skip prolonged static stretch immediately before isolated max efforts.

ACSM flexibility: 2–3 days/week, 10–30s, 2–4 reps. We use 30–45s when the session IS stretching.

Ergonomics: hamstrings = hip hinge with a long spine, not a rounded 'touch the toes' contest. Hip flexors = glute on, slight posterior tilt, not a dumped lumbar backbend. Shoulders = in front of the body, never behind the neck. Stop at stretch; nerve zing, numbness, or sharp joint pain is a stop. Much of ROM gain is stretch tolerance (Weppler 2010), not overnight longer muscles.

Ballistic bouncing is not in this app. Stretching is not an injury-prevention spell for a sport you under-recover.`,
    citations: ["Kay & Blazevich 2012", "Behm et al. 2016", "Weppler 2010", "ACSM flexibility guidelines"],
  },
  {
    id: "rucking-load",
    title: "Rucking load and progression",
    tags: ["ruck", "rucking", "pack", "cardio", "feet", "load carriage"],
    summary:
      "Start ~10–15% bodyweight, talking pace, 20–40 minutes. Add distance or load — not both — in a week. Recreational rucks do not need 30%+ bodyweight.",
    body: `Military load-carriage literature (Knapik reviews; NSCA TSAC summaries) shows injury risk climbing as pack mass rises, especially toward ~26–50% bodyweight. That is operator territory, not a household Tuesday.

Start 10–15% BW (or 10–20 lb if you have no scale). Pack high and close to the back. Tall posture. Conversational pace. Progress one variable: minutes/distance or ~5 lb, not both the same week. Hills use the same or a lighter pack. Walk down.

Feet and Achilles adapt slower than lungs. Unload-strength days (hinge, squat, calves, carries) belong in the week. Skip a ruck after a grinding lower-body max.`,
    citations: ["Knapik load-carriage reviews", "NSCA TSAC load carriage"],
  },
  {
    id: "turnout-alignment",
    title: "Turnout, plié, and barre knees",
    tags: ["barre", "ballet", "turnout", "knee", "hip", "plie"],
    summary:
      "Turnout comes from the hip. Knees track toes. About 45° is honest for most people. Do not roll the feet to fake 180°.",
    body: `IADMS resource paper on turnout: forcing the feet and pronating to look more turned out loads the knee and ankle — the joints that already take the most dance injuries.

Plié is a controlled knee bend with hip rotation you can keep, heels down as long as they stay honest, spine long. Pulses stay in a range you can align; fatigue is usually when the knee caves.

Use a chair as a barre. This app's ballet/barre plans are for balance and a smoother walk, not vocational technique.`,
    citations: ["IADMS turnout resource paper"],
  },
  {
    id: "banned-exercises",
    title: "Exercises we do not prescribe",
    tags: ["safety", "shoulder", "bench dip", "upright row", "behind neck", "injury"],
    summary:
      "Bench/chair/parallel-bar dips, behind-the-neck press/pulldown, chin-height upright rows, and kipping pull-ups in prep programs are banned. Swaps must come from the registry.",
    body: `Bench dips: loaded end-range shoulder extension — McKenzie 2022 advises against regular use. Parallel-bar dips are omitted for the same extension problem at depth. Use cable pushdowns, close-grip bench, narrow push-ups instead.
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
Glute/pole/strength goals still need fuel. Enroll a diet block (cut, bulk, reverse, beach week, or low-histamine plates) under Eat if you want periodized calories or a fresh-cook food pattern. The app will not praise crash dieting.`,
  },
  {
    id: "diet-periodization",
    title: "Diet periodization — cut, bulk, reverse, peak",
    tags: ["diet", "cut", "bulk", "reverse", "periodization", "calories", "peak", "beach", "histamine"],
    summary:
      "Pick a time-capped calorie block. Lose ~0.5–1% bodyweight/week. Reverse after a hard cut. Peak weeks are for people who are already lean. Low-histamine plates are a food pattern, not a second crash diet.",
    body: `Training periodization (volume → intensity → deload) has a food twin. A 12-week cut with a diet break beats an endless 1200-kcal grind. A lean bulk is a small surplus, not a dirty bulk. Reverse is how you leave a deficit.

Helms 2014: slower contest-prep losses kept more lean mass. Garthe 2011: athletes losing ~0.7% BW/week retained more LBM than faster cuts. Morton 2018: ~1.6 g/kg protein is enough for most; leaner cuts go higher.

Peak week is not a fat-loss phase. It is a short appearance window. Beach/photo week in this app is 14 days. Stage lean is 21 days and then Reverse — sub-6% is a weekend for already-lean men, not a lifestyle, and not a female target (essential fat ~10–13%).

Low-histamine blocks keep the same calorie math and swap the plate: fresh chicken or turkey, eggs, rice, potato, freeze leftovers. They do not diagnose HIT.`,
    citations: ["Helms et al. 2014", "Garthe et al. 2011", "Morton et al. 2018", "Trexler et al. 2014"],
  },
  {
    id: "peak-lean",
    title: "Sub-6% and short peaks — honest limits",
    tags: ["peak", "body fat", "stage", "beach", "contest", "6%", "water cut"],
    summary:
      "Sub-6% is male contest-day leanness. It is short-term, already-lean only, and not a female goal. No water cuts or diuretics here.",
    body: `Body-fat estimates (DEXA, calipers, scales) routinely miss by a couple of percent. '6%' on a bathroom scale is not lab truth.

Male stage condition is often reported around 5–8% and is associated with low energy availability, poor sleep, and hormonal suppression. Female essential fat is roughly 10–13%; chasing 6% is a medical problem.

This app's Stage lean block is 21 days, calorie-floored, no water cut. Beach week is 14 days of a modest extra deficit with consistent sodium. If you cannot see abs in indoor light, use Steady cut. After either peak: Reverse.`,
    citations: ["Helms et al. 2014", "Chappell contest-prep reviews"],
  },
  {
    id: "low-histamine",
    title: "Low-histamine eating — lists, leftovers, and honesty",
    tags: ["histamine", "HIT", "DAO", "diet", "leftovers", "fermented", "SIGHI", "nutrition"],
    summary:
      "A low-histamine plate is freshly cooked food, not a gut-heal protocol. Freeze leftovers. Fermented dairy, aged cheese, spinach, avocado, and poorly stored fish are the usual eliminations. Not a diagnosis.",
    body: `Histamine intolerance (HIT) is a clinical pattern: suspected when histamine-rich meals are followed by headache, flushing, hives, gut symptoms, or palpitations, and more obvious allergy has been ruled out (Maintz & Novak 2007). Reviews still call the evidence messy (Comas-Basté 2020). There is no single blood test this app can run.

Food lists (including SIGHI-style charts) are compatibility guides, not randomized trials. Histamine content also changes with storage: bacterial histidine decarboxylase raises histamine in leftovers, canned fish, and anything that sat warm. That is why this app's low-histamine menus say cook fresh or freeze in meal-size packs the same day.

Typical elimination foods here: fermented dairy (yogurt, cottage, cheddar), sourdough, spinach, avocado, almonds, beans, peanut butter, and fish that is not cooked from frozen the same day. Typical keepers: fresh chicken or turkey, eggs, white rice, potato, oats, broccoli, zucchini, carrot, cucumber, apple, pear, blueberries, olive oil.

Do the strict plate for a few weeks, then reintroduce one food every few days. If nothing changes, histamine was not the limiter — stop stacking restrictions. Hives, wheeze, or swelling is emergency care, not a tighter menu. This is not treatment for IgE allergy, MCAS, or IBD.

Calories still matter. Low histamine maintain holds TDEE. Low histamine cut uses a modest Helms-style deficit on the same foods, then a diet break. Do not pair a tiny food list with a crash cut.`,
    citations: ["Maintz & Novak 2007", "Comas-Basté et al. 2020", "SIGHI food compatibility list (not an RCT)"],
  },
  {
    id: "fast-food-orders",
    title: "Drive-thru orders that still log",
    tags: ["fast food", "chick-fil-a", "chipotle", "mcdonalds", "wendys", "taco bell", "subway", "protein", "nutrition"],
    summary:
      "If you are already in the drive-thru, pick grilled chicken and skip the combo fries. Chick-fil-A 12-count grilled nuggets are ~200 kcal and 38 g protein. Log it. This is not meal prep.",
    body: `A training diet survives a Chick-fil-A run. It does not survive pretending the waffle fries were optional after you ate them.

Chick-fil-A: 12 grilled nuggets (~200 kcal, 38 g protein) or the 8-count. Fruit cup, not fries. The grilled sandwich is the carb version. Cool Wrap is a cheese wrap — fine as a bulk meal, not a cut default.

Chipotle: bowl, chicken, salsa, lettuce. Double chicken and skip rice on a cut. One rice scoop after lifting. Queso, sour cream, and chips are how a 400-kcal bowl becomes 1100.

McDonald's: Egg McMuffin at breakfast. McDouble if that is the protein you can actually get. Not a large meal deal.

Wendy's grilled chicken sandwich and a small chili beat a Baconator. Taco Bell: chicken + beans, hold creamy sauces. Subway: 6-inch turkey or grilled chicken, mustard, vegetables, no mayo. Panda: grilled teriyaki or string bean chicken with steamed rice, not orange chicken. In-N-Out: protein-style hamburger; a Double-Double is a meal.

Published menu numbers assume standard scoops. Sauces, extra rice, and 'just a sip' sodas are still calories. Eat it, log it, go home. Fast food is high sodium and not a low-histamine protocol — if you are on that block, grilled chicken eaten immediately is the least-bad order, not a loophole.`,
    citations: [
      "Chick-fil-A nutrition guide (12 ct grilled nuggets)",
      "Chipotle US nutrition facts (chicken 4 oz, cilantro-lime rice)",
    ],
  },
  {
    id: "time-restricted-eating",
    title: "Fasting windows are a timer, not a metabolism hack",
    tags: ["fasting", "TRE", "16:8", "intermittent fasting", "eating window"],
    summary:
      "Time-restricted eating can make a deficit easier to follow. When calories are matched, it does not reliably beat a normal meal pattern for fat loss.",
    body: `Liu et al. 2022 (NEJM) and similar trials: 8-hour eating windows without a prescribed calorie gap did not outperform calorie-matched regular eating for weight. TRE is optional structure.

8–16 hours overnight is ordinary. 16:8 is common. 24 h is occasional, not a weekly personality. Edit the start or the eat-at time if you woke late, ate early, or remembered wrong — the log should match reality, not the original alarm.

Do not stack a long fast on top of Stage lean to 'finish' a peak. Eat the assigned meals.`,
    citations: ["Liu et al. 2022 NEJM"],
  },
  {
    id: "fitness-assessment",
    title: "Baseline fitness check — six field tests",
    tags: ["assessment", "onboarding", "baseline", "6mwt", "push-up", "plank", "balance", "chair stand"],
    summary:
      "A short, no-lab battery: 6-minute walk or 2-minute step, CSEP push-ups, 30-second chair stand, front plank, single-leg stance, and two mobility screens. Scores scale RPE, rest, and exercise swaps.",
    body: `Health-related fitness has several domains (ACSM): aerobic, muscular strength/endurance, flexibility/mobility, plus balance for function. This app does not test a 1RM on day one and does not use sit-ups as a core test.

Aerobic: 6-minute walk (ATS 2002). If you log age, height, and weight (40–80), distance is compared with Enright & Sherrill 1998 predicted 6MWD. Younger adults without a prediction equation are scored on raw meters. Alternative: 2-minute in-place step (Rikli & Jones Senior Fitness Test).

Upper endurance: push-ups to form failure. Cut-points are CSEP-PATH (Payne 2000), republished by ACSM/ACE. The published women's table uses kneeling push-ups; men use toes. Record which you did.

Lower body: 30-second chair stand (Rikli & Jones 1999). Arms crossed. Validated in 60–94; younger adults are scored against mixed-age means around ~23 stands.

Core: front plank hold (Strand et al. 2014 norms; McGill trunk-endurance work). Sit-ups load the spine in flexion-repeat; they are not the screen.

Balance: unipedal stance, eyes open, 45 s cap (Springer 2007). Performance is age-specific, not sex-specific.

Mobility: a qualitative overhead squat plus the Senior Fitness Test back-scratch. This is not a certified FMS score.

The overall band (foundation → strong) changes RPE, accessory volume, rest, squat/press selection, and whether we add a plank or easy walk. It does not skip you to a peak week.`,
    citations: [
      "ATS 2002 6MWT",
      "Enright & Sherrill 1998",
      "Payne et al. 2000 CSEP-PATH",
      "Rikli & Jones 1999",
      "Strand et al. 2014",
      "McGill et al. 1999",
      "Springer et al. 2007",
    ],
  },
  {
    id: "deload-signals",
    title: "When to deload",
    tags: ["deload", "fatigue", "recovery", "session rpe", "overtraining"],
    summary:
      "Rolling session RPE ≥8.2 with multiple very hard days, stalled loads, and high subjective fatigue → cut volume ~40% for a week.",
    body: `Deloads are productive, not lazy. Keep every listed drill. Cut load and RPE (compounds at about 6–7), not the list.
Pain that is sharp, radiating, or worsening = stop — that is medical territory, not a deload tweak.`,
  },
  {
    id: "time-budget",
    title: "Training when time is short",
    tags: ["duration", "superset", "efficiency", "30 min", "45 min"],
    summary:
      "Keep every listed drill. If the clock is short, the session runs long. Shorten rest. Do not delete lifts.",
    body: `Iversen et al.: minimum effective dose includes at least one squat pattern, one pull, one push. This app never hides or drops a programmed exercise to fake a shorter session. If you are over the clock cap, keep the list — trim rest, not work.`,
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
    title: "Triceps without dips",
    tags: ["triceps", "pushdown", "close grip", "elbow", "shoulder", "dip"],
    summary:
      "Default: cable pushdowns, close-grip bench, overhead cable extensions, JM press, narrow push-ups. No bench, chair, or parallel-bar dips.",
    body: `Bench and chair dips shear the anterior shoulder capsule (McKenzie et al. 2022: the humerus travels past self-selected max extension). Deep parallel-bar dips share that end-range extension. This app never programs them.

If elbows bark on skull crushers, switch to pushdowns or neutral-grip work. Close-grip bench and narrow push-ups load the triceps with the shoulder in a friendlier path.`,
  },
  {
    id: "warmup",
    title: "Warm-up that respects the clock",
    tags: ["warmup", "ramp", "activation", "mobility"],
    summary:
      "Exercise-specific warm-ups only: 2–4 ramp sets on the first compound, brief activation for the session's priority muscles.",
    body: `Skip long general stretching unless flexibility is the session goal (use the Smart stretch or Home yoga plans). For first heavy lift: empty bar → 50% → 70% → first working weight. Shoulder CARs before overhead/pole days. Do not park 60+ second static stretches immediately before a max set (Kay & Blazevich 2012).`,
  },
  {
    id: "program-splits",
    title: "Split choice — honest tradeoffs",
    tags: ["split", "ppl", "upper lower", "bro split", "frequency"],
    summary:
      "Upper/Lower or PPL usually recover better than bro splits for the same volume. Bro split works if you rarely miss days.",
    body: `When weekly sets are equated, split style barely changes hypertrophy. Pick the schedule you will actually adhere to. Conjugate and powerlifting need more specificity on competition lifts.`,
  },
  {
    id: "e1rm-tracking",
    title: "Estimated 1RM and load jumps",
    tags: ["e1rm", "progression", "strength", "load", "autoregulation"],
    summary:
      "Use logged sets to estimate e1RM (Epley). Jump loads in small increments: +2.5 kg compounds, +1.25 kg isolation when RPE is easy.",
    body: `Epley: weight × (1 + reps/30). Track trend over 4–6 weeks, not session to session noise.
If RPE ≤ target − 1 on working sets, add the smallest plate increment. If RPE ≥ target + 1 or reps missed, repeat or drop 5%.`,
    citations: ["Helms et al. 2016"],
  },
  {
    id: "sleep-recovery",
    title: "Sleep and recovery for lifters",
    tags: ["sleep", "recovery", "fatigue", "deload", "check-in"],
    summary:
      "Chronic sleep debt raises session RPE and blunts performance. High fatigue check-ins should trigger shorter, simpler sessions.",
    body: `7–9 h is the practical target for most lifters. When sleep is poor 3+ nights, keep every listed drill, cut RPE, and avoid grind sets at 9+.
Spirit reads your daily fatigue check-in — treat it honestly.`,
  },
  {
    id: "progressive-overload",
    title: "Progressive overload without ego",
    tags: ["progression", "volume", "load", "hypertrophy", "strength"],
    summary:
      "Overload via load, reps, sets, or quality — not all at once. Double progression (reps then load) works well for accessories.",
    body: `Main lifts: small load jumps when RPE allows. Accessories: add reps within range first, then load.
Stalled for 3 weeks with rising session RPE → deload or reduce weekly sets before chasing heavier weights.`,
    citations: ["Schoenfeld 2017"],
  },
  {
    id: "mind-muscle",
    title: "Mind-muscle connection — when it matters",
    tags: ["hypertrophy", "isolation", "technique", "glutes", "cues"],
    summary:
      "Internal focus helps isolation and glute work; external focus often wins on heavy compounds for force output.",
    body: `Calatayud et al.: internal focus increases EMG on isolation but can reduce 1RM on heavy multi-joint lifts.
Use cues on hip thrusts, abduction, and curls; on squats/deadlifts prioritize bracing and bar path.`,
    citations: ["Calatayud et al. 2016"],
  },
  {
    id: "pioneer-observer",
    title: "Pioneer — observe-only fitness and nutrition reads",
    tags: ["pioneer", "instrument", "draft", "safety", "nutrition", "rpe"],
    summary:
      "Pioneer watches a training or food draft. Instruments always score stimulus, fuel, recovery, safety, and adherence. The language model only speaks when allowed, and it never edits the page.",
    body: `Pioneer is one-way on purpose. You write. It reports gaps, banned-lift wording, crash intake, and missing RPE. It cannot paste into the draft and you cannot copy its cards back in.

The instrument layer is local: household calorie floors, ISSN-range protein, Helms–Zourdos RPE, the Garanimal lift registry, and rest-day honesty. The pioneer layer is a constrained model with multiple reads and a source allow-list. If the model is dark, throttled, or refused, the gauges still work.

This is not medical care. Sharp, hot, numb, or radiating pain is a stop.`,
    citations: ["Helms et al. 2016", "Morton et al. 2018", "McKenzie et al. 2022", "ISSN protein position"],
  },
];

export function getArticle(id: string) {
  return KNOWLEDGE_ARTICLES.find((a) => a.id === id);
}
