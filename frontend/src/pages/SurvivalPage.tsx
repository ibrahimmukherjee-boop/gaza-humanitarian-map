import { useTranslation } from "react-i18next";

const SECTIONS = [
  "water",
  "sanitation",
  "first_aid",
  "shelter",
  "no_power",
  "infant",
  "chronic",
  "menstrual",
] as const;

export default function SurvivalPage() {
  const { t } = useTranslation();

  function downloadGuides() {
    const sections = SECTIONS.map((s) => {
      const title = t(`survival.${s}.title`);
      const items = t(`survival.${s}.items`, { returnObjects: true }) as string[];
      return `${title}\n${items.map((i) => `• ${i}`).join("\n")}`;
    });
    const blob = new Blob([sections.join("\n\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "survival-guides.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{t("survival.title")}</h2>
          <p className="text-sm text-slate-500">{t("survival.subtitle")}</p>
          <p className="text-xs text-slate-400 mt-1">{t("survival.offline_note")}</p>
        </div>
        <button className="btn btn-primary" onClick={downloadGuides}>
          {t("survival.download")}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const items = t(`survival.${section}.items`, { returnObjects: true }) as string[];
          return (
            <section key={section} className="card">
              <h3 className="font-semibold text-blue-800 mb-3">
                {t(`survival.${section}.title`)}
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 list-disc ps-4">
                {items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
