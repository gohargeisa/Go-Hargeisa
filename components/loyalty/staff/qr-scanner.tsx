"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, CameraOff, Keyboard, Loader2 } from "lucide-react";
import jsQR from "jsqr";
import { parseLoyaltyQrPayload } from "@/lib/loyalty/constants";

/**
 * Pure-web membership-QR scanner for the loyalty staff console.
 *
 *  - `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`
 *    for the camera (same-origin only — Permissions-Policy `camera=(self)`,
 *    set in next.config.mjs specifically for this route).
 *  - `BarcodeDetector` when the engine exposes it (Chrome / most Android
 *    System WebView builds) — the fast path.
 *  - `jsQR` decoding of sampled `<canvas>` frames otherwise, so scanning
 *    still works on WebViews without BarcodeDetector.
 *  - Manual membership-number entry as the always-available fallback (no
 *    camera permission, blocked camera, desktop, or a damaged QR).
 *
 * No native / Capacitor plugin. The Android app loads the live site in a
 * WebView, so this runs there unchanged.
 */

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}
interface BarcodeDetectorCtor {
  new (opts?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

type CameraState = "idle" | "starting" | "scanning" | "denied" | "unavailable";

export function QrScanner({
  onMemberUid,
  onMembershipNumber,
  numberEntryLabel,
}: {
  /** Fired once with a valid member_uid parsed from a scanned QR. */
  onMemberUid: (uid: string) => void;
  /** Fired when the operator submits a membership number manually. */
  onMembershipNumber: (value: string) => void;
  numberEntryLabel: string;
}) {
  const t = useTranslations("loyalty");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const doneRef = useRef(false);
  const lastDecodeRef = useRef(0);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const handleRaw = useCallback(
    (raw: string) => {
      if (doneRef.current) return;
      const uid = parseLoyaltyQrPayload(raw);
      if (!uid) return; // not one of ours — keep scanning
      doneRef.current = true;
      stop();
      onMemberUid(uid);
    },
    [onMemberUid, stop]
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    const now = performance.now();
    // Decode at ~6 fps, not every animation frame — jsQR on a full frame is
    // heavy, and a QR only needs to be caught within a fraction of a second.
    if (!video || doneRef.current || video.readyState < 2 || now - lastDecodeRef.current < 160) {
      if (!doneRef.current) rafRef.current = requestAnimationFrame(tick);
      return;
    }
    lastDecodeRef.current = now;

    const run = async () => {
      try {
        if (detectorRef.current) {
          try {
            const found = await detectorRef.current.detect(video);
            if (found[0]?.rawValue) handleRaw(found[0].rawValue);
          } catch {
            // Some WebViews expose BarcodeDetector but its detect() throws
            // "not implemented" — drop it and let jsQR take over next tick.
            detectorRef.current = null;
          }
        } else {
          const canvas = (canvasRef.current ??= document.createElement("canvas"));
          // Downscale to a max ~640px working image — plenty for a QR, a
          // fraction of the pixels for jsQR to scan.
          const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight || 1));
          const w = (canvas.width = Math.round(video.videoWidth * scale));
          const h = (canvas.height = Math.round(video.videoHeight * scale));
          const cctx = canvas.getContext("2d", { willReadFrequently: true });
          if (cctx && w && h) {
            cctx.drawImage(video, 0, 0, w, h);
            const img = cctx.getImageData(0, 0, w, h);
            const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
            if (code?.data) handleRaw(code.data);
          }
        }
      } catch {
        /* transient decode error — keep going */
      }
      if (!doneRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    void run();
  }, [handleRaw]);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("unavailable");
      setManualOpen(true);
      return;
    }
    setCameraState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stop();
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => undefined);

      const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
      if (Ctor) {
        try {
          const formats = (await Ctor.getSupportedFormats?.()) ?? ["qr_code"];
          if (formats.includes("qr_code")) detectorRef.current = new Ctor({ formats: ["qr_code"] });
        } catch {
          detectorRef.current = null;
        }
      }

      doneRef.current = false;
      setCameraState("scanning");
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const name = (err as { name?: string })?.name;
      setCameraState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
      setManualOpen(true);
    }
  }, [stop, tick]);

  useEffect(() => {
    void start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const v = manualValue.trim();
    if (v) onMembershipNumber(v);
  }

  return (
    <div>
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-ink">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
          aria-label={t("scannerVideoLabel")}
        />
        {/* framing guide */}
        {cameraState === "scanning" && (
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-2/3 w-2/3 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}
        {(cameraState === "idle" || cameraState === "starting") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
            <Loader2 size={22} className="animate-spin" aria-hidden="true" />
            <p className="text-sm">{t("scannerStarting")}</p>
          </div>
        )}
        {(cameraState === "denied" || cameraState === "unavailable") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white/80">
            <CameraOff size={24} aria-hidden="true" />
            <p className="text-sm">
              {cameraState === "denied" ? t("scannerDenied") : t("scannerUnavailable")}
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-sm text-ink/55 dark:text-sand/55">{t("scannerHint")}</p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {(cameraState === "denied" || cameraState === "unavailable") && (
          <button
            type="button"
            onClick={() => {
              doneRef.current = false;
              void start();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
          >
            <Camera size={14} aria-hidden="true" />
            {t("scannerRetry")}
          </button>
        )}
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          aria-expanded={manualOpen}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
        >
          <Keyboard size={14} aria-hidden="true" />
          {t("enterNumberInstead")}
        </button>
      </div>

      {manualOpen && (
        <form onSubmit={submitManual} className="mx-auto mt-4 flex max-w-sm gap-2">
          <input
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder={numberEntryLabel}
            aria-label={numberEntryLabel}
            autoCapitalize="characters"
            className="min-w-0 flex-1 rounded-full border border-ink/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-white/20"
          />
          <button
            type="submit"
            disabled={!manualValue.trim()}
            className="shrink-0 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
          >
            {t("lookUp")}
          </button>
        </form>
      )}
    </div>
  );
}
