import type { StickerKey } from './stickers';

/**
 * Bespoke top-down plate illustrations (120×120), one per food category.
 * Style: overhead food photography rendered as soft-gradient vector — no outlines, light from top-left.
 * Gradient ids are prefixed per category so many plates can share one page.
 */

const plateDefs = (p: string) => `
  <radialGradient id="${p}-pl" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".75" stop-color="#F3F1EC"/><stop offset="1" stop-color="#DEDAD2"/></radialGradient>
  <radialGradient id="${p}-well" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".85" stop-color="#F6F4EF"/><stop offset="1" stop-color="#E7E3DB"/></radialGradient>`;

const steel = (p: string, id: string) =>
  `<radialGradient id="${p}-${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FBFCFD"/><stop offset=".55" stop-color="#C9D0D6"/><stop offset=".85" stop-color="#9AA3AB"/><stop offset="1" stop-color="#D5DBE0"/></radialGradient>`;

/** Scatter of small shapes, seeded so the art is identical everywhere. */
function scatter(n: number, cx: number, cy: number, r: number, seed: number, draw: (x: number, y: number, a: number, i: number) => string) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let out = '';
  for (let i = 0; i < n; i++) {
    const t = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r;
    out += draw(+(cx + Math.cos(t) * d).toFixed(1), +(cy + Math.sin(t) * d).toFixed(1), Math.round(rnd() * 180), i);
  }
  return out;
}

