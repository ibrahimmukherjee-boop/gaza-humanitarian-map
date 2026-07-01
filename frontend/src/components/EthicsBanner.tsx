import { useTranslation } from "react-i18next";

export default function EthicsBanner() {
  const { t } = useTranslation();

  return (
    <details className="bg-amber-50 border-b border-amber-200 group">
      <summary className="text-amber-900 text-xs px-3 py-2 cursor-pointer list-none flex items-center justify-between gap-2">
        <span className="font-medium">{t("ethics_banner_short")}</span>
        <span className="text-amber-700 text-[10px] shrink-0 group-open:hidden">
          {t("ethics_banner_expand")}
        </span>
      </summary>
      <p
        className="text-amber-900 text-xs px-3 pb-2 leading-snug"
        role="note"
      >
        {t("ethics_banner")}
      </p>
    </details>
  );
}
