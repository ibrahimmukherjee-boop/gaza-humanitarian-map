import type { NewsItem } from "../types";

/** Must match at least one Gaza/Palestine-specific signal. */
const GAZA_CORE =
  /gaza|gaza strip|palestin|unrwa|rafah|khan younis|deir al-?balah|jabalia|beit hanoun|north gaza|strip\b|west bank|occupied territor/i;

/** Humanitarian context tied to the region (allowed with aid/refugee wording). */
const HUMANITARIAN_GAZA =
  /humanitarian|refugee|aid convoy|food aid|medical aid|displaced|shelter|un agency|unrwa|ocha|wfp|unicef|icrc/i;

/** Stories that are usually off-topic unless they also mention Gaza/Palestine. */
const OFF_TOPIC =
  /tehran|\biran\b|khamenei|\bsyria\b|damascus|\blebanon\b|\byemen\b|\bsudan\b|ukraine|russia|mali|congo|myanmar|afghanistan|pakistan flood|india\b|china\b|trump(?!.*gaza)|migrants in europe|uk election/i;

const TRUSTED_GAZA_SOURCES = new Set([
  "UNRWA",
  "ReliefWeb",
  "OCHA",
  "WAFA",
  "Ma'an News",
]);

export function isRelevantNews(title: string, excerpt: string, source = ""): boolean {
  const text = `${title} ${excerpt}`.toLowerCase();

  if (OFF_TOPIC.test(text) && !GAZA_CORE.test(text)) return false;

  if (GAZA_CORE.test(text)) return true;

  if (TRUSTED_GAZA_SOURCES.has(source) && HUMANITARIAN_GAZA.test(text)) return true;

  return false;
}

export function filterNewsItems(items: NewsItem[]): NewsItem[] {
  return items.filter((item) =>
    isRelevantNews(
      item.title_en || item.title_ar,
      item.excerpt_en || item.excerpt_ar,
      item.source
    )
  );
}
