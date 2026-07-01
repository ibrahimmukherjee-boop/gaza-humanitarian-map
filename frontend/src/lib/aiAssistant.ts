import type { AIResponse, GeoContext, Resource, UserLocation } from "../types/resource";
import { formatDistance, safeLabel } from "./resources";

function freshnessNote(r: Resource, isAr: boolean): string {
  const ageH = Math.floor((Date.now() - new Date(r.lastUpdated).getTime()) / 3600000);
  if (ageH < 1) return isAr ? "محدّث خلال الساعة" : "updated within the hour";
  if (ageH < 24) return isAr ? `محدّث منذ ${ageH} س` : `updated ${ageH}h ago`;
  return isAr ? "قد يكون قديماً" : "may be stale";
}

export function generateAIResponse(
  user: UserLocation | null,
  ctx: GeoContext,
  isAr: boolean
): AIResponse {
  const warnings: string[] = [];
  const immediateActions: string[] = [];
  const bestOptions: AIResponse["bestOptions"] = [];

  if (!user) {
    return {
      summary: isAr
        ? "فعّل موقعك لعرض أقرب الموارد المتاحة. جميع المعلومات تتطلب تحققاً محلياً."
        : "Enable location to see nearest available resources. All information requires local verification.",
      immediateActions: isAr
        ? ["اضغط «استخدام موقعي» أعلاه", "تحقق محلياً قبل السفر إلى أي موقع"]
        : ["Tap 'Use my location' above", "Verify locally before travelling to any site"],
      warnings: isAr
        ? ["لا نقدم توصيات أمان أو مسارات آمنة"]
        : ["We do not provide safety routes or safe-zone recommendations"],
      bestOptions: [],
    };
  }

  const parts: string[] = [];
  if (ctx.nearestWater) {
    parts.push(
      isAr
        ? `أقرب مياه: ${formatDistance(ctx.nearestWater.distanceKm ?? 0, "ar")}`
        : `Nearest water: ${formatDistance(ctx.nearestWater.distanceKm ?? 0, "en")}`
    );
  }
  if (ctx.nearestMedical) {
    parts.push(
      isAr
        ? `أقرب طبي: ${formatDistance(ctx.nearestMedical.distanceKm ?? 0, "ar")}`
        : `Nearest medical: ${formatDistance(ctx.nearestMedical.distanceKm ?? 0, "en")}`
    );
  }

  const summary =
    parts.length > 0
      ? (isAr
          ? `بناءً على البيانات المتاحة: ${parts.join("؛ ")}. تحقق محلياً قبل التصرف.`
          : `Based on available data: ${parts.join("; ")}. Verify locally before acting.`)
      : isAr
        ? "لا توجد موارد قريبة في البيانات الحالية. جرّب تصفية منطقة أخرى."
        : "No nearby resources in current data. Try browsing by area.";

  for (const r of ctx.urgentNeeds.slice(0, 3)) {
    const label = safeLabel(r, isAr);
    const dist = r.distanceKm ?? 0;
    immediateActions.push(
      isAr
        ? `${label} — ${formatDistance(dist, "ar")} (${freshnessNote(r, true)})`
        : `${label} — ${formatDistance(dist, "en")} (${freshnessNote(r, false)})`
    );
    bestOptions.push({
      title: label,
      reason: isAr
        ? `${r.source} · ${freshnessNote(r, true)}`
        : `${r.source} · ${freshnessNote(r, false)}`,
      distanceKm: dist,
    });
  }

  for (const r of ctx.nearbyAid) {
    if (r.verificationLevel === "unverified") {
      warnings.push(
        isAr
          ? `${r.nameAr}: غير مؤكد — تحقق قبل الزيارة`
          : `${r.name}: unverified — confirm before visiting`
      );
    }
    if (r.status === "uncertain" || r.status === "unknown") {
      warnings.push(
        isAr
          ? `${r.nameAr}: الحالة غير معروفة`
          : `${r.name}: operating status unknown`
      );
    }
  }

  warnings.push(
    isAr
      ? "هذه المعلومات إنسانية فقط — ليست توقعات أو توصيات أمان"
      : "This is humanitarian information only — not predictions or safety advice"
  );

  return {
    summary,
    immediateActions: immediateActions.slice(0, 4),
    warnings: [...new Set(warnings)].slice(0, 5),
    bestOptions: bestOptions.slice(0, 4),
  };
}
