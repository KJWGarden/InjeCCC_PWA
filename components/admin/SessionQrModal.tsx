"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "@/lib/utils";

interface SessionQrModalProps {
  sessionId: string;
  token: string;
  title: string | null;
  sessionDate: string;
  tokenExpiresAt: string;
  isActive: boolean;
}

export default function SessionQrModal({
  sessionId,
  token,
  title,
  sessionDate,
  tokenExpiresAt,
  isActive,
}: SessionQrModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const expiresAt = new Date(tokenExpiresAt);
  const isExpired = expiresAt < new Date();

  async function handleRenew() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "QR 재발급에 실패했습니다");
        return;
      }

      dialogRef.current?.close();
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="btn btn-ghost btn-xs"
        onClick={() => dialogRef.current?.showModal()}
        disabled={!isActive}
      >
        QR
      </button>

      <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box flex flex-col items-center gap-4">
          <h3 className="font-bold text-lg">{title ?? "채플"}</h3>
          <p className="text-sm text-base-content/60">
            {formatDate(sessionDate)}
          </p>

          <div className={`bg-white p-4 rounded-xl ${isExpired ? "opacity-30" : ""}`}>
            <QRCodeSVG
              value={`https://inje-cccattd.vercel.app/scan?token=${token}`}
              size={256}
            />
          </div>

          {isExpired ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-error">QR 코드가 만료되었습니다</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRenew}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "QR 재발급"
                )}
              </button>
            </div>
          ) : (
            <p className="text-sm text-base-content/60">
              만료:{" "}
              {expiresAt.toLocaleString("ko-KR", {
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}

          <div className="modal-action">
            <form method="dialog">
              <button className="btn">닫기</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