const grains = (cx: number, cy: number, r: number, seed: number, fill = '#FFFDF6') =>
  scatter(26, cx, cy, r, seed, (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1" transform="rotate(${a} ${x} ${y})" fill="${fill}" opacity=".9"/>`);

const ART: Record<StickerKey, string> = {
  biryani: `<defs>
    <radialGradient id="bi-cu" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#F2B47A"/><stop offset=".5" stop-color="#C46D33"/><stop offset=".9" stop-color="#8A4120"/><stop offset="1" stop-color="#B0602E"/></radialGradient>
    <radialGradient id="bi-rice" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#FFF8E8"/><stop offset="1" stop-color="#EBD3A6"/></radialGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#bi-cu)"/>
  <circle cx="60" cy="60" r="46" fill="#6E3418"/>
  <circle cx="60" cy="60" r="43" fill="url(#bi-rice)"/>
  <path d="M30 58c8-10 20-6 26-14s16-6 22 2-2 18 8 22-6 16-18 12-14 6-24-2-20-10-14-20z" fill="#F3A83C" opacity=".55"/>
  <path d="M40 78c6-4 12 0 16-4s10-2 12 2" stroke="#E98A2A" stroke-width="5" stroke-linecap="round" fill="none" opacity=".5"/>
  ${grains(60, 60, 38, 7)}
  <ellipse cx="74" cy="48" rx="10" ry="8" fill="#FFFFFF"/><circle cx="75" cy="48" r="5" fill="#F6B73C"/>
  <path d="M38 44c6-8 16-6 16-6s-2 10-10 12-6-6-6-6z" fill="#3E9B57"/><path d="M40 47l12-8" stroke="#2C7A42" stroke-width="1"/>
  <path d="M60 78c4-8 13-6 13-6s-1 8-8 10-5-4-5-4z" fill="#4BA862"/>
  ${scatter(9, 58, 62, 30, 3, (x, y, a) => `<path d="M${x} ${y}q2.5 -2.5 5 0" stroke="#8A4A1E" stroke-width="1.8" fill="none" stroke-linecap="round" transform="rotate(${a} ${x} ${y})"/>`)}`,

  dosa: `<defs>${plateDefs('do')}
    <linearGradient id="do-d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6CF7E"/><stop offset=".45" stop-color="#E3A043"/><stop offset="1" stop-color="#B8701E"/></linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#do-pl)"/><circle cx="60" cy="60" r="46" fill="url(#do-well)"/>
  <g transform="rotate(-35 60 60)">
    <rect x="8" y="48" width="104" height="26" rx="13" fill="url(#do-d)"/>
    <path d="M18 56h84M20 62h80" stroke="#FBE2A8" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
    <path d="M24 68h70" stroke="#A9631A" stroke-width="1.2" opacity=".5"/>
    <ellipse cx="14" cy="61" rx="5" ry="11" fill="#C98329"/>
  </g>
  <circle cx="33" cy="33" r="13" fill="#CFD5DA"/><circle cx="33" cy="33" r="10.5" fill="#F4F1E3"/>
  ${scatter(6, 33, 33, 8, 11, (x, y) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#5E9D48"/>`)}
  <circle cx="87" cy="87" r="13" fill="#CFD5DA"/><circle cx="87" cy="87" r="10.5" fill="#D9482B"/><ellipse cx="84" cy="83" rx="4" ry="2" fill="#F28A6B" opacity=".7"/>`,

  chai: `<defs>${plateDefs('ch')}
    <radialGradient id="ch-t" cx="40%" cy="38%" r="65%"><stop offset="0" stop-color="#DDA875"/><stop offset=".7" stop-color="#B26E36"/><stop offset="1" stop-color="#8C4F22"/></radialGradient>
    <linearGradient id="ch-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2C47A"/><stop offset="1" stop-color="#C98731"/></linearGradient>
  </defs>
  <circle cx="60" cy="60" r="50" fill="url(#ch-pl)"/><circle cx="60" cy="60" r="40" fill="url(#ch-well)"/>
  <circle cx="54" cy="54" r="29" fill="#EAF2F4" opacity=".9"/><circle cx="54" cy="54" r="26.5" fill="url(#ch-t)"/>
  <path d="M38 50a17 17 0 0 1 22-14" stroke="#F3DCB8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
  ${scatter(10, 56, 56, 16, 5, (x, y, _a, i) => `<circle cx="${x}" cy="${y}" r="${(i % 3) + 0.8}" fill="#F0D3A8" opacity=".55"/>`)}
  <rect x="70" y="74" width="34" height="14" rx="4" transform="rotate(-30 87 81)" fill="url(#ch-r)"/>
  <path d="M74 80l24-14" stroke="#F9DCA0" stroke-width="1.4" transform="rotate(0)" opacity=".8"/>`,

  coffee: `<defs>${steel('co', 's1')}${steel('co', 's2')}
    <radialGradient id="co-f" cx="42%" cy="40%" r="60%"><stop offset="0" stop-color="#F1D6AE"/><stop offset=".7" stop-color="#C58A52"/><stop offset="1" stop-color="#8E5A2E"/></radialGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#co-s1)"/><circle cx="60" cy="60" r="44" fill="#B9C1C8"/><circle cx="60" cy="60" r="42" fill="url(#co-s2)"/>
  <circle cx="60" cy="60" r="28" fill="#8F99A2"/><circle cx="60" cy="60" r="25.5" fill="url(#co-f)"/>
  ${scatter(14, 60, 60, 18, 9, (x, y, _a, i) => `<circle cx="${x}" cy="${y}" r="${(i % 4) * 0.6 + 0.8}" fill="#F8E7CC" opacity=".7"/>`)}
  <path d="M30 34a40 40 0 0 1 30-12" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`,

  momo: `<defs>
    <radialGradient id="mo-b" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#EBC98D"/><stop offset=".8" stop-color="#C99A55"/><stop offset="1" stop-color="#A87835"/></radialGradient>
    <radialGradient id="mo-m" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#F7F0E2"/><stop offset="1" stop-color="#E2D4BB"/></radialGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#mo-b)"/>
  <circle cx="60" cy="60" r="50" fill="none" stroke="#B8894A" stroke-width="1.2"/><circle cx="60" cy="60" r="53" fill="none" stroke="#B8894A" stroke-width="1"/>
  <circle cx="60" cy="60" r="46" fill="#D4E6AE"/>
  <path d="M60 18v84M18 60h84M30 30l60 60M90 30l-60 60" stroke="#BFD796" stroke-width="2"/>
  ${[[42, 42], [78, 42], [42, 78], [78, 78], [60, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="url(#mo-m)"/>
    ${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M${x} ${y - 11}q2 5 0 8" stroke="#D8C8A8" stroke-width="1.4" fill="none" transform="rotate(${a} ${x} ${y})"/>`).join('')}
    <circle cx="${x}" cy="${y}" r="2.2" fill="#E6D8BC"/>`).join('')}
  <circle cx="96" cy="96" r="12" fill="#F6F3EC"/><circle cx="96" cy="96" r="9" fill="#D7402A"/>`,

  icecream: `<defs>${plateDefs('ic')}
    <radialGradient id="ic-p" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FFD3E0"/><stop offset="1" stop-color="#E98AAB"/></radialGradient>
    <radialGradient id="ic-v" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FFFBF0"/><stop offset="1" stop-color="#EFDDBC"/></radialGradient>
    <radialGradient id="ic-g" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#E4F1C4"/><stop offset="1" stop-color="#A9C778"/></radialGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#ic-pl)"/><circle cx="60" cy="60" r="44" fill="#F4EEF1"/>
  <circle cx="60" cy="60" r="40" fill="#F7D7E2" opacity=".7"/>
  <circle cx="48" cy="50" r="16" fill="url(#ic-p)"/><circle cx="72" cy="52" r="15" fill="url(#ic-v)"/><circle cx="60" cy="74" r="15" fill="url(#ic-g)"/>
  <path d="M34 56c10 6 18-8 28-2s14 14 24 6" stroke="#C2245E" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".85"/>
  ${scatter(12, 60, 60, 26, 21, (x, y, a) => `<rect x="${x}" y="${y}" width="4" height="1.6" rx=".8" fill="#7FAE45" transform="rotate(${a} ${x} ${y})"/>`)}
  <circle cx="50" cy="44" r="3" fill="#FFFFFF" opacity=".6"/>`,

  bakery: `<defs>${plateDefs('ba')}
    <radialGradient id="ba-b" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#F8D294"/><stop offset=".6" stop-color="#DE9A45"/><stop offset="1" stop-color="#AF6623"/></radialGradient>
    <linearGradient id="ba-p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F9DCA4"/><stop offset="1" stop-color="#D2913F"/></linearGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#ba-pl)"/><circle cx="60" cy="60" r="46" fill="url(#ba-well)"/>
  <circle cx="52" cy="54" r="26" fill="url(#ba-b)"/>
  <path d="M40 46q12 8 24 0M38 58q14 8 28 0" stroke="#F9DDA4" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>
  <ellipse cx="45" cy="44" rx="8" ry="4" fill="#FFFFFF" opacity=".35"/>
  <path d="M70 70l22 4-8 20z" fill="url(#ba-p)"/><path d="M74 74l14 3M76 80l10 2M79 86l5 1" stroke="#F8E3B8" stroke-width="1.4" stroke-linecap="round"/>`,

  burger: `<defs>${plateDefs('bu')}
    <radialGradient id="bu-b" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#F7C878"/><stop offset=".65" stop-color="#D98B32"/><stop offset="1" stop-color="#A65F1C"/></radialGradient>
  </defs>
  <circle cx="60" cy="60" r="56" fill="url(#bu-pl)"/><circle cx="60" cy="60" r="46" fill="url(#bu-well)"/>
  <circle cx="52" cy="54" r="31" fill="#6DB04C"/>
  <path d="M22 54a30 30 0 0 0 4 14" stroke="#8CCB5F" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="52" cy="54" r="27" fill="url(#bu-b)"/>
  ${scatter(14, 52, 52, 20, 31, (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="1.9" ry="1" fill="#FFF3D6" transform="rotate(${a} ${x} ${y})"/>`)}
  <ellipse cx="44" cy="42" rx="9" ry="4" fill="#FFFFFF" opacity=".35"/>
  ${[0, 1, 2, 3, 4].map((i) => `<rect x="${80 + i * 4}" y="${68 + (i % 2) * 3}" width="4.2" height="24" rx="2" fill="#F6C443" transform="rotate(${-12 + i * 6} ${82 + i * 4} 80)"/>`).join('')}`,

  thali: `<defs>${steel('th', 's1')}${steel('th', 'k')}</defs>
  <circle cx="60" cy="60" r="56" fill="url(#th-s1)"/><circle cx="60" cy="60" r="49" fill="#D9DEE2"/>
  ${[
    [60, 25, '#E9B43F'], [91, 45, '#C9682E'], [86, 82, '#5C8A3A'], [52, 95, '#FAF7EE'], [26, 72, '#EED9B0'],
  ].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="13" fill="url(#th-k)"/><circle cx="${x}" cy="${y}" r="10" fill="${c}"/><ellipse cx="${+x - 3}" cy="${+y - 3}" rx="3.5" ry="1.8" fill="#FFFFFF" opacity=".35"/>`).join('')}
  <circle cx="54" cy="56" r="16" fill="#FFFDF7"/>${grains(54, 56, 13, 17, '#EFE9DA')}
  <circle cx="30" cy="40" r="13" fill="#E8C58E"/><circle cx="30" cy="40" r="13" fill="none" stroke="#C99B5A" stroke-dasharray="2 3" stroke-width="1"/>`,

  cart: `<defs>
    <radialGradient id="ca-l" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#8FC46B"/><stop offset=".85" stop-color="#5E9842"/><stop offset="1" stop-color="#4C7F35"/></radialGradient>
    <radialGradient id="ca-p" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#F8D795"/><stop offset=".7" stop-color="#DDA14D"/><stop offset="1" stop-color="#B7792C"/></radialGradient>
  </defs>
  <circle cx="60" cy="60" r="55" fill="url(#ca-l)"/>
  ${[0, 30, 60, 90, 120, 150].map((a) => `<path d="M60 8v104" stroke="#7DB25A" stroke-width="1.2" transform="rotate(${a} 60 60)" opacity=".7"/>`).join('')}
  ${[[42, 40], [70, 34], [86, 58], [38, 68], [64, 62], [56, 88], [82, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="url(#ca-p)"/><circle cx="${x + 1}" cy="${y + 1}" r="5" fill="#6B4A2A"/><circle cx="${x + 1}" cy="${y + 1}" r="3.2" fill="#C89A5A"/>`).join('')}
  ${scatter(22, 60, 62, 36, 41, (x, y, a) => `<rect x="${x}" y="${y}" width="5" height="1.2" rx=".6" fill="#F6C83E" transform="rotate(${a} ${x} ${y})"/>`)}
  ${scatter(8, 60, 60, 34, 43, (x, y) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#2F7A2F"/>`)}`,

  cafe: `<defs>${plateDefs('cf')}
    <radialGradient id="cf-c" cx="40%" cy="38%" r="62%"><stop offset="0" stop-color="#C48A58"/><stop offset=".8" stop-color="#8A5630"/><stop offset="1" stop-color="#6B3F20"/></radialGradient>
  </defs>
  <circle cx="60" cy="60" r="52" fill="url(#cf-pl)"/><circle cx="60" cy="60" r="42" fill="url(#cf-well)"/>
  <path d="M86 52c12 0 14 16 0 16" stroke="#F1EEE8" stroke-width="7" fill="none" stroke-linecap="round"/>
  <circle cx="58" cy="60" r="30" fill="#FFFFFF"/><circle cx="58" cy="60" r="30" fill="none" stroke="#E6E2DA" stroke-width="1.4"/>
  <circle cx="58" cy="60" r="25" fill="url(#cf-c)"/>
  <path d="M58 74c-12-7-14-14-10-18 3-3 7-2 10 2 3-4 7-5 10-2 4 4 2 11-10 18z" fill="#F6E8D4"/>
  <path d="M58 70v-12" stroke="#C99A6E" stroke-width="1.4" opacity=".6"/>
  <rect x="22" y="80" width="30" height="4" rx="2" fill="#C3C9CE" transform="rotate(-38 37 82)"/>`,

  noodles: `<defs>
    <radialGradient id="no-b" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#3B3B3F"/><stop offset="1" stop-color="#151517"/></radialGradient>
    <radialGradient id="no-n" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#F6D58C"/><stop offset="1" stop-color="#D9A24A"/></radialGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#no-b)"/><circle cx="60" cy="60" r="45" fill="#B8322A"/><circle cx="60" cy="60" r="42" fill="url(#no-n)"/>
  ${scatter(16, 60, 60, 30, 51, (x, y, a) => `<path d="M${x} ${y}c6 -6 12 6 18 0" stroke="#F8E2A6" stroke-width="2.2" fill="none" stroke-linecap="round" transform="rotate(${a} ${x} ${y})" opacity=".85"/>`)}
  ${scatter(7, 60, 60, 30, 53, (x, y, a) => `<rect x="${x}" y="${y}" width="9" height="2.2" rx="1" fill="#F08A2E" transform="rotate(${a} ${x} ${y})"/>`)}
  ${scatter(7, 60, 60, 30, 57, (x, y, a) => `<rect x="${x}" y="${y}" width="8" height="2.6" rx="1.3" fill="#4E9B3C" transform="rotate(${a} ${x} ${y})"/>`)}
  ${scatter(6, 60, 60, 28, 59, (x, y) => `<circle cx="${x}" cy="${y}" r="2.4" fill="none" stroke="#7FC25A" stroke-width="1.2"/>`)}
  <path d="M74 6L52 84" stroke="#C99561" stroke-width="4" stroke-linecap="round"/><path d="M86 10L60 88" stroke="#B8844F" stroke-width="4" stroke-linecap="round"/>`,
};

const cache = new Map<StickerKey, string>();
export function plateSvg(k: StickerKey) {
  let s = cache.get(k);
  if (!s) {
    s = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${ART[k]}</svg>`;
    cache.set(k, s);
  }
  return s;
}
