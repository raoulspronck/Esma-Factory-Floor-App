// Deterministic color tag per device, so a device's widgets stay visually
// grouped on the flat grid without needing a literal container box.

const PALETTE = [
  "blue.400",
  "green.400",
  "purple.400",
  "orange.400",
  "pink.400",
  "teal.400",
  "yellow.400",
  "cyan.400",
];

export function deviceColor(deviceId: string): string {
  let hash = 0;
  for (let i = 0; i < deviceId.length; i++) {
    hash = (hash * 31 + deviceId.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
