import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authSecretBytes } from "@/lib/auth-secret";
import { db, ensureMigrated } from "@/lib/db";
import { usesDefaultPassword } from "@/lib/db/seed";
import { cookiePolicy } from "@/lib/runtime";
import { profiles, users } from "@/lib/db/schema";
import type { AssessmentResult, FitnessTier } from "@/lib/assessment/types";
import { parseAssessment } from "@/lib/assessment/parse";
import type { BodyCompGoal, DietaryPattern, Experience, Goal, Injury, Persona, Units } from "@/lib/types";

const COOKIE = "garanimal_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function sessionCookie(maxAge: number) {
  const policy = cookiePolicy();
  return { httpOnly: true, sameSite: policy.sameSite, secure: policy.secure, path: "/", maxAge } as const;
}

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
};

export const MAX_DISPLAY_NAME = 40;
export const MAX_USERNAME = 64;
export const MAX_PASSWORD = 256;
export const MIN_PASSWORD = 8;

export function cleanDisplayName(raw: string, fallback: string): string {
  const trimmed = raw.replace(/\s+/g, " ").trim().slice(0, MAX_DISPLAY_NAME);
  return trimmed || fallback;
}

export async function createSession(user: SessionUser) {
  // Only the id goes in the token; getSession re-reads name and username from
  // the users table so a long display name can never push the cookie past 4 KB.
  const token = await new SignJWT({ id: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(authSecretBytes());
  (await cookies()).set(COOKIE, token, sessionCookie(SESSION_MAX_AGE));
}

export async function destroySession() {
  (await cookies()).set(COOKIE, "", sessionCookie(0));
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecretBytes(), { algorithms: ["HS256"] });
    const id = typeof payload.id === "string" ? payload.id : "";
    if (!id) return null;
    const row = db.select().from(users).where(eq(users.id, id)).get();
    if (!row) return null;
    return { id: row.id, username: row.username, displayName: row.displayName };
  } catch {
    return null;
  }
}

export function verifyLogin(username: string, password: string): SessionUser | null {
  const name = username.trim().toLowerCase().slice(0, MAX_USERNAME);
  if (!name || !password || password.length > MAX_PASSWORD) return null;
  const user = db.select().from(users).where(eq(users.username, name)).get();
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.passwordHash)) return null;
  return { id: user.id, username: user.username, displayName: user.displayName };
}

export type PasswordChangeResult = "ok" | "wrong-current" | "too-short" | "too-long" | "mismatch" | "same";

/** Verify the current password, then store a new bcrypt hash. Sessions stay valid. */
export function changePassword(userId: string, current: string, next: string, confirm: string): PasswordChangeResult {
  if (next.length < MIN_PASSWORD) return "too-short";
  if (next.length > MAX_PASSWORD) return "too-long";
  if (next !== confirm) return "mismatch";
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user || current.length > MAX_PASSWORD || !bcrypt.compareSync(current, user.passwordHash)) return "wrong-current";
  if (current === next) return "same";
  db.update(users).set({ passwordHash: bcrypt.hashSync(next, 10) }).where(eq(users.id, userId)).run();
  return "ok";
}

/** True while a user is still on the seeded default password. */
export function hasDefaultPassword(userId: string): boolean {
  const user = db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId)).get();
  return Boolean(user && usesDefaultPassword(user.passwordHash));
}

export type ProfileRow = {
  userId: string;
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  sessionMinutes: number;
  equipment: string[];
  injuries: Injury[];
  units: Units;
  persona: Persona;
  sex: "female" | "male" | "unspecified";
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  onboarded: boolean;
  activeProgramId: string | null;
  programStartDate: string | null;
  currentWeek: number;
  assessment: AssessmentResult | null;
  fitnessTier: FitnessTier | null;
  assessedAt: string | null;
  activeDietId: string | null;
  dietStartDate: string | null;
  dietWeek: number;
  /** Null until the user answers the body-composition question on /meal-plan. */
  bodyCompGoal: BodyCompGoal | null;
  bodyFatPct: number | null;
  mealsPerDay: number;
  dietaryPattern: DietaryPattern;
};

const BODY_COMP_GOALS: readonly BodyCompGoal[] = ["lean", "recomp", "maintain", "gain"];
const DIETARY_PATTERNS: readonly DietaryPattern[] = ["omnivore", "pescatarian", "vegetarian", "vegan"];

function parseStringList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function getProfile(userId: string): ProfileRow | null {
  try {
    return readProfile(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("no such column")) throw error;
    ensureMigrated();
    return readProfile(userId);
  }
}

function readProfile(userId: string): ProfileRow | null {
  const row = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
  if (!row) return null;
  return {
    userId: row.userId,
    goal: row.goal as Goal,
    experience: row.experience as Experience,
    daysPerWeek: row.daysPerWeek,
    sessionMinutes: row.sessionMinutes,
    equipment: parseStringList(row.equipment),
    injuries: parseStringList(row.injuries) as Injury[],
    units: row.units as Units,
    persona: row.persona as Persona,
    sex: row.sex as ProfileRow["sex"],
    age: row.age,
    heightCm: row.heightCm,
    weightKg: row.weightKg,
    onboarded: row.onboarded === 1,
    activeProgramId: row.activeProgramId,
    programStartDate: row.programStartDate,
    currentWeek: row.currentWeek,
    assessment: parseAssessment(row.assessmentJson),
    fitnessTier: row.fitnessTier as FitnessTier | null,
    assessedAt: row.assessedAt ?? null,
    activeDietId: row.activeDietId ?? null,
    dietStartDate: row.dietStartDate ?? null,
    dietWeek: row.dietWeek ?? 1,
    bodyCompGoal: BODY_COMP_GOALS.includes(row.bodyCompGoal as BodyCompGoal)
      ? (row.bodyCompGoal as BodyCompGoal)
      : null,
    bodyFatPct:
      typeof row.bodyFatPct === "number" && Number.isFinite(row.bodyFatPct) && row.bodyFatPct > 0
        ? row.bodyFatPct
        : null,
    mealsPerDay: Math.min(6, Math.max(3, Math.round(row.mealsPerDay ?? 4))),
    dietaryPattern: DIETARY_PATTERNS.includes(row.dietaryPattern as DietaryPattern)
      ? (row.dietaryPattern as DietaryPattern)
      : "omnivore",
  };
}