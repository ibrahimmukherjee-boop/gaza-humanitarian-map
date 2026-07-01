import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppStore } from "../store/appStore";

const LIVE_INTERVAL_MS = 60_000;

/** Poll all live data feeds every minute (skipped in lite mode for heavy endpoints). */
export function useLiveRefresh() {
  const queryClient = useQueryClient();
  const { liteMode } = useAppStore();

  useEffect(() => {
    if (liteMode) return;

    const tick = () => {
      queryClient.invalidateQueries({ queryKey: ["meta"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      queryClient.invalidateQueries({ queryKey: ["political_news"] });
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      queryClient.invalidateQueries({ queryKey: ["pressure"] });
    };

    const id = setInterval(tick, LIVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [queryClient, liteMode]);
}

export const LIVE_QUERY_OPTS = {
  refetchInterval: 60_000 as const,
  refetchIntervalInBackground: true,
  staleTime: 55_000,
};

export const LIVE_META_OPTS = {
  refetchInterval: 60_000 as const,
  refetchIntervalInBackground: true,
  staleTime: 55_000,
};
