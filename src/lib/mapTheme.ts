import type { Map as MLMap, ExpressionSpecification } from 'maplibre-gl';

/**
 * Map looks (DESIGN.md › Map). The base is OpenFreeMap's Positron vector style, re-inked per theme,
 * plus our own land-use, land-cover and 3D-building layers so the city reads in colour.
 */
export type MapTheme = 'colour' | 'diorama' | 'satellite' | 'light';

export const MAP_THEMES: { id: MapTheme; label: string }[] = [
  { id: 'colour', label: 'Colour' },
  { id: 'diorama', label: 'Diorama' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'light', label: 'Light' },
];

const SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_ATTR = 'Imagery © Esri, Maxar, Earthstar Geographics';
/** AWS Terrain Tiles (open data, Terrarium encoding) for hill relief in the Diorama style. */
const DEM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const DEM_ATTR = 'Terrain: Mapzen, AWS Terrain Tiles';

interface Palette {
  land: string; water: string; park: string; wood: string; sand: string; farm: string;
  residential: string; commercial: string; industrial: string; hospital: string; school: string; stadium: string;
  motorway: string; motorwayCase: string; major: string; majorCase: string; minor: string; minorCase: string; rail: string;
  label: string; strong: string; halo: string; roadLabel: string;
  buildings: ExpressionSpecification | string; buildingOpacity: number;
}

const COLOUR: Palette = {
  land: '#F2F0EB', water: '#8EC9EE', park: '#B9E0A0', wood: '#97CC84', sand: '#F2E6C2', farm: '#E2EDC0',
  residential: '#EEEBE4', commercial: '#F6E4E8', industrial: '#E6E3F3', hospital: '#F9DCE3', school: '#F4EED2', stadium: '#CBEBC0',
  motorway: '#FFE7A3', motorwayCase: '#E3C676', major: '#FFFFFF', majorCase: '#DCD6C8', minor: '#FFFFFF', minorCase: '#E6E1D6', rail: '#C9C3D8',
  label: '#6B6672', strong: '#2F2A38', halo: '#FFFFFF', roadLabel: '#7A7480',
  // Buildings cool from ivory to lavender-blue as they get taller.
  buildings: ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, '#F6F3EE', 12, '#ECE9F2', 30, '#DEDDF3', 70, '#C9D4F1', 150, '#B2C5EF'],
  buildingOpacity: 0.96,
};

/**
 * Diorama: a tabletop miniature model (moodboard: Agra diorama, tilt-shift relief maps).
 * Sage and wheat land, teal water, clumps of trees, sandstone-to-brick buildings, hill relief.
 */
const DIORAMA: Palette = {
  land: '#CFD6A8', water: '#5F9DB3', park: '#9DBF70', wood: '#7FA65E', sand: '#E8D7A6', farm: '#C5D08E',
  residential: '#D8D7B0', commercial: '#E0D3B0', industrial: '#D2D0B6', hospital: '#DDD0B4', school: '#E2DCB0', stadium: '#9DBF70',
  motorway: '#F7EBCB', motorwayCase: '#A88E62', major: '#F5EBD0', majorCase: '#B6A27A', minor: '#EFE6CC', minorCase: '#C4B48E', rail: '#9C8E73',
  label: '#5E5640', strong: '#3B3424', halo: '#F4EED8', roadLabel: '#6E6448',
  buildings: ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, '#F1EBDD', 10, '#E8E0CC', 25, '#DCD0B6', 60, '#CDB9A0', 120, '#BBA48E'],
  buildingOpacity: 1,
};

const LIGHT: Palette = {
  land: '#F1F1EE', water: '#CDE2EC', park: '#DCEBD2', wood: '#D3E6C7', sand: '#F1EBDB', farm: '#ECEEE2',
  residential: '#F1F1EE', commercial: '#F1F1EE', industrial: '#F1F1EE', hospital: '#F1F1EE', school: '#F1F1EE', stadium: '#DCEBD2',
  motorway: '#FFFFFF', motorwayCase: '#E3E3DE', major: '#FFFFFF', majorCase: '#E3E3DE', minor: '#FAFAF8', minorCase: '#E3E3DE', rail: '#D8D8D2',
  label: '#8A8794', strong: '#3B3644', halo: '#F1F1EE', roadLabel: '#8A8794',
  buildings: '#FFFFFF', buildingOpacity: 0.94,
};

