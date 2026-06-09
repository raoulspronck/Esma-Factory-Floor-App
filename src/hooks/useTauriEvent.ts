import { useEffect } from "react";
import { listen, Event } from "@tauri-apps/api/event";

/**
 * Subscribe to a Tauri backend event and automatically unsubscribe on unmount.
 * Replace all raw `listen(...)` calls with this hook to eliminate listener leaks.
 */
export function useTauriEvent<T>(
  event: string,
  handler: (event: Event<T>) => void,
  deps: unknown[] = []
) {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen<T>(event, handler).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
