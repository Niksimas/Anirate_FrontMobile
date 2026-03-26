export function fixUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}
