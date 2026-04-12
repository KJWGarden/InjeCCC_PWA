"use client";

import { createContext, useContext } from "react";
import type { SessionData } from "@/lib/auth";

const AuthContext = createContext<SessionData | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default function AuthProvider({
  session,
  children,
}: {
  session: SessionData;
  children: React.ReactNode;
}) {
  return <AuthContext value={session}>{children}</AuthContext>;
}
