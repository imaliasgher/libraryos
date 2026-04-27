"use client";

import { useEffect, useRef } from "react";

type Html5 = import("html5-qrcode").Html5Qrcode;

async function stopScanner(s: Html5 | null) {
  if (!s) return;
  try {
    if (s.isScanning) await s.stop();
  } catch {
    /* already stopped or track ended */
  }
  try {
    s.clear();
  } catch {
    /* ignore */
  }
}

/**
 * Live 1D/2D barcode reader using the device camera.
 * Prefers the back camera (`facingMode: environment`), then label heuristics, then last listed device.
 */
export function IsbnCameraReader({ elementId, onDecoded }: { elementId: string; onDecoded: (text: string) => void }) {
  const scannerRef = useRef<Html5 | null>(null);
  const onDecodedRef = useRef(onDecoded);
  const doneRef = useRef(false);

  onDecodedRef.current = onDecoded;

  useEffect(() => {
    doneRef.current = false;
    let cancelled = false;

    const run = async () => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      if (cancelled) return;

      const formats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODABAR,
      ];

      const scanner = new Html5Qrcode(elementId, {
        verbose: false,
        formatsToSupport: formats,
        useBarCodeDetectorIfSupported: true,
      });
      scannerRef.current = scanner;

      const config = { fps: 8, qrbox: { width: 300, height: 200 }, aspectRatio: 1.7777778 };

      const onOk = (text: string) => {
        if (doneRef.current || !text?.trim()) return;
        doneRef.current = true;
        void stopScanner(scanner).finally(() => {
          onDecodedRef.current(text.trim());
        });
      };

      const onErr = (_message: string, _error: unknown) => {};

      const startWith = async (cameraIdOrConfig: string | MediaTrackConstraints) => {
        await scanner.start(cameraIdOrConfig, config, onOk, onErr);
      };

      try {
        await startWith({ facingMode: "environment" });
      } catch {
        if (cancelled) return;
        try {
          const devices = await Html5Qrcode.getCameras();
          if (!devices.length) return;
          let camId = devices.find((d) => /back|rear|environment|wide/i.test(d.label))?.id;
          if (!camId && devices.length > 1) camId = devices[devices.length - 1]!.id;
          if (!camId) camId = devices[0]!.id;
          await startWith(camId);
        } catch (e) {
          console.error("ISBN camera start failed", e);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      void stopScanner(scannerRef.current);
      scannerRef.current = null;
    };
  }, [elementId]);

  return (
    <div
      id={elementId}
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        borderRadius: 16,
        overflow: "hidden",
        border: "2px solid #e8dfd4",
        minHeight: 220,
        background: "#0a0a0a",
      }}
    />
  );
}
