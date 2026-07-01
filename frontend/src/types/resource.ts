export type ResourceType =
  | "food"
  | "water"
  | "medical"
  | "shelter"
  | "aid_distribution"
  | "evacuation_info"
  | "risk_zone"
  | "infrastructure_status";

export type ResourceStatus = "active" | "limited" | "uncertain" | "unknown";

export type VerificationLevel =
  | "verified"
  | "ngo_reported"
  | "crowdsourced"
  | "unverified";

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  coordinates: [number, number];
  status: ResourceStatus;
  lastUpdated: string;
  source: string;
  verificationLevel: VerificationLevel;
  area?: string;
  distanceKm?: number;
}

export type ScenarioNeed =
  | "general"
  | "food"
  | "water"
  | "medical"
  | "safety"
  | "information";

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export type LocationConfidence = "high" | "medium" | "low";

export interface GeoContext {
  urgentNeeds: Resource[];
  nearbyAid: Resource[];
  nearbyRisks: Resource[];
  fallbackOptions: Resource[];
  nearestWater?: Resource;
  nearestMedical?: Resource;
  nearestFood?: Resource;
  nearestShelter?: Resource;
}

export interface AIResponse {
  summary: string;
  immediateActions: string[];
  warnings: string[];
  bestOptions: {
    title: string;
    reason: string;
    distanceKm: number;
  }[];
}
