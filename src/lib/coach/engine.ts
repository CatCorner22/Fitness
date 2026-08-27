import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { coachMessages, dailyCheckins, workouts } from "@/lib/db/schema";
import type { ProfileRow } from "@/lib/auth";
import type { Exercise } from "@/lib/types";
import { bannedExercises, getExercise } from "@/lib/exercises/registry";
import { isLowEnergy } from "@/lib/assessment/session-adjust";
import { shouldDeload, weeklyVolume } from "@/lib/autoregulation";
import { getProgram } from "@/lib/programs/catalog";
import { daysAgoISO, todayISO } from "@/lib/utils";

type CoachCtx = ReturnType<typeof coachContext>;
type Persona = "scientist" | "garanimal";

export function coachContext(userId: string, profile: ProfileRow) {
  const since = daysAgoISO(14);
  const recent = db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), gte(workouts.date, since)))
    .orderBy(desc(workouts.startedAt))
    .all();

  const completed: typeof recent = [];
  const missed: typeof recent = [];
  for (const w of recent) {
    if (w.status === "completed") completed.push(w);
    else if (w.status === "skipped") missed.push(w);
  }
  const checkin = db
    .select()
    .from(dailyCheckins)
    .where(and(eq(dailyCheckins.userId, userId), eq(dailyCheckins.date, todayISO())))
    .get();
  const deload = shouldDeload(userId);
  const volume = weeklyVolume(userId, daysAgoISO(7));
  const program = profile.activeProgramId ? getProgram(profile.activeProgramId) : null;

  return { recent, completed, missed, checkin, deload, volume, program };
}

function deloadLine(reason: string, deload: boolean, persona: Persona) {
  if (!deload) return reason;
  return persona === "scientist"
    ? `Fatigue flag: ${reason} A deload is the scientific call — not more suffering.`
    : `Listen carefully: I will not tell you to train through a broken body. ${reason} Take the deload like a professional. Cowards skip recovery and then wonder why they stay weak.`;
}

function scientistVoice(input: CoachCtx, profile: ProfileRow, question?: string) {
  const lines: string[] = [];
  lines.push(
    `Scientist mode. You are on ${input.program?.name ?? "no program yet"}, week ${profile.currentWeek}, ${profile.sessionMinutes}-minute sessions.`,
  );
  lines.push(
    `Last 14 days: ${input.completed.length} completed, ${input.missed.length} skipped. Session RPE average: ${
      average(input.completed.map((w) => w.sessionRpe)) ?? "not enough data"
    }.`,
  );
  lines.push(deloadLine(input.deload.reason, input.deload.deload, "scientist"));
  const glute = input.volume.glutes ?? 0;
  if (profile.goal === "glute_specialization" || profile.activeProgramId === "big_ass") {
    lines.push(
      `Glute weekly sets (fractional): ${glute.toFixed(1)}. Landmark window is about 12–20. ${
        glute < 10 ? "You are under-dosing the goal." : glute > 22 ? "You are near MRV — watch recovery." : "Volume is in the productive range."
      }`,
    );
  }
  if (isLowEnergy(input.checkin?.fatigue)) {
    lines.push("Today's energy is low. Keep every listed drill. Cut RPE, not the list. Do not chase RPE 9.");
  }
  lines.push(
    question
      ? answerQuestion(question, input, profile, "scientist")
      : "Log today's session honestly. The progression math only works if RPE is real.",
  );
  return lines.join("\n\n");
}

function garanimalVoice(input: CoachCtx, profile: ProfileRow, question?: string) {
  const lines: string[] = [];
  lines.push("GARANIMAL MODE. Soft living is optional. Showing up is not.");
  if (input.deload.deload) {
    lines.push(deloadLine(input.deload.reason, true, "garanimal"));
  } else if (input.missed.length >= 2) {
    lines.push(
      `${input.missed.length} skipped sessions in two weeks. Nobody is coming to save you. Get in the room. ${profile.sessionMinutes} minutes. That is the standard.`,
    );
  } else {
    lines.push(
      `${input.completed.length} sessions logged. Good. Stay stayin'. Today is ${input.program?.name ?? "your program"}, week ${profile.currentWeek}. Do the main lifts like they owe you money.`,
    );
  }
  if (isLowEnergy(input.checkin?.fatigue)) {
    lines.push(
      "You marked energy low. We do not play hero with joints. Every listed drill still happens — lighter, slower, honest RPE. Calluses over excuses — not bone spurs over ego.",
    );
  }
  lines.push(
    question
      ? answerQuestion(question, input, profile, "garanimal")
      : "Start the workout. Log every set. If you want a hug, turn Garanimal off.",
  );
  return lines.join("\n\n");
}

