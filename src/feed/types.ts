export type FeedItem = {
  id: string;
  type: 'image';
  title: string;
  mediaUrl: string;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
};
export type SlideContext<T> = {
  index: number; total: number; activeIndex: number; active: boolean;
  distanceFromActive: number; shouldLoad: boolean;
  previous: T | undefined; current: T; next: T | undefined;
};
export type MediaState = { loaded: boolean; error: boolean; width: number; height: number };
