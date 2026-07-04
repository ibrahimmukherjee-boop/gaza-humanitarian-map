import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppStore } from "../store/appStore";

const LIVE_INTERVAL_MS = 45_000;

function refetchLive(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.refetchQueries({ queryKey: ["meta"], type: "active" });
  void queryClient.refetchQueries({ queryKey: ["news"], type: "active" });
  void queryClient.refetchQueries({ queryKey: ["political_news"], type: "active" });
}

/** Poll live feeds every 45s; refresh when tab visible, focused, or online. */
export function useLiveRefresh() {
  const queryClient = useQueryClient();
  const { liteMode } = useAppStore();

  useEffect(() => {
    if (liteMode) return;

    const tick = () => refetchLive(queryClient);
    tick();
    const id = setInterval(tick, LIVE_INTERVAL_MS);

    function onFocus() {
      tick();
    }
    function onOnline() {
      tick();
    }
    function onVisible() {
      if (document.visibilityState === "visible") tick();
    }

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [queryClient, liteMode]);
}

export const LIVE_QUERY_OPTS = {
  refetchInterval: 45_000 as const,
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  staleTime: 30_000,
};

export const LIVE_META_OPTS = {
  refetchInterval: 45_000 as const,
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  staleTime: 30_000,
};
