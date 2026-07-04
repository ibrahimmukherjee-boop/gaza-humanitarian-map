import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

const SquirrelAdventureGame = lazy(() => import("../game/SquirrelAdventureGame"));

export default function ChildrenGamePage() {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] min-h-[480px] max-w-lg mx-auto px-2 sm:px-3 pb-2">
      <div className="card shrink-0 mt-2 mb-2 py-2">
        <h2 className="text-base font-semibold page-title">{t("children_game.title")}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{t("children_game.controls")}</p>
      </div>

      <div className="game-viewport flex-1 min-h-[360px] flex flex-col">
        <Suspense
          fallback={
            <div className="flex items-center justify-center flex-1 text-slate-500">
              {t("children_game.loading")}
            </div>
          }
        >
          <SquirrelAdventureGame onScoreChange={setScore} />
        </Suspense>
      </div>

      <p className="shrink-0 text-center text-xs text-slate-500 mt-2">
        {t("children_game.score")}: {score} 🌰
      </p>
    </div>
  );
}
