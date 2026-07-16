import { DeviceData, useConnectionStore } from "../stores/connectionStore";

/**
 * Returns the cached device shape (connected status + datapoint definitions)
 * for a device id. The cache is hydrated once by `get_dashboard_data` in
 * EventManager.tsx. WidgetCell should use this instead of calling
 * `get_device` individually.
 */
export function useDeviceData(deviceId: string): DeviceData | undefined {
  return useConnectionStore((s) => s.deviceData[deviceId]);
}
