const SWITZERLAND_BOUNDS = [
  [5.8, 45.6],
  [10.6, 47.99],
];

const SWISSTOPO_TILE_BOUNDS = [
  SWITZERLAND_BOUNDS[0][0],
  SWITZERLAND_BOUNDS[0][1],
  SWITZERLAND_BOUNDS[1][0],
  SWITZERLAND_BOUNDS[1][1],
];

const stationFeatures = STATIONS.map(st => ({
  type: 'Feature',
  id: st.id,
  properties: {
    id: st.id,
    name: st.name,
    canton: st.canton,
    alt: st.alt,
  },
  geometry: {
    type: 'Point',
    coordinates: [st.lng, st.lat],
  },
}));

const stationCollection = {
  type: 'FeatureCollection',
  features: stationFeatures,
};

const map = new maplibregl.Map({
  container: 'map',
  center: [8.2, 46.8],
  zoom: 7.0,
  minZoom: 7.0,
  maxZoom: 13,
  pitch: 18,
  bearing: 0,
  maxBounds: [
    [3, 43.8],
    [13.0, 48.8],
  ],
  attributionControl: false,
  style: {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      swissRelief: {
        type: 'raster',
        tiles: [
          'https://wmts20.geo.admin.ch/1.0.0/ch.swisstopo.swissalti3d-reliefschattierung/default/current/3857/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        minzoom: 6.6,
        maxzoom: 13,
        bounds: SWISSTOPO_TILE_BOUNDS,
        attribution: '&copy; <a href="https://www.swisstopo.admin.ch/">swisstopo</a>',
      },
      stations: {
        type: 'geojson',
        data: stationCollection,
        promoteId: 'id',
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#babcc6',
        },
      },
      {
        id: 'swiss-relief',
        type: 'raster',
        source: 'swissRelief',
        paint: {
          'raster-saturation': -1,
          'raster-contrast': 0.24,
          'raster-brightness-min': 0.06,
          'raster-brightness-max': 0.92,
          'raster-opacity': 0.42,
        },
      },
      {
        id: 'station-halo',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            24,
            16,
          ],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#c0392b',
            '#1a6fc4',
          ],
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.23,
            0.18,
          ],
          'circle-blur': 0.25,
        },
      },
      {
        id: 'station-point',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            11,
            7,
          ],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#c0392b',
            '#1a6fc4',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3,
            2,
          ],
          'circle-pitch-scale': 'viewport',
          'circle-pitch-alignment': 'viewport',
        },
      },
      {
        id: 'station-hit-area',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-radius': 28,
          'circle-color': '#000000',
          'circle-opacity': 0.01,
          'circle-pitch-scale': 'viewport',
          'circle-pitch-alignment': 'viewport',
        },
      },
    ],
  },
});

map.addControl(
  new maplibregl.NavigationControl({
    showCompass: true,
    showZoom: true,
    visualizePitch: true,
  }),
  'top-right'
);
map.addControl(new maplibregl.AttributionControl({ compact: true }), 'top-left');

let selectedStationId = null;
let compareStationId = null;
let stationMarkerLayer = null;
const stationMarkerElements = {};
let stationLayerEventsBound = false;
let lastStationClickEvent = null;
const stationPopup = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false,
  offset: 18,
});

addStationDomMarkers();
fitSwitzerland();
applyAtmosphere();
bindStationLayerEvents();

let mapInitialized = false;
map.on('load', initializeMapOnce);
map.on('style.load', initializeMapOnce);
map.on('idle', initializeMapOnce);
requestAnimationFrame(initializeMapOnce);
setTimeout(initializeMapOnce, 250);
setTimeout(initializeMapOnce, 1000);

function initializeMapOnce() {
  if (mapInitialized) return;

  try {
    initializeMap();
    mapInitialized = true;
  } catch (error) {
    setTimeout(initializeMapOnce, 500);
  }
}

function initializeMap() {
  addStationLayers();
}

