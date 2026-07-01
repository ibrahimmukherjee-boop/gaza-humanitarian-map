import { useTranslation } from "react-i18next";

const SECTIONS = ["shelter", "vital_organs", "protect_children"] as const;

export default function ViolenceSafetyPage() {
  const { t } = useTranslation();

  function downloadGuide() {
    const sections = SECTIONS.map((s) => {
      const title = t(`violence_safety.${s}.title`);
      const items = t(`violence_safety.${s}.items`, { returnObjects: true }) as string[];
      return `${title}\n${items.map((i) => `• ${i}`).join("\n")}`;
    });
    const blob = new Blob([sections.join("\n\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "violence-safety-guide.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{t("violence_safety.title")}</h2>
          <p className="text-sm text-slate-500">{t("violence_safety.subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={downloadGuide}>
          {t("violence_safety.download")}
        </button>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        {t("violence_safety.disclaimer")}
      </div>

      <div className="grid gap-4">
        {SECTIONS.map((section) => {
          const items = t(`violence_safety.${section}.items`, {
            returnObjects: true,
          }) as string[];
          return (
            <section key={section} className="card border-l-4 border-l-red-600">
              <h3 className="font-semibold text-lg text-red-900 mb-3">
                {t(`violence_safety.${section}.title`)}
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

      <p className="text-xs text-slate-500">{t("violence_safety.sources_note")}</p>
    </div>
  );
}
