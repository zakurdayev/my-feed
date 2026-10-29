import { useEffect, useRef, type ReactNode } from 'react';
import { FeedSlide } from './FeedSlide';
import { useActiveSlide } from './useActiveSlide';
import type { SlideContext } from './types';
type Props<T> = {
  items: readonly T[]; getItemKey: (item: T) => string;
  renderItem: (item: T, context: SlideContext<T>) => ReactNode;
  onActiveItemChange?: (item: T, index: number) => void;
};
export function DiscoveryFeed<T>({ items, getItemKey, renderItem, onActiveItemChange }: Props<T>) {
  const root = useRef<HTMLDivElement>(null);
  const activeIndex = useActiveSlide(root, items.length);
  const last = useRef<{ key: string; index: number } | null>(null);
  useEffect(() => {
    const item = items[activeIndex];
    if (item === undefined) { last.current = null; return; }
    const key = getItemKey(item);
    if (last.current?.key === key && last.current.index === activeIndex) return;
    last.current = { key, index: activeIndex };
    onActiveItemChange?.(item, activeIndex);
  }, [activeIndex, items, getItemKey, onActiveItemChange]);
  return <div className="discovery-feed" ref={root} tabIndex={0} aria-label="Image feed" onKeyDown={event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const index = Math.max(0, Math.min(items.length - 1, activeIndex + (event.key === 'ArrowDown' ? 1 : -1)));
    root.current?.children[index]?.scrollIntoView({ behavior: 'smooth' });
  }}>{items.length ? items.map((item, index) => {
    const distanceFromActive = index - activeIndex;
    return <FeedSlide key={getItemKey(item)} index={index} active={index === activeIndex}>{renderItem(item, {
      index, total: items.length, activeIndex, active: index === activeIndex, distanceFromActive,
      shouldLoad: distanceFromActive >= -1 && distanceFromActive <= 2,
      previous: items[activeIndex - 1], current: items[activeIndex], next: items[activeIndex + 1],
    })}</FeedSlide>;
  }) : <p role="status">No items</p>}</div>;
}
