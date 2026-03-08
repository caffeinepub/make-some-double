import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Printer, RotateCcw, Scan, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDiagnosticsStore } from "../stores/diagnosticsStore";
import { useLabelSettingsStore } from "../stores/labelSettingsStore";
import { usePrinterStore } from "../stores/printerStore";
import { generateCPCL } from "../utils/cpclGenerator";

type LogLevel = "all" | "info" | "warning" | "error";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const levelColors: Record<string, string> = {
  info: "bg-primary/20 text-primary border-primary/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  error: "bg-destructive/20 text-destructive border-destructive/30",
};

export function DiagnosticsTab() {
  return (
    <Tabs defaultValue="stats" className="flex flex-col h-full overflow-hidden">
      <TabsList className="grid grid-cols-3 mx-4 mt-3 mb-0 bg-card border border-border h-auto rounded shrink-0">
        {[
          { value: "stats", label: "Stats", ocid: "diag.stats.tab" },
          { value: "history", label: "History", ocid: "diag.history.tab" },
          { value: "logs", label: "Logs", ocid: "diag.logs.tab" },
        ].map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            data-ocid={t.ocid}
            className="text-xs uppercase tracking-wider py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent
        value="stats"
        className="flex-1 overflow-y-auto px-4 pb-4 mt-3"
      >
        <StatsSubTab />
      </TabsContent>
      <TabsContent
        value="history"
        className="flex-1 overflow-y-auto px-4 pb-4 mt-3"
      >
        <HistorySubTab />
      </TabsContent>
      <TabsContent
        value="logs"
        className="flex-1 overflow-y-auto px-4 pb-4 mt-3"
      >
        <LogsSubTab />
      </TabsContent>
    </Tabs>
  );
}

function StatsSubTab() {
  const { totalScans, totalPrints, totalErrors, serialTypeCounts } =
    useDiagnosticsStore();

  const statCards = [
    {
      label: "Total Scans",
      value: totalScans,
      icon: Scan,
      color: "text-primary",
    },
    {
      label: "Labels Printed",
      value: totalPrints,
      icon: Printer,
      color: "text-status-connected",
    },
    {
      label: "Errors",
      value: totalErrors,
      icon: AlertCircle,
      color: "text-status-error",
    },
  ];

  const typeEntries = Object.entries(serialTypeCounts);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="bg-card border border-border rounded p-4 flex flex-col items-center gap-1"
          >
            <c.icon className={`w-5 h-5 ${c.color}`} />
            <span className={`text-2xl font-black font-mono ${c.color}`}>
              {c.value}
            </span>
            <span className="text-xs text-muted-foreground text-center uppercase tracking-wider">
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {/* Serial type counts */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            By Serial Type
          </span>
        </div>
        {typeEntries.length === 0 ? (
          <div
            data-ocid="diag.stats.empty_state"
            className="p-6 text-center text-muted-foreground text-sm"
          >
            No scan data yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Prefix
                </th>
                <th className="text-left p-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
                <th className="text-right p-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Scans
                </th>
                <th className="text-right p-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Prints
                </th>
              </tr>
            </thead>
            <tbody>
              {typeEntries.map(([prefix, data], idx) => (
                <tr
                  key={prefix}
                  data-ocid={`diag.stats.row.${idx + 1}`}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="p-3 font-mono font-bold text-primary">
                    {prefix}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {data.labelType}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-foreground">
                    {data.scans}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-status-connected">
                    {data.prints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function HistorySubTab() {
  const { printHistory, clearHistory } = useDiagnosticsStore();
  const settings = useLabelSettingsStore();

  const handleReprint = async (
    serial1: string,
    serial2: string,
    labelType: string,
  ) => {
    const mapping = settings.prefixes.find((p) => p.labelType === labelType);
    const title = mapping?.title ?? labelType;
    try {
      const cpcl = generateCPCL(settings, serial1, serial2, title);
      await usePrinterStore.getState().print(cpcl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Reprint failed";
      alert(`Reprint failed: ${msg}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Print History ({printHistory.length})
        </span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              data-ocid="diag.clear_history.button"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-destructive/40 rounded text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Print History?</AlertDialogTitle>
              <AlertDialogDescription>
                All print history records will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={clearHistory}
                className="bg-destructive text-destructive-foreground"
              >
                Clear
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        {printHistory.length === 0 ? (
          <div
            data-ocid="diag.history.empty_state"
            className="p-6 text-center text-muted-foreground text-sm"
          >
            No print history
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {printHistory.map((entry, idx) => (
              <div
                key={entry.id}
                data-ocid={`diag.history.item.${idx + 1}`}
                className="p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDate(entry.timestamp)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${
                        entry.success
                          ? "bg-success/15 text-status-connected border-success/30"
                          : "bg-destructive/15 text-status-error border-destructive/30"
                      }`}
                    >
                      {entry.success ? "OK" : "FAIL"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleReprint(
                        entry.serial1,
                        entry.serial2,
                        entry.labelType,
                      )
                    }
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors touch-manipulation"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reprint
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {entry.labelType}
                  </span>
                  <span className="font-mono text-xs text-foreground">
                    {entry.serial1}
                  </span>
                  <span className="text-muted-foreground/40">→</span>
                  <span className="font-mono text-xs text-foreground">
                    {entry.serial2}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogsSubTab() {
  const [levelFilter, setLevelFilter] = useState<LogLevel>("all");
  const { logs, clearLogs } = useDiagnosticsStore();

  const filtered =
    levelFilter === "all" ? logs : logs.filter((l) => l.level === levelFilter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1">
          {(["all", "info", "warning", "error"] as LogLevel[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              data-ocid="diag.log_level.select"
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors touch-manipulation ${
                levelFilter === lvl
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              data-ocid="diag.clear_logs.button"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-destructive/40 rounded text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Logs?</AlertDialogTitle>
              <AlertDialogDescription>
                All log entries will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={clearLogs}
                className="bg-destructive text-destructive-foreground"
              >
                Clear
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        {filtered.length === 0 ? (
          <div
            data-ocid="diag.logs.empty_state"
            className="p-6 text-center text-muted-foreground text-sm"
          >
            No log entries
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((entry, idx) => (
              <div
                key={entry.id}
                data-ocid={`diag.logs.item.${idx + 1}`}
                className="p-3 flex items-start gap-3"
              >
                <Badge
                  className={`text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider border shrink-0 mt-0.5 rounded ${levelColors[entry.level]}`}
                >
                  {entry.level}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{entry.message}</p>
                  {entry.metadata && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {entry.metadata}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
