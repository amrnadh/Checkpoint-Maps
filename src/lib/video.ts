import type { Video } from './types';

export interface ParsedVideo {
  platform: 'youtube' | 'instagram';
  embedId: string;
  vertical: boolean;
  url: string;
}

/** Accepts the links people actually paste: youtu.be, watch?v=, /shorts/, /live/, instagram /reel/ /p/ /tv/. */
export function parseVideoUrl(raw: string): ParsedVideo | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  const parts = u.pathname.split('/').filter(Boolean);
  if (host === 'youtu.be' && parts[0]) return { platform: 'youtube', embedId: parts[0], vertical: false, url: u.href };
  if (host.endsWith('youtube.com')) {
    const v = u.searchParams.get('v');
    if (v) return { platform: 'youtube', embedId: v, vertical: false, url: u.href };
    if (['shorts', 'live', 'embed'].includes(parts[0]) && parts[1])
      return { platform: 'youtube', embedId: parts[1], vertical: parts[0] === 'shorts', url: u.href };
  }
  if (host === 'instagram.com') {
    const i = parts.findIndex((p) => ['reel', 'reels', 'p', 'tv'].includes(p));
    if (i >= 0 && parts[i + 1]) return { platform: 'instagram', embedId: parts[i + 1], vertical: parts[i] !== 'p', url: u.href };
  }
  return null;
}

export const normHandle = (h: string) => {
  const t = h.trim().replace(/^@+/, '').replace(/\s+/g, '').toLowerCase();
  return t ? `@${t}` : '';
};

export function embedUrl(v: Video) {
  if (v.platform === 'youtube') return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.embedId)}?autoplay=1&rel=0&playsinline=1`;
  if (v.platform === 'instagram') return `https://www.instagram.com/p/${encodeURIComponent(v.embedId)}/embed`;
  return null;
}

export function thumbUrl(v: Video) {
  return v.platform === 'youtube' ? `https://i.ytimg.com/vi/${encodeURIComponent(v.embedId)}/hqdefault.jpg` : null;
}

export const platformLabel = (v: Video) => (v.platform === 'youtube' ? (v.vertical ? 'YouTube Short' : 'YouTube') : v.platform === 'instagram' ? 'Instagram' : 'Demo');
