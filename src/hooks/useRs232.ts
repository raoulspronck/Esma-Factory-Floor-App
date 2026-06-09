import { useConnectionStore } from "../stores/connectionStore";

/**
 * Exposes the RS232 monitor state from the connection store.
 * The store is populated by the centralized event manager in App.tsx.
 */
export function useRs232() {
  const status = useConnectionStore((s) => s.rs232Status);
  const error = useConnectionStore((s) => s.rs232Error);
  const log = useConnectionStore((s) => s.rs232Log);
  return { status, error, log };
}