const landuseColor = (p: Palette): ExpressionSpecification => [
  'match', ['get', 'class'],
  ['residential', 'suburb', 'neighbourhood'], p.residential,
  ['commercial', 'retail'], p.commercial,
  ['industrial', 'garages', 'railway', 'quarry'], p.industrial,
  'hospital', p.hospital,
  ['school', 'university', 'college', 'kindergarten', 'library'], p.school,
  ['stadium', 'pitch', 'playground', 'zoo', 'theme_park', 'cemetery'], p.stadium,
  p.land,
];

const landcoverColor = (p: Palette): ExpressionSpecification => [
  'match', ['get', 'class'],
  ['wood', 'forest'], p.wood,
  ['grass', 'park', 'garden'], p.park,
  ['sand', 'beach'], p.sand,
  ['farmland', 'scrub'], p.farm,
  'wetland', p.park,
  p.park,
];

/** Add our own layers once, right after the style loads. */
export function addThemeLayers(map: MLMap) {
  const layers = map.getStyle().layers;
  const afterBackground = layers[1]?.id;
  const firstSymbol = layers.find((l) => l.type === 'symbol')?.id;

  map.addSource('satellite', { type: 'raster', tiles: [SAT_URL], tileSize: 256, maxzoom: 19, attribution: SAT_ATTR });
  map.addSource('dem', { type: 'raster-dem', tiles: [DEM_URL], tileSize: 256, maxzoom: 15, encoding: 'terrarium', attribution: DEM_ATTR });
  map.addImage('trees-dense', treePattern(true), { pixelRatio: 1 });
  map.addImage('trees-sparse', treePattern(false), { pixelRatio: 1 });
  map.addLayer({ id: 'satellite', type: 'raster', source: 'satellite', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 200, 'raster-saturation': 0.12, 'raster-contrast': 0.06 } }, afterBackground);
  map.addLayer({ id: 'cp-landcover', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover', paint: { 'fill-color': COLOUR.park, 'fill-opacity': 0.9 } }, afterBackground);
  map.addLayer({ id: 'cp-landuse', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse', paint: { 'fill-color': COLOUR.residential } }, 'cp-landcover');
  // Diorama extras: hill shading and clumps of trees, hidden in other styles.
  const firstLine = map.getStyle().layers.find((l) => l.type === 'line')?.id;
  map.addLayer({
    id: 'cp-hillshade', type: 'hillshade', source: 'dem', layout: { visibility: 'none' },
    paint: { 'hillshade-exaggeration': 0.9, 'hillshade-shadow-color': '#5C5A38', 'hillshade-highlight-color': '#FFF8E0', 'hillshade-accent-color': '#7A6F45', 'hillshade-illumination-direction': 315 },
  }, firstLine);
  map.addLayer({ id: 'cp-trees-wood', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]], layout: { visibility: 'none' }, paint: { 'fill-pattern': 'trees-dense' } }, firstLine);
  map.addLayer({ id: 'cp-trees-park', type: 'fill', source: 'openmaptiles', 'source-layer': 'park', layout: { visibility: 'none' }, paint: { 'fill-pattern': 'trees-sparse', 'fill-opacity': 0.95 } }, firstLine);
  map.addLayer({ id: 'cp-trees-grass', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['grass', 'park', 'garden']]], layout: { visibility: 'none' }, paint: { 'fill-pattern': 'trees-sparse', 'fill-opacity': 0.8 } }, firstLine);
  map.addLayer(
    {
      id: 'buildings-3d',
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-extrusion-color': '#fff',
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, ['coalesce', ['get', 'render_height'], 9]],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.95,
        'fill-extrusion-vertical-gradient': true,
      },
    },
    firstSymbol,
  );
}

function set(map: MLMap, id: string, prop: string, value: unknown) {
  try {
    map.setPaintProperty(id, prop, value);
  } catch {
    /* layer lacks that property */
  }
}
function vis(map: MLMap, id: string, on: boolean) {
  if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
}

