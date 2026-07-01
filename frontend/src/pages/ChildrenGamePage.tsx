import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

const SquirrelAdventureGame = lazy(() => import("../game/SquirrelAdventureGame"));

export default function ChildrenGamePage() {
  const { t } = useTranslation();
  const [score, setScore] = useState(0);

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] min-h-[400px]">
      <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-amber-100 to-orange-100 border-b border-amber-200">
        <h2 className="text-lg font-bold text-amber-900">{t("children_game.title")}</h2>
        <p className="text-sm text-amber-800">{t("children_game.subtitle")}</p>
        <p className="text-xs text-amber-700 mt-1">{t("children_game.controls")}</p>
      </div>

      <div className="flex-1 relative min-h-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-amber-800">
              {t("children_game.loading")}
            </div>
          }
        >
          <SquirrelAdventureGame onScoreChange={setScore} />
        </Suspense>
      </div>

      <div className="shrink-0 px-4 py-2 text-center text-xs text-slate-500 bg-slate-50 border-t">
        {t("children_game.score")}: {score} 🌰
      </div>
    </div>
  );
}
