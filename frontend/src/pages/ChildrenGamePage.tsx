import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import LiveIndicator from "../components/LiveIndicator";

const SquirrelAdventureGame = lazy(() => import("../game/SquirrelAdventureGame"));

export default function ChildrenGamePage() {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] min-h-[420px] max-w-4xl mx-auto px-2 sm:px-4">
      <div className="glass-card shrink-0 mt-2 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold page-title flex items-center gap-2">
              <span className="text-2xl" aria-hidden>🐿️</span>
              {t("children_game.title")}
            </h2>
            <p className="text-sm text-slate-600">{t("children_game.subtitle")}</p>
          </div>
          <LiveIndicator className="!text-green-700 shrink-0" />
        </div>
        <p className="text-xs text-slate-500 mt-1">{t("children_game.controls")}</p>
      </div>

      <div className="game-viewport flex-1 min-h-0 mb-2 overflow-visible">
        <div className="game-viewport-inner h-full overflow-visible">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-slate-500">
                {t("children_game.loading")}
              </div>
            }
          >
            <SquirrelAdventureGame onScoreChange={setScore} popOut />
          </Suspense>
        </div>
      </div>

      <div className="glass-card shrink-0 py-2 text-center text-sm text-slate-600 mb-2">
        {t("children_game.score")}: <strong className="text-amber-700">{score}</strong> 🌰
      </div>
    </div>
  );
}
