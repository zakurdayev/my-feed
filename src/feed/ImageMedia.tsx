import { useEffect, useRef, useState } from 'react';
import type { MediaState } from './types';
const initial: MediaState = { loaded: false, error: false, width: 0, height: 0 };
export function ImageMedia({ src, alt, active, shouldLoad, onStateChange }: {
  src: string; alt: string; active: boolean; shouldLoad: boolean; onStateChange?: (state: MediaState) => void;
}) {
  const [started, setStarted] = useState(shouldLoad);
  const [state, setState] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => { if (shouldLoad) setStarted(true); }, [shouldLoad]);
  useEffect(() => { onStateChange?.(state); }, [state, onStateChange]);
  function ready(element: HTMLImageElement) {
    if (element.naturalWidth) setState({ loaded: true, error: false, width: element.naturalWidth, height: element.naturalHeight });
  }
  useEffect(() => { if (image.current?.complete) ready(image.current); }, [started, attempt]);
  return <div className="image-media" aria-busy={!state.loaded && !state.error}>
    {!state.loaded && !state.error && <span className="media-message" role="status">Loading image…</span>}
    {started && <img ref={image} key={attempt} src={src} alt={alt} decoding="async" loading={shouldLoad ? 'eager' : 'lazy'} fetchPriority={active ? 'high' : 'low'} className={state.loaded ? 'loaded' : ''} onLoad={event => ready(event.currentTarget)} onError={() => setState({ ...initial, error: true })} />}
    {state.error && <div className="media-message" role="alert"><p>Image unavailable</p><button onClick={() => { setState(initial); setAttempt(value => value + 1); }}>Retry</button><p className="muted">Swipe to continue</p></div>}
  </div>;
}
