import { useTranslation } from "react-i18next";

const SECTIONS = ["soothe_children", "cope_trauma", "duas_comfort", "community_support"] as const;

export default function IslamicGuidancePage() {
  const { t } = useTranslation();

  function downloadGuide() {
    const parts: string[] = [];
    for (const s of SECTIONS) {
      parts.push(t(`islamic.${s}.title`));
      if (s === "duas_comfort") {
        const duas = t(`islamic.${s}.items`, { returnObjects: true }) as {
          text: string;
          ref: string;
        }[];
        parts.push(duas.map((d) => `${d.text}\n  — ${d.ref}`).join("\n\n"));
      } else {
        const items = t(`islamic.${s}.items`, { returnObjects: true }) as string[];
        parts.push(items.map((i) => `• ${i}`).join("\n"));
      }
    }
    const blob = new Blob([parts.join("\n\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "islamic-guidance.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{t("islamic.title")}</h2>
          <p className="text-sm text-slate-500">{t("islamic.subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={downloadGuide}>
          {t("islamic.download")}
        </button>
      </div>

      <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
        {t("islamic.disclaimer")}
      </div>

      <div className="grid gap-4">
        {SECTIONS.map((section) => {
          if (section === "duas_comfort") {
            const duas = t("islamic.duas_comfort.items", {
              returnObjects: true,
            }) as { text: string; ref: string }[];
            return (
              <section key={section} className="card border-l-4 border-l-teal-600">
                <h3 className="font-semibold text-lg text-teal-900 mb-3">
                  {t("islamic.duas_comfort.title")}
                </h3>
                <div className="space-y-4">
                  {duas.map((dua, i) => (
                    <blockquote key={i} className="text-sm border-s-2 border-teal-200 ps-3">
                      <p className="text-slate-800 leading-relaxed font-medium">{dua.text}</p>
                      <cite className="text-xs text-slate-500 not-italic mt-1 block">
                        {dua.ref}
                      </cite>
                    </blockquote>
                  ))}
                </div>
              </section>
            );
          }

          const items = t(`islamic.${section}.items`, { returnObjects: true }) as string[];
          return (
            <section key={section} className="card border-l-4 border-l-teal-600">
              <h3 className="font-semibold text-lg text-teal-900 mb-3">
                {t(`islamic.${section}.title`)}
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
