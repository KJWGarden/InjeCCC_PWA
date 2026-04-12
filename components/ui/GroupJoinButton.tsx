"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GroupJoinButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "순 가입에 실패했습니다");
        return;
      }

      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="btn btn-primary btn-sm"
      onClick={handleJoin}
      disabled={loading}
    >
      {loading ? <span className="loading loading-spinner loading-xs" /> : "가입하기"}
    </button>
  );
}
