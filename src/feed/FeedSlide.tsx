import type { ReactNode } from 'react';
export function FeedSlide({ index, active, children }: { index: number; active: boolean; children: ReactNode }) {
  return <section className="feed-slide" data-index={index} aria-label={`Item ${index + 1}`} aria-current={active ? 'true' : undefined}>{children}</section>;
}
