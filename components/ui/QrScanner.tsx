"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function QrScanner() {
  const [state, setState] = useState<ScanState>({ status: "idle" });
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        const scannerState = html5QrRef.current.getState();
        if (scannerState === 2) { // SCANNING state
          await html5QrRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      html5QrRef.current = null;
    }
  }, []);

  const handleScan = useCallback(async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    await stopScanner();

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: decodedText }),
      });

      const data = await res.json();

      if (res.ok) {
        setState({ status: "success", message: data.message });
      } else {
        setState({ status: "error", message: data.error });
      }
    } catch {
      setState({ status: "error", message: "네트워크 오류가 발생했습니다" });
    } finally {
      processingRef.current = false;
    }
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    setState({ status: "scanning" });
    processingRef.current = false;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {} // ignore decode failures
      );
    } catch {
      setState({
        status: "error",
        message: "카메라를 사용할 수 없습니다. 카메라 권한을 확인해주세요.",
      });
    }
  }, [handleScan]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="flex flex-col items-center gap-4">
      {state.status === "success" && (
        <div role="alert" className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
          </svg>
          <span>{state.message}</span>
        </div>
      )}

      {state.status === "error" && (
        <div role="alert" className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
          </svg>
          <span>{state.message}</span>
        </div>
      )}

      <div
        id="qr-reader"
        ref={scannerRef}
        className={`w-full max-w-sm rounded-lg overflow-hidden ${
          state.status === "scanning" ? "" : "hidden"
        }`}
      />

      {state.status === "idle" && (
        <button className="btn btn-primary btn-lg" onClick={startScanner}>
          QR 코드 스캔하기
        </button>
      )}

      {(state.status === "success" || state.status === "error") && (
        <button className="btn btn-outline" onClick={startScanner}>
          다시 스캔하기
        </button>
      )}
    </div>
  );
}