function addStationLayers() {
  if (map.getLayer('station-point')) {
    bindStationLayerEvents();
    return;
  }

  if (!map.getSource('stations')) {
    map.addSource('stations', {
      type: 'geojson',
      data: stationCollection,
      promoteId: 'id',
    });
  }

  map.addLayer({
    id: 'station-halo',
    type: 'circle',
    source: 'stations',
    paint: {
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        24,
        16,
      ],
      'circle-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#c0392b',
        '#1a6fc4',
      ],
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        0.23,
        0.18,
      ],
      'circle-blur': 0.25,
    },
  });

  map.addLayer({
    id: 'station-point',
    type: 'circle',
    source: 'stations',
    paint: {
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        11,
        7,
      ],
      'circle-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#c0392b',
        '#1a6fc4',
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        3,
        2,
      ],
      'circle-pitch-scale': 'viewport',
      'circle-pitch-alignment': 'viewport',
    },
  });

  map.addLayer({
    id: 'station-hit-area',
    type: 'circle',
    source: 'stations',
    paint: {
      'circle-radius': 28,
      'circle-color': '#000000',
      'circle-opacity': 0.01,
      'circle-pitch-scale': 'viewport',
      'circle-pitch-alignment': 'viewport',
    },
  });

  bindStationLayerEvents();
}

function bindStationLayerEvents() {
  if (stationLayerEventsBound) return;

  if (!map.getLayer('station-point')) {
    setTimeout(bindStationLayerEvents, 300);
    return;
  }

  ['station-hit-area', 'station-point', 'station-halo'].forEach(layerId => {
    map.on('click', layerId, handleStationClick);
    map.on('contextmenu', layerId, handleStationContextMenu);
    map.on('mouseenter', layerId, handleStationEnter);
    map.on('mouseleave', layerId, handleStationLeave);
  });

  stationLayerEventsBound = true;
}

function handleStationClick(e) {
  if (e.originalEvent && e.originalEvent === lastStationClickEvent) return;
  lastStationClickEvent = e.originalEvent || null;
  setTimeout(() => {
    if (lastStationClickEvent === e.originalEvent) lastStationClickEvent = null;
  }, 0);

  e.originalEvent?.preventDefault();
  e.originalEvent?.stopPropagation();

  const stationId = e.features[0].properties.id;
  const station = STATIONS.find(st => st.id === stationId);
  if (station) {
    stationPopup.remove();
    selectStation(station);
  }
}

function handleStationContextMenu(e) {
  e.originalEvent?.preventDefault();
  const stationId = e.features[0].properties.id;
  const station = STATIONS.find(st => st.id === stationId);
  if (station) {
    showRecordsPopup(st, e.lngLat);
  }
}

function handleStationEnter(e) {
  map.getCanvas().style.cursor = 'pointer';
  const feature = e.features[0];
  stationPopup
    .setLngLat(feature.geometry.coordinates)
    .setHTML(`<b>${feature.properties.name}</b><br>${feature.properties.alt} m - ${feature.properties.canton}<br><span>Right-click for records</span>`)
    .addTo(map);
}

function handleStationLeave() {
  map.getCanvas().style.cursor = '';
  stationPopup.remove();
}

function fitSwitzerland() {
  const compactLayout = window.matchMedia('(max-width: 850px)').matches;

  if (!compactLayout) {
    map.jumpTo({
      center: [8.0, 46.35],
      zoom: 3.18,
      pitch: 18,
      bearing: 0,
    });
    return;
  }

  map.fitBounds(SWITZERLAND_BOUNDS, {
    padding: {
      top: Math.min(window.innerHeight * 0.48, 390),
      right: 20,
      bottom: 100,
      left: 20,
    },
    pitch: 10,
    bearing: 0,
    duration: 0,
  });
}

function applyAtmosphere() {
  if (typeof map.setFog === 'function') {
    map.setFog({
      color: 'rgba(239, 244, 246, 0.9)',
      'high-color': 'rgba(219, 230, 237, 0.55)',
      'horizon-blend': 0.08,
      'space-color': '#eef2f4',
      'star-intensity': 0,
    });
  }
}

