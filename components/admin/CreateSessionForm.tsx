"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateSessionForm() {
  const router = useRouter();
  const [sessionDate, setSessionDate] = useState("");
  const [title, setTitle] = useState("");
  const [qrDuration, setQrDuration] = useState(60);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_date: sessionDate,
          title: title || undefined,
          qr_duration_minutes: qrDuration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "채플 생성에 실패했습니다");
        return;
      }

      setSessionDate("");
      setTitle("");
      setQrDuration(15);

      // Navigate to the created session's semester
      const semester = data.session?.semester;
      if (semester) {
        router.push(`/admin?semester=${semester}`);
      }
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div role="alert" className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      <label className="floating-label">
        <span>날짜</span>
        <input
          type="date"
          className="input input-bordered w-full"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          required
        />
      </label>

      <label className="floating-label">
        <span>제목 (선택)</span>
        <input
          type="text"
          placeholder="제목 (선택)"
          className="input input-bordered w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="floating-label">
        <span>QR 유효시간 (분)</span>
        <input
          type="number"
          placeholder="QR 유효시간 (분)"
          className="input input-bordered w-full"
          value={qrDuration}
          onChange={(e) => setQrDuration(Number(e.target.value))}
          min={1}
          max={120}
          required
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? <span className="loading loading-spinner loading-sm" /> : "채플 생성"}
      </button>
    </form>
  );
}