function bannedHit(q: string) {
  return bannedExercises().find((e) => {
    const name = e.name.toLowerCase();
    const idWords = e.id.replaceAll("-", " ");
    return q.includes(e.id) || q.includes(idWords) || q.includes(name);
  });
}

function isDipQuestion(q: string, hit?: Exercise) {
  return (
    /\bdips?\b/.test(q) ||
    q.includes("bench dip") ||
    q.includes("chair dip") ||
    q.includes("bar dip") ||
    q.includes("tricep dip") ||
    q.includes("triceps dip") ||
    hit?.id === "bench-dip" ||
    hit?.id === "parallel-bar-dip"
  );
}

type QuestionRule = {
  test: (q: string, hit?: Exercise) => boolean;
  reply: (persona: Persona, profile: ProfileRow) => string;
};

const QUESTION_RULES: QuestionRule[] = [
  {
    test: isDipQuestion,
    reply: (persona) =>
      persona === "garanimal"
        ? "Dips off a bench, chair, or parallel bars? That is how you buy a cranky shoulder. Cable pushdowns. Close-grip bench. Narrow push-ups. Stay dangerous, stay intact."
        : getExercise("bench-dip")?.safetyNote ?? "",
  },
  {
    test: (q) => q.includes("behind") && q.includes("neck"),
    reply: () =>
      "Behind-the-neck pressing and pulldowns are banned here. Press and pull in front. Shoulders last longer than an Instagram variation.",
  },
  {
    test: (q) => q.includes("swap") || q.includes("substitute") || q.includes("instead"),
    reply: () =>
      "I can only swap from the safety registry. Open the workout and tap Swap — you will only see recommended alternatives that respect your injuries.",
  },
  {
    test: (q) =>
      q.includes("assess") ||
      q.includes("fitness check") ||
      q.includes("baseline") ||
      q.includes("push-up") ||
      q.includes("plank") ||
      q.includes("6-minute"),
    reply: () =>
      "You → Fitness check. Six field tests (6-minute walk or 2-minute step, CSEP push-ups, 30s chair stand, plank, single-leg stance, overhead squat + back-scratch). We scale RPE and swaps from that. No 1RM on day one. Sit-ups are not the core test.",
  },
  {
    test: (q) => q.includes("fast") || q.includes("16:8") || q.includes("16/8") || q.includes("eating window"),
    reply: () =>
      "Open Eat. Start a fast, then change the start time, the target, or the eat-at time whenever you need to — including after you already ended it. TRE is a timer. Matched-calorie studies do not show a magic metabolism bonus.",
  },
  {
    test: (q) =>
      q.includes("6%") ||
      q.includes("sub-6") ||
      q.includes("body fat") ||
      q.includes("peak week") ||
      q.includes("beach"),
    reply: () =>
      "Sub-6% is male contest-day leanness, already-lean only, and short. Women: essential fat is roughly 10–13% — Beach week or Steady cut, not 6%. No water cuts. After a peak, Reverse.",
  },
  {
    test: (q) =>
      q.includes("reverse") ||
      q.includes("mini-cut") ||
      q.includes("mini cut") ||
      q.includes("diet block") ||
      q.includes("lean bulk"),
    reply: () =>
      "Eat → Diet blocks. Cut slowly (0.5–1% bodyweight/week). Mini-cut is four weeks if you are already lean. Reverse is how you leave a deficit. Lean bulk is a small surplus.",
  },
  {
    test: (q) => q.includes("protein") || q.includes("eat") || q.includes("calorie"),
    reply: (_persona, profile) =>
      `Protein target is about 1.6–2.2 g/kg. Yours is based on ${profile.weightKg ?? "your"} kg bodyweight. Eat enough to train. This app will not praise a crash diet.`,
  },
  {
    test: (q) =>
      q.includes("time") ||
      q.includes("busy") ||
      q.includes("minutes") ||
      q.includes("skip extra") ||
      q.includes("drop isolation") ||
      q.includes("cut the list"),
    reply: (_persona, profile) =>
      `Your clock cap is ${profile.sessionMinutes} minutes. The planner still keeps every programmed drill and tells you if the day runs long. We do not hide or drop lifts to fake a short session.`,
  },
  {
    test: (q) => q.includes("glute") || q.includes("butt") || q.includes("ass"),
    reply: () =>
      "Hip thrust, squat or split squat, RDL, abduction, 45° extension. Variety. Plotkin 2023: thrust ≈ squat for glute size. Kassiano 2024: adding thrusts on top of hinges and presses grew more glute. Do the work.",
  },
  {
    test: (q) =>
      q.includes("pole") ||
      q.includes("strip") ||
      q.includes("invert") ||
      q.includes("amateur") ||
      q.includes("exotic") ||
      q.includes("nyx") ||
      q.includes("lap") ||
      q.includes("heel"),
    reply: () =>
      "Nyx’s amateur-night course is actual exotic skill in training-course format: walk, heels, hands, stage map, commercial hips, floor crawls, chair phrases on furniture (approach, body, close — not on a person), costume peels, rail visits, two-song map, and a close. Pair it with Couch to amateur night (5 days). Intermediate pole class is the other course — hangs, both-side spins, sit, climb, invert prep. Crash mat. Studio for inverts. No kipping. Open Course from You.",
  },
  {
    test: (q) => q.includes("ruck") || q.includes("rucking") || q.includes("pack"),
    reply: () =>
      "Start around 10–15% bodyweight, talking pace. Add distance or load, not both, in the same week. Stay under ~30% bodyweight unless you have a real event and a base.",
  },
  {
    test: (q) => q.includes("stretch") || q.includes("split") || q.includes("flexib"),
    reply: () =>
      "Warm first. Hinge at the hip. 30–45 second holds. No bounce. No behind-the-neck stretches. Do not sit in long static stretches right before a heavy lift.",
  },
  {
    test: (q) => q.includes("barre") || q.includes("ballet") || q.includes("turnout") || q.includes("plie"),
    reply: () =>
      "Turnout from the hips. Knees track toes. About 45 degrees is honest. A chair is a barre. This is balance and a smoother walk, not vocational ballet.",
  },
];

