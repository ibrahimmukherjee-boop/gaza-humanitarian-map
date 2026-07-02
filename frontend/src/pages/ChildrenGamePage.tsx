import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

const SquirrelAdventureGame = lazy(() => import("../game/SquirrelAdventureGame"));

export default function ChildrenGamePage() {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] min-h-[400px] max-w-4xl mx-auto px-3 sm:px-4">
      <div className="card shrink-0 mt-2 mb-3">
        <h2 className="text-base font-semibold page-title">{t("children_game.title")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("children_game.subtitle")}</p>
        <p className="text-xs text-slate-400 mt-1">{t("children_game.controls")}</p>
      </div>

      <div className="game-viewport flex-1 min-h-0 mb-2">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-slate-500">
              {t("children_game.loading")}
            </div>
          }
        >
          <SquirrelAdventureGame onScoreChange={setScore} />
        </Suspense>
      </div>

      <div className="card shrink-0 py-2 text-center text-sm text-slate-600 mb-2">
        {t("children_game.score")}: <strong>{score}</strong> 🌰
      </div>
    </div>
  );
}
