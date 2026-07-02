import { useTranslation } from "react-i18next";

export default function EthicsBanner() {
  const { t } = useTranslation();

  return (
    <details className="bg-white border-b border-slate-200 group">
      <summary className="text-slate-600 text-xs px-3 py-2 cursor-pointer list-none flex items-center justify-between gap-2">
        <span className="font-medium">{t("ethics_banner_short")}</span>
        <span className="text-slate-400 text-[10px] shrink-0 group-open:hidden">
          {t("ethics_banner_expand")}
        </span>
      </summary>
      <p className="text-slate-500 text-xs px-3 pb-2 leading-snug" role="note">
        {t("ethics_banner")}
      </p>
    </details>
  );
}
