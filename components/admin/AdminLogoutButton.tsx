"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/logout", { method: "POST" });
      if (!res.ok) return;
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm shrink-0 text-base-content/70"
      onClick={handleLogout}
      disabled={loading}
      aria-label="로그아웃"
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        "로그아웃"
      )}
    </button>
  );
}
