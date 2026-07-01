export type PoliticalSourceRegion = "israel" | "palestine" | "international" | "other";
export type StatementType =
  | "official_statement"
  | "military_announcement"
  | "political_commentary"
  | "diplomatic"
  | "media_report";

export interface PoliticalNewsItem {
  id: string;
  title_en: string;
  title_ar: string;
  excerpt_en: string;
  excerpt_ar: string;
  source: string;
  source_region: PoliticalSourceRegion;
  statement_type: StatementType;
  timestamp: string;
  url: string;
  credibility: "high" | "medium" | "low";
}

export interface DiscourseMetrics {
  /** -100 to +100: escalation vs de-escalation language in tracked headlines */
  sentimentScore: number;
  /** 0–100: volume/intensity of escalation-related discourse — NOT operational risk */
  discourseQuotient: number;
  articleCount: number;
  windowHours: number;
  computedAt: string;
  sentimentLabel: "de_escalation" | "neutral" | "escalation";
  quotientLabel: "low" | "moderate" | "elevated";
}
