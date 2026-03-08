import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BarcodeType =
  | "CODE128"
  | "CODE39"
  | "EAN13"
  | "EAN8"
  | "UPC-A"
  | "UPCE"
  | "I2OF5"
  | "CODABAR";

export interface PrefixMapping {
  prefix: string;
  labelType: string;
  title: string;
}

export interface LabelSettings {
  width: number;
  height: number;
  titleFontSize: number;
  serialFontSize: number;
  globalVerticalOffset: number;
  globalHorizontalOffset: number;
  barcodeType: BarcodeType;
  barcodeHeight: number;
  barcodeWidth: number;
  barcode1X: number;
  barcode1Y: number;
  barcode1TextGap: number;
  barcode2X: number;
  barcode2Y: number;
  barcode2TextGap: number;
  prefixes: PrefixMapping[];
  successSoundId: string;
  errorSoundId: string;
  printSoundId: string;
  volume: number;
}

const DEFAULT_SETTINGS: LabelSettings = {
  width: 58,
  height: 43,
  titleFontSize: 3,
  serialFontSize: 2,
  globalVerticalOffset: 0,
  globalHorizontalOffset: 0,
  barcodeType: "CODE128",
  barcodeHeight: 10,
  barcodeWidth: 2,
  barcode1X: 0,
  barcode1Y: 6,
  barcode1TextGap: 2,
  barcode2X: 0,
  barcode2Y: 20,
  barcode2TextGap: 2,
  prefixes: [
    { prefix: "AB", labelType: "Type A", title: "PART A ASSEMBLY" },
    { prefix: "CD", labelType: "Type B", title: "COMPONENT B SET" },
    { prefix: "EF", labelType: "Type C", title: "UNIT C MODULE" },
  ],
  successSoundId: "beep1",
  errorSoundId: "buzz1",
  printSoundId: "click1",
  volume: 0.7,
};

interface LabelSettingsStore extends LabelSettings {
  updateSettings: (updates: Partial<LabelSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => void;
}

export const useLabelSettingsStore = create<LabelSettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (updates) => set((state) => ({ ...state, ...updates })),

      resetSettings: () => set(() => ({ ...DEFAULT_SETTINGS })),

      exportSettings: () => {
        const state = get();
        const settings: LabelSettings = {
          width: state.width,
          height: state.height,
          titleFontSize: state.titleFontSize,
          serialFontSize: state.serialFontSize,
          globalVerticalOffset: state.globalVerticalOffset,
          globalHorizontalOffset: state.globalHorizontalOffset,
          barcodeType: state.barcodeType,
          barcodeHeight: state.barcodeHeight,
          barcodeWidth: state.barcodeWidth,
          barcode1X: state.barcode1X,
          barcode1Y: state.barcode1Y,
          barcode1TextGap: state.barcode1TextGap,
          barcode2X: state.barcode2X,
          barcode2Y: state.barcode2Y,
          barcode2TextGap: state.barcode2TextGap,
          prefixes: state.prefixes,
          successSoundId: state.successSoundId,
          errorSoundId: state.errorSoundId,
          printSoundId: state.printSoundId,
          volume: state.volume,
        };
        return JSON.stringify(settings, null, 2);
      },

      importSettings: (json: string) => {
        const parsed = JSON.parse(json) as Partial<LabelSettings>;
        set((state) => ({ ...state, ...parsed }));
      },
    }),
    {
      name: "label_settings_store",
    },
  ),
);
