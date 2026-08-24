import { and, desc, eq } from "drizzle-orm";
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
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt))
    .all()
    .filter((w) => w.date >= since);

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
    lines.push("Today's fatigue is high. Keep main lifts, drop optional isolation, and do not chase RPE 9.");
  }
  if (question?.toLowerCase().includes("dip")) {
    const banned = bannedExercises().find((e) => e.id === "bench-dip");
    lines.push(banned?.safetyNote ?? "Bench dips are banned in this app.");
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
      "You marked fatigue high. We do not play hero with joints. Hit the compounds, skip the extras, go home. Calluses over excuses — not bone spurs over ego.",
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
  const bannedHit = bannedExercises().find((e) => q.includes(e.name.split(" ")[0].toLowerCase()) || q.includes(e.id));
  if (q.includes("bench dip") || q.includes("chair dip") || bannedHit?.id === "bench-dip") {
    return persona === "garanimal"
      ? "Bench dips? That is how you buy a cranky shoulder. Cable pushdowns. Close-grip bench. Narrow push-ups. Stay dangerous, stay intact."
      : getExercise("bench-dip")?.safetyNote ?? "";
  }
  if (q.includes("behind") && q.includes("neck")) {
    return "Behind-the-neck pressing and pulldowns are banned here. Press and pull in front. Shoulders last longer than an Instagram variation.";
  }
  if (q.includes("swap") || q.includes("substitute") || q.includes("instead")) {
    return "I can only swap from the safety registry. Open the workout and tap Swap — you will only see recommended alternatives that respect your injuries.";
  }
  if (q.includes("protein") || q.includes("eat") || q.includes("calorie")) {
    return `Protein target is about 1.6–2.2 g/kg. Yours is based on ${profile.weightKg ?? "your"} kg bodyweight. Eat enough to train. This app will not praise a crash diet.`;
  }
  if (q.includes("time") || q.includes("busy") || q.includes("minutes")) {
    return `Your cap is ${profile.sessionMinutes} minutes. The planner keeps compounds and drops isolation. That is how you train when life is loud.`;
  }
  if (q.includes("glute") || q.includes("butt") || q.includes("ass")) {
    return "Hip thrust, squat or split squat, RDL, abduction, 45° extension. Variety. Plotkin 2023: thrust ≈ squat for glute size. Kassiano 2024: adding thrusts on top of hinges and presses grew more glute. Do the work.";
  }
  if (q.includes("pole") || q.includes("strip") || q.includes("invert")) {
    return "Grip, strict pull-ups, hollow body, hanging tucks, push balance, hip mobility. No kipping. Studio time is still required — this is prep, not a trick list.";
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
    .all()
    .slice(0, 40)
    .reverse();
}