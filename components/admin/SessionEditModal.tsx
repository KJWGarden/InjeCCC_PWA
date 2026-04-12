"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SessionEditModalProps {
  id: string;
  sessionDate: string;
  title: string | null;
  qrDurationMinutes: number;
}

export default function SessionEditModal({
  id,
  sessionDate,
  title,
  qrDurationMinutes,
}: SessionEditModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [date, setDate] = useState(sessionDate);
  const [titleValue, setTitleValue] = useState(title ?? "");
  const [qrDuration, setQrDuration] = useState(qrDurationMinutes);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleOpen() {
    setDate(sessionDate);
    setTitleValue(title ?? "");
    setQrDuration(qrDurationMinutes);
    setError("");
    dialogRef.current?.showModal();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          session_date: date,
          title: titleValue || undefined,
          qr_duration_minutes: qrDuration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "채플 수정에 실패했습니다");
        return;
      }

      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="btn btn-ghost btn-xs" onClick={handleOpen}>
        수정
      </button>

      <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">채플 수정</h3>

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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>

            <label className="floating-label">
              <span>제목 (선택)</span>
              <input
                type="text"
                placeholder="제목 (선택)"
                className="input input-bordered w-full"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
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

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => dialogRef.current?.close()}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "저장"
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
