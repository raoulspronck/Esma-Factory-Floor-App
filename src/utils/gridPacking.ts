// Placement helpers for the device-strip dashboard: each device owns a
// 2-column strip (max 5 strips). Widget coordinates are local to their
// device's strip. STRIP_ROWS is the default row count — the actual rendered
// row count comes from the `dashboard_rows` basic setting (per machine).

export const STRIP_COLS = 2;
export const STRIP_ROWS = 7;
export const MAX_DEVICES = 5;

export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: GridRect, b: GridRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// First-fit scan for a free w x h rect, row-major from (0,0). Scans past
// STRIP_ROWS as a last resort so placement never fails outright — an
// over-full strip just grows downward, which the user can fix in edit mode.
export function findFreeSlot(
  placed: GridRect[],
  w: number,
  h: number,
  cols: number = STRIP_COLS
): { x: number; y: number } {
  const maxSearchRows = STRIP_ROWS * 4;

  for (let y = 0; y <= maxSearchRows - h; y++) {
    for (let x = 0; x <= cols - w; x++) {
      const candidate = { x, y, w, h };
      if (!placed.some((p) => overlaps(candidate, p))) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: 0 };
}
