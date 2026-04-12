"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GroupLeaveButton({
  groupId,
  groupName,
  redirectTo,
}: {
  groupId: string;
  groupName: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLeave() {
    if (!confirm(`"${groupName}" 순에서 나가시겠습니까?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/groups/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "순 나가기에 실패했습니다");
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="btn btn-ghost btn-sm text-error"
      onClick={handleLeave}
      disabled={loading}
    >
      {loading ? <span className="loading loading-spinner loading-xs" /> : "나가기"}
    </button>
  );
}
