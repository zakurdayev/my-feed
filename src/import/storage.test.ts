import { beforeEach, expect, it, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';
import { loadCollections, saveCollections } from './storage';
import { parseCollection } from './collections';
vi.mock('@capacitor/preferences', () => {
  const values = new Map<string, string>();
  return { Preferences: { get: vi.fn(async ({ key }) => ({ value: values.get(key) ?? null })), set: vi.fn(async ({ key, value }) => { values.set(key, value); }) } };
});
beforeEach(() => vi.clearAllMocks());
it('persists normalized collections, reloads them and saves removal', async () => {
  const { feed } = parseCollection(JSON.stringify({ version: 1, collection: { id: 'remote', title: 'Remote' }, items: [{ id: '1', type: 'image', mediaUrl: 'https://example.com/1.jpg' }] }));
  await saveCollections([feed]);
  expect(await loadCollections()).toEqual([feed]);
  await saveCollections([]);
  expect(await loadCollections()).toEqual([]);
  expect(Preferences.set).toHaveBeenCalledTimes(2);
});
