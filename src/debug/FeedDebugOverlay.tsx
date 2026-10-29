import type { MediaState, SlideContext } from '../feed/types';
export function FeedDebugOverlay<T>({ id, context, media, online, source }: { id: string; context: SlideContext<T>; media: MediaState; online: boolean; source?: 'remote' | 'local' }) {
  return <pre className="debug-overlay">{`index: ${context.index + 1} / ${context.total}\nid: ${id}\nsource: ${source ?? 'local'}\nactive: ${context.active}\ndistance: ${context.distanceFromActive}\nloaded: ${media.loaded}\nerror: ${media.error}\nnatural: ${media.width}×${media.height}\nactiveIndex: ${context.activeIndex}\nonline: ${online}`}</pre>;
}
