"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SessionDeleteButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "이 채플을 삭제하시겠습니까? 관련 출석 기록도 함께 삭제됩니다."
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "채플 삭제에 실패했습니다");
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
      className="btn btn-ghost btn-xs text-error"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        "삭제"
      )}
    </button>
  );
}
