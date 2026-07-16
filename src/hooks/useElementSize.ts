import { useEffect, useRef, useState } from "react";

// Measures an element's rendered box via ResizeObserver, so components can
// size their content (e.g. a circular gauge's diameter) off the real space
// the grid gave them instead of a fixed pixel assumption.
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
