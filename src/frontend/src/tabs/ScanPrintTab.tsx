import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Hash,
  Printer,
  RotateCcw,
  Tag,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDiagnosticsStore } from "../stores/diagnosticsStore";
import { useLabelSettingsStore } from "../stores/labelSettingsStore";
import type { PrefixMapping } from "../stores/labelSettingsStore";
import { usePrinterStore } from "../stores/printerStore";
import { submitJobBestEffort } from "../utils/backendClient";
import { generateCPCL } from "../utils/cpclGenerator";
import { playSound } from "../utils/soundSystem";

type Step = 1 | 2 | 3;

interface ScanData {
  serial: string;
  prefix: string;
  labelType: string;
  title: string;
}

function findMatchingPrefix(
  serial: string,
  prefixes: PrefixMapping[],
): PrefixMapping | null {
  // Sort by prefix length descending so longer prefixes match first
  const sorted = [...prefixes].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  for (const p of sorted) {
    if (serial.toUpperCase().startsWith(p.prefix.toUpperCase())) {
      return p;
    }
  }
  return null;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ScanPrintTab() {
  const [step, setStep] = useState<Step>(1);
  const [inputValue, setInputValue] = useState("");
  const [scan1, setScan1] = useState<ScanData | null>(null);
  const [scan2, setScan2] = useState<ScanData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printTriggered, setPrintTriggered] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const { isConnected } = usePrinterStore();
  const settings = useLabelSettingsStore();
  const diag = useDiagnosticsStore();

  // Wake lock to keep tablet awake
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (
            navigator as unknown as {
              wakeLock: {
                request: (type: string) => Promise<WakeLockSentinel>;
              };
            }
          ).wakeLock.request("screen");
        }
      } catch {
        // Wake lock not available or denied — ignore
      }
    };
    requestWakeLock();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLock?.release().catch(() => {});
    };
  }, []);

  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  const showError = useCallback(
    (msg: string, playErr = true) => {
      setErrorMsg(msg);
      setSuccessMsg(null);
      setInputValue("");
      if (playErr) {
        playSound(settings.errorSoundId, settings.volume);
      }
      diag.incrementErrors();
      diag.addLog("error", msg);
      focusInput();
    },
    [settings, diag, focusInput],
  );

  const resetWorkflow = useCallback(() => {
    setStep(1);
    setInputValue("");
    setScan1(null);
    setScan2(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPrintTriggered(false);
    focusInput();
  }, [focusInput]);

  const handlePrint = useCallback(
    async (s1: ScanData, s2: ScanData) => {
      if (!isConnected) {
        showError(
          "Printer not connected. Go to Devices tab to connect.",
          false,
        );
        return;
      }

      setIsPrinting(true);
      setErrorMsg(null);

      try {
        const cpcl = generateCPCL(settings, s1.serial, s2.serial, s1.title);
        await usePrinterStore.getState().print(cpcl);

        playSound(settings.printSoundId, settings.volume);
        setSuccessMsg(`Printed: ${s1.serial} / ${s2.serial}`);
        diag.incrementPrints(s1.prefix, s1.labelType);
        diag.addPrintHistory({
          timestamp: Date.now(),
          labelType: s1.labelType,
          serial1: s1.serial,
          serial2: s2.serial,
          success: true,
        });
        diag.addLog(
          "info",
          `Print success: ${s1.serial} / ${s2.serial}`,
          `Label: ${s1.title}`,
        );

        // Best-effort backend submit (non-blocking)
        const s1num = BigInt(s1.serial.replace(/[^0-9]/g, "") || 0);
        const s2num = BigInt(s2.serial.replace(/[^0-9]/g, "") || 0);
        submitJobBestEffort(s1.prefix, s1num, s2num);

        // Auto-reset to step 1 after 1 second
        setTimeout(() => {
          resetWorkflow();
        }, 1000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Print failed";
        showError(msg, false);
        diag.addPrintHistory({
          timestamp: Date.now(),
          labelType: s1.labelType,
          serial1: s1.serial,
          serial2: s2.serial,
          success: false,
        });
      } finally {
        setIsPrinting(false);
      }
    },
    [isConnected, settings, diag, showError, resetWorkflow],
  );

  // Auto-print when scan2 is set
  useEffect(() => {
    if (scan2 && scan1 && step === 3 && !printTriggered) {
      setPrintTriggered(true);
      handlePrint(scan1, scan2);
    }
  }, [scan2, scan1, step, printTriggered, handlePrint]);

  const handleScan = useCallback(() => {
    const serial = inputValue.trim().toUpperCase();
    setInputValue("");
    if (!serial) return;

    if (step === 1) {
      const mapping = findMatchingPrefix(serial, settings.prefixes);
      if (!mapping) {
        showError("Wrong barcode scanned");
        return;
      }
      const newScan: ScanData = {
        serial,
        prefix: mapping.prefix,
        labelType: mapping.labelType,
        title: mapping.title,
      };
      setScan1(newScan);
      setErrorMsg(null);
      playSound(settings.successSoundId, settings.volume);
      diag.incrementScans(mapping.prefix, mapping.labelType);
      diag.addLog("info", `Scan 1: ${serial} (${mapping.labelType})`);
      setStep(2);
      focusInput();
    } else if (step === 2 && scan1) {
      const mapping = findMatchingPrefix(serial, settings.prefixes);
      if (!mapping) {
        showError("Wrong barcode scanned");
        return;
      }
      if (mapping.prefix !== scan1.prefix) {
        showError(`Wrong product — serial must start with ${scan1.prefix}`);
        return;
      }
      if (serial === scan1.serial) {
        showError("Duplicate scan, please scan unique serial");
        return;
      }
      const newScan: ScanData = {
        serial,
        prefix: mapping.prefix,
        labelType: scan1.labelType,
        title: scan1.title,
      };
      setScan2(newScan);
      setErrorMsg(null);
      playSound(settings.successSoundId, settings.volume);
      diag.incrementScans(mapping.prefix, scan1.labelType);
      diag.addLog("info", `Scan 2: ${serial} — auto-printing...`);
      setStep(3);
    }
  }, [inputValue, step, scan1, settings, diag, showError, focusInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  // Route all keypresses to the scan input when in step 1 or 2
  useEffect(() => {
    const handleGlobalKey = () => {
      if (step === 3) return;
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, [step]);

  const inputState = errorMsg ? "error" : successMsg ? "success" : "default";
  const { dailyPrintCounts, resetDailyCounters, lastResetDate } = diag;
  const today = getTodayString();

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {/* Printer status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Printer className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Printer
          </span>
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            isConnected
              ? "border-success/40 bg-success/10 text-status-connected"
              : "border-destructive/30 bg-destructive/10 text-status-error"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-success animate-pulse" : "bg-destructive"
            }`}
          />
          {isConnected ? "CONNECTED" : "DISCONNECTED"}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 bg-card border border-border rounded overflow-hidden">
        {([1, 2, 3] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex-1 flex items-center justify-center py-3 px-2 gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground step-active-pulse"
                  : step > s
                    ? "bg-success/20 text-status-connected"
                    : "text-muted-foreground"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black border ${
                  step === s
                    ? "border-primary-foreground/50 text-primary-foreground"
                    : step > s
                      ? "border-success/50 text-status-connected"
                      : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {s}
              </span>
              <span className="hidden sm:inline">
                {s === 1 ? "First Label" : s === 2 ? "Second Label" : "Print"}
              </span>
            </div>
            {idx < 2 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Per-prefix daily counters */}
      <div className="bg-card border border-border rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Today's Prints{" "}
            {lastResetDate !== today ? (
              <span className="text-warning/70">(resetting...)</span>
            ) : null}
          </span>
          <button
            type="button"
            data-ocid="scan.reset_counters.button"
            onClick={resetDailyCounters}
            className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors touch-manipulation"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
        {settings.prefixes.length === 0 ? (
          <p className="text-xs text-muted-foreground/60">
            No prefixes configured
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {settings.prefixes.map((p) => (
              <div
                key={p.prefix}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background rounded border border-border/60"
              >
                <span className="font-mono font-bold text-primary text-sm">
                  {p.prefix}
                </span>
                <span className="text-muted-foreground/50 text-xs">—</span>
                <span className="font-mono font-bold text-foreground text-sm">
                  {dailyPrintCounts[p.prefix] ?? 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scanner input area (shown in steps 1 & 2) */}
      {step !== 3 && (
        <div className="flex flex-col gap-3">
          <label
            htmlFor="scan-input-hidden"
            className="text-xs uppercase tracking-widest text-muted-foreground"
          >
            {step === 1
              ? "SCAN FIRST SERIAL"
              : `SCAN SECOND SERIAL — MUST START WITH ${scan1?.prefix ?? ""}`}
          </label>

          {/* Hidden input captures scanner keystrokes without showing keyboard */}
          <input
            id="scan-input-hidden"
            ref={inputRef}
            type="text"
            inputMode="none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            tabIndex={-1}
            aria-hidden="true"
            style={{
              position: "absolute",
              opacity: 0,
              pointerEvents: "none",
              width: 1,
              height: 1,
              top: -9999,
              left: -9999,
            }}
          />

          {/* Visual display div — tapping this refocuses the hidden input */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: scanner-only input, keyboard interaction handled by hidden input */}
          <div
            data-ocid="scan.input"
            onClick={() => inputRef.current?.focus({ preventScroll: true })}
            className={`
              w-full text-2xl font-mono py-5 px-5 rounded border
              bg-input transition-all duration-150 cursor-default select-none
              ${
                inputState === "error"
                  ? "border-destructive scan-input-error-glow"
                  : inputState === "success"
                    ? "border-success scan-input-success-glow"
                    : "border-border scan-input-glow"
              }
            `}
            style={{ minHeight: 72 }}
          >
            {inputValue ? (
              <span className="text-foreground">{inputValue}</span>
            ) : (
              <span className="text-muted-foreground/30">
                {step === 1 ? "Awaiting scan..." : "Scan second serial..."}
              </span>
            )}
          </div>

          {/* Error banner */}
          {errorMsg && (
            <div
              data-ocid="scan.error_state"
              className="flex items-center gap-3 px-4 py-3 rounded bg-destructive/15 border border-destructive/40 text-destructive animate-fade-in"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Success banner */}
          {successMsg && (
            <div
              data-ocid="scan.success_state"
              className="flex items-center gap-3 px-4 py-3 rounded bg-success/15 border border-success/40 text-status-connected animate-fade-in"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{successMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Scan 1 result display (shown in step 2) */}
      {step === 2 && scan1 && (
        <div className="bg-card border border-border rounded p-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            First Serial
          </p>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary shrink-0" />
            <span className="font-mono text-lg font-bold text-foreground">
              {scan1.serial}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {scan1.labelType}
            </span>
          </div>
        </div>
      )}

      {/* Auto-print screen (step 3) */}
      {step === 3 && scan1 && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Label details card */}
          <div className="bg-card border border-primary/30 rounded p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Label Details
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Label Type
                </span>
                <span className="font-medium text-foreground">
                  {scan1.labelType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Title
                </span>
                <span className="font-medium text-foreground">
                  {scan1.title}
                </span>
              </div>
              <div className="border-t border-border pt-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Serial 1:
                  </span>
                  <span className="font-mono font-bold text-foreground ml-auto">
                    {scan1.serial}
                  </span>
                </div>
                {scan2 && (
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Serial 2:
                    </span>
                    <span className="font-mono font-bold text-foreground ml-auto">
                      {scan2.serial}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Print status */}
          {isPrinting && (
            <div
              data-ocid="scan.loading_state"
              className="flex items-center justify-center gap-3 py-4 px-4 rounded bg-primary/10 border border-primary/30 text-primary"
            >
              <Printer className="w-5 h-5 animate-pulse" />
              <span className="font-bold uppercase tracking-widest text-sm">
                PRINTING...
              </span>
            </div>
          )}

          {/* Error banner (print failed) */}
          {errorMsg && !isPrinting && (
            <div
              data-ocid="scan.error_state"
              className="flex items-center gap-3 px-4 py-3 rounded bg-destructive/15 border border-destructive/40 text-destructive"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Success banner */}
          {successMsg && !isPrinting && (
            <div
              data-ocid="scan.success_state"
              className="flex items-center gap-3 px-4 py-3 rounded bg-success/15 border border-success/40 text-status-connected"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{successMsg}</span>
            </div>
          )}

          {/* Retry + reset buttons on print failure */}
          {errorMsg && !isPrinting && scan2 && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetWorkflow}
                className="flex-none px-5 py-4 rounded border border-border text-muted-foreground font-bold uppercase tracking-wider text-sm active:scale-[0.98] transition-all touch-manipulation"
              >
                RESET
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintTriggered(false);
                  setErrorMsg(null);
                }}
                data-ocid="scan.retry_button"
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded font-black uppercase tracking-widest text-lg bg-primary text-primary-foreground disabled:opacity-40 active:scale-[0.98] transition-all touch-manipulation"
                style={{ minHeight: 64 }}
              >
                <Printer className="w-5 h-5" />
                RETRY PRINT
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reset shortcut at bottom */}
      {step !== 1 && step !== 3 && (
        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={resetWorkflow}
            className="w-full py-2 text-xs text-muted-foreground/60 uppercase tracking-widest hover:text-muted-foreground transition-colors touch-manipulation"
          >
            ↺ Reset Workflow
          </button>
        </div>
      )}
    </div>
  );
}
