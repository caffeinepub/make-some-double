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

  // Use ratio 2 (integer) for maximum printer compatibility
  // Build CPCL using exact same structure as working test print
  const cpcl = `! 0 200 200 ${heightDots} 1\r\nPAGE-WIDTH ${widthDots}\r\nTEXT ${titleFontDots} 0 ${hOffset} ${vOffset} ${title}\r\nBARCODE ${settings.barcodeType} ${bWidth} 2 ${bHeight} ${b1x} ${b1y} ${serial1}\r\nTEXT ${serialFontDots} 0 ${b1x} ${s1textY} ${serial1}\r\nBARCODE ${settings.barcodeType} ${bWidth} 2 ${bHeight} ${b2x} ${b2y} ${serial2}\r\nTEXT ${serialFontDots} 0 ${b2x} ${s2textY} ${serial2}\r\nPRINT`;

  // Debug: log generated CPCL to console so it can be inspected
  console.log(`[CPCL Generated]\n${cpcl.replace(/\r\n/g, "\n")}`);

  return cpcl;
}
