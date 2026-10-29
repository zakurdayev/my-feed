import type { FeedItem } from '../feed/types';

export type FeedCollection = { version: 1; collection: { id: string; title: string }; items: FeedItem[] };
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function normalizeCollection(input: unknown): { feed: FeedCollection; skipped: number } {
  if (!record(input)) throw new Error('Invalid collection structure');
  if (input.version !== 1) throw new Error('Unsupported feed version');
  if (!record(input.collection) || !nonempty(input.collection.id) || !nonempty(input.collection.title) || !Array.isArray(input.items)) {
    throw new Error('Invalid collection structure');
  }
  const id = input.collection.id.trim();
  if (id === 'models') throw new Error('Collection id "models" is reserved');
  const seen = new Set<string>();
  const items: FeedItem[] = [];
  for (const item of input.items) {
    if (!record(item) || !nonempty(item.id) || seen.has(item.id.trim()) || item.type !== 'image' || !nonempty(item.mediaUrl)) continue;
    // Imported media must be remote HTTPS; never load script/file/content URLs.
    let url: URL;
    try { url = new URL(item.mediaUrl.trim()); } catch { continue; }
    if (url.protocol !== 'https:' || url.username || url.password) continue;
    const normalized: FeedItem = { id: item.id.trim(), type: 'image', title: typeof item.title === 'string' ? item.title.trim() : '', mediaUrl: url.href };
    for (const dimension of ['width', 'height'] as const) {
      const value = item[dimension];
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) normalized[dimension] = value;
    }
    if (record(item.metadata)) normalized.metadata = item.metadata;
    items.push(normalized);
    seen.add(normalized.id);
  }
  if (!items.length) throw new Error('No valid items found');
  return { feed: { version: 1, collection: { id, title: input.collection.title.trim() }, items }, skipped: input.items.length - items.length };
}

export function parseCollection(text: string) {
  let value: unknown;
  try { value = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new Error('Invalid JSON'); }
  return normalizeCollection(value);
}

export function replaceCollection(feeds: FeedCollection[], incoming: FeedCollection) {
  const index = feeds.findIndex(feed => feed.collection.id === incoming.collection.id);
  return index < 0 ? [...feeds, incoming] : feeds.map((feed, i) => i === index ? incoming : feed);
}