const FALLBACK_REPLY: Record<Persona, string> = {
  garanimal: "Stop looking for a magic question. Open Today. Start the session. Log the RPE. That is the whole religion.",
  scientist:
    "I can help with load, swaps, volume, nutrition targets, and why an exercise is banned. Keep questions specific.",
};

function answerQuestion(question: string, _input: CoachCtx, profile: ProfileRow, persona: Persona) {
  const q = question.toLowerCase();
  const hit = bannedHit(q);
  const rule = QUESTION_RULES.find((entry) => entry.test(q, hit));
  return rule ? rule.reply(persona, profile) : FALLBACK_REPLY[persona];
}

function average(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v != null);
  if (!nums.length) return null;
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
}

export function generateCoachReply(userId: string, profile: ProfileRow, question?: string) {
  const ctx = coachContext(userId, profile);
  return profile.persona === "garanimal"
    ? garanimalVoice(ctx, profile, question)
    : scientistVoice(ctx, profile, question);
}

export function storeCoachMessage(userId: string, role: "user" | "coach", content: string) {
  db.insert(coachMessages)
    .values({
      id: crypto.randomUUID(),
      userId,
      role,
      content,
      createdAt: new Date().toISOString(),
    })
    .run();
}

export function historyForUser(userId: string) {
  return db
    .select()
    .from(coachMessages)
    .where(eq(coachMessages.userId, userId))
    .orderBy(desc(coachMessages.createdAt))
    .limit(40)
    .all()
    .reverse();
}
