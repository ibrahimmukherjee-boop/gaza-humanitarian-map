import type { ScenarioNeed, GeoContext, Resource, UserLocation } from "../types/resource";
import { haversineKm } from "./resources";

const TYPE_PRIORITY: Record<Resource["type"], number> = {
  medical: 1,
  water: 2,
  food: 3,
  shelter: 4,
  aid_distribution: 5,
  evacuation_info: 6,
  infrastructure_status: 7,
  risk_zone: 8,
};

const VERIFY_SCORE: Record<Resource["verificationLevel"], number> = {
  verified: 4,
  ngo_reported: 3,
  crowdsourced: 2,
  unverified: 1,
};

const SCENARIO_WEIGHTS: Record<
  ScenarioNeed,
  Partial<Record<Resource["type"], number>>
> = {
  general: {},
  food: { food: 0, medical: 3, water: 2, shelter: 4 },
  water: { water: 0, medical: 2, food: 3, shelter: 4 },
  medical: { medical: 0, water: 2, food: 3, shelter: 4 },
  safety: { shelter: 0, medical: 1, evacuation_info: 2, risk_zone: 3 },
  information: {
    aid_distribution: 0,
    evacuation_info: 1,
    infrastructure_status: 2,
  },
};

function freshnessScore(iso: string): number {
  const ageH = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (ageH < 6) return 4;
  if (ageH < 24) return 3;
  if (ageH < 72) return 2;
  return 1;
}

function rankScore(
  r: Resource,
  scenario: ScenarioNeed
): number {
  const scenarioBoost = SCENARIO_WEIGHTS[scenario][r.type] ?? TYPE_PRIORITY[r.type];
  const dist = r.distanceKm ?? 999;
  const distScore = dist <= 1 ? 5 : dist <= 5 ? 4 : dist <= 10 ? 3 : dist <= 20 ? 2 : 1;
  return (
    scenarioBoost * 100 +
    VERIFY_SCORE[r.verificationLevel] * 10 +
    freshnessScore(r.lastUpdated) * 5 +
    distScore
  );
}

function withDistance(
  resources: Resource[],
  user: UserLocation
): Resource[] {
  return resources.map((r) => ({
    ...r,
    distanceKm: haversineKm(user.lat, user.lng, r.coordinates[0], r.coordinates[1]),
  }));
}

function nearestByType(
  resources: Resource[],
  type: Resource["type"]
): Resource | undefined {
  return resources
    .filter((r) => r.type === type && r.status !== "limited")
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))[0];
}

export function buildGeoContext(
  resources: Resource[],
  user: UserLocation | null,
  scenario: ScenarioNeed = "general",
  maxKm = 10
): GeoContext {
  const located = user ? withDistance(resources, user) : resources;
  const nearby = user
    ? located.filter((r) => (r.distanceKm ?? 999) <= maxKm)
    : located;

  const ranked = [...nearby].sort(
    (a, b) => rankScore(b, scenario) - rankScore(a, scenario)
  );

  const urgentNeeds = ranked.filter(
    (r) =>
      r.type === "medical" ||
      r.type === "water" ||
      (r.status === "active" && (r.type === "food" || r.type === "shelter"))
  ).slice(0, 5);

  const nearbyAid = ranked
    .filter((r) => r.type !== "risk_zone" && r.type !== "infrastructure_status")
    .slice(0, 8);

  const nearbyRisks = ranked
    .filter((r) => r.type === "risk_zone" || r.status === "limited")
    .slice(0, 4);

  const fallbackOptions = ranked
    .filter((r) => (r.distanceKm ?? 0) > maxKm && (r.distanceKm ?? 999) <= maxKm * 3)
    .slice(0, 4);

  return {
    urgentNeeds,
    nearbyAid,
    nearbyRisks,
    fallbackOptions,
    nearestWater: nearestByType(located, "water"),
    nearestMedical: nearestByType(located, "medical"),
    nearestFood: nearestByType(located, "food"),
    nearestShelter: nearestByType(located, "shelter"),
  };
}

export function locationConfidence(accuracy: number): "high" | "medium" | "low" {
  if (accuracy <= 100) return "high";
  if (accuracy <= 500) return "medium";
  return "low";
}
