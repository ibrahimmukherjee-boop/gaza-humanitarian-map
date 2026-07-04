import { useEffect, useState } from "react";

/** Re-render every interval so relative timestamps stay current. */
export function useRelativeTimeTicker(intervalMs = 30_000): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
