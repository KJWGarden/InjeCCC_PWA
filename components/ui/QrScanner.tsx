"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function extractToken(raw: string): string {
  try {
    const url = new URL(raw);
    const t = url.searchParams.get("token");
    if (t) return t;
  } catch {
    // not a URL, use as-is
  }
  return raw;
}

interface QrScannerProps {
  autoToken?: string;
}

export default function QrScanner({ autoToken }: QrScannerProps) {
  const [state, setState] = useState<ScanState>({ status: "idle" });
  const [zoom, setZoom] = useState(1);
  const [showZoom, setShowZoom] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const zoomRef = useRef(1);
  const zoomCapRef = useRef<{ isSupported: () => boolean; apply: (v: number) => Promise<void>; min: () => number; max: () => number } | null>(null);
  const hideZoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // pinch state
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);

  // swipe state (single finger vertical)
  const swipeStartY = useRef<number | null>(null);
  const swipeStartZoom = useRef(1);

  const applyZoom = useCallback(async (newZoom: number) => {
    const capped = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
    zoomRef.current = capped;
    setZoom(capped);
    setShowZoom(true);

    if (hideZoomTimer.current) clearTimeout(hideZoomTimer.current);
    hideZoomTimer.current = setTimeout(() => setShowZoom(false), 1500);

    if (zoomCapRef.current?.isSupported()) {
      const min = zoomCapRef.current.min();
      const max = zoomCapRef.current.max();
      const native = clamp(capped, min, max);
      await zoomCapRef.current.apply(native).catch(() => {});
    }
  }, []);

  const initZoomCapability = useCallback(() => {
    if (!html5QrRef.current) return;
    try {
      const caps = html5QrRef.current.getRunningTrackCameraCapabilities();
      const zoomFeature = caps.zoomFeature();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      zoomCapRef.current = zoomFeature as any;
    } catch {
      zoomCapRef.current = null;
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        const scannerState = html5QrRef.current.getState();
        if (scannerState === 2) {
          await html5QrRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      html5QrRef.current = null;
    }
    zoomCapRef.current = null;
    zoomRef.current = 1;
    setZoom(1);
    setShowZoom(false);
  }, []);

  const submitToken = useCallback(async (raw: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    const token = extractToken(raw);

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
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

  const handleScan = useCallback(async (decodedText: string) => {
    await stopScanner();
    await submitToken(decodedText);
  }, [stopScanner, submitToken]);

  // Auto-submit when token comes from URL param (external camera scan)
  useEffect(() => {
    if (autoToken) {
      setState({ status: "scanning" });
      submitToken(autoToken);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = useCallback(async () => {
    setState({ status: "scanning" });
    processingRef.current = false;
    zoomRef.current = 1;
    setZoom(1);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => {}
      );

      // init zoom capability after camera starts
      setTimeout(initZoomCapability, 500);
    } catch {
      setState({
        status: "error",
        message: "카메라를 사용할 수 없습니다. 카메라 권한을 확인해주세요.",
      });
    }
  }, [handleScan, initZoomCapability]);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoom.current = zoomRef.current;
      swipeStartY.current = null;
    } else if (e.touches.length === 1) {
      swipeStartY.current = e.touches[0].clientY;
      swipeStartZoom.current = zoomRef.current;
      pinchStartDist.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      // pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchStartDist.current;
      applyZoom(pinchStartZoom.current * scale);
    } else if (e.touches.length === 1 && swipeStartY.current !== null) {
      // single-finger vertical swipe to zoom
      const deltaY = swipeStartY.current - e.touches[0].clientY;
      // 100px swipe = 1x zoom change
      const zoomDelta = deltaY / 100;
      applyZoom(swipeStartZoom.current + zoomDelta);
    }
  }, [applyZoom]);

  const handleTouchEnd = useCallback(() => {
    pinchStartDist.current = null;
    swipeStartY.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
      if (hideZoomTimer.current) clearTimeout(hideZoomTimer.current);
    };
  }, [stopScanner]);

  const zoomPercent = Math.round(((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100);

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
        className={`relative w-full max-w-sm ${state.status === "scanning" ? "" : "hidden"}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none" }}
      >
        <div
          id="qr-reader"
          ref={scannerRef}
          className="w-full rounded-lg overflow-hidden"
        />

        {/* Zoom indicator */}
        {showZoom && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
            <div className="bg-black/60 text-white text-sm font-semibold px-3 py-1 rounded-full">
              {zoom.toFixed(1)}x
            </div>
            <div className="w-24 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${zoomPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Zoom hint */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="bg-black/50 text-white/80 text-xs px-2 py-1 rounded-full whitespace-nowrap">
            핀치 또는 위아래 스와이프로 줌 조절
          </span>
        </div>

        {/* Zoom buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <button
            className="btn btn-circle btn-sm bg-black/50 border-none text-white hover:bg-black/70"
            onClick={() => applyZoom(zoomRef.current + ZOOM_STEP * 5)}
          >
            +
          </button>
          <button
            className="btn btn-circle btn-sm bg-black/50 border-none text-white hover:bg-black/70"
            onClick={() => applyZoom(zoomRef.current - ZOOM_STEP * 5)}
          >
            −
          </button>
        </div>
      </div>

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
