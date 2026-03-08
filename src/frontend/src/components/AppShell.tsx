import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Cpu, Lock, Scan, Settings } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { usePasswordSession } from "../providers/PasswordSessionProvider";

const ScanPrintTab = lazy(() =>
  import("../tabs/ScanPrintTab").then((m) => ({ default: m.ScanPrintTab })),
);
const LabelSettingsTab = lazy(() =>
  import("../tabs/LabelSettingsTab").then((m) => ({
    default: m.LabelSettingsTab,
  })),
);
const DevicesTab = lazy(() =>
  import("../tabs/DevicesTab").then((m) => ({ default: m.DevicesTab })),
);
const DiagnosticsTab = lazy(() =>
  import("../tabs/DiagnosticsTab").then((m) => ({
    default: m.DiagnosticsTab,
  })),
);

type Tab = "scan" | "settings" | "devices" | "diagnostics";

const tabs: Array<{
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ocid: string;
}> = [
  { id: "scan", label: "Scan & Print", icon: Scan, ocid: "scan_print.tab" },
  {
    id: "settings",
    label: "Label Settings",
    icon: Settings,
    ocid: "label_settings.tab",
  },
  { id: "devices", label: "Devices", icon: Cpu, ocid: "devices.tab" },
  {
    id: "diagnostics",
    label: "Diagnostics",
    icon: BarChart2,
    ocid: "diagnostics.tab",
  },
];

function TabSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("scan");
  const { lock } = usePasswordSession();

  return (
    <div
      className="flex flex-col h-dvh w-full bg-background"
      style={{ maxHeight: "100dvh" }}
    >
      {/* Fixed header */}
      <header className="flex-none flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-black uppercase tracking-widest text-foreground">
            Make Some Double!!
          </h1>
        </div>
        <button
          type="button"
          onClick={lock}
          data-ocid="lock.button"
          className="flex items-center gap-1.5 px-3 py-2 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors text-xs font-bold uppercase tracking-wider touch-manipulation"
          style={{ minHeight: 40 }}
          aria-label="Lock app"
        >
          <Lock className="w-3.5 h-3.5" />
          Lock
        </button>
      </header>

      {/* Tab content area */}
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<TabSkeleton />}>
          {activeTab === "scan" && <ScanPrintTab />}
          {activeTab === "settings" && <LabelSettingsTab />}
          {activeTab === "devices" && <DevicesTab />}
          {activeTab === "diagnostics" && <DiagnosticsTab />}
        </Suspense>
      </main>

      {/* Bottom tab bar */}
      <nav
        className="flex-none grid border-t border-border bg-card"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
        role="tablist"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              data-ocid={tab.ocid}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-2 transition-colors touch-manipulation ${
                isActive
                  ? "text-primary border-t-2 border-primary"
                  : "text-muted-foreground border-t-2 border-transparent hover:text-foreground"
              }`}
              style={{ minHeight: 60 }}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-wide leading-none ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.id === "scan"
                  ? "SCAN"
                  : tab.id === "settings"
                    ? "SETTINGS"
                    : tab.id === "devices"
                      ? "DEVICES"
                      : "DIAG"}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <footer className="flex-none py-1.5 text-center border-t border-border/50">
        <p className="text-[9px] text-muted-foreground/40">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
