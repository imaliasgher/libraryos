"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { C } from "@/lib/tokens";

type Html5 = import("html5-qrcode").Html5Qrcode;

const CAMERA_STORAGE_KEY = "libraryos_barcode_camera_id";

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

/** Ask for permission so device labels enumerate reliably (especially on mobile). */
async function ensureVideoPermission(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    /* user denied or no device — enumeration may still return entries on some browsers */
  }
}

function resolveInitialCameraId(devices: Array<{ id: string; label: string }>): string {
  if (!devices.length) return "";
  try {
    const saved = localStorage.getItem(CAMERA_STORAGE_KEY);
    if (saved && devices.some((d) => d.id === saved)) return saved;
  } catch {
    /* private mode */
  }
  const back = devices.find((d) => /back|rear|environment|wide/i.test(d.label))?.id;
  const fallback = back ?? (devices.length > 1 ? devices[devices.length - 1]!.id : devices[0]!.id);
  try {
    localStorage.setItem(CAMERA_STORAGE_KEY, fallback);
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * Live 1D/2D barcode reader. Camera choice is persisted in localStorage as the default.
 */
export function IsbnCameraReader({ elementId, onDecoded }: { elementId: string; onDecoded: (text: string) => void }) {
  const scannerRef = useRef<Html5 | null>(null);
  const onDecodedRef = useRef(onDecoded);
  const doneRef = useRef(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedId, setSelectedId] = useState("");
  const [camerasReady, setCamerasReady] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  onDecodedRef.current = onDecoded;

  const handleCameraChange = useCallback((id: string) => {
    try {
      localStorage.setItem(CAMERA_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setSelectedId(id);
  }, []);

  // Enumerate cameras once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListError(null);
      try {
        await ensureVideoPermission();
        const { Html5Qrcode } = await import("html5-qrcode");
        const devices = await Html5Qrcode.getCameras();
        if (cancelled) return;
        setCameras(devices);
        const initial = resolveInitialCameraId(devices);
        setSelectedId(initial);
      } catch (e) {
        if (!cancelled) {
          setListError("Could not list cameras.");
          console.error(e);
        }
      } finally {
        if (!cancelled) setCamerasReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Start / restart scanner when camera or mount key changes
  useEffect(() => {
    if (!camerasReady || !selectedId) return;

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

      try {
        await scanner.start(selectedId, config, onOk, onErr);
      } catch (e) {
        if (!cancelled) console.error("ISBN camera start failed", e);
      }
    };

    void run();

    return () => {
      cancelled = true;
      void stopScanner(scannerRef.current);
      scannerRef.current = null;
    };
  }, [elementId, selectedId, camerasReady]);

  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
      {camerasReady && cameras.length > 0 && (
        <div
          style={{
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <label htmlFor={`${elementId}-cam`} style={{ fontSize: 12, color: C.textMid, fontWeight: 700, flexShrink: 0 }}>
            Camera
          </label>
          <select
            id={`${elementId}-cam`}
            value={selectedId}
            onChange={(e) => handleCameraChange(e.target.value)}
            style={{
              flex: 1,
              minWidth: 160,
              maxWidth: "100%",
              background: C.inputBg,
              border: `1.5px solid ${C.inputBorder}`,
              borderRadius: 10,
              padding: "8px 12px",
              color: C.text,
              fontSize: 13,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {cameras.map((c, i) => (
              <option key={c.id} value={c.id}>
                {c.label?.trim() || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
      {listError && (
        <div style={{ marginBottom: 8, fontSize: 12, color: C.red, fontWeight: 600 }}>{listError}</div>
      )}
      {camerasReady && cameras.length === 0 && !listError && (
        <div style={{ marginBottom: 8, fontSize: 12, color: C.textMid }}>
          No camera found. Allow camera access in the browser, then refresh.
        </div>
      )}
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
    </div>
  );
}
