export type GazaArea =
  | "all"
  | "gaza-city"
  | "north-gaza"
  | "middle-area"
  | "khan-younis"
  | "rafah"
  | "unknown";

export type FacilityStatus = "open" | "closed" | "unknown";

export type VerificationStatus = "verified" | "unverified" | "disputed";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface HumanitarianFeature {
  id: string;
  type: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  lat: number;
  lng: number;
  area?: GazaArea;
  area_en?: string;
  area_ar?: string;
  status?: FacilityStatus;
  source: string;
  timestamp: string;
  verification_status: VerificationStatus;
  confidence: ConfidenceLevel;
  url?: string;
}

export interface GeoJSONFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: HumanitarianFeature;
}

export interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface NewsItem {
  id: string;
  title_en: string;
  title_ar: string;
  excerpt_en: string;
  excerpt_ar: string;
  source: string;
  timestamp: string;
  url: string;
  tags: string[];
  location_tags: string[];
  credibility: ConfidenceLevel;
  lat?: number;
  lng?: number;
}

export interface PressureRegion {
  id: string;
  name_en: string;
  name_ar: string;
  lat: number;
  lng: number;
  reports_1h: number;
  reports_6h: number;
  reports_24h: number;
  source_count: number;
  contradiction_index: number;
  recency_score: number;
  activity_level: "low" | "medium" | "high";
  last_update: string;
}

export interface PressureData {
  timestamp: string;
  regions: PressureRegion[];
}

export interface Hotline {
  id: string;
  name_en: string;
  name_ar: string;
  number: string;
  number_display: string;
  description_en: string;
  description_ar: string;
  category: "medical" | "humanitarian" | "children" | "mental_health";
  available_24h: boolean;
  source: string;
  url: string;
}

export interface MetaData {
  last_updated: string;
  news_last_updated?: string;
  political_last_updated?: string;
  refresh_heartbeat?: string;
  sources: string[];
  facilities_count: number;
  news_count: number;
  note_en: string;
  note_ar: string;
}

export type LayerType =
  | "hospitals"
  | "clinics"
  | "shelters"
  | "water"
  | "food"
  | "sanitation"
  | "roads"
  | "damage"
  | "incidents"
  | "news"
  | "pressure";

export const GAZA_AREAS: GazaArea[] = [
  "gaza-city",
  "north-gaza",
  "middle-area",
  "khan-younis",
  "rafah",
];

export type ResourceCategory = "all" | "hospitals" | "clinics" | "water" | "food" | "shelters";
