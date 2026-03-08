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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  Download,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Save,
  TestTube,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { LabelPreview } from "../components/LabelPreview";
import {
  type BarcodeType,
  useLabelSettingsStore,
} from "../stores/labelSettingsStore";
import { usePrinterStore } from "../stores/printerStore";
import { SOUND_OPTIONS, playSound } from "../utils/soundSystem";

const BARCODE_TYPES: BarcodeType[] = [
  "CODE128",
  "CODE39",
  "EAN13",
  "EAN8",
  "UPC-A",
  "UPCE",
  "I2OF5",
  "CODABAR",
];

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 200,
  step = 0.5,
  unit = "mm",
  dataOcid,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  dataOcid?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
      <Label className="text-sm text-muted-foreground flex-1">{label}</Label>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          data-ocid={dataOcid}
          className="w-20 text-center font-mono bg-input text-sm h-9"
        />
        <span className="text-xs text-muted-foreground w-6">{unit}</span>
      </div>
    </div>
  );
}

export function LabelSettingsTab() {
  const settings = useLabelSettingsStore();
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [barcodeTestStatus, setBarcodeTestStatus] = useState<
    "idle" | "printing" | "ok" | "error"
  >("idle");
  const importRef = useRef<HTMLInputElement>(null);
  const { isConnected, testPrintWithSerials } = usePrinterStore();

  const handleBarcodeTestPrint = async () => {
    if (!isConnected) {
      setBarcodeTestStatus("error");
      setTimeout(() => setBarcodeTestStatus("idle"), 2000);
      return;
    }
    setBarcodeTestStatus("printing");
    try {
      // Use dummy serials matching first configured prefix, or generic sample
      const firstPrefix = settings.prefixes[0];
      const serial1 = firstPrefix ? `${firstPrefix.prefix}TEST001` : "TEST001";
      const serial2 = firstPrefix ? `${firstPrefix.prefix}TEST002` : "TEST002";
      const title = firstPrefix ? firstPrefix.title : "TEST LABEL";
      await testPrintWithSerials(serial1, serial2, title, settings);
      setBarcodeTestStatus("ok");
      setTimeout(() => setBarcodeTestStatus("idle"), 2000);
    } catch {
      setBarcodeTestStatus("error");
      setTimeout(() => setBarcodeTestStatus("idle"), 2000);
    }
  };

  const handleExport = () => {
    const json = settings.exportSettings();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "label-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        settings.importSettings(ev.target?.result as string);
      } catch {
        alert("Invalid settings file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSave = () => {
    // Settings are auto-saved via Zustand persist, but show feedback
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 1500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/50">
        <span className="text-xs uppercase tracking-widest text-muted-foreground flex-1">
          Label Settings
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            data-ocid="settings.export_button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors touch-manipulation"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            data-ocid="settings.import_button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors touch-manipulation"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                data-ocid="settings.reset_button"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-destructive/40 rounded text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Settings?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will restore all label settings to factory defaults. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={settings.resetSettings}
                  className="bg-destructive text-destructive-foreground"
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button
            type="button"
            onClick={handleSave}
            data-ocid="settings.save_button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-wider rounded bg-primary text-primary-foreground touch-manipulation"
          >
            {savedIndicator ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {savedIndicator ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs
        defaultValue="label"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="grid grid-cols-4 mx-4 mt-3 mb-0 bg-card border border-border h-auto rounded shrink-0">
          {[
            { value: "label", label: "Label", ocid: "settings.label.tab" },
            {
              value: "barcodes",
              label: "Barcodes",
              ocid: "settings.barcodes.tab",
            },
            {
              value: "prefixes",
              label: "Prefixes",
              ocid: "settings.prefixes.tab",
            },
            { value: "sound", label: "Sound", ocid: "settings.sound.tab" },
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

        {/* Label sub-tab */}
        <TabsContent
          value="label"
          className="flex-1 overflow-y-auto px-4 pb-4 mt-3"
        >
          <div className="space-y-0 bg-card border border-border rounded p-4 mb-4">
            <NumberInput
              label="Width"
              value={settings.width}
              onChange={(v) => settings.updateSettings({ width: v })}
              min={20}
              max={200}
              dataOcid="settings.width.input"
            />
            <NumberInput
              label="Height"
              value={settings.height}
              onChange={(v) => settings.updateSettings({ height: v })}
              min={20}
              max={200}
              dataOcid="settings.height.input"
            />
            <NumberInput
              label="Title Font Size"
              value={settings.titleFontSize}
              onChange={(v) => settings.updateSettings({ titleFontSize: v })}
              min={1}
              max={20}
            />
            <NumberInput
              label="Serial Font Size"
              value={settings.serialFontSize}
              onChange={(v) => settings.updateSettings({ serialFontSize: v })}
              min={1}
              max={15}
            />
            <NumberInput
              label="Global Vertical Offset"
              value={settings.globalVerticalOffset}
              onChange={(v) =>
                settings.updateSettings({ globalVerticalOffset: v })
              }
              min={-20}
              max={20}
            />
            <NumberInput
              label="Global Horizontal Offset"
              value={settings.globalHorizontalOffset}
              onChange={(v) =>
                settings.updateSettings({ globalHorizontalOffset: v })
              }
              min={-20}
              max={20}
            />
          </div>
          <LabelPreview />
        </TabsContent>

        {/* Barcodes sub-tab */}
        <TabsContent
          value="barcodes"
          className="flex-1 overflow-y-auto px-4 pb-4 mt-3"
        >
          <div className="space-y-0 bg-card border border-border rounded p-4 mb-4">
            <div className="flex items-center justify-between gap-3 py-2 border-b border-border/50">
              <Label className="text-sm text-muted-foreground">
                Barcode Type
              </Label>
              <Select
                value={settings.barcodeType}
                onValueChange={(v) =>
                  settings.updateSettings({ barcodeType: v as BarcodeType })
                }
              >
                <SelectTrigger
                  className="w-32 h-9 text-sm bg-input"
                  data-ocid="settings.barcode_type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {BARCODE_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="font-mono text-sm">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <NumberInput
              label="Barcode Height"
              value={settings.barcodeHeight}
              onChange={(v) => settings.updateSettings({ barcodeHeight: v })}
              min={3}
              max={50}
            />
            <NumberInput
              label="Barcode Width"
              value={settings.barcodeWidth}
              onChange={(v) => settings.updateSettings({ barcodeWidth: v })}
              min={1}
              max={10}
              step={1}
              unit="dots"
            />
          </div>

          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 px-1">
            Barcode 1 Position
          </p>
          <div className="bg-card border border-border rounded p-4 mb-4">
            <NumberInput
              label="X Position"
              value={settings.barcode1X}
              onChange={(v) => settings.updateSettings({ barcode1X: v })}
            />
            <NumberInput
              label="Y Position"
              value={settings.barcode1Y}
              onChange={(v) => settings.updateSettings({ barcode1Y: v })}
            />
            <NumberInput
              label="Text Gap"
              value={settings.barcode1TextGap}
              onChange={(v) => settings.updateSettings({ barcode1TextGap: v })}
              min={0.5}
              max={10}
            />
          </div>

          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 px-1">
            Barcode 2 Position
          </p>
          <div className="bg-card border border-border rounded p-4 mb-4">
            <NumberInput
              label="X Position"
              value={settings.barcode2X}
              onChange={(v) => settings.updateSettings({ barcode2X: v })}
            />
            <NumberInput
              label="Y Position"
              value={settings.barcode2Y}
              onChange={(v) => settings.updateSettings({ barcode2Y: v })}
            />
            <NumberInput
              label="Text Gap"
              value={settings.barcode2TextGap}
              onChange={(v) => settings.updateSettings({ barcode2TextGap: v })}
              min={0.5}
              max={10}
            />
          </div>
          <LabelPreview />

          {/* Test Print button for Barcodes sub-tab */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleBarcodeTestPrint}
              disabled={barcodeTestStatus === "printing"}
              data-ocid="settings.barcode_test_print.button"
              className={`flex items-center justify-center gap-2 w-full py-4 rounded font-bold uppercase tracking-wider text-sm active:scale-[0.98] transition-all touch-manipulation disabled:opacity-40 ${
                barcodeTestStatus === "ok"
                  ? "bg-success/20 border border-success/40 text-status-connected"
                  : barcodeTestStatus === "error"
                    ? "bg-destructive/15 border border-destructive/40 text-destructive"
                    : "border border-primary/40 text-primary hover:bg-primary/10"
              }`}
              style={{ minHeight: 52 }}
            >
              {barcodeTestStatus === "printing" ? (
                <>
                  <Printer className="w-4 h-4 animate-pulse" />
                  Printing...
                </>
              ) : barcodeTestStatus === "ok" ? (
                <>
                  <Check className="w-4 h-4" />
                  Printed!
                </>
              ) : barcodeTestStatus === "error" ? (
                <>
                  <Printer className="w-4 h-4" />
                  {isConnected ? "Print Failed" : "Printer Not Connected"}
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  Test Print (with serials & barcode)
                </>
              )}
            </button>
            {!isConnected && (
              <p className="text-xs text-muted-foreground/60 text-center mt-2">
                Connect printer in Devices tab first
              </p>
            )}
          </div>
        </TabsContent>

        {/* Prefixes sub-tab */}
        <TabsContent
          value="prefixes"
          className="flex-1 overflow-y-auto px-4 pb-4 mt-3"
        >
          <PrefixesSubTab />
        </TabsContent>

        {/* Sound sub-tab */}
        <TabsContent
          value="sound"
          className="flex-1 overflow-y-auto px-4 pb-4 mt-3"
        >
          <SoundSubTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PrefixesSubTab() {
  const settings = useLabelSettingsStore();
  const [newPrefix, setNewPrefix] = useState("");
  const [newLabelType, setNewLabelType] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const existingTypes = [...new Set(settings.prefixes.map((p) => p.labelType))];

  const handleAdd = () => {
    if (!newPrefix || !newLabelType || !newTitle) return;
    const upper = newPrefix.toUpperCase();
    if (settings.prefixes.find((p) => p.prefix === upper)) {
      alert(`Prefix "${upper}" already exists`);
      return;
    }
    settings.updateSettings({
      prefixes: [
        ...settings.prefixes,
        { prefix: upper, labelType: newLabelType, title: newTitle },
      ],
    });
    setNewPrefix("");
    setNewLabelType("");
    setNewTitle("");
  };

  const handleRemove = (prefix: string) => {
    settings.updateSettings({
      prefixes: settings.prefixes.filter((p) => p.prefix !== prefix),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Existing prefixes */}
      <div className="bg-card border border-border rounded overflow-hidden">
        {settings.prefixes.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No prefixes configured
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Prefix
                </th>
                <th className="text-left p-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Label Type
                </th>
                <th className="text-left p-3 text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                  Title
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {settings.prefixes.map((p, idx) => (
                <tr
                  key={p.prefix}
                  data-ocid={`settings.prefix.row.${idx + 1}`}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="p-3 font-mono font-bold text-primary">
                    {p.prefix}
                  </td>
                  <td className="p-3 text-foreground">{p.labelType}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell truncate max-w-32">
                    {p.title}
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => handleRemove(p.prefix)}
                      data-ocid={
                        idx === 0
                          ? "settings.prefix.delete_button.1"
                          : `settings.prefix.delete_button.${idx + 1}`
                      }
                      className="p-2 rounded text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
                      aria-label={`Remove prefix ${p.prefix}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add new prefix */}
      <div className="bg-card border border-border rounded p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Add New Prefix
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-none w-28">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Prefix
              </Label>
              <Input
                value={newPrefix}
                onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
                placeholder="AB"
                className="font-mono uppercase bg-input h-10"
                maxLength={10}
                data-ocid="settings.prefix_add.input"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Label Type
              </Label>
              <div className="relative">
                <Input
                  value={newLabelType}
                  onChange={(e) => setNewLabelType(e.target.value)}
                  placeholder="Type A"
                  list="label-type-suggestions"
                  className="bg-input h-10"
                />
                <datalist id="label-type-suggestions">
                  {existingTypes.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Title
            </Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="PART DESCRIPTION"
              className="bg-input h-10 uppercase"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newPrefix || !newLabelType || !newTitle}
            data-ocid="settings.prefix_add.button"
            className="flex items-center justify-center gap-2 w-full py-3 rounded bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm disabled:opacity-40 touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            Add Prefix
          </button>
        </div>
      </div>
    </div>
  );
}

function SoundSubTab() {
  const settings = useLabelSettingsStore();

  const soundEvents = [
    {
      id: "successSoundId" as const,
      label: "Success Scan",
      value: settings.successSoundId,
    },
    {
      id: "errorSoundId" as const,
      label: "Error Scan",
      value: settings.errorSoundId,
    },
    {
      id: "printSoundId" as const,
      label: "Print Complete",
      value: settings.printSoundId,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Sound events */}
      <div className="bg-card border border-border rounded p-4 space-y-4">
        {soundEvents.map((event) => (
          <div key={event.id}>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
              {event.label}
            </Label>
            <div className="flex items-center gap-2">
              <select
                value={event.value}
                onChange={(e) =>
                  settings.updateSettings({ [event.id]: e.target.value })
                }
                className="flex-1 h-10 px-3 rounded bg-input border border-border text-foreground text-sm outline-none focus:border-primary"
              >
                {SOUND_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => playSound(event.value, settings.volume)}
                className="p-2.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors touch-manipulation"
                aria-label={`Preview ${event.label}`}
              >
                <Play className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Volume */}
      <div className="bg-card border border-border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Volume
          </Label>
          <span className="text-sm font-mono font-bold text-foreground">
            {Math.round(settings.volume * 100)}%
          </span>
        </div>
        <Slider
          value={[settings.volume * 100]}
          onValueChange={([v]) => settings.updateSettings({ volume: v / 100 })}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
      </div>
    </div>
  );
}
