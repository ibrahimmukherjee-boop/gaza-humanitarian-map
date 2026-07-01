import { useTranslation } from "react-i18next";
import type { DiscourseMetrics } from "../types/political";

interface DiscourseMetricsPanelProps {
  metrics: DiscourseMetrics;
}

function GaugeBar({
  value,
  min,
  max,
  color,
}: {
  value: number;
  min: number;
  max: number;
  color: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function DiscourseMetricsPanel({ metrics }: DiscourseMetricsPanelProps) {
  const { t } = useTranslation();
  const sentimentPct = ((metrics.sentimentScore + 100) / 200) * 100;
  const sentimentColor =
    metrics.sentimentLabel === "escalation"
      ? "#dc2626"
      : metrics.sentimentLabel === "de_escalation"
        ? "#16a34a"
        : "#64748b";

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="card border-slate-300">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">
          {t("political.metrics.sentiment_title")}
        </h3>
        <p className="text-xs text-slate-500 mb-3">{t("political.metrics.sentiment_desc")}</p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold tabular-nums" style={{ color: sentimentColor }}>
            {metrics.sentimentScore > 0 ? "+" : ""}
            {metrics.sentimentScore}
          </span>
          <span className="text-xs text-slate-500 capitalize">
            {t(`political.metrics.${metrics.sentimentLabel === "de_escalation" ? "de_escalation" : metrics.sentimentLabel}`)}{" "}
            tone
          </span>
        </div>
        <GaugeBar value={sentimentPct} min={0} max={100} color={sentimentColor} />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>{t("political.metrics.de_escalation")}</span>
          <span>{t("political.metrics.escalation")}</span>
        </div>
      </div>

      <div className="card border-slate-300">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">
          {t("political.metrics.diq_title")}
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {t("political.metrics.diq_desc")}{" "}
          <strong className="text-amber-700">{t("political.disclaimer_title")}:</strong>{" "}
          {t("political.disclaimer").slice(0, 120)}…
        </p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold tabular-nums text-slate-800">
            {metrics.discourseQuotient}
          </span>
          <span className="text-xs text-slate-500 capitalize">{metrics.quotientLabel}</span>
        </div>
        <GaugeBar value={metrics.discourseQuotient} min={0} max={100} color="#f59e0b" />
        <p className="text-[10px] text-slate-400 mt-2">
          {t("political.metrics.articles", {
            count: metrics.articleCount,
            hours: metrics.windowHours,
          })}
        </p>
      </div>
    </div>
  );
}
