import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PrintHistoryEntry {
  id: string;
  timestamp: number;
  labelType: string;
  serial1: string;
  serial2: string;
  success: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: "info" | "warning" | "error";
  message: string;
  metadata?: string;
}

export interface SerialTypeCount {
  labelType: string;
  scans: number;
  prints: number;
}

interface DiagnosticsState {
  totalScans: number;
  totalPrints: number;
  totalErrors: number;
  serialTypeCounts: Record<string, SerialTypeCount>;
  printHistory: PrintHistoryEntry[];
  logs: LogEntry[];
  dailyPrintCounts: Record<string, number>;
  lastResetDate: string;
  incrementScans: (prefix: string, labelType: string) => void;
  incrementPrints: (prefix: string, labelType: string) => void;
  incrementErrors: () => void;
  addPrintHistory: (entry: Omit<PrintHistoryEntry, "id">) => void;
  addLog: (
    level: "info" | "warning" | "error",
    message: string,
    metadata?: string,
  ) => void;
  clearLogs: () => void;
  clearHistory: () => void;
  resetDailyCounters: () => void;
}

export const useDiagnosticsStore = create<DiagnosticsState>()(
  persist(
    (set) => ({
      totalScans: 0,
      totalPrints: 0,
      totalErrors: 0,
      serialTypeCounts: {},
      printHistory: [],
      logs: [],
      dailyPrintCounts: {},
      lastResetDate: "",

      incrementScans: (prefix: string, labelType: string) =>
        set((state) => {
          const existing = state.serialTypeCounts[prefix] ?? {
            labelType,
            scans: 0,
            prints: 0,
          };
          return {
            totalScans: state.totalScans + 1,
            serialTypeCounts: {
              ...state.serialTypeCounts,
              [prefix]: { ...existing, scans: existing.scans + 1 },
            },
          };
        }),

      incrementPrints: (prefix: string, labelType: string) =>
        set((state) => {
          const existing = state.serialTypeCounts[prefix] ?? {
            labelType,
            scans: 0,
            prints: 0,
          };
          return {
            totalPrints: state.totalPrints + 1,
            serialTypeCounts: {
              ...state.serialTypeCounts,
              [prefix]: { ...existing, prints: existing.prints + 1 },
            },
            dailyPrintCounts: {
              ...state.dailyPrintCounts,
              [prefix]: (state.dailyPrintCounts[prefix] ?? 0) + 1,
            },
          };
        }),

      incrementErrors: () =>
        set((state) => ({ totalErrors: state.totalErrors + 1 })),

      addPrintHistory: (entry) =>
        set((state) => ({
          printHistory: [
            {
              ...entry,
              id: `ph_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            },
            ...state.printHistory,
          ].slice(0, 500),
        })),

      addLog: (level, message, metadata) =>
        set((state) => ({
          logs: [
            {
              id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              timestamp: Date.now(),
              level,
              message,
              metadata,
            },
            ...state.logs,
          ].slice(0, 1000),
        })),

      clearLogs: () => set(() => ({ logs: [] })),
      clearHistory: () => set(() => ({ printHistory: [] })),

      resetDailyCounters: () =>
        set(() => ({
          dailyPrintCounts: {},
          lastResetDate: new Date().toISOString().slice(0, 10),
        })),
    }),
    {
      name: "diagnostics_store",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const today = new Date().toISOString().slice(0, 10);
          if (state.lastResetDate !== today) {
            state.dailyPrintCounts = {};
            state.lastResetDate = today;
          }
        }
      },
    },
  ),
);
