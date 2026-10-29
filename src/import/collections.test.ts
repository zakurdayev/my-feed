import { describe, expect, it } from 'vitest';
import { normalizeCollection, parseCollection, replaceCollection } from './collections';
const item = { id: 'one', type: 'image', mediaUrl: 'https://example.com/one.jpg' };
const collection = { version: 1, collection: { id: 'test', title: 'Test' }, items: [item] };
describe('collection normalization', () => {
  it('rejects malformed JSON, unsupported versions and invalid containers', () => {
    expect(() => parseCollection('{')).toThrow('Invalid JSON');
    expect(() => normalizeCollection({ ...collection, version: 2 })).toThrow('Unsupported feed version');
    expect(() => normalizeCollection({ ...collection, items: {} })).toThrow('Invalid collection structure');
    expect(() => normalizeCollection({ ...collection, collection: { id: 'models', title: 'Replace' } })).toThrow('reserved');
  });
  it('skips invalid and duplicate items, allows optional title and normalizes fields', () => {
    const result = normalizeCollection({ ...collection, items: [item, item, null, { ...item, id: 'two', type: 'video' }, { ...item, id: 'three', mediaUrl: 'javascript:alert(1)' }, { ...item, id: 'four', title: ' Name ', width: -1, height: 100, metadata: { tag: 'test' } }] });
    expect(result.skipped).toBe(4);
    expect(result.feed.items[0].title).toBe('');
    expect(result.feed.items[1]).toEqual({ id: 'four', type: 'image', title: 'Name', mediaUrl: item.mediaUrl, height: 100, metadata: { tag: 'test' } });
    expect(() => normalizeCollection({ ...collection, items: [null] })).toThrow('No valid items found');
  });
  it('updates the same collection without adding a duplicate', () => {
    const original = normalizeCollection(collection).feed;
    const incoming = { ...original, collection: { ...original.collection, title: 'Updated' } };
    expect(replaceCollection([original], incoming)).toEqual([incoming]);
  });
});
