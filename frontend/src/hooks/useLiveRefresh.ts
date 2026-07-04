import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppStore } from "../store/appStore";

const LIVE_INTERVAL_MS = 60_000;

function invalidateLive(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.refetchQueries({ queryKey: ["meta"], type: "active" });
  void queryClient.refetchQueries({ queryKey: ["news"], type: "active" });
  void queryClient.refetchQueries({ queryKey: ["political_news"], type: "active" });
}

/** Poll live feeds every 60s; refresh when tab regains focus or comes online. */
export function useLiveRefresh() {
  const queryClient = useQueryClient();
  const { liteMode } = useAppStore();

  useEffect(() => {
    if (liteMode) return;

    const tick = () => invalidateLive(queryClient);
    tick();
    const id = setInterval(tick, LIVE_INTERVAL_MS);

    function onFocus() {
      tick();
    }
    function onOnline() {
      tick();
    }

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    return () => {
      clearInterval(id);
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
