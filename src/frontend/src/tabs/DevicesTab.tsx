import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Keyboard,
  Printer,
  RefreshCw,
  TestTube,
  Unplug,
  Usb,
  XCircle,
} from "lucide-react";
import { useEffect } from "react";
import { useDiagnosticsStore } from "../stores/diagnosticsStore";
import { usePrinterStore } from "../stores/printerStore";

const webUsbSupported = "usb" in navigator;

export function DevicesTab() {
  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    reconnect,
    testPrint,
  } = usePrinterStore();
  const { addLog } = useDiagnosticsStore();

  // Auto-reconnect on mount
  useEffect(() => {
    if (webUsbSupported) {
      reconnect().catch(() => {});
    }
  }, [reconnect]);

  const handleConnect = async () => {
    try {
      await connect();
      addLog("info", "USB printer connected");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      if (!msg.includes("No device selected")) {
        addLog("error", `Printer connect failed: ${msg}`);
      }
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    addLog("info", "USB printer disconnected");
  };

  const handleTestPrint = async () => {
    try {
      await testPrint();
      addLog("info", "Test print sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Test print failed";
      addLog("error", `Test print failed: ${msg}`);
    }
  };

  const handleRefresh = async () => {
    await reconnect();
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Section: CPCL Printer */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Printer className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            CPCL Printer (USB)
          </h2>
        </div>

        {/* WebUSB not supported warning */}
        {!webUsbSupported && (
          <div
            data-ocid="devices.webusbwarning.error_state"
            className="flex items-start gap-3 p-4 rounded bg-warning/10 border border-warning/40 text-warning mb-3"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">WebUSB Not Supported</p>
              <p className="text-xs mt-1 opacity-80">
                This browser does not support WebUSB. Use Chrome or Edge on
                Android for USB printing.
              </p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded p-4">
          {/* Connection status */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Status</span>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isConnected
                  ? "border-success/40 bg-success/10 text-status-connected"
                  : "border-destructive/30 bg-destructive/10 text-status-error"
              }`}
            >
              {isConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  Disconnected
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {!isConnected ? (
              <button
                type="button"
                onClick={handleConnect}
                disabled={!webUsbSupported || isConnecting}
                data-ocid="devices.connect_printer.button"
                className="flex items-center justify-center gap-2 w-full py-4 rounded bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm disabled:opacity-40 active:scale-[0.98] transition-all touch-manipulation"
                style={{ minHeight: 52 }}
              >
                <Usb className="w-4 h-4" />
                {isConnecting ? "Connecting..." : "Connect USB Printer"}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  data-ocid="devices.disconnect_printer.button"
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded border border-destructive/40 text-destructive font-bold uppercase tracking-wider text-sm hover:bg-destructive/10 active:scale-[0.98] transition-all touch-manipulation"
                  style={{ minHeight: 52 }}
                >
                  <Unplug className="w-4 h-4" />
                  Disconnect
                </button>
                <button
                  type="button"
                  onClick={handleTestPrint}
                  data-ocid="devices.test_print.button"
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded border border-primary/40 text-primary font-bold uppercase tracking-wider text-sm hover:bg-primary/10 active:scale-[0.98] transition-all touch-manipulation"
                  style={{ minHeight: 52 }}
                >
                  <TestTube className="w-4 h-4" />
                  Test Print
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              data-ocid="devices.refresh.button"
              className="flex items-center justify-center gap-2 w-full py-3 rounded border border-border text-muted-foreground font-medium text-sm hover:text-foreground hover:border-foreground/40 active:scale-[0.98] transition-all touch-manipulation"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh / Auto-Reconnect
            </button>
          </div>

          {/* Info notice */}
          <div className="mt-4 flex items-start gap-2 p-3 rounded bg-muted/50 border border-border/50">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Bluetooth printing is not supported. USB only via WebUSB. Requires
              Chrome or Edge browser.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Barcode Scanner */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Keyboard className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Barcode Scanner
          </h2>
        </div>

        <div className="bg-card border border-border rounded p-4">
          <p className="text-sm text-foreground font-medium mb-3">
            Keyboard Wedge Mode
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            This app uses keyboard-wedge scanner input. The scanner must be
            configured to emulate keyboard keystrokes.
          </p>

          <div className="space-y-2">
            {[
              { num: 1, text: "Set scanner to USB HID keyboard mode" },
              { num: 2, text: "Configure barcode suffix as Enter key (CR/LF)" },
              {
                num: 3,
                text: "Point scanner at this app window before scanning",
              },
              {
                num: 4,
                text: "Test by scanning any barcode in the input field on the Scan & Print tab",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="flex items-start gap-3 p-3 rounded bg-muted/30 border border-border/50"
              >
                <span className="flex-none w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  {step.num}
                </span>
                <span className="text-sm text-muted-foreground">
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
