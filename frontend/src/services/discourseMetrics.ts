/**
 * Transparent, rule-based discourse analysis.
 *
 * IMPORTANT: These metrics measure LANGUAGE in published political news.
 * They do NOT predict military action, assess threat levels, or infer intent.
 */

import type { DiscourseMetrics, PoliticalNewsItem } from "../types/political";

const ESCALATION_TERMS = [
  "military",
  "strike",
  "strikes",
  "operation",
  "offensive",
  "invasion",
  "mobiliz",
  "rocket",
  "rockets",
  "bomb",
  "bombing",
  "attack",
  "attacks",
  "combat",
  "war",
  "-idf",
  "air force",
  "ground operation",
  "security cabinet",
  "hostage",
  "iron dome",
  "artillery",
  "shelling",
  "airstrike",
  "airstrikes",
  "troops",
  "deploy",
  "escalat",
  "retaliat",
];

const DEESCALATION_TERMS = [
  "ceasefire",
  "truce",
  "diplomatic",
  "diplomacy",
  "negotiat",
  "humanitarian",
  "aid corridor",
  "peace",
  "mediation",
  "pause",
  "de-escalat",
  "release",
  "hostage deal",
  "talks",
  "agreement",
  "un resolution",
];

function countTerms(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  return terms.reduce((n, term) => n + (lower.includes(term) ? 1 : 0), 0);
}

function articleLanguageScore(item: PoliticalNewsItem): number {
  const text = `${item.title_en} ${item.excerpt_en}`;
  const esc = countTerms(text, ESCALATION_TERMS);
  const de = countTerms(text, DEESCALATION_TERMS);
  if (esc === 0 && de === 0) return 0;
  return (esc - de) / (esc + de);
}

function recencyWeight(iso: string): number {
  const ageHours = (Date.now() - new Date(iso).getTime()) / 3600000;
  return Math.exp(-ageHours / 24);
}

export function computeDiscourseMetrics(
  articles: PoliticalNewsItem[],
  windowHours = 48
): DiscourseMetrics {
  const cutoff = Date.now() - windowHours * 3600000;
  const recent = articles.filter((a) => new Date(a.timestamp).getTime() >= cutoff);

  let weightedSentiment = 0;
  let totalWeight = 0;
  let intensitySum = 0;

  for (const article of recent) {
    const score = articleLanguageScore(article);
    const weight = recencyWeight(article.timestamp);
    weightedSentiment += score * weight;
    totalWeight += weight;
    intensitySum += Math.abs(score) * weight;
  }

  const rawSentiment = totalWeight > 0 ? weightedSentiment / totalWeight : 0;
  const sentimentScore = Math.round(Math.max(-100, Math.min(100, rawSentiment * 100)));

  const discourseQuotient = Math.min(
    100,
    Math.round(intensitySum * 18 + recent.length * 2)
  );

  const sentimentLabel =
    sentimentScore > 15
      ? "escalation"
      : sentimentScore < -15
        ? "de_escalation"
        : "neutral";

  const quotientLabel =
    discourseQuotient >= 60 ? "elevated" : discourseQuotient >= 30 ? "moderate" : "low";

  return {
    sentimentScore,
    discourseQuotient,
    articleCount: recent.length,
    windowHours,
    computedAt: new Date().toISOString(),
    sentimentLabel,
    quotientLabel,
  };
}

export { ESCALATION_TERMS, DEESCALATION_TERMS };
