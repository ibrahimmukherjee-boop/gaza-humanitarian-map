import { useTranslation } from "react-i18next";
import i18n from "../i18n";

export default function LanguageToggle() {
  const { t } = useTranslation();
  const current = i18n.language;

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-slate-500 hidden sm:inline">{t("language")}:</span>
      <button
        className={`btn btn-ghost ${current === "en" ? "bg-blue-50 text-blue-800 font-semibold" : ""}`}
        onClick={() => i18n.changeLanguage("en")}
        aria-pressed={current === "en"}
      >
        EN
      </button>
      <span className="text-slate-300">|</span>
      <button
        className={`btn btn-ghost ${current === "ar" ? "bg-blue-50 text-blue-800 font-semibold" : ""}`}
        onClick={() => i18n.changeLanguage("ar")}
        aria-pressed={current === "ar"}
      >
        العربية
      </button>
    </div>
  );
}