export function applyMapTheme(map: MLMap, theme: MapTheme) {
  const sat = theme === 'satellite';
  const dio = theme === 'diorama';
  const p = theme === 'light' ? LIGHT : dio ? DIORAMA : COLOUR;
  map.setLight(dio
    ? { anchor: 'viewport', color: '#FFF1D6', intensity: 0.42, position: [1.5, 225, 38] }
    : { anchor: 'viewport', color: '#ffffff', intensity: 0.3, position: [1.5, 190, 40] });
  for (const id of ['cp-hillshade', 'cp-trees-wood', 'cp-trees-park', 'cp-trees-grass']) vis(map, id, dio);

  vis(map, 'satellite', sat);
  vis(map, 'cp-landuse', !sat && theme !== 'light');
  set(map, 'cp-landcover', 'fill-opacity', dio ? 1 : 0.9);
  vis(map, 'cp-landcover', !sat);
  vis(map, 'buildings-3d', !sat); // the photo already shows the buildings
  set(map, 'cp-landuse', 'fill-color', landuseColor(p));
  set(map, 'cp-landcover', 'fill-color', landcoverColor(p));
  set(map, 'buildings-3d', 'fill-extrusion-color', sat ? '#FFFFFF' : p.buildings);
  set(map, 'buildings-3d', 'fill-extrusion-opacity', sat ? 0.35 : p.buildingOpacity);

  for (const l of map.getStyle().layers) {
    const id = l.id;
    if (id.startsWith('cp-') || id === 'satellite' || id === 'buildings-3d') continue;
    if (l.type === 'background') set(map, id, 'background-color', sat ? '#2B3A2E' : p.land);
    else if (l.type === 'fill' && /^water/.test(id)) { vis(map, id, !sat); set(map, id, 'fill-color', p.water); }
    else if (l.type === 'fill' && /park/.test(id)) { vis(map, id, !sat); set(map, id, 'fill-color', p.park); }
    else if (l.type === 'fill' && /landcover|landuse/.test(id)) vis(map, id, false); // replaced by cp-landcover / cp-landuse
    else if (l.type === 'fill' && id === 'building') vis(map, id, false);
    else if (l.type === 'fill' && /aeroway|road_area/.test(id)) { vis(map, id, !sat); set(map, id, 'fill-color', p.industrial); }
    else if (l.type === 'line' && /^waterway/.test(id)) { vis(map, id, !sat); set(map, id, 'line-color', p.water); }
    else if (l.type === 'line' && /motorway/.test(id)) {
      set(map, id, 'line-color', /casing/.test(id) ? p.motorwayCase : p.motorway);
      set(map, id, 'line-opacity', sat ? (/casing/.test(id) ? 0 : 0.55) : 1);
    } else if (l.type === 'line' && /major/.test(id)) {
      set(map, id, 'line-color', /casing/.test(id) ? p.majorCase : p.major);
      set(map, id, 'line-opacity', sat ? (/casing/.test(id) ? 0 : 0.45) : 1);
    } else if (l.type === 'line' && /highway|road|pier|aeroway/.test(id)) {
      set(map, id, 'line-color', /casing/.test(id) ? p.minorCase : p.minor);
      set(map, id, 'line-opacity', sat ? (/casing/.test(id) ? 0 : 0.22) : 1);
    } else if (l.type === 'line' && /rail/.test(id)) { set(map, id, 'line-color', p.rail); set(map, id, 'line-opacity', sat ? 0.3 : 1); }
    else if (l.type === 'line' && /boundary/.test(id)) vis(map, id, false);
    else if (l.type === 'symbol') {
      if (/shield|airport|poi/.test(id)) { vis(map, id, false); continue; }
      const strong = /label_(city|town|village|other)/.test(id);
      set(map, id, 'text-color', sat ? '#FFFFFF' : strong ? p.strong : /highway-name/.test(id) ? p.roadLabel : p.label);
      set(map, id, 'text-halo-color', sat ? 'rgba(0,0,0,.65)' : p.halo);
      set(map, id, 'text-halo-width', sat ? 1.4 : 1.2);
    }
  }
}

/**
 * A tileable pattern of tree canopies seen from above at a slight angle:
 * each tree is a rounded crown with a darker shadow to the lower right, like model-railway trees.
 */
function treePattern(dense: boolean): ImageData {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  let seed = dense ? 17 : 29;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const greens = dense ? ['#4F7A3A', '#5D8A41', '#6B9A48', '#3F6A33', '#7AA552'] : ['#5D8A41', '#6E9C4A', '#82AD57', '#4F7A3A', '#9BBE66'];
  const n = dense ? 34 : 16;
  for (let i = 0; i < n; i++) {
    const x = rnd() * size, y = rnd() * size, r = (dense ? 10 : 9) + rnd() * 6;
    // draw wrapped so the pattern tiles seamlessly
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
      const cx = x + dx, cy = y + dy;
      if (cx < -r * 2 || cx > size + r * 2 || cy < -r * 2 || cy > size + r * 2) continue;
      ctx.fillStyle = 'rgba(40, 50, 20, .35)';
      ctx.beginPath(); ctx.ellipse(cx + r * 0.45, cy + r * 0.5, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
      const base = greens[Math.floor(rnd() * greens.length)];
      g.addColorStop(0, '#C9E08F');
      g.addColorStop(0.35, base);
      g.addColorStop(1, '#2F4F25');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  return ctx.getImageData(0, 0, size, size);
}
