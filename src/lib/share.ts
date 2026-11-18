import { RATING_LABEL, type GameState } from './game';
import { stickerMeta, stickerSvg, tiltFor, type StickerKey } from './stickers';
import type { CheckIn, Spot } from './types';

/**
 * Share images are drawn on the phone. They never include a map, address or coordinates.
 * Look: the sticker is the hero, on white, with the spot name in the display face (DESIGN.md).
 */
const W = 1080;
const H = 1350;
const C = { paper: '#FFFFFF', ground: '#F3F4EF', ink: '#16222C', steel: '#64717D', leaf: '#1E7A4C', turmeric: '#F2B01E' };
const DISPLAY = 'Caprasimo, Georgia, serif';
const BODY = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

async function ensureFonts() {
  try {
    await document.fonts.load(`400 80px ${DISPLAY}`);
  } catch {
    /* falls back to Georgia */
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  }
  return lines;
}

function loadSvg(k: StickerKey): Promise<HTMLImageElement> {
  const svg = stickerSvg(k).replace('<svg ', '<svg width="256" height="256" ');
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** A sticker as it appears on the map: tinted disc, thick white rim, turmeric ring, soft shadow, slight tilt. */
async function drawSticker(ctx: CanvasRenderingContext2D, k: StickerKey, cx: number, cy: number, r: number, tiltDeg: number) {
  const img = await loadSvg(k);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((tiltDeg * Math.PI) / 180);
  ctx.shadowColor = 'rgba(22,34,44,.22)';
  ctx.shadowBlur = r * 0.25;
  ctx.shadowOffsetY = r * 0.1;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = r * 0.06;
  ctx.strokeStyle = C.turmeric;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  ctx.fillStyle = stickerMeta(k).tint;
  ctx.fill();
  const s = r * 1.5;
  ctx.drawImage(img, -s / 2, -s / 2, s, s);
  ctx.restore();
}

export interface ShareInput {
  kind: 'checkin' | 'progress';
  state: GameState;
  spot?: Spot;
  checkin?: CheckIn;
  sticker?: StickerKey;
  number?: number | null;
  stickers?: StickerKey[];
}

export async function drawShareCard(input: ShareInput): Promise<Blob> {
  await ensureFonts();
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d')!;
  const pad = 88;
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.ground;
  ctx.beginPath();
  ctx.ellipse(W / 2, 560, 500, 360, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'center';

  if (input.kind === 'checkin' && input.spot && input.checkin && input.sticker) {
    const { spot, checkin } = input;
    if (checkin.photo) {
      const bmp = await createImageBitmap(checkin.photo);
      const r = 300;
      ctx.save();
      ctx.translate(W / 2 - 70, 520);
      ctx.rotate(-0.05);
      ctx.shadowColor = 'rgba(22,34,44,.2)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 14;
      ctx.fillStyle = '#fff';
      ctx.fillRect(-r - 18, -r - 18, r * 2 + 36, r * 2 + 36);
      ctx.shadowColor = 'transparent';
      const side = Math.min(bmp.width, bmp.height);
      ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, -r, -r, r * 2, r * 2);
      ctx.restore();
      bmp.close();
      await drawSticker(ctx, input.sticker, W / 2 + 250, 750, 150, tiltFor(spot.id));
    } else {
      await drawSticker(ctx, input.sticker, W / 2, 540, 270, tiltFor(spot.id));
    }
    ctx.fillStyle = C.ink;
    ctx.font = `400 84px ${DISPLAY}`;
    let y = 990;
    for (const l of wrap(ctx, spot.name, W - pad * 2, 2)) {
      ctx.fillText(l, W / 2, y);
      y += 92;
    }
    ctx.fillStyle = C.steel;
    ctx.font = `500 38px ${BODY}`;
    const sub = [checkin.dishes.slice(0, 2).join(' and '), RATING_LABEL[checkin.rating]].filter(Boolean).join('. ');
    ctx.fillText(wrap(ctx, sub, W - pad * 2, 1)[0] ?? '', W / 2, y + 2);
    ctx.fillStyle = C.leaf;
    ctx.font = `700 34px ${BODY}`;
    ctx.fillText(input.number ? `No. ${input.number} in my CheckPoint collection` : 'From my CheckPoint diary', W / 2, H - 70);
  } else {
    const list = (input.stickers ?? []).slice(-7);
    const spots: [number, number, number][] = [
      [540, 560, 200], [300, 430, 120], [790, 420, 130], [260, 760, 110], [830, 760, 120], [520, 300, 90], [560, 860, 90],
    ];
    if (!list.length) list.push('thali');
    for (let i = list.length - 1; i >= 0; i--) {
      const [x, y, r] = spots[i];
      await drawSticker(ctx, list[list.length - 1 - i], x, y, r, (i % 2 ? 1 : -1) * (4 + i));
    }
    ctx.fillStyle = C.ink;
    ctx.font = `400 120px ${DISPLAY}`;
    ctx.fillText(`${input.state.spotsVisited} ${input.state.spotsVisited === 1 ? 'spot' : 'spots'}`, W / 2, 1110);
    ctx.fillStyle = C.steel;
    ctx.font = `500 40px ${BODY}`;
    ctx.fillText(`${input.state.dishes.length} dishes, ${input.state.seenOn} from creators’ videos`, W / 2, 1180);
    ctx.fillStyle = C.leaf;
    ctx.font = `700 34px ${BODY}`;
    ctx.fillText('My CheckPoint collection', W / 2, H - 70);
  }

  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('Could not draw image'))), 'image/png'));
}

export async function shareOrDownload(blob: Blob, title: string) {
  const file = new File([blob], 'checkpoint.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'checkpoint.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return 'downloaded';
}
