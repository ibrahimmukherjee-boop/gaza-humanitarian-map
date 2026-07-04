import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppStore } from "../store/appStore";

const LIVE_INTERVAL_MS = 60_000;
const DAILY_MS = 24 * 60 * 60_000;

function invalidateLive(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["meta"] });
  queryClient.invalidateQueries({ queryKey: ["news"] });
  queryClient.invalidateQueries({ queryKey: ["political_news"] });
  queryClient.invalidateQueries({ queryKey: ["facilities"] });
  queryClient.invalidateQueries({ queryKey: ["pressure"] });
}

/** Poll live feeds every minute; also refresh when tab regains focus and once daily. */
export function useLiveRefresh() {
  const queryClient = useQueryClient();
  const { liteMode } = useAppStore();

  useEffect(() => {
    if (liteMode) return;

    const tick = () => invalidateLive(queryClient);
    const minuteId = setInterval(tick, LIVE_INTERVAL_MS);
    const dailyId = setInterval(tick, DAILY_MS);

    function onFocus() {
      tick();
    }
    function onOnline() {
      tick();
    }

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    return () => {
      clearInterval(minuteId);
      clearInterval(dailyId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [queryClient, liteMode]);
}

export const LIVE_QUERY_OPTS = {
  refetchInterval: 60_000 as const,
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: true,
  staleTime: 55_000,
};

export const LIVE_META_OPTS = {
  refetchInterval: 60_000 as const,
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: true,
  staleTime: 55_000,
};
