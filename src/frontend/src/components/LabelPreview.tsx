import { useLabelSettingsStore } from "../stores/labelSettingsStore";

interface LabelPreviewProps {
  serial1?: string;
  serial2?: string;
  title?: string;
  scale?: number;
}

const MOCK_SERIAL1 = "AB123456";
const MOCK_SERIAL2 = "AB789012";
const MOCK_TITLE = "PART A ASSEMBLY";

export function LabelPreview({
  serial1 = MOCK_SERIAL1,
  serial2 = MOCK_SERIAL2,
  title = MOCK_TITLE,
  scale = 3,
}: LabelPreviewProps) {
  const settings = useLabelSettingsStore();

  const px = (mm: number) => mm * scale;

  const labelW = px(settings.width);
  const labelH = px(settings.height);

  const vOff = settings.globalVerticalOffset;
  const hOff = settings.globalHorizontalOffset;

  // Barcode dimensions
  const bW = Math.min(settings.width - 2, settings.width * 0.9);
  const bH = settings.barcodeHeight;

  // Barcode 1
  const b1x = Math.max(0, settings.barcode1X + hOff);
  const b1y = settings.barcode1Y + vOff;
  const s1y = b1y + bH + settings.barcode1TextGap;

  // Barcode 2
  const b2x = Math.max(0, settings.barcode2X + hOff);
  const b2y = settings.barcode2Y + vOff;
  const s2y = b2y + bH + settings.barcode2TextGap;

  // Title position
  const titleY = vOff;
  const titleX = hOff;

  const titleFontPx = Math.max(6, px(settings.titleFontSize));
  const serialFontPx = Math.max(4, px(settings.serialFontSize));

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground uppercase tracking-widest">
        Label Preview ({settings.width}×{settings.height}mm)
      </p>
      <div
        className="relative overflow-hidden border border-border/60 shrink-0"
        style={{
          width: labelW,
          height: labelH,
          backgroundColor: "#ffffff",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Title */}
        <div
          style={{
            position: "absolute",
            left: px(titleX),
            top: px(titleY),
            fontSize: titleFontPx,
            fontFamily: "monospace",
            color: "#000",
            fontWeight: "bold",
            whiteSpace: "nowrap",
            overflow: "hidden",
            maxWidth: labelW - px(titleX),
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>

        {/* Barcode 1 placeholder */}
        <div
          style={{
            position: "absolute",
            left: px(b1x),
            top: px(b1y),
            width: Math.min(px(bW), labelW - px(b1x)),
            height: px(bH),
          }}
        >
          {/* Barcode stripes visualization */}
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundImage:
                "repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px)",
              backgroundSize: "12px 100%",
            }}
          />
        </div>

        {/* Serial 1 text */}
        <div
          style={{
            position: "absolute",
            left: px(b1x),
            top: px(s1y),
            fontSize: serialFontPx,
            fontFamily: "monospace",
            color: "#000",
            whiteSpace: "nowrap",
          }}
        >
          {serial1}
        </div>

        {/* Barcode 2 placeholder */}
        <div
          style={{
            position: "absolute",
            left: px(b2x),
            top: px(b2y),
            width: Math.min(px(bW), labelW - px(b2x)),
            height: px(bH),
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundImage:
                "repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px)",
              backgroundSize: "12px 100%",
            }}
          />
        </div>

        {/* Serial 2 text */}
        <div
          style={{
            position: "absolute",
            left: px(b2x),
            top: px(s2y),
            fontSize: serialFontPx,
            fontFamily: "monospace",
            color: "#000",
            whiteSpace: "nowrap",
          }}
        >
          {serial2}
        </div>
      </div>
    </div>
  );
}
