import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authSecretBytes } from "@/lib/auth-secret";
import { db, ensureMigrated } from "@/lib/db";
import { cookiePolicy } from "@/lib/runtime";
import { profiles, users } from "@/lib/db/schema";
import type { AssessmentResult, FitnessTier } from "@/lib/assessment/types";
import { parseAssessment } from "@/lib/assessment/parse";
import type { Experience, Goal, Injury, Persona, Units } from "@/lib/types";

const COOKIE = "garanimal_session";

function secret() {
  return authSecretBytes();
}

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ id: user.id, username: user.username, displayName: user.displayName })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  const policy = cookiePolicy();
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: policy.sameSite,
    secure: policy.secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const policy = cookiePolicy();
  (await cookies()).set(COOKIE, "", {
    httpOnly: true,
    sameSite: policy.sameSite,
    secure: policy.secure,
    path: "/",
    maxAge: 0,
  });
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
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
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
  const user = db
    .select()
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .get();
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.passwordHash)) return null;
  return { id: user.id, username: user.username, displayName: user.displayName };
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
};

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
    fitnessTier: (row.fitnessTier as FitnessTier | null) ?? null,
    assessedAt: row.assessedAt ?? null,
    activeDietId: row.activeDietId ?? null,
    dietStartDate: row.dietStartDate ?? null,
    dietWeek: row.dietWeek ?? 1,
  };
}