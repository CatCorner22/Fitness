import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { coachMessages, dailyCheckins, workouts } from "@/lib/db/schema";
import type { ProfileRow } from "@/lib/auth";
import { bannedExercises, getExercise } from "@/lib/exercises/registry";
import { shouldDeload, weeklyVolume } from "@/lib/autoregulation";
import { getProgram } from "@/lib/programs/catalog";
import { todayISO } from "@/lib/utils";

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return todayISO(d);
}

export function coachContext(userId: string, profile: ProfileRow) {
  const since = daysAgoISO(14);
  const recent = db
    .select()
    .from(workouts)
    .where(and(eq(workouts.userId, userId), gte(workouts.date, since)))
    .orderBy(desc(workouts.startedAt))
    .all();

  const completed = recent.filter((w) => w.status === "completed");
  const missed = recent.filter((w) => w.status === "skipped");
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

function scientistVoice(input: ReturnType<typeof coachContext>, profile: ProfileRow, question?: string) {
  const lines: string[] = [];
  lines.push(
    `Scientist mode. You are on ${input.program?.name ?? "no program yet"}, week ${profile.currentWeek}, ${profile.sessionMinutes}-minute sessions.`,
  );
  lines.push(
    `Last 14 days: ${input.completed.length} completed, ${input.missed.length} skipped. Session RPE average: ${
      average(input.completed.map((w) => w.sessionRpe)) ?? "not enough data"
    }.`,
  );
  if (input.deload.deload) {
    lines.push(`Fatigue flag: ${input.deload.reason} A deload is the scientific call — not more suffering.`);
  } else {
    lines.push(input.deload.reason);
  }
  const glute = input.volume.glutes ?? 0;
  if (profile.goal === "glute_specialization" || profile.activeProgramId === "big_ass") {
    lines.push(
      `Glute weekly sets (fractional): ${glute.toFixed(1)}. Landmark window is about 12–20. ${
        glute < 10 ? "You are under-dosing the goal." : glute > 22 ? "You are near MRV — watch recovery." : "Volume is in the productive range."
      }`,
    );
  }
  if (input.checkin?.fatigue && input.checkin.fatigue >= 4) {
    lines.push("Today's fatigue is high. Keep every listed drill. Cut RPE, not the list. Do not chase RPE 9.");
  }
  if (question) {
    lines.push(answerQuestion(question, input, profile, "scientist"));
  } else {
    lines.push("Log today's session honestly. The progression math only works if RPE is real.");
  }
  return lines.join("\n\n");
}

function garanimalVoice(input: ReturnType<typeof coachContext>, profile: ProfileRow, question?: string) {
  const lines: string[] = [];
  lines.push("GARANIMAL MODE. Soft living is optional. Showing up is not.");
  if (input.deload.deload) {
    lines.push(
      `Listen carefully: I will not tell you to train through a broken body. ${input.deload.reason} Take the deload like a professional. Cowards skip recovery and then wonder why they stay weak.`,
    );
  } else if (input.missed.length >= 2) {
    lines.push(
      `${input.missed.length} skipped sessions in two weeks. Nobody is coming to save you. Get in the room. ${profile.sessionMinutes} minutes. That is the standard.`,
    );
  } else {
    lines.push(
      `${input.completed.length} sessions logged. Good. Stay stayin'. Today is ${input.program?.name ?? "your program"}, week ${profile.currentWeek}. Do the main lifts like they owe you money.`,
    );
  }
  if (input.checkin?.fatigue && input.checkin.fatigue >= 4) {
    lines.push(
      "You marked fatigue high. We do not play hero with joints. Every listed drill still happens — lighter, slower, honest RPE. Calluses over excuses — not bone spurs over ego.",
    );
  }
  if (question) {
    lines.push(answerQuestion(question, input, profile, "garanimal"));
  } else {
    lines.push("Start the workout. Log every set. If you want a hug, turn Garanimal off.");
  }
  return lines.join("\n\n");
}

function answerQuestion(
  question: string,
  input: ReturnType<typeof coachContext>,
  profile: ProfileRow,
  persona: "scientist" | "garanimal",
) {
  const q = question.toLowerCase();
  const bannedHit = bannedExercises().find((e) => {
    const name = e.name.toLowerCase();
    const idWords = e.id.replaceAll("-", " ");
    return q.includes(e.id) || q.includes(idWords) || q.includes(name);
  });
  if (
    /\bdips?\b/.test(q) ||
    q.includes("bench dip") ||
    q.includes("chair dip") ||
    q.includes("bar dip") ||
    q.includes("tricep dip") ||
    q.includes("triceps dip") ||
    bannedHit?.id === "bench-dip" ||
    bannedHit?.id === "parallel-bar-dip"
  ) {
    return persona === "garanimal"
      ? "Dips off a bench, chair, or parallel bars? That is how you buy a cranky shoulder. Cable pushdowns. Close-grip bench. Narrow push-ups. Stay dangerous, stay intact."
      : getExercise("bench-dip")?.safetyNote ?? "";
  }
  if (q.includes("behind") && q.includes("neck")) {
    return "Behind-the-neck pressing and pulldowns are banned here. Press and pull in front. Shoulders last longer than an Instagram variation.";
  }
  if (q.includes("swap") || q.includes("substitute") || q.includes("instead")) {
    return "I can only swap from the safety registry. Open the workout and tap Swap — you will only see recommended alternatives that respect your injuries.";
  }
  if (q.includes("assess") || q.includes("fitness check") || q.includes("baseline") || q.includes("push-up") || q.includes("plank") || q.includes("6-minute")) {
    return "You → Fitness check. Six field tests (6-minute walk or 2-minute step, CSEP push-ups, 30s chair stand, plank, single-leg stance, overhead squat + back-scratch). We scale RPE and swaps from that. No 1RM on day one. Sit-ups are not the core test.";
  }
  if (q.includes("fast") || q.includes("16:8") || q.includes("16/8") || q.includes("eating window")) {
    return "Open Eat. Start a fast, then change the start time, the target, or the eat-at time whenever you need to — including after you already ended it. TRE is a timer. Matched-calorie studies do not show a magic metabolism bonus.";
  }
  if (q.includes("6%") || q.includes("sub-6") || q.includes("body fat") || q.includes("peak week") || q.includes("beach")) {
    return "Sub-6% is male contest-day leanness, already-lean only, and short. Women: essential fat is roughly 10–13% — Beach week or Steady cut, not 6%. No water cuts. After a peak, Reverse.";
  }
  if (q.includes("reverse") || q.includes("mini-cut") || q.includes("mini cut") || q.includes("diet block") || q.includes("lean bulk")) {
    return "Eat → Diet blocks. Cut slowly (0.5–1% bodyweight/week). Mini-cut is four weeks if you are already lean. Reverse is how you leave a deficit. Lean bulk is a small surplus.";
  }
  if (q.includes("protein") || q.includes("eat") || q.includes("calorie")) {
    return `Protein target is about 1.6–2.2 g/kg. Yours is based on ${profile.weightKg ?? "your"} kg bodyweight. Eat enough to train. This app will not praise a crash diet.`;
  }
  if (q.includes("time") || q.includes("busy") || q.includes("minutes")) {
    return `Your clock cap is ${profile.sessionMinutes} minutes. The planner still keeps every programmed drill and tells you if the day runs long. We do not hide or drop lifts to fake a short session.`;
  }
  if (q.includes("glute") || q.includes("butt") || q.includes("ass")) {
    return "Hip thrust, squat or split squat, RDL, abduction, 45° extension. Variety. Plotkin 2023: thrust ≈ squat for glute size. Kassiano 2024: adding thrusts on top of hinges and presses grew more glute. Do the work.";
  }
  if (q.includes("pole") || q.includes("strip") || q.includes("invert") || q.includes("amateur") || q.includes("exotic") || q.includes("nyx") || q.includes("lap") || q.includes("heel")) {
    return "Nyx’s amateur-night course is actual exotic skill in training-course format: walk, heels, hands, stage map, commercial hips, floor crawls, chair phrases on furniture (approach, body, close — not on a person), costume peels, rail visits, two-song map, and a close. Pair it with Couch to amateur night (5 days). Intermediate pole class is the other course — hangs, both-side spins, sit, climb, invert prep. Crash mat. Studio for inverts. No kipping. Open Course from You.";
  }
  if (q.includes("ruck") || q.includes("rucking") || q.includes("pack")) {
    return "Start around 10–15% bodyweight, talking pace. Add distance or load, not both, in the same week. Stay under ~30% bodyweight unless you have a real event and a base.";
  }
  if (q.includes("stretch") || q.includes("split") || q.includes("flexib")) {
    return "Warm first. Hinge at the hip. 30–45 second holds. No bounce. No behind-the-neck stretches. Do not sit in long static stretches right before a heavy lift.";
  }
  if (q.includes("barre") || q.includes("ballet") || q.includes("turnout") || q.includes("plie")) {
    return "Turnout from the hips. Knees track toes. About 45 degrees is honest. A chair is a barre. This is balance and a smoother walk, not vocational ballet.";
  }
  return persona === "garanimal"
    ? "Stop looking for a magic question. Open Today. Start the session. Log the RPE. That is the whole religion."
    : "I can help with load, swaps, volume, nutrition targets, and why an exercise is banned. Keep questions specific.";
}

function average(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v != null);
  if (!nums.length) return null;
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
}

export function generateCoachReply(
  userId: string,
  profile: ProfileRow,
  question?: string,
) {
  const ctx = coachContext(userId, profile);
  return profile.persona === "garanimal"
    ? garanimalVoice(ctx, profile, question)
    : scientistVoice(ctx, profile, question);
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