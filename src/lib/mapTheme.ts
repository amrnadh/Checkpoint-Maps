import type { Map as MLMap, ExpressionSpecification } from 'maplibre-gl';

/**
 * Map looks (DESIGN.md › Map). The base is OpenFreeMap's Positron vector style, re-inked per theme,
 * plus our own land-use, land-cover and 3D-building layers so the city reads in colour.
 */
export type MapTheme = 'colour' | 'satellite' | 'light';

export const MAP_THEMES: { id: MapTheme; label: string }[] = [
  { id: 'colour', label: 'Colour' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'light', label: 'Light' },
];

const SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_ATTR = 'Imagery © Esri, Maxar, Earthstar Geographics';

interface Palette {
  land: string; water: string; park: string; wood: string; sand: string; farm: string;
  residential: string; commercial: string; industrial: string; hospital: string; school: string; stadium: string;
  motorway: string; motorwayCase: string; major: string; majorCase: string; minor: string; minorCase: string; rail: string;
  label: string; strong: string; halo: string; roadLabel: string;
  buildings: ExpressionSpecification | string; buildingOpacity: number;
}

const COLOUR: Palette = {
  land: '#F4EEE3', water: '#86C5F0', park: '#B5E09A', wood: '#93CE7E', sand: '#F5E3AE', farm: '#E3EDB9',
  residential: '#F0E6D6', commercial: '#F9DED6', industrial: '#E6E0F4', hospital: '#FCD5DD', school: '#FFEDB8', stadium: '#CBEBC0',
  motorway: '#FFB45E', motorwayCase: '#E08A33', major: '#FFE38F', majorCase: '#EEC968', minor: '#FFFFFF', minorCase: '#E3D7C4', rail: '#C3B8D6',
  label: '#6E6152', strong: '#33283D', halo: '#FFFFFF', roadLabel: '#7A6A55',
  // Buildings warm up and turn lilac as they get taller.
  buildings: ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, '#F7E8D6', 12, '#F6D8C4', 30, '#EFC4D2', 70, '#CDBCEE', 150, '#A9B7F0'],
  buildingOpacity: 0.96,
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
  map.addLayer({ id: 'satellite', type: 'raster', source: 'satellite', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 200, 'raster-saturation': 0.12, 'raster-contrast': 0.06 } }, afterBackground);
  map.addLayer({ id: 'cp-landcover', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover', paint: { 'fill-color': COLOUR.park, 'fill-opacity': 0.9 } }, afterBackground);
  map.addLayer({ id: 'cp-landuse', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse', paint: { 'fill-color': COLOUR.residential } }, 'cp-landcover');
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
  const p = theme === 'light' ? LIGHT : COLOUR;

  vis(map, 'satellite', sat);
  vis(map, 'cp-landuse', !sat && theme !== 'light');
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