function selectStation(st, options = {}) {
  if (APP_STATE.compareMode) {
    if (APP_STATE.activeStation?.id === st.id) return;

    if (compareStationId) {
      stationMarkerElements[compareStationId]?.classList.remove('compare');
      setStationFeatureState(compareStationId, false);
    }
    compareStationId = st.id;
    stationMarkerElements[compareStationId]?.classList.add('compare');
    setStationFeatureState(compareStationId, true);
    window.setCompareStation?.(st);
    return;
  }

  if (compareStationId) {
    stationMarkerElements[compareStationId]?.classList.remove('compare');
    setStationFeatureState(compareStationId, false);
    compareStationId = null;
  }

  if (selectedStationId) {
    setStationFeatureState(selectedStationId, false);
    stationMarkerElements[selectedStationId]?.classList.remove('active');
  }

  selectedStationId = st.id;
  setStationFeatureState(selectedStationId, true);
  stationMarkerElements[selectedStationId]?.classList.add('active');
  updateStationMarkerStyles();

  beginStationSelection(st);
  updateStationMarkerStyles();

  if (!options.skipCamera) {
    const stationCamera = {
      center: [st.lng, st.lat],
      zoom: Math.max(map.getZoom(), 10.15),
      pitch: 32,
      bearing: 0,
    };

    map.stop();
    map.easeTo({
      ...stationCamera,
      duration: 900,
      easing: t => 1 - (1 - t) ** 3,
      essential: true,
    });

    setTimeout(() => {
      if (APP_STATE.activeStation?.id === st.id && map.getZoom() < 9.35) {
        map.jumpTo(stationCamera);
      }
    }, 1050);
  }

  loadAndDraw(st.id);
}

window.clearCompareMarker = () => {
  if (compareStationId) {
    stationMarkerElements[compareStationId]?.classList.remove('compare');
    setStationFeatureState(compareStationId, false);
    compareStationId = null;
  }
};

function setStationFeatureState(id, selected) {
  if (!map.getSource('stations')) return;

  try {
    map.setFeatureState({ source: 'stations', id }, { selected });
  } catch (error) {
    console.warn('Station feature state could not be updated.', error);
  }
}

window.addEventListener('resize', () => {
  map.resize();
  updateStationDomMarkers();
  if (!APP_STATE.activeStation) fitSwitzerland();
});

function addStationDomMarkers() {
  const container = document.getElementById('map-container');
  stationMarkerLayer = document.createElement('div');
  stationMarkerLayer.id = 'station-marker-layer';
  container.appendChild(stationMarkerLayer);

  STATIONS.forEach(st => {
    const marker = document.createElement('button');
    marker.className = 'station-dom-marker';
    marker.type = 'button';
    marker.title = `${st.name} - ${st.alt} m - ${st.canton}`;
    marker.setAttribute('aria-label', `Select ${st.name} station`);
    marker.addEventListener('click', event => {
      event.stopPropagation();
      selectStation(st);
    });
    marker.addEventListener('contextmenu', event => {
      event.preventDefault();
      event.stopPropagation();
      showRecordsPopup(st);
    });
    stationMarkerLayer.appendChild(marker);
    stationMarkerElements[st.id] = marker;
  });

  updateStationDomMarkers();
  updateStationMarkerStyles();
  map.on('move', updateStationDomMarkers);
  map.on('zoom', updateStationDomMarkers);
  map.on('rotate', updateStationDomMarkers);
  map.on('pitch', updateStationDomMarkers);
}

function updateStationDomMarkers() {
  if (!stationMarkerLayer) return;

  const width = stationMarkerLayer.clientWidth;
  const height = stationMarkerLayer.clientHeight;

  STATIONS.forEach(st => {
    const marker = stationMarkerElements[st.id];
    const point = map.project([st.lng, st.lat]);
    const visible =
      point.x > -40 &&
      point.x < width + 40 &&
      point.y > -40 &&
      point.y < height + 40 &&
      map.getZoom() >= 6.8;

    marker.style.display = visible ? 'block' : 'none';
    marker.style.left = `${point.x}px`;
    marker.style.top = `${point.y}px`;
  });
}

