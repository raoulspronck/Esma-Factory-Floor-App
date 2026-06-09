import { useConnectionStore } from "../stores/connectionStore";

/**
 * Returns the last known value for a datapoint from the in-memory cache.
 * The cache is kept up-to-date by the centralized event manager in App.tsx.
 * Widgets should use this hook instead of calling `get_last_value` individually.
 */
export function useDeviceValue(deviceKey: string, datapointKey: string): string | undefined {
  const key = `${deviceKey}---${datapointKey}`;
  return useConnectionStore((s) => s.lastValues[key]);
}
