import { useTranslation } from "react-i18next";
import { useAppStore } from "../store/appStore";

export default function LiveIndicator({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const { liteMode } = useAppStore();

  if (liteMode) return null;

  return (
    <span
      className={`live-badge inline-flex items-center gap-1.5 text-xs font-medium ${className}`}
    >
      <span className="live-dot" aria-hidden />
      {t("news.auto_refresh")}
    </span>
  );
}
