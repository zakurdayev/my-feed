import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from './App';
import { loadCollections, saveCollections } from '../import/storage';
vi.mock('../import/storage', () => {
  let saved: unknown[] = [];
  return { loadCollections: vi.fn(async () => saved), saveCollections: vi.fn(async (feeds: unknown[]) => { saved = feeds; }) };
});
vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
afterEach(cleanup);
const data = (title: string) => JSON.stringify({ version: 1, collection: { id: 'remote-test', title }, items: [{ id: '1', type: 'image', title: 'Portrait', mediaUrl: 'https://example.com/portrait.jpg' }] });
async function selectFile(text: string) {
  const input = screen.getByLabelText('Collection JSON file');
  fireEvent.change(input, { target: { files: [{ text: async () => text }] } });
  await waitFor(() => expect(screen.queryByText('Working…')).toBeNull());
}
it('imports, opens HTTPS media, updates, reloads, removes and keeps Models', async () => {
  const view = render(<App />);
  await waitFor(() => expect((screen.getByText('+ Import collection') as HTMLButtonElement).disabled).toBe(false));
  await selectFile(data('Remote Test'));
  fireEvent.click(screen.getByText('Remote Test'));
  expect(screen.getByAltText('Portrait').getAttribute('src')).toBe('https://example.com/portrait.jpg');
  fireEvent.click(screen.getByLabelText('Back to collections'));
  await selectFile(data('Updated'));
  expect(screen.queryByText('Remote Test')).toBeNull();
  expect(screen.getAllByText('Updated')).toHaveLength(1);
  view.unmount(); render(<App />);
  await screen.findByText('Updated');
  fireEvent.click(screen.getByLabelText('Remove collection Updated'));
  await screen.findByText('Collection removed');
  expect(screen.queryByText('Updated')).toBeNull();
  expect(screen.getByText('Models')).toBeTruthy();
  expect(saveCollections).toHaveBeenCalledTimes(3);
  expect(loadCollections).toHaveBeenCalledTimes(2);
  await selectFile('invalid');
  expect(screen.getByText('Invalid JSON')).toBeTruthy();
});