function updateStationMarkerStyles() {
  if (!stationMarkerLayer) return;

  const mode = APP_STATE.markerMode || 'default';
  const metricKey = APP_STATE.activeMetric || 'temp';

  STATIONS.forEach(st => {
    const marker = stationMarkerElements[st.id];
    if (!marker) return;

    const style = markerStyleForStation(st, mode, metricKey);
    marker.style.setProperty('--marker-size', `${style.size}px`);
    marker.style.setProperty('--marker-color', style.color);
    marker.style.setProperty('--marker-ring-size', `${style.ringSize}px`);
    marker.style.setProperty('--marker-ring-color', style.ringColor);
    marker.style.setProperty('--marker-opacity', style.opacity);
    marker.classList.toggle('story-pulse', style.pulse);
    marker.title = style.title;
  });
}

function markerStyleForStation(st, mode, metricKey) {
  const baseTitle = `${st.name} - ${st.alt} m - ${st.canton}`;
  const base = {
    size: 18,
    color: '#1a6fc4',
    ringSize: 5,
    ringColor: 'rgba(26,111,196,0.18)',
    opacity: 1,
    pulse: !APP_STATE.activeStation && !APP_STATE.storyCollapsed,
    title: baseTitle,
  };

  if (mode === 'default') return base;

  const rows = DATA_CACHE[`${st.id}_y`];
  if (!rows) {
    return {
      ...base,
      size: 16,
      color: '#8fa1b2',
      ringColor: 'rgba(143,161,178,0.12)',
      opacity: 0.62,
      pulse: false,
      title: `${baseTitle} - loading yearly data`,
    };
  }

  const series = extractSeries(rows, metricKey, 'y');
  if (series.length < 3) {
    return {
      ...base,
      color: '#8fa1b2',
      ringColor: 'rgba(143,161,178,0.14)',
      opacity: 0.7,
      pulse: false,
      title: `${baseTitle} - no ${METRICS[metricKey].label.toLowerCase()} series`,
    };
  }

  if (mode === 'trend') {
    const slope = linearSlope(series);
    const strength = trendStrength(slope, metricKey);
    const color = signedMetricColor(metricKey, slope, strength);
    const direction = slope >= 0 ? '+' : '';

    return {
      ...base,
      size: 17 + strength * 13,
      color,
      ringSize: 5 + strength * 7,
      ringColor: rgbaFromHex(color, 0.16 + strength * 0.2),
      opacity: 0.82 + strength * 0.18,
      pulse: false,
      title: `${baseTitle} - trend ${direction}${slope.toFixed(metricKey === 'temp' ? 3 : 2)} ${METRICS[metricKey].unit}/year`,
    };
  }

  if (mode === 'yearAnomaly') {
    const year = APP_STATE.activeYear;
    const point = series.find(candidate => candidate.year === year);
    if (!point) {
      return {
        ...base,
        color: '#8fa1b2',
        ringColor: 'rgba(143,161,178,0.12)',
        opacity: 0.55,
        pulse: false,
        title: `${baseTitle} - no value for ${year}`,
      };
    }

    const average = mean(series.map(candidate => candidate.value));
    const deviation = point.value - average;
    const spread = standardDeviation(series.map(candidate => candidate.value)) || Math.abs(average) * 0.04 || 1;
    const zScore = deviation / spread;
    const strength = clamp(Math.abs(zScore) / 2.25, 0, 1);
    const color = signedMetricColor(metricKey, deviation, strength);
    const direction = deviation >= 0 ? '+' : '-';

    return {
      ...base,
      size: 16 + strength * 14,
      color,
      ringSize: 4 + strength * 9,
      ringColor: rgbaFromHex(color, 0.14 + strength * 0.24),
      opacity: 0.76 + strength * 0.24,
      pulse: st.id === APP_STATE.activeStation?.id,
      title: `${baseTitle} - ${year}: ${formatValue(point.value, metricKey)} (${direction}${formatValue(Math.abs(deviation), metricKey)} vs avg)`,
    };
  }

  return base;
}

function linearSlope(series) {
  const xMean = mean(series.map(point => point.x));
  const yMean = mean(series.map(point => point.value));
  const denominator = series.reduce((sum, point) => sum + (point.x - xMean) ** 2, 0);
  if (!denominator) return 0;

  return series.reduce((sum, point) =>
    sum + (point.x - xMean) * (point.value - yMean), 0
  ) / denominator;
}

