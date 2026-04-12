"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatDate } from "@/lib/utils";

interface SessionQrModalProps {
  token: string;
  title: string | null;
  sessionDate: string;
  tokenExpiresAt: string;
  isActive: boolean;
}

export default function SessionQrModal({
  token,
  title,
  sessionDate,
  tokenExpiresAt,
  isActive,
}: SessionQrModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const expiresAt = new Date(tokenExpiresAt);
  const isExpired = expiresAt < new Date();

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

          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={token} size={256} />
          </div>

          {isExpired ? (
            <p className="text-sm text-error">QR 코드가 만료되었습니다</p>
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
