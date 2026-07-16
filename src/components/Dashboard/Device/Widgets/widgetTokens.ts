// Shared visual tokens for dashboard stat widgets, tuned for glanceable
// readability on shop-floor touchscreens viewed from a few meters away.

// Deterministic font sizing from the widget's measured box (useElementSize):
// the result is the smaller of "fits the height budget" and "fits the width
// at this character count" — so text adapts live to the cell's real rendered
// size (1x1 vs 2x2, any screen) instead of a hardcoded pixel table.
export function fitFontSize(
  text: string | undefined,
  widthPx: number,
  heightPx: number,
  opts?: { min?: number; max?: number }
): number {
  const { min = 12, max = 64 } = opts ?? {};
  if (!widthPx || !heightPx) return min;
  const chars = Math.max(text?.length ?? 1, 1);
  // ~0.58em average glyph width for a bold sans-serif.
  const byWidth = widthPx / (chars * 0.58);
  return Math.round(Math.min(Math.max(Math.min(byWidth, heightPx), min), max));
}

// Secondary text (labels, timestamps): a fraction of the cell height, clamped.
export function scaleFont(
  heightPx: number,
  fraction: number,
  min: number,
  max: number
): number {
  if (!heightPx) return min;
  return Math.round(Math.min(Math.max(heightPx * fraction, min), max));
}

export interface StatTypography {
  showLabel: boolean;
  showTs: boolean;
  labelSize: number;
  tsSize: number;
  valueArea: number;
}

// Vertical priority budget for a stat widget (top to bottom: label row,
// value area, timestamp row). The VALUE always keeps the remaining space —
// on small cells the timestamp disappears first, then the label, so the
// three can never fight for room or overlap. Priority: value > label > time.
export function statTypography(_width: number, height: number): StatTypography {
  const showTs = height >= 78;
  const showLabel = height >= 50;
  const labelSize = scaleFont(height, 0.13, 10, 16);
  const tsSize = scaleFont(height, 0.09, 9, 11);
  const valueArea = Math.max(
    height - 12 - (showLabel ? labelSize * 1.5 : 0) - (showTs ? tsSize * 1.6 : 0),
    16
  );
  return { showLabel, showTs, labelSize, tsSize, valueArea };
}

export const STAT_LABEL_COLOR = "whiteAlpha.700";
export const STAT_VALUE_COLOR = "white";
export const STAT_TIMESTAMP_COLOR = "whiteAlpha.500";
export const STAT_DIVIDER_COLOR = "whiteAlpha.200";

// Reserved machine-state colors — never reused for anything else, so a
// glance at the color alone (backed by the text label) is trustworthy.
export const STATUS_COLOR = {
  run: "green.500",
  pause: "orange.500",
  stop: "red.500",
  idle: "gray.600",
};
