import type { GeoJSONCollection, HumanitarianFeature } from "../types";
import type {
  Resource,
  ResourceStatus,
  ResourceType,
  VerificationLevel,
} from "../types/resource";

const TYPE_MAP: Record<string, ResourceType> = {
  hospitals: "medical",
  clinics: "medical",
  water: "water",
  food: "food",
  shelters: "shelter",
  sanitation: "infrastructure_status",
  roads: "infrastructure_status",
  damage: "risk_zone",
  incidents: "risk_zone",
  aid: "aid_distribution",
};

const STATUS_MAP: Record<string, ResourceStatus> = {
  open: "active",
  closed: "limited",
  unknown: "unknown",
};

const VERIFY_MAP: Record<string, VerificationLevel> = {
  verified: "verified",
  unverified: "unverified",
  disputed: "crowdsourced",
};

export function mapFeatureToResource(f: HumanitarianFeature, isAr: boolean): Resource {
  const statusKey = f.status ?? "unknown";
  return {
    id: f.id,
    type: TYPE_MAP[f.type] ?? "infrastructure_status",
    name: isAr ? f.title_ar : f.title_en,
    nameAr: f.title_ar,
    description: isAr ? f.description_ar : f.description_en,
    descriptionAr: f.description_ar,
    coordinates: [f.lat, f.lng],
    status: STATUS_MAP[statusKey] ?? "uncertain",
    lastUpdated: f.timestamp,
    source: f.source,
    verificationLevel: VERIFY_MAP[f.verification_status] ?? "unverified",
    area: f.area,
  };
}

export function resourcesFromGeoJSON(
  data: GeoJSONCollection,
  isAr: boolean
): Resource[] {
  return data.features.map((feat) => mapFeatureToResource(feat.properties, isAr));
}

export function safeLabel(resource: Resource, isAr: boolean): string {
  if (resource.verificationLevel === "unverified") {
    return isAr
      ? `ربما متاح (غير مؤكد): ${resource.nameAr}`
      : `Possibly available (unverified): ${resource.name}`;
  }
  if (resource.status === "uncertain" || resource.status === "unknown") {
    return isAr
      ? `${resource.nameAr} — الحالة غير مؤكدة`
      : `${resource.name} — status uncertain`;
  }
  return resource.name;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number, locale: string): string {
  if (km < 1) {
    const m = Math.round(km * 1000);
    return locale === "ar" ? `${m} م` : `${m} m`;
  }
  return locale === "ar" ? `${km.toFixed(1)} كم` : `${km.toFixed(1)} km`;
}
