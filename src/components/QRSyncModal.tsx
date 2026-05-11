"use client";

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { QRCodeCanvas } from "qrcode.react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Html5Qrcode } from "html5-qrcode";
import { useCalendarStore, type Leave, type Person } from "@/stores";

const SCAN_REGION_ID = "annual-leave-qr-sync-camera-region";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isPerson(value: unknown): value is Person {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.color === "string"
  );
}

function isLeave(value: unknown): value is Leave {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.personId === "string" &&
    typeof o.startDate === "string" &&
    typeof o.endDate === "string" &&
    ISO_DATE_RE.test(o.startDate) &&
    ISO_DATE_RE.test(o.endDate)
  );
}

function parseImportedState(raw: unknown): {
  persons: Person[];
  leaves: Leave[];
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.persons) || !Array.isArray(o.leaves)) return null;
  const persons = o.persons.filter(isPerson);
  const leaves = o.leaves.filter(isLeave);
  if (persons.length !== o.persons.length || leaves.length !== o.leaves.length) {
    return null;
  }
  const personIds = new Set(persons.map((p) => p.id));
  if (personIds.size !== persons.length) return null;
  if (!leaves.every((l) => personIds.has(l.personId))) return null;
  return { persons, leaves };
}

export type QRSyncModalProps = {
  open: boolean;
  onClose: () => void;
};

type TabId = "send" | "receive";

