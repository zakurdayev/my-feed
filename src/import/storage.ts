import { Preferences } from '@capacitor/preferences';
import { normalizeCollection, type FeedCollection } from './collections';
const KEY = 'my-feed.imported-collections.v1';
export async function loadCollections(): Promise<FeedCollection[]> {
  const { value } = await Preferences.get({ key: KEY });
  if (value === null) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('Invalid saved collections');
  return parsed.map(value => normalizeCollection(value).feed);
}
export async function saveCollections(feeds: FeedCollection[]) {
  await Preferences.set({ key: KEY, value: JSON.stringify(feeds) });
}
