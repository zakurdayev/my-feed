import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DiscoveryFeed } from './DiscoveryFeed';
import { ImageMedia } from './ImageMedia';
let notify: IntersectionObserverCallback;
vi.stubGlobal('IntersectionObserver', class {
  constructor(callback: IntersectionObserverCallback) { notify = callback; }
  observe() {} disconnect() {}
});
afterEach(cleanup);
it('reports only actual active changes and advances the loading window', () => {
  const onChange = vi.fn();
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  const { container, rerender } = render(<DiscoveryFeed items={items} getItemKey={x => x} onActiveItemChange={onChange} renderItem={(x, c) => <span data-testid={x}>{String(c.shouldLoad)}</span>} />);
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('d').textContent).toBe('false');
  const target = container.querySelectorAll('section')[1];
  const entry: IntersectionObserverEntry = { target, isIntersecting: true, intersectionRatio: 1, time: 0, boundingClientRect: target.getBoundingClientRect(), intersectionRect: target.getBoundingClientRect(), rootBounds: null };
  act(() => notify([entry], {} as IntersectionObserver));
  expect(onChange).toHaveBeenLastCalledWith('b', 1);
  expect(screen.getByTestId('d').textContent).toBe('true');
  act(() => notify([entry], {} as IntersectionObserver));
  rerender(<DiscoveryFeed items={items} getItemKey={x => x} onActiveItemChange={onChange} renderItem={x => x} />);
  expect(onChange).toHaveBeenCalledTimes(2);
});
it('defers distant images, retains loaded DOM, and recovers after an error', () => {
  const { container, rerender } = render(<ImageMedia src="/test.jpg" alt="Test" active={false} shouldLoad={false} />);
  expect(container.querySelector('img')).toBeNull();
  rerender(<ImageMedia src="/test.jpg" alt="Test" active shouldLoad />);
  const img = screen.getByAltText('Test');
  fireEvent.error(img);
  expect(screen.getByRole('alert')).toBeTruthy();
  fireEvent.click(screen.getByText('Retry'));
  const retried = screen.getByAltText('Test');
  Object.defineProperties(retried, { naturalWidth: { value: 900 }, naturalHeight: { value: 1350 } });
  fireEvent.load(retried);
  expect(retried.className).toBe('loaded');
  rerender(<ImageMedia src="/test.jpg" alt="Test" active={false} shouldLoad={false} />);
  expect(screen.getByAltText('Test')).toBe(retried);
  expect(screen.queryByRole('alert')).toBeNull();
});
