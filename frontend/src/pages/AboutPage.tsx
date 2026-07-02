import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function AboutPage() {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const doList = t("about.do_list", { returnObjects: true }) as string[];
  const dontList = t("about.dont_list", { returnObjects: true }) as string[];

  useEffect(() => {
    if (hash === "#ethics") {
      document.getElementById("ethics")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div>
        <h2 className="text-xl font-bold">{t("about.title")}</h2>
      </div>

      <section className="card">
        <h3 className="font-semibold text-lg mb-2">{t("about.mission_title")}</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{t("about.mission")}</p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="card border-green-200 bg-green-50/50">
          <h3 className="font-semibold text-green-800 mb-2">{t("about.what_we_do")}</h3>
          <ul className="text-sm space-y-1 list-disc ps-4 text-slate-700">
            {doList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="card border-red-200 bg-red-50/50">
          <h3 className="font-semibold text-red-800 mb-2">{t("about.what_we_dont")}</h3>
          <ul className="text-sm space-y-1 list-disc ps-4 text-slate-700">
            {dontList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card border-amber-200 bg-amber-50/40" id="ethics">
        <h3 className="font-semibold text-lg mb-2">{t("about.ethics_title")}</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{t("ethics_banner")}</p>
      </section>

      <p className="text-xs text-slate-500">
        {t("about.license")} · {t("about.contact")}
      </p>
    </div>
  );
}
