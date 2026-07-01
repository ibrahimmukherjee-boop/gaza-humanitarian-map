import { useTranslation } from "react-i18next";
import type { HumanitarianFeature } from "../types";
import { formatRelativeTime } from "../services/api";

interface FeaturePopupProps {
  feature: HumanitarianFeature;
}

export default function FeaturePopup({ feature }: FeaturePopupProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const title = isAr ? feature.title_ar || feature.title_en : feature.title_en;
  const description = isAr
    ? feature.description_ar || feature.description_en
    : feature.description_en;

  const verificationClass =
    feature.verification_status === "verified"
      ? "bg-green-100 text-green-800"
      : feature.verification_status === "disputed"
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800";

  return (
    <div className="min-w-[200px] max-w-[280px] text-sm">
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-600 mb-2 leading-snug">{description}</p>
      <div className="space-y-1 text-xs text-slate-500">
        <div>
          <span className="font-medium">{t("source")}:</span> {feature.source}
        </div>
        <div>
          <span className="font-medium">{t("timestamp")}:</span>{" "}
          {formatRelativeTime(feature.timestamp, i18n.language)}
        </div>
        <div className="flex gap-1 flex-wrap mt-1">
          <span className={`badge ${verificationClass}`}>
            {t(feature.verification_status)}
          </span>
          <span className="badge bg-slate-100 text-slate-700">
            {t("confidence")}: {t(feature.confidence)}
          </span>
        </div>
        {feature.url && (
          <a
            href={feature.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline block mt-1"
          >
            {t("read_more")} →
          </a>
        )}
      </div>
    </div>
  );
}