function trendStrength(slope, metricKey) {
  const scale = {
    temp: 0.065,
    precip: 4.5,
    wind: 0.045,
    sun: 18,
  }[metricKey] || 1;

  return clamp(Math.abs(slope) / scale, 0, 1);
}

function signedMetricColor(metricKey, value, strength) {
  if (strength < 0.08) return '#eef2f4';

  const palettes = {
    temp: { positive: '#c0392b', negative: '#1a6fc4' },
    precip: { positive: '#1a6fc4', negative: '#b45309' },
    sun: { positive: '#b45309', negative: '#1a6fc4' },
    wind: { positive: '#2d7a4f', negative: '#6b7280' },
  };

  const palette = palettes[metricKey] || palettes.temp;
  return value >= 0 ? palette.positive : palette.negative;
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  const avg = mean(values);
  return Math.sqrt(mean(values.map(value => (value - avg) ** 2)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rgbaFromHex(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function focusMapCamera(camera) {
  map.stop();
  map.easeTo({
    ...camera,
    duration: 780,
    easing: t => 1 - (1 - t) ** 3,
    essential: true,
  });
}

let recordsPopup = null;

async function showRecordsPopup(station, lngLat = [station.lng, station.lat]) {
  recordsPopup?.remove();
  const popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    offset: 18,
  })
    .setLngLat(lngLat)
    .setHTML(`<div class="rec-popup">
      <h3>${station.name}</h3>
      <div class="rp-sub">${station.alt} m a.s.l. - ${station.canton} - ${station.id}</div>
      <div class="rp-note">Loading monthly records...</div>
    </div>`)
    .addTo(map);

  recordsPopup = popup;

  try {
    await fetchData(station.id, 'm');
    if (recordsPopup !== popup) return;

    const records = computeRecords(station.id);
    if (!records) return;

    popup.setHTML(`<div class="rec-popup">
      <h3>${station.name}</h3>
      <div class="rp-sub">${station.alt} m a.s.l. · ${station.canton} · ${station.id}</div>
      <table>
        ${recordPopupRow('Hottest month',  records.hot,  'temp',   '#c0392b')}
        ${recordPopupRow('Coldest month',  records.cold, 'temp',   '#1a6fc4')}
        ${recordPopupRow('Wettest month',  records.wet,  'precip', '#1a6fc4')}
        ${recordPopupRow('Windiest month', records.wind, 'wind',   '#2d7a4f')}
        ${sunPopupRow(records.sun)}
      </table>
      <div class="rp-note">Monthly records · open drawer for daily extremes</div>
    </div>`);
  } catch (error) {
    if (recordsPopup !== popup) return;
    popup.setHTML(`<div class="rec-popup">
      <h3>${station.name}</h3>
      <div class="rp-note">Could not load monthly records.</div>
    </div>`);
  }
}

function recordPopupRow(label, point, metricKey, color = '#586273') {
  const val  = point ? formatValue(point.value, metricKey) : '—';
  const when = point ? monthLabel(point.year, point.month) : '';
  return `<tr>
    <td class="rp-label"><span class="rp-dot" style="background:${color}"></span>${label}</td>
    <td class="rp-val" style="color:${color}">${val}</td>
    <td class="rp-when">${when}</td>
  </tr>`;
}

function sunPopupRow(point) {
  const color = '#b45309';
  const val  = point ? `${(point.value / daysInMonth(point.year, point.month || 6)).toFixed(1)} h/day` : '—';
  const when = point ? monthLabel(point.year, point.month) : '';
  return `<tr>
    <td class="rp-label"><span class="rp-dot" style="background:${color}"></span>Sunniest month</td>
    <td class="rp-val" style="color:${color}">${val}</td>
    <td class="rp-when">${when}</td>
  </tr>`;
}

window.focusMapCamera = focusMapCamera;
window.selectStation = selectStation;
window.updateStationMarkerStyles = updateStationMarkerStyles;
