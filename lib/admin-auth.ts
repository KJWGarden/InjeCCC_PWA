import { cookies } from "next/headers";

export interface AdminSessionData {
  id: string;
  username: string;
}

const SESSION_COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function getAdminSession(): Promise<AdminSessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSessionData;
  } catch {
    return null;
  }
}

export async function setAdminSession(data: AdminSessionData) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
