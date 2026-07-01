/** Vite base URL, e.g. "/" locally or "/gaza-humanitarian-map/" on GitHub Pages */
export const BASE_URL = import.meta.env.BASE_URL;

export function assetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${BASE_URL}${normalized}`;
}
