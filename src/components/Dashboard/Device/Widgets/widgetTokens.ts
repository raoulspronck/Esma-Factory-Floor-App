// Shared visual tokens for dashboard stat widgets, tuned for glanceable
// readability on shop-floor touchscreens viewed from a few meters away.

export const STAT_ROW_MIN_H = "92px";

export const STAT_LABEL_COLOR = "whiteAlpha.700";
export const STAT_VALUE_COLOR = "white";
export const STAT_TIMESTAMP_COLOR = "whiteAlpha.500";
export const STAT_DIVIDER_COLOR = "whiteAlpha.200";

export const STAT_DIVIDER = {
  borderBottom: "1px solid",
  borderColor: STAT_DIVIDER_COLOR,
};

// Reserved machine-state colors — never reused for anything else, so a
// glance at the color alone (backed by the text label) is trustworthy.
export const STATUS_COLOR = {
  run: "green.500",
  pause: "orange.500",
  stop: "red.500",
  idle: "gray.600",
};