export function QRSyncModal({ open, onClose }: QRSyncModalProps) {
  const headingId = useId();
  const persons = useCalendarStore((s) => s.persons);
  const leaves = useCalendarStore((s) => s.leaves);

  const [tab, setTab] = useState<TabId>("send");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    persons: Person[];
    leaves: Leave[];
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingDecodeRef = useRef(false);

  const qrValue = useMemo(() => {
    try {
      const payload = JSON.stringify({
        persons,
        leaves,
        timestamp:
          // eslint-disable-next-line react-hooks/purity -- intentional export stamp
          Date.now(),
      });
      return compressToEncodedURIComponent(payload);
    } catch {
      return "";
    }
  }, [persons, leaves]);

  useEffect(() => {
    if (!open || tab !== "receive") {
      const prev = scannerRef.current;
      scannerRef.current = null;
      handlingDecodeRef.current = false;
      if (prev) {
        void prev
          .stop()
          .then(() => {
            prev.clear();
          })
          .catch(() => {
            try {
              prev.clear();
            } catch {
              /* ignore */
            }
          });
      }
      return;
    }

    let cancelled = false;

    const onDecoded = (decodedText: string) => {
      if (handlingDecodeRef.current) return;
      const scanner = scannerRef.current;
      if (!scanner?.isScanning) return;

      let parsedJson: unknown;
      try {
        const decompressed = decompressFromEncodedURIComponent(decodedText);
        if (!decompressed) {
          window.alert("QR kodu okunamadı veya sıkıştırılmış veri geçersiz.");
          return;
        }
        parsedJson = JSON.parse(decompressed) as unknown;
      } catch {
        window.alert("QR içeriği çözümlenemedi.");
        return;
      }

      const imported = parseImportedState(parsedJson);
      if (!imported) {
        window.alert(
          "Bu QR kodu geçerli bir izin takvimi yedeği içermiyor.",
        );
        return;
      }

      handlingDecodeRef.current = true;
      try {
        scanner.pause(true);
      } catch {
        /* ignore */
      }
      setPendingImport(imported);
    };

    const shutdownScanner = async (scanner: Html5Qrcode) => {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        /* ignore */
      }
      try {
        scanner.clear();
      } catch {
        /* ignore */
      }
      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
    };

    void (async () => {
      setCameraError(null);
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(SCAN_REGION_ID, false);
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 240, height: 240 },
        };
        const onScanFailure = () => {};

        try {
          await scanner.start(
            { facingMode: "environment" },
            config,
            onDecoded,
            onScanFailure,
          );
        } catch {
          if (cancelled) {
            await shutdownScanner(scanner);
            return;
          }
          try {
            await scanner.start(
              { facingMode: "user" },
              config,
              onDecoded,
              onScanFailure,
            );
          } catch (inner) {
            if (!cancelled) {
              const msg =
                inner instanceof Error
                  ? inner.message
                  : "Kamera başlatılamadı.";
              setCameraError(msg);
            }
            await shutdownScanner(scanner);
            return;
          }
        }

        if (cancelled) {
          await shutdownScanner(scanner);
        }
      } catch (e) {
        if (!cancelled) {
          const msg =
            e instanceof Error ? e.message : "Tarayıcıda kamera desteklenmiyor.";
          setCameraError(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      handlingDecodeRef.current = false;
      if (!s) return;
      void s
        .stop()
        .then(() => {
          s.clear();
        })
        .catch(() => {
          try {
            s.clear();
          } catch {
            /* ignore */
          }
        });
    };
  }, [open, tab]);

  const applyImport = useCallback(() => {
    if (!pendingImport) return;
    useCalendarStore.setState({
      persons: pendingImport.persons,
      leaves: pendingImport.leaves,
      selectionRange: { start: null, end: null },
      selectionAnchor: null,
      isSelecting: false,
      assignmentModal: { isOpen: false },
    });
    setPendingImport(null);
    handlingDecodeRef.current = false;
    onClose();
  }, [onClose, pendingImport]);

  const cancelImportPrompt = useCallback(() => {
    setPendingImport(null);
    handlingDecodeRef.current = false;
    try {
      scannerRef.current?.resume();
    } catch {
      /* ignore */
    }
  }, []);

  const onBackdropPointerDown = useCallback(
    (e: PointerEvent<Element>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!open) {
    return null;
  }

  return (
    <>
      <ConfirmDialog
        open={pendingImport !== null}
        title="Mevcut verilerin üzerine yazılsın mı?"
        description={
          pendingImport
            ? `Bu cihazdaki ${pendingImport.persons.length} kişi ve ${pendingImport.leaves.length} izin kaydı, QR ile gelen verilerle değiştirilecek.`
            : ""
        }
        cancelLabel="İptal"
        confirmLabel="Üzerine yaz"
        confirmDestructive
        onCancel={cancelImportPrompt}
        onConfirm={applyImport}
      />

      <div
        className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
        role="presentation"
      >
        <div
          className="absolute inset-0 bg-zinc-950/55 backdrop-blur-[2px] dark:bg-black/65"
          aria-hidden
        />
        <button
          type="button"
          aria-label="Kapat"
          className="absolute inset-0 cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/35"
          onPointerDown={onBackdropPointerDown}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          className="relative z-10 w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl shadow-zinc-950/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <h2
              id={headingId}
              className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              QR ile eşitleme
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-500"
            >
              Kapat
            </button>
          </div>

          <div
            className="mt-4 flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-950"
            role="tablist"
            aria-label="Eşitleme modu"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "send"}
              className={[
                "flex-1 rounded-md px-2 py-2 text-center text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500",
                tab === "send"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              ].join(" ")}
              onClick={() => setTab("send")}
            >
              Gönder (QR göster)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "receive"}
              className={[
                "flex-1 rounded-md px-2 py-2 text-center text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500",
                tab === "receive"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              ].join(" ")}
              onClick={() => setTab("receive")}
            >
              Al (QR okut)
            </button>
          </div>

          <div className="mt-4">
            {tab === "send" ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-center text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Diğer cihazda &quot;Al&quot; sekmesini açıp bu kodu kameraya
                  gösterin. İnternet bağlantısı gerekmez.
                </p>
                {qrValue.length === 0 ? (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    QR oluşturulamadı.
                  </p>
                ) : (
                  <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950">
                    <QRCodeCanvas
                      value={qrValue}
                      size={256}
                      level="L"
                      bgColor="#ffffff"
                      fgColor="#09090b"
                      aria-label="Eşitleme QR kodu"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-center text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Kamera izni istenebilir. Kodu kadraja alın; veriler
                  yüklendikten sonra onay isteyeceğiz.
                </p>
                {cameraError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    Kamera: {cameraError}
                  </p>
                ) : null}
                <div
                  id={SCAN_REGION_ID}
                  className="mx-auto min-h-[240px] w-full max-w-[320px] overflow-hidden rounded-xl border border-zinc-200 bg-black/5 dark:border-zinc-700 dark:bg-black/40"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
