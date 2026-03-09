import type { LabelSettings } from "../stores/labelSettingsStore";

// 200 DPI: 1mm = ~7.874 dots
const MM_TO_DOTS = 200 / 25.4;

function mmToDots(mm: number): number {
  return Math.round(mm * MM_TO_DOTS);
}

export function generateCPCL(
  settings: LabelSettings,
  serial1: string,
  serial2: string,
  title: string,
): string {
  const widthDots = mmToDots(settings.width);
  const heightDots = mmToDots(settings.height);
  const titleFontDots = mmToDots(settings.titleFontSize);
  const serialFontDots = mmToDots(settings.serialFontSize);
  const vOffset = mmToDots(settings.globalVerticalOffset);
  const hOffset = mmToDots(settings.globalHorizontalOffset);

  // Barcode positions (apply global offsets)
  let b1x = mmToDots(settings.barcode1X) + hOffset;
  const b1y = mmToDots(settings.barcode1Y) + vOffset;
  let b2x = mmToDots(settings.barcode2X) + hOffset;
  const b2y = mmToDots(settings.barcode2Y) + vOffset;
  const bHeight = mmToDots(settings.barcodeHeight);
  const bWidth = settings.barcodeWidth; // already in dots

  // Left-align: ensure barcode fits within label width
  b1x = Math.max(0, Math.min(b1x, widthDots - bWidth * 4));
  b2x = Math.max(0, Math.min(b2x, widthDots - bWidth * 4));

  // Serial text positions (below barcode)
  const s1textY = b1y + bHeight + mmToDots(settings.barcode1TextGap);
  const s2textY = b2y + bHeight + mmToDots(settings.barcode2TextGap);

  // CPCL BARCODE command: data must be on a SEPARATE line immediately after the command
  // Format: BARCODE <type> <width> <ratio> <height> <x> <y>\r\n<data>
  const lines: string[] = [];
  lines.push(`! 0 200 200 ${heightDots} 1`);
  lines.push(`PAGE-WIDTH ${widthDots}`);
  lines.push(`TEXT ${titleFontDots} 0 ${hOffset} ${vOffset} ${title}`);
  // Barcode 1 — data on next line per CPCL spec
  lines.push(
    `BARCODE ${settings.barcodeType} ${bWidth} 2 ${bHeight} ${b1x} ${b1y}`,
  );
  lines.push(serial1);
  lines.push(`TEXT ${serialFontDots} 0 ${b1x} ${s1textY} ${serial1}`);
  // Barcode 2 — data on next line per CPCL spec
  lines.push(
    `BARCODE ${settings.barcodeType} ${bWidth} 2 ${bHeight} ${b2x} ${b2y}`,
  );
  lines.push(serial2);
  lines.push(`TEXT ${serialFontDots} 0 ${b2x} ${s2textY} ${serial2}`);
  lines.push("PRINT");

  const cpcl = lines.join("\r\n");

  // Debug: log generated CPCL to console so it can be inspected
  console.log(`[CPCL Generated]\n${cpcl.replace(/\r\n/g, "\n")}`);

  return cpcl;
}
