import { useTranslation } from "react-i18next";

export default function EthicsBanner() {
  const { t } = useTranslation();

  return (
    <div
      className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs sm:text-sm px-3 py-2 text-center leading-snug"
      role="note"
      aria-label="Ethics disclaimer"
    >
      {t("ethics_banner")}
    </div>
  );
}
