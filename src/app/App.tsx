import { useEffect, useRef, useState } from 'react';
import { App as NativeApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { DiscoveryFeed } from '../feed/DiscoveryFeed';
import { ImageMedia } from '../feed/ImageMedia';
import type { FeedItem, MediaState, SlideContext } from '../feed/types';
import { mockModels } from '../data/mockModels';
import { FeedDebugOverlay } from '../debug/FeedDebugOverlay';
import { parseCollection, replaceCollection, type FeedCollection } from '../import/collections';
import { loadCollections, saveCollections } from '../import/storage';
function ModelSlide({ item, context, debug, online }: { item: FeedItem; context: SlideContext<FeedItem>; debug: boolean; online: boolean }) {
  const [media, setMedia] = useState<MediaState>({ loaded: false, error: false, width: 0, height: 0 });
  return <><ImageMedia key={item.mediaUrl} src={item.mediaUrl} alt={item.title} active={context.active} shouldLoad={context.shouldLoad} onStateChange={setMedia} /><div className="name-overlay">{item.title}</div>{debug && <FeedDebugOverlay id={item.id} source={item.mediaUrl.startsWith('https://') ? 'remote' : 'local'} context={context} media={media} online={online} />}</>;
}
const key = (item: FeedItem) => item.id;
const brokenItems = mockModels.items.map((item, index) => index === 2 ? { ...item, mediaUrl: '/media/images/intentionally-missing.jpg' } : item);
export function App() {
  const [open, setOpen] = useState<FeedCollection | null>(null);
  const [feeds, setFeeds] = useState<FeedCollection[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const picker = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let mounted = true;
    loadCollections().then(saved => { if (mounted) { setFeeds(saved); setReady(true); } })
      .catch(() => { if (mounted) setMessage('Could not load saved collections. Restart the app to retry.'); });
    return () => { mounted = false; };
  }, []);
  async function importFile(file: File) {
    setBusy(true); setMessage('');
    try {
      const { feed, skipped } = parseCollection(await file.text());
      const next = replaceCollection(feeds, feed);
      await saveCollections(next);
      setFeeds(next);
      setMessage(`${feed.items.length} items imported, ${skipped} skipped`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not import collection'); }
    finally { setBusy(false); }
  }
  async function removeCollection(id: string) {
    setBusy(true);
    try {
      const next = feeds.filter(feed => feed.collection.id !== id);
      await saveCollections(next); setFeeds(next); setMessage('Collection removed');
    } catch { setMessage('Could not remove collection'); }
    finally { setBusy(false); }
  }
  const [debug, setDebug] = useState(false);
  const [broken, setBroken] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener('backButton', () => { if (open) setOpen(null); else void NativeApp.exitApp(); });
    return () => { void listener.then(handle => handle.remove()); };
  }, [open]);
  if (!open) return <main className="home"><h1>My feed</h1><button className="collection" onClick={() => setOpen({ ...mockModels, version: 1 })}>Models <span>7 images →</span></button>
    <section className="imports"><h2>Imported feeds</h2>
      <input ref={picker} type="file" accept="application/json,.json" hidden aria-label="Collection JSON file" onChange={event => {
        const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) void importFile(file);
      }} />
      <button disabled={!ready || busy} onClick={() => picker.current?.click()}>+ Import collection</button>
      {busy && <p role="status">Working…</p>}
      {message && <p role="status">{message}</p>}
      {feeds.map(feed => <div className="imported-collection" key={feed.collection.id}>
        <button className="imported-collection-open" onClick={() => setOpen(feed)}>
          <span className="imported-collection-title" title={feed.collection.title}>{feed.collection.title}</span>
          <span className="imported-collection-count">{feed.items.length} images</span>
        </button>
        <button className="imported-collection-remove" disabled={busy} aria-label={`Remove collection ${feed.collection.title}`} onClick={() => void removeCollection(feed.collection.id)}>Remove</button>
      </div>)}
    </section>
    <label><input type="checkbox" checked={debug} onChange={e => setDebug(e.target.checked)} /> Debug overlay</label><label><input type="checkbox" checked={broken} onChange={e => setBroken(e.target.checked)} /> Test broken image (Models item 3)</label><small>0.1.1 · Image feed experiment</small></main>;
  return <main><DiscoveryFeed key={open.collection.id} items={open.collection.id === 'models' && broken ? brokenItems : open.items} getItemKey={key} renderItem={(item, context) => <ModelSlide item={item} context={context} debug={debug} online={online} />} /><div className="toolbar"><button onClick={() => setOpen(null)} aria-label="Back to collections">← {open.collection.title}</button><button onClick={() => setDebug(value => !value)} aria-pressed={debug}>Debug {debug ? 'on' : 'off'}</button></div></main>;
}
