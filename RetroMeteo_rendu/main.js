const APP_STATE = {
  activeStation: null,
  activeMetric: 'temp',
  activeRange: 0,
  activeResolution: 'y',
  activeYear: null,
  activeRecordKey: null,
  focusRange: null,
  loadingToken: null,
  drawerOpen: false,
  compareStation: null,
  compareMode: false,
  chartLayout: 'overlay',
  markerMode: 'default',
  storyStep: 0,
  storyCollapsed: false,
  storyPlayback: null,
  yearPrefetches: {},
  hofOpen: false,
  hofStep: 0,
  hofEntries: null,
  hofLoading: false,
};

const STORY_STEPS = [
  {
    title: 'Swiss climate, station by station',
    copy: '16 Swiss stations, some dating back to the 1860s. Together they form one of Europe\'s longest continuous climate records. Click any marker to dive into its data.',
    metric: 'temp',
    resolution: 'y',
    range: 0,
    markerMode: 'default',
    camera: { center: [8.1, 46.72], zoom: 7.1, pitch: 18, bearing: 0 },
  },
  {
    title: 'Warming faster than the world',
    copy: 'Every station has warmed. Switzerland has gained roughly 2 °C since 1864 (about twice the global average) because landlocked alpine regions amplify the signal. Redder, larger markers mean a steeper upward trend.',
    metric: 'temp',
    resolution: 'y',
    range: 0,
    markerMode: 'trend',
    stationId: 'KLO',
    camera: { center: [8.1, 46.72], zoom: 7.1, pitch: 18, bearing: 0 },
    prefetch: true,
  },
  {
    title: '2003: a summer for the history books',
    copy: 'The summer of 2003 didn\'t break records, it shattered them. Across Europe, temperatures climbed to levels unseen since the Renaissance, glaciers bled and rivers shrank.',
    metric: 'temp',
    resolution: 'y',
    range: 0,
    markerMode: 'yearAnomaly',
    stationId: 'BAS',
    activeYear: 2003,
    camera: { center: [7.7, 46.95], zoom: 7.8, pitch: 18, bearing: 0 },
    prefetch: true,
    autoplay: true,
    autoplayStart: 1990,
    autoplayEnd: 2010,
  },
  {
    title: 'Altitude changes everything',
    copy: 'Saentis sits at 2502 m, the highest station here. It averages 267 frost days per year and can see 10 m of snow in winter. Lugano, just 130 km south at 273 m, rarely freezes and has a Mediterranean microclimate.',
    metric: 'temp',
    resolution: 'y',
    range: 0,
    markerMode: 'trend',
    stationId: 'SAE',
    camera: { center: [9.05, 47.05], zoom: 8.4, pitch: 30, bearing: -10 },
    prefetch: true,
  },
  {
    title: 'Valais: sun-baked and bone-dry',
    copy: 'The Valais is Switzerland\'s driest region. Sion receives only around 580 mm of precipitation per year, comparable to Madrid and far below the Swiss average. Sheltered deep in the Rhône Valley by Alpine ridges on all sides, it sits in one of Europe\'s most striking rain shadows, an anomaly in one of the continent\'s wettest countries.',
    metric: 'precip',
    resolution: 'y',
    range: 0,
    markerMode: 'default',
    stationId: 'SIO',
    camera: { center: [7.45, 46.22], zoom: 9.2, pitch: 24, bearing: 10 },
    prefetch: true,
  },
  {
    title: '2021: when the rain didn\'t stop',
    copy: 'July 2021 brought some of the worst flooding in a generation to central Switzerland. Lakes Lucerne, Thun and Biel all hit Level 5 warnings, the highest possible, and many stations recorded more rain in a fortnight than in a normal entire July',
    metric: 'precip',
    resolution: 'y',
    range: 0,
    markerMode: 'yearAnomaly',
    stationId: 'LUZ',
    activeYear: 2021,
    camera: { center: [8.1, 46.85], zoom: 8.2, pitch: 20, bearing: 0 },
    prefetch: true,
  },
  {
    title: 'Wind: the forgotten variable',
    copy: 'Saentis is one of Switzerland\'s windiest spot, with gusts regularly exceeding 150 km/h. But even lowland stations carry the Foehn\'s fingerprint, the warm, dry southerly wind that can raise Zurich\'s temperature by up to 15 °C in a matter of hours.',
    metric: 'wind',
    resolution: 'y',
    range: 0,
    markerMode: 'trend',
    stationId: 'SAE',
    camera: { center: [8.8, 46.95], zoom: 7.7, pitch: 22, bearing: 0 },
    prefetch: true,
  },
  {
    title: 'Lugano: where Switzerland meets Italy',
    copy: 'Lugano averages around 2200 sunshine hours a year, comparable to many Mediterranean cities, and far more than Zurich. South of the Alps, it enjoys a microclimate that feels nothing like the Swiss Plateau. Switch metrics, scrub years, or click any station: every dataset has more stories to tell.',
    metric: 'sun',
    resolution: 'y',
    range: 0,
    markerMode: 'default',
    stationId: 'LUG',
    camera: { center: [8.72, 46.12], zoom: 9.0, pitch: 26, bearing: 5 },
    prefetch: true,
  },
];

const RECORD_CONFIG = {
  temp: {
    title: 'Temperature records',
    monthly: [
      { key: 'hot', label: 'Hottest month', shortLabel: 'Hot', className: 'hot', metricKey: 'temp' },
      { key: 'cold', label: 'Coldest month', shortLabel: 'Cold', className: 'cold', metricKey: 'temp' },
    ],
    daily: [
      { key: 'hotDay', label: 'Hottest day', className: 'hot', metricKey: 'temp' },
      { key: 'coldDay', label: 'Coldest day', className: 'cold', metricKey: 'temp' },
    ],
  },
  precip: {
    title: 'Precipitation records',
    monthly: [
      { key: 'wet', label: 'Wettest month', shortLabel: 'Wet', className: 'wet', metricKey: 'precip' },
    ],
    daily: [
      { key: 'wetDay', label: 'Wettest day', className: 'wet', metricKey: 'precip' },
    ],
  },
  wind: {
    title: 'Wind records',
    monthly: [
      { key: 'wind', label: 'Windiest month', shortLabel: 'Wind', className: 'wind', metricKey: 'wind' },
    ],
    daily: [
      { key: 'windDay', label: 'Windiest day', className: 'wind', metricKey: 'wind' },
    ],
  },
  sun: {
    title: 'Sunshine records',
    monthly: [
      {
        key: 'sun',
        label: 'Sunniest month',
        shortLabel: 'Sun',
        className: 'sun',
        metricKey: 'sun',
        transform: (value, point) => value / daysInMonth(point.year, point.month || 6),
        unitLabel: 'h/day',
      },
    ],
    daily: [
      { key: 'sunDay', label: 'Sunniest day', className: 'sun', metricKey: 'sun', transform: value => value / 60 },
    ],
  },
};

if (location.protocol === 'file:') {
  document.getElementById('cors-banner')?.classList.remove('hidden');
}

document.getElementById('metric-list').addEventListener('click', event => {
  const pill = event.target.closest('.metric-pill');
  if (!pill) return;

  setActiveMetric(pill.dataset.metric);
  APP_STATE.activeRecordKey = null;
  APP_STATE.focusRange = null;

  const rows = getActiveRows();
  if (rows) drawChart(rows);
  if (APP_STATE.activeStation) {
    renderRecords(APP_STATE.activeStation.id);
    if (APP_STATE.drawerOpen) loadDailyRecords(APP_STATE.activeStation.id);
  }
  if (APP_STATE.markerMode !== 'default') prefetchStationYearData(APP_STATE.activeMetric);
  window.updateStationMarkerStyles?.();
});

document.getElementById('res-group').addEventListener('click', event => {
  const button = event.target.closest('.res-btn');
  if (!button || button.dataset.res === APP_STATE.activeResolution) return;

  setActiveResolution(button.dataset.res);
  APP_STATE.activeRecordKey = null;
  APP_STATE.focusRange = null;

  if (APP_STATE.activeResolution === 'm' && APP_STATE.activeRange === 0) {
    setActiveRange(10);
  }

  if (APP_STATE.activeStation) loadAndDraw(APP_STATE.activeStation.id);
  if (APP_STATE.compareStation) {
    fetchData(APP_STATE.compareStation.id, APP_STATE.activeResolution)
      .then(() => { if (APP_STATE.compareStation) drawChart(getActiveRows()); })
      .catch(() => {});
  }
});

document.getElementById('time-group').addEventListener('click', event => {
  const button = event.target.closest('.time-btn');
  if (!button) return;

  APP_STATE.focusRange = null;
  setActiveRange(parseInt(button.dataset.years, 10));

  const rows = getActiveRows();
  if (rows) drawChart(rows);
  if (APP_STATE.activeStation) renderRecords(APP_STATE.activeStation.id);
  updateTimeNav();
});

document.getElementById('time-nav').addEventListener('click', event => {
  const btn = event.target.closest('.time-nav-btn');
  if (!btn) return;
  shiftPeriod(btn.id === 'next-period' ? 1 : -1);
});

window.addEventListener('resize', () => {
  const rows = getActiveRows();
  if (rows) drawChart(rows);
});

document.getElementById('year-range')?.addEventListener('input', event => {
  stopStoryPlayback();
  setActiveYear(parseInt(event.target.value, 10), { enableYearMarkers: true });
});

document.getElementById('story-prev')?.addEventListener('click', () => {
  setStoryStep(APP_STATE.storyStep - 1);
});

document.getElementById('story-next')?.addEventListener('click', () => {
  if (APP_STATE.storyStep >= STORY_STEPS.length - 1) {
    collapseStoryPanel();
    return;
  }

  setStoryStep(APP_STATE.storyStep + 1);
});

document.getElementById('story-explore')?.addEventListener('click', collapseStoryPanel);
document.getElementById('story-reopen')?.addEventListener('click', reopenStoryPanel);

document.getElementById('hof-open')?.addEventListener('click', openHallOfFame);
document.getElementById('hof-close')?.addEventListener('click', closeHallOfFame);
document.getElementById('hof-prev')?.addEventListener('click', () => setHofStep(APP_STATE.hofStep - 1));
document.getElementById('hof-next')?.addEventListener('click', () => {
  if (!APP_STATE.hofEntries || APP_STATE.hofStep >= APP_STATE.hofEntries.length - 1) {
    closeHallOfFame();
    return;
  }
  setHofStep(APP_STATE.hofStep + 1);
});

initializeStoryController();

function setActiveMetric(metricKey) {
  APP_STATE.activeMetric = metricKey;
  document.querySelectorAll('.metric-pill').forEach(pill =>
    pill.classList.toggle('active', pill.dataset.metric === metricKey)
  );
}

function setActiveResolution(resolution) {
  APP_STATE.activeResolution = resolution;
  document.querySelectorAll('.res-btn').forEach(button =>
    button.classList.toggle('active', button.dataset.res === resolution)
  );
}

function setActiveRange(years) {
  APP_STATE.activeRange = years;
  document.querySelectorAll('.time-btn').forEach(button =>
    button.classList.toggle('active', parseInt(button.dataset.years, 10) === years)
  );
}

function setActiveYear(year, options = {}) {
  const { redraw = true, updateMarkers = true, enableYearMarkers = false } = options;
  const input = document.getElementById('year-range');
  const nextYear = year === null || year === undefined ? null : Math.round(year);

  APP_STATE.activeYear = nextYear;
  if (input && nextYear !== null) {
    input.value = nextYear;
    updateYearScrubberProgress();
  }
  if (nextYear === null) document.getElementById('year-scrubber')?.classList.add('hidden');

  if (enableYearMarkers && nextYear !== null && APP_STATE.markerMode !== 'yearAnomaly') {
    setMarkerMode('yearAnomaly');
  }

  document.getElementById('active-year-label').textContent = nextYear ?? '-';

  if (updateMarkers) window.updateStationMarkerStyles?.();

  const rows = getActiveRows();
  if (redraw && rows) drawChart(rows);
}

function syncYearScrubberDomain(series) {
  const scrubber = document.getElementById('year-scrubber');
  const input = document.getElementById('year-range');
  if (!scrubber || !input || !series?.length) return;

  const minYear = d3.min(series, point => point.year);
  const maxYear = d3.max(series, point => point.year);
  input.min = minYear;
  input.max = maxYear;
  document.getElementById('year-min-label').textContent = minYear;
  document.getElementById('year-max-label').textContent = maxYear;

  if (APP_STATE.activeYear === null || APP_STATE.activeYear < minYear || APP_STATE.activeYear > maxYear) {
    setActiveYear(maxYear, { redraw: false, enableYearMarkers: true });
  } else {
    input.value = APP_STATE.activeYear;
    document.getElementById('active-year-label').textContent = APP_STATE.activeYear;
    updateYearScrubberProgress();
  }

  scrubber.classList.remove('hidden');
}

function updateYearScrubberProgress() {
  const input = document.getElementById('year-range');
  if (!input) return;

  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 100;
  input.style.setProperty('--scrub-progress', `${Math.max(0, Math.min(100, progress))}%`);
}

function setMarkerMode(mode) {
  APP_STATE.markerMode = mode;
  window.updateStationMarkerStyles?.();

  if (mode !== 'default') {
    prefetchStationYearData(APP_STATE.activeMetric);
  }
}

function prefetchStationYearData(metricKey) {
  if (!metricKey || APP_STATE.yearPrefetches[metricKey]) {
    return APP_STATE.yearPrefetches[metricKey] || Promise.resolve();
  }

  APP_STATE.yearPrefetches[metricKey] = Promise.allSettled(
    STATIONS.map(station =>
      fetchData(station.id, 'y')
        .then(rows => {
          window.updateStationMarkerStyles?.();
          return rows;
        })
    )
  ).then(result => {
    window.updateStationMarkerStyles?.();
    return result;
  });

  return APP_STATE.yearPrefetches[metricKey];
}

function initializeStoryController() {
  setStoryStep(0);
}

function setStoryStep(index) {
  const nextIndex = Math.max(0, Math.min(STORY_STEPS.length - 1, index));
  const step = STORY_STEPS[nextIndex];
  APP_STATE.storyStep = nextIndex;
  APP_STATE.storyCollapsed = false;

  closeHallOfFame();
  document.getElementById('story-panel')?.classList.remove('hidden');
  document.getElementById('story-reopen')?.classList.add('hidden');
  document.getElementById('hof-open')?.classList.add('hidden');
  renderStoryPanel();
  applyStoryStep(step);
}

function renderStoryPanel() {
  const step = STORY_STEPS[APP_STATE.storyStep];
  document.getElementById('story-step-count').textContent =
    `${APP_STATE.storyStep + 1} / ${STORY_STEPS.length}`;
  document.getElementById('story-title').textContent = step.title;
  document.getElementById('story-copy').textContent = step.copy;
  document.getElementById('story-prev').disabled = APP_STATE.storyStep === 0;
  document.getElementById('story-next').textContent =
    APP_STATE.storyStep === STORY_STEPS.length - 1 ? 'Explore' : 'Next';

  const progress = document.getElementById('story-progress');
  progress.innerHTML = STORY_STEPS.map((_, index) =>
    `<span class="story-progress-dot${index === APP_STATE.storyStep ? ' active' : ''}"></span>`
  ).join('');
}

function applyStoryStep(step) {
  stopStoryPlayback();

  APP_STATE.activeRecordKey = null;
  APP_STATE.focusRange = null;

  setActiveMetric(step.metric);
  setActiveResolution(step.resolution);
  setActiveRange(step.range);
  setMarkerMode(step.markerMode);

  if (step.activeYear !== undefined) {
    setActiveYear(step.activeYear, { redraw: false });
  }

  if (step.prefetch) {
    prefetchStationYearData(step.metric);
  }

  if (step.stationId) {
    const station = STATIONS.find(candidate => candidate.id === step.stationId);
    if (station) window.selectStation?.(station, { skipCamera: true });
  } else {
    const rows = getActiveRows();
    if (rows) drawChart(rows);
  }

  if (step.camera) {
    window.focusMapCamera?.(step.camera);
  }

  if (step.autoplay) {
    prefetchStationYearData(step.metric).then(() => {
      if (APP_STATE.storyStep === STORY_STEPS.indexOf(step) && !APP_STATE.storyCollapsed) {
        startStoryPlayback(step.autoplayStart ?? 1982, step.autoplayEnd ?? 2025);
      }
    });
  }
}

function startStoryPlayback(startYear, endYear) {
  stopStoryPlayback();
  let year = startYear;
  setActiveYear(year);

  APP_STATE.storyPlayback = setInterval(() => {
    year += 1;
    if (year > endYear) {
      stopStoryPlayback();
      return;
    }
    setActiveYear(year);
  }, 120);
}

function stopStoryPlayback() {
  if (!APP_STATE.storyPlayback) return;
  clearInterval(APP_STATE.storyPlayback);
  APP_STATE.storyPlayback = null;
}

function collapseStoryPanel() {
  stopStoryPlayback();
  APP_STATE.storyCollapsed = true;
  document.getElementById('story-panel')?.classList.add('hidden');
  document.getElementById('story-reopen')?.classList.remove('hidden');
  if (!APP_STATE.hofOpen) document.getElementById('hof-open')?.classList.remove('hidden');
}

function reopenStoryPanel() {
  closeHallOfFame();
  APP_STATE.storyCollapsed = false;
  document.getElementById('story-panel')?.classList.remove('hidden');
  document.getElementById('story-reopen')?.classList.add('hidden');
  document.getElementById('hof-open')?.classList.add('hidden');
  renderStoryPanel();
}

// ── Hall of Fame ─────────────────────────────────────────

async function openHallOfFame() {
  stopStoryPlayback();
  APP_STATE.hofOpen = true;
  APP_STATE.storyCollapsed = true;
  document.getElementById('story-panel')?.classList.add('hidden');
  document.getElementById('story-reopen')?.classList.add('hidden');
  document.getElementById('hof-open')?.classList.add('hidden');
  document.getElementById('hof-panel')?.classList.remove('hidden');

  if (!APP_STATE.hofEntries) {
    APP_STATE.hofLoading = true;
    document.getElementById('hof-title').textContent = 'Loading records…';
    document.getElementById('hof-copy').textContent = 'Fetching data from all stations…';
    document.getElementById('hof-value-line').textContent = '';
    try {
      APP_STATE.hofEntries = await computeHofEntries();
    } catch (err) {
      document.getElementById('hof-title').textContent = 'Could not load records';
      document.getElementById('hof-copy').textContent = String(err);
      APP_STATE.hofLoading = false;
      return;
    }
    APP_STATE.hofLoading = false;
  }

  setHofStep(APP_STATE.hofStep);
}

function closeHallOfFame() {
  if (!APP_STATE.hofOpen) return;
  APP_STATE.hofOpen = false;
  document.getElementById('hof-panel')?.classList.add('hidden');
  document.getElementById('hof-open')?.classList.remove('hidden');
  if (APP_STATE.storyCollapsed) {
    document.getElementById('story-reopen')?.classList.remove('hidden');
  }
}

function setHofStep(index) {
  const entries = APP_STATE.hofEntries;
  if (!entries?.length) return;
  const nextIndex = Math.max(0, Math.min(entries.length - 1, index));
  APP_STATE.hofStep = nextIndex;
  renderHofPanel();
  applyHofEntry(entries[nextIndex]);
}

function renderHofPanel() {
  const entries = APP_STATE.hofEntries;
  if (!entries?.length) return;
  const entry = entries[APP_STATE.hofStep];
  const total = entries.length;
  const step = APP_STATE.hofStep;

  document.getElementById('hof-step-count').textContent = `${step + 1} / ${total}`;
  document.getElementById('hof-value-line').textContent = entry.value ?? '';
  document.getElementById('hof-title').textContent = entry.title;
  document.getElementById('hof-copy').textContent = entry.copy;
  document.getElementById('hof-prev').disabled = step === 0;
  document.getElementById('hof-next').textContent = step === total - 1 ? 'Close' : 'Next';

  const progress = document.getElementById('hof-progress');
  progress.style.gridTemplateColumns = `repeat(${total}, minmax(0, 1fr))`;
  progress.innerHTML = entries.map((_, i) =>
    `<span class="hof-progress-dot${i === step ? ' active' : ''}"></span>`
  ).join('');
}

async function applyHofEntry(entry) {
  setActiveMetric(entry.metric);
  // Daily resolution isn't supported by the chart — use yearly for display so the
  // station chart renders correctly while the HOF panel shows the exact daily record.
  setActiveResolution(entry.needsDaily ? 'y' : entry.resolution);
  setActiveRange(0);
  setMarkerMode(entry.markerMode);
  APP_STATE.activeRecordKey = null;
  APP_STATE.focusRange = null;

  if (entry.needsDaily && entry.value === '—') {
    if (!DATA_CACHE[`${entry.stationId}_d`]) {
      document.getElementById('hof-copy').textContent = 'Loading daily data…';
    }
    try {
      await fetchData(entry.stationId, 'd');
      const daily = computeDailyRecords(entry.stationId);
      const rec = daily?.[entry.dailyKey];
      if (rec) {
        entry.value = formatValue(rec.value, entry.metric);
        entry.activeYear = rec.year;
        entry.copy = entry.copyTemplate
          .replace('{date}', hofDateLabel(rec))
          .replace('{station}', entry.stationName);
      } else {
        entry.copy = 'Record not found in daily data for this station.';
      }
    } catch (err) {
      console.error('HOF daily load failed:', err);
      entry.copy = `Could not load daily data: ${err.message}`;
    }
    renderHofPanel();
  }

  if (entry.activeYear !== undefined) {
    setActiveYear(entry.activeYear, { redraw: false });
    document.getElementById('year-scrubber')?.classList.remove('hidden');
  }

  const station = STATIONS.find(s => s.id === entry.stationId);
  if (station) window.selectStation?.(station, { skipCamera: true });

  if (entry.camera) {
    window.focusMapCamera?.(entry.camera);
  }
}

async function computeHofEntries() {
  await Promise.allSettled([
    ...STATIONS.map(s => fetchData(s.id, 'y')),
    ...STATIONS.map(s => fetchData(s.id, 'm')),
  ]);

  // Temperature
  let bestHotYear = null, bestHotYearStation = null;
  let bestColdYear = null, bestColdYearStation = null;
  let bestHotMonth = null, bestHotMonthStation = null;
  let bestColdMonth = null, bestColdMonthStation = null;
  let bestHotDayCandidate = null;
  let bestColdDayCandidate = null;

  // Precipitation
  let bestWetYear = null, bestWetYearStation = null;
  let bestDryYear = null, bestDryYearStation = null;
  let bestWetMonth = null, bestWetMonthStation = null;
  let bestWetDayCandidate = null;

  // Wind
  let bestWindYear = null, bestWindYearStation = null;
  let bestWindMonth = null, bestWindMonthStation = null;
  let bestWindDayCandidate = null;

  // Sunshine
  let bestSunYear = null, bestSunYearStation = null;
  let bestDarkYear = null, bestDarkYearStation = null;
  let bestSunMonth = null, bestSunMonthStation = null;

  for (const station of STATIONS) {
    const records = computeRecords(station.id);
    if (!records) continue;

    const yearRows = DATA_CACHE[`${station.id}_y`];
    if (yearRows) {
      const tempSeries   = extractSeries(yearRows, 'temp',   'y');
      const precipSeries = extractSeries(yearRows, 'precip', 'y');
      const windSeries   = extractSeries(yearRows, 'wind',   'y');
      const sunSeries    = extractSeries(yearRows, 'sun',    'y');

      const hotY   = findExtremum(tempSeries,   (a, b) => a >= b);
      const coldY  = findExtremum(tempSeries,   (a, b) => a <= b);
      const wetY   = findExtremum(precipSeries, (a, b) => a >= b);
      const dryY   = findExtremum(precipSeries, (a, b) => a <= b);
      const windY  = findExtremum(windSeries,   (a, b) => a >= b);
      const sunY   = findExtremum(sunSeries,    (a, b) => a >= b);
      const darkY  = findExtremum(sunSeries,    (a, b) => a <= b);

      if (hotY  && (!bestHotYear  || hotY.value  > bestHotYear.value))  { bestHotYear  = hotY;  bestHotYearStation  = station; }
      if (coldY && (!bestColdYear || coldY.value < bestColdYear.value))  { bestColdYear = coldY; bestColdYearStation = station; }
      if (wetY  && (!bestWetYear  || wetY.value  > bestWetYear.value))   { bestWetYear  = wetY;  bestWetYearStation  = station; }
      if (dryY  && (!bestDryYear  || dryY.value  < bestDryYear.value))   { bestDryYear  = dryY;  bestDryYearStation  = station; }
      if (windY && (!bestWindYear || windY.value > bestWindYear.value))   { bestWindYear = windY; bestWindYearStation = station; }
      if (sunY  && (!bestSunYear  || sunY.value  > bestSunYear.value))   { bestSunYear  = sunY;  bestSunYearStation  = station; }
      if (darkY && (!bestDarkYear || darkY.value < bestDarkYear.value))  { bestDarkYear = darkY; bestDarkYearStation = station; }
    }

    const { hot, cold, wet, wind, sun } = records;

    if (hot  && (!bestHotMonth  || hot.value  > bestHotMonth.value))   { bestHotMonth  = hot;  bestHotMonthStation  = station; }
    if (cold && (!bestColdMonth || cold.value < bestColdMonth.value))   { bestColdMonth = cold; bestColdMonthStation = station; }
    if (wet  && (!bestWetMonth  || wet.value  > bestWetMonth.value))    { bestWetMonth  = wet;  bestWetMonthStation  = station; }
    if (wind && (!bestWindMonth || wind.value > bestWindMonth.value))   { bestWindMonth = wind; bestWindMonthStation = station; }
    if (sun  && (!bestSunMonth  || sun.value  > bestSunMonth.value))    { bestSunMonth  = sun;  bestSunMonthStation  = station; }

    if (!bestHotDayCandidate  || (hot  && hot.value  > (bestHotDayCandidate?.monthRecord?.value  ?? -Infinity))) bestHotDayCandidate  = { station, monthRecord: hot };
    if (!bestColdDayCandidate || (cold && cold.value < (bestColdDayCandidate?.monthRecord?.value  ?? Infinity)))  bestColdDayCandidate = { station, monthRecord: cold };
    if (!bestWetDayCandidate  || (wet  && wet.value  > (bestWetDayCandidate?.monthRecord?.value   ?? -Infinity))) bestWetDayCandidate  = { station, monthRecord: wet };
    if (!bestWindDayCandidate || (wind && wind.value > (bestWindDayCandidate?.monthRecord?.value  ?? -Infinity))) bestWindDayCandidate = { station, monthRecord: wind };
  }

  const entries = [];

  // ── Temperature ────────────────────────────────────────
  if (bestHotYearStation && bestHotYear) {
    entries.push({
      title: `Warmest year: ${bestHotYear.year}`,
      copy: `${bestHotYearStation.name} recorded the highest annual mean temperature in the network. ${bestHotYear.year} stands as the warmest year on record across all 16 stations.`,
      value: formatValue(bestHotYear.value, 'temp'),
      metric: 'temp', resolution: 'y', stationId: bestHotYearStation.id, stationName: bestHotYearStation.name,
      activeYear: bestHotYear.year, markerMode: 'yearAnomaly', camera: stationCamera(bestHotYearStation),
    });
  }

  if (bestColdYearStation && bestColdYear) {
    entries.push({
      title: `Coldest year: ${bestColdYear.year}`,
      copy: `${bestColdYearStation.name} recorded the lowest annual mean temperature in the network. ${bestColdYear.year} stands as the coldest year on record — a snapshot of Switzerland before its modern warming.`,
      value: formatValue(bestColdYear.value, 'temp'),
      metric: 'temp', resolution: 'y', stationId: bestColdYearStation.id, stationName: bestColdYearStation.name,
      activeYear: bestColdYear.year, markerMode: 'yearAnomaly', camera: stationCamera(bestColdYearStation),
    });
  }

  if (bestHotMonthStation && bestHotMonth) {
    entries.push({
      title: `Hottest month: ${hofDateLabel(bestHotMonth)}`,
      copy: `${bestHotMonthStation.name} holds the record for the hottest single month in the network. ${hofDateLabel(bestHotMonth)} remains the most extreme heat month in the dataset.`,
      value: formatValue(bestHotMonth.value, 'temp'),
      metric: 'temp', resolution: 'm', stationId: bestHotMonthStation.id, stationName: bestHotMonthStation.name,
      activeYear: bestHotMonth.year, markerMode: 'default', camera: stationCamera(bestHotMonthStation),
    });
  }

  if (bestColdMonthStation && bestColdMonth) {
    entries.push({
      title: `Coldest month: ${hofDateLabel(bestColdMonth)}`,
      copy: `${bestColdMonthStation.name} holds the record for the coldest single month in the network. ${hofDateLabel(bestColdMonth)} is the most extreme cold month in the dataset.`,
      value: formatValue(bestColdMonth.value, 'temp'),
      metric: 'temp', resolution: 'm', stationId: bestColdMonthStation.id, stationName: bestColdMonthStation.name,
      activeYear: bestColdMonth.year, markerMode: 'default', camera: stationCamera(bestColdMonthStation),
    });
  }

  if (bestHotDayCandidate?.station) {
    const s = bestHotDayCandidate.station;
    entries.push({
      title: 'Hottest day on record',
      copy: `Based on monthly extremes, ${s.name} is the top candidate. Loading daily data to find the exact date…`,
      value: '—',
      metric: 'temp', resolution: 'd', stationId: s.id, stationName: s.name,
      markerMode: 'default', camera: stationCamera(s),
      needsDaily: true, dailyKey: 'hotDay',
      copyTemplate: 'The hottest day ever recorded at {station} was {date} — the peak daily maximum across the entire network.',
    });
  }

  if (bestColdDayCandidate?.station) {
    const s = bestColdDayCandidate.station;
    entries.push({
      title: 'Coldest day on record',
      copy: `Based on monthly extremes, ${s.name} is the top candidate. Loading daily data to find the exact date…`,
      value: '—',
      metric: 'temp', resolution: 'd', stationId: s.id, stationName: s.name,
      markerMode: 'default', camera: stationCamera(s),
      needsDaily: true, dailyKey: 'coldDay',
      copyTemplate: 'The coldest day ever recorded at {station} was {date} — the lowest daily minimum across the entire network.',
    });
  }

  // ── Precipitation ───────────────────────────────────────
  if (bestWetYearStation && bestWetYear) {
    entries.push({
      title: `Wettest year: ${bestWetYear.year}`,
      copy: `${bestWetYearStation.name} logged the highest annual rainfall on record in ${bestWetYear.year}. Across Switzerland, wet years tend to coincide with persistent Atlantic low-pressure systems stalling over the Alps.`,
      value: formatValue(bestWetYear.value, 'precip'),
      metric: 'precip', resolution: 'y', stationId: bestWetYearStation.id, stationName: bestWetYearStation.name,
      activeYear: bestWetYear.year, markerMode: 'yearAnomaly', camera: stationCamera(bestWetYearStation),
    });
  }

  if (bestDryYearStation && bestDryYear) {
    entries.push({
      title: `Driest year: ${bestDryYear.year}`,
      copy: `${bestDryYearStation.name} had its driest year on record in ${bestDryYear.year}. Switzerland's rainfall varies enormously — the inner Valais rain shadow creates some of the driest conditions in Central Europe, while Saentis, just 60 km away, receives more annual precipitation than Bergen, Norway.`,
      value: formatValue(bestDryYear.value, 'precip'),
      metric: 'precip', resolution: 'y', stationId: bestDryYearStation.id, stationName: bestDryYearStation.name,
      activeYear: bestDryYear.year, markerMode: 'yearAnomaly', camera: stationCamera(bestDryYearStation),
    });
  }

  if (bestWetMonthStation && bestWetMonth) {
    entries.push({
      title: `Wettest month: ${hofDateLabel(bestWetMonth)}`,
      copy: `${bestWetMonthStation.name}'s record month was ${hofDateLabel(bestWetMonth)}. Such intense events cause major river flooding — the Rhône, Reuss, and Aare all drain catchments covered by this network.`,
      value: formatValue(bestWetMonth.value, 'precip'),
      metric: 'precip', resolution: 'm', stationId: bestWetMonthStation.id, stationName: bestWetMonthStation.name,
      activeYear: bestWetMonth.year, markerMode: 'default', camera: stationCamera(bestWetMonthStation),
    });
  }

  if (bestWetDayCandidate?.station) {
    const s = bestWetDayCandidate.station;
    entries.push({
      title: 'Wettest day on record',
      copy: `Based on monthly extremes, ${s.name} is the top candidate. Loading daily data to find the exact date…`,
      value: '—',
      metric: 'precip', resolution: 'd', stationId: s.id, stationName: s.name,
      markerMode: 'default', camera: stationCamera(s),
      needsDaily: true, dailyKey: 'wetDay',
      copyTemplate: 'The wettest single day at {station} was {date}. Flash floods and landslides are the direct consequences of such concentrated rainfall in alpine terrain.',
    });
  }

  // ── Wind ───────────────────────────────────────────────
  if (bestWindYearStation && bestWindYear) {
    entries.push({
      title: `Windiest year: ${bestWindYear.year}`,
      copy: `${bestWindYearStation.name} recorded the highest mean annual wind speed in the network in ${bestWindYear.year}. Saentis at 2502 m has recorded gusts above 200 km/h — its all-time record of 263 km/h was set during a violent Foehn storm in 1990.`,
      value: formatValue(bestWindYear.value, 'wind'),
      metric: 'wind', resolution: 'y', stationId: bestWindYearStation.id, stationName: bestWindYearStation.name,
      activeYear: bestWindYear.year, markerMode: 'yearAnomaly', camera: stationCamera(bestWindYearStation),
    });
  }

  if (bestWindMonthStation && bestWindMonth) {
    entries.push({
      title: `Windiest month: ${hofDateLabel(bestWindMonth)}`,
      copy: `${bestWindMonthStation.name} saw its stormiest month in ${hofDateLabel(bestWindMonth)}. Switzerland's most violent winds come from two opposite directions: the cold Bise from the northeast and the warm, dry Foehn from the south.`,
      value: formatValue(bestWindMonth.value, 'wind'),
      metric: 'wind', resolution: 'm', stationId: bestWindMonthStation.id, stationName: bestWindMonthStation.name,
      activeYear: bestWindMonth.year, markerMode: 'default', camera: stationCamera(bestWindMonthStation),
    });
  }

  if (bestWindDayCandidate?.station) {
    const s = bestWindDayCandidate.station;
    entries.push({
      title: 'Windiest day on record',
      copy: `Based on monthly extremes, ${s.name} is the top candidate. Loading daily data to find the exact date…`,
      value: '—',
      metric: 'wind', resolution: 'd', stationId: s.id, stationName: s.name,
      markerMode: 'default', camera: stationCamera(s),
      needsDaily: true, dailyKey: 'windDay',
      copyTemplate: 'The windiest day at {station} was {date}. As air is compressed and accelerated through alpine passes, the Foehn can more than double wind speeds within a matter of hours.',
    });
  }

  // ── Sunshine ───────────────────────────────────────────
  if (bestSunYearStation && bestSunYear) {
    entries.push({
      title: `Sunniest year: ${bestSunYear.year}`,
      copy: `${bestSunYearStation.name} basked in a record ${formatValue(bestSunYear.value, 'sun')} of sunshine in ${bestSunYear.year}. South of the Alps, Lugano and Ticino average over 2 000 sunshine hours a year — more than Lyon or Bordeaux, and rivalling the south of France.`,
      value: formatValue(bestSunYear.value, 'sun'),
      metric: 'sun', resolution: 'y', stationId: bestSunYearStation.id, stationName: bestSunYearStation.name,
      activeYear: bestSunYear.year, markerMode: 'yearAnomaly', camera: stationCamera(bestSunYearStation),
    });
  }

  if (bestDarkYearStation && bestDarkYear) {
    entries.push({
      title: `Darkest year: ${bestDarkYear.year}`,
      copy: `${bestDarkYearStation.name} endured its gloomiest year on record in ${bestDarkYear.year}. The Mittelland Nebelmeer — the sea of fog that blankets the Swiss plateau — can trap lowland stations for weeks each winter.`,
      value: formatValue(bestDarkYear.value, 'sun'),
      metric: 'sun', resolution: 'y', stationId: bestDarkYearStation.id, stationName: bestDarkYearStation.name,
      activeYear: bestDarkYear.year, markerMode: 'yearAnomaly', camera: stationCamera(bestDarkYearStation),
    });
  }

  if (bestSunMonthStation && bestSunMonth) {
    entries.push({
      title: `Sunniest month: ${hofDateLabel(bestSunMonth)}`,
      copy: `${bestSunMonthStation.name}'s sunniest month ever was ${hofDateLabel(bestSunMonth)}. In peak summer, stations above the winter fog layer can reach over 260 sunshine hours in a single month — while the lowlands below the cloud inversion sit in grey shade.`,
      value: formatValue(bestSunMonth.value, 'sun'),
      metric: 'sun', resolution: 'm', stationId: bestSunMonthStation.id, stationName: bestSunMonthStation.name,
      activeYear: bestSunMonth.year, markerMode: 'default', camera: stationCamera(bestSunMonthStation),
    });
  }

  return entries;
}

function stationCamera(station) {
  return { center: [station.lng, station.lat], zoom: 9.5, pitch: 20, bearing: 0 };
}

function hofDateLabel(point) {
  if (!point) return '';
  if (point.day) {
    const v = point.day % 100;
    const suffix = (v >= 11 && v <= 13) ? 'th' : (['th','st','nd','rd'][point.day % 10] || 'th');
    return `${MONTH_NAMES[point.month - 1]} ${point.day}${suffix} ${point.year}`;
  }
  return point.month ? `${MONTH_NAMES[point.month - 1]} ${point.year}` : `${point.year}`;
}

// ── End Hall of Fame ─────────────────────────────────────

function beginStationSelection(station) {
  APP_STATE.activeStation = station;
  APP_STATE.activeRecordKey = null;
  APP_STATE.focusRange = null;

  // Clear compare state when primary station changes
  if (APP_STATE.compareStation) {
    APP_STATE.compareStation = null;
    APP_STATE.compareMode = false;
    document.getElementById('compare-card').classList.add('hidden');
    document.getElementById('layout-switcher').classList.add('hidden');
    document.getElementById('compare-btn').classList.remove('active');
    document.getElementById('compare-btn').textContent = '+ Compare station';
    document.body.classList.remove('split-chart-active');
    window.clearCompareMarker?.();
  }

  document.getElementById('st-placeholder').classList.add('hidden');
  document.getElementById('st-info').classList.remove('hidden');
  document.getElementById('compare-controls').classList.remove('hidden');
  document.getElementById('st-name').textContent = station.name;
  document.getElementById('st-meta').textContent =
    `${station.canton} - ${station.alt} m a.s.l.\nStation code: ${station.id}`;

  updateAvailabilityDots({});
  setDataStatus('loading', 'Fetching station measurements...');
  document.getElementById('chart-title').textContent = 'Loading measurements...';
  document.getElementById('chart-meta').textContent = '';
  document.getElementById('year-scrubber')?.classList.add('hidden');
  document.getElementById('chart-empty').textContent = 'Fetching station measurements...';
  document.getElementById('chart-empty').classList.remove('hidden');
  document.getElementById('chart-svg-wrap').classList.add('hidden');
  renderRecords(station.id);
}

async function loadAndDraw(stationId) {
  const token = `${stationId}_${APP_STATE.activeResolution}_${Date.now()}`;
  APP_STATE.loadingToken = token;
  setDataStatus('loading', 'Fetching station measurements...');

  try {
    const rows = await fetchData(stationId, APP_STATE.activeResolution);
    if (APP_STATE.loadingToken !== token) return;

    if (!rows.length) {
      setDataStatus('err', '0 data rows parsed from file.');
      showChartMessage('No data in this station file.');
      return;
    }

    const availability = getMetricAvailability(rows, APP_STATE.activeResolution);
    updateAvailabilityDots(availability);

    const availableMetrics = Object.keys(availability).filter(metricKey => availability[metricKey]);
    if (!availableMetrics.length) {
      setDataStatus('err', 'Data loaded, but no supported variables were found.');
      showChartMessage('This station has no supported measurements at the selected resolution.');
      return;
    }

    if (!availability[APP_STATE.activeMetric]) {
      setActiveMetric(availableMetrics[0]);
    }

    clearDataStatus();
    drawChart(rows);
    updateTimeNav();
    refreshRecords(stationId);
  } catch (error) {
    if (APP_STATE.loadingToken !== token) return;

    setDataStatus('err', error.message);
    showChartMessage(`Error: ${error.message}`);
  }
}

function getMetricAvailability(rows, resolution) {
  return Object.fromEntries(
    Object.keys(METRICS).map(metricKey => [
      metricKey,
      extractSeries(rows, metricKey, resolution).length > 0,
    ])
  );
}

function updateAvailabilityDots(availability) {
  Object.keys(METRICS).forEach(metricKey => {
    const dot = document.getElementById(`avail-${metricKey}`);
    if (!dot) return;
    dot.className = `avail-dot${availability[metricKey] ? ' yes' : ''}`;
  });
}

function setDataStatus(kind, text) {
  const status = document.getElementById('data-status');
  if (!status) return;
  status.className = kind;
  status.innerHTML = kind === 'loading'
    ? `${text} <span class="loading-spinner"></span>`
    : text;
}

function clearDataStatus() {
  const status = document.getElementById('data-status');
  if (!status) return;
  status.className = 'hidden';
  status.textContent = '';
}

function showChartMessage(message) {
  document.getElementById('chart-empty').textContent = message;
  document.getElementById('chart-empty').classList.remove('hidden');
  document.getElementById('chart-svg-wrap').classList.add('hidden');
  document.getElementById('year-scrubber')?.classList.add('hidden');
}

function getActiveRows() {
  if (!APP_STATE.activeStation) return null;
  return DATA_CACHE[`${APP_STATE.activeStation.id}_${APP_STATE.activeResolution}`] || null;
}

function refreshRecords(stationId) {
  if (APP_STATE.activeStation?.id !== stationId) return;

  renderRecords(stationId);
  if (APP_STATE.activeResolution !== 'm') {
    fetchData(stationId, 'm')
      .then(() => {
        if (APP_STATE.activeStation?.id !== stationId) return;
        renderRecords(stationId);
        if (APP_STATE.drawerOpen) loadDailyRecords(stationId);
      })
      .catch(() => {});
  }
}

function renderRecords(stationId, options = {}) {
  const config = getRecordConfig();
  const monthlyRecords = computeRecords(stationId);
  const dailyLoaded = Boolean(DATA_CACHE[`${stationId}_d`]);
  const dailyRecords = dailyLoaded ? computeDailyRecords(stationId) : null;

  renderRecordHandle(config, monthlyRecords);
  renderRecordGrid(config, monthlyRecords, dailyRecords, {
    dailyLoaded,
    dailyStatus: options.dailyStatus,
  });
}

function getRecordConfig() {
  return RECORD_CONFIG[APP_STATE.activeMetric] || RECORD_CONFIG.temp;
}

function renderRecordHandle(config, monthlyRecords) {
  const container = document.getElementById('records-handle-pills');
  if (!container) return;

  const trend = computeActiveTrend();
  const pills = config.monthly.map(record => {
    const point = monthlyRecords?.[record.key];
    const value = point ? formatRecordValue(point, record) : '-';
    const action = point
      ? ` onclick="event.stopPropagation(); jumpToRecord('${record.metricKey}', '${record.key}')"`
      : '';

    return `<span class="rh-pill ${record.className}"${action}>
      <span class="rh-pill-lbl">${record.shortLabel}</span>
      <span class="rh-pill-val">${value}</span>
    </span>`;
  });

  if (trend) {
    pills.push(`<span class="rh-pill trend ${trend.className}">
      <span class="rh-pill-lbl">Trend</span>
      <span class="rh-pill-val">${trend.perYearLabel}</span>
    </span>`);
  }

  container.innerHTML = pills.join('');
}

function renderRecordGrid(config, monthlyRecords, dailyRecords, options = {}) {
  const title = document.getElementById('records-section-title');
  const grid = document.getElementById('records-grid');
  if (!grid) return;

  if (title) title.textContent = config.title;

  const trendCard = recordTrendCard();
  const cards = config.monthly.map(record =>
    recordCard(record, monthlyRecords?.[record.key], { clickable: true, dateFormatter: monthLabelForPoint })
  );

  cards.push(...config.daily.map(record =>
    recordCard(record, dailyRecords?.[record.key], {
      clickable: false,
      dateFormatter: dateLabel,
      emptyValue: '-',
      emptyWhen: dailyPlaceholderText(options),
    })
  ));

  if (trendCard) cards.push(trendCard);

  grid.innerHTML = cards.join('');
}

function recordCard(record, point, options = {}) {
  const {
    clickable = false,
    dateFormatter = dateLabel,
    emptyValue = 'n/a',
    emptyWhen = 'No data',
  } = options;
  const tag = clickable ? 'button' : 'div';
  const type = clickable ? ' type="button"' : '';
  const disabled = clickable && !point ? ' disabled' : '';
  const action = clickable && point ? ` onclick="jumpToRecord('${record.metricKey}', '${record.key}')"` : '';
  const staticClass = clickable ? '' : ' static';
  const emptyClass = point ? '' : ' empty';
  const value = point ? formatRecordValue(point, record) : emptyValue;
  const when = point ? dateFormatter(point) : emptyWhen;

  return `<${tag} class="record-card ${record.className}${staticClass}${emptyClass}"${type}${disabled}${action}>
    <span class="rc-label">${record.label}</span>
    <span class="rc-value">${value}</span>
    <span class="rc-when">${when}</span>
  </${tag}>`;
}

function dailyPlaceholderText(options = {}) {
  if (options.dailyStatus === 'loading') return 'Fetching...';
  if (options.dailyStatus === 'error') return 'Unavailable';
  if (!options.dailyLoaded) return 'Open records';
  return 'No data';
}

function formatRecordValue(point, record) {
  const value = record.transform ? record.transform(point.value, point) : point.value;
  if (record.unitLabel) return `${value.toFixed(1)} ${record.unitLabel}`;
  return formatValue(value, record.metricKey);
}

function monthLabelForPoint(point) {
  return monthLabel(point.year, point.month);
}

function recordTrendCard() {
  const trend = computeActiveTrend();
  if (!trend) return '';

  return `<div class="record-card trend ${trend.className} static">
    <span class="rc-label">Trend</span>
    <span class="rc-value">${trend.perYearLabel}</span>
    <span class="rc-when">${trend.totalLabel} over ${trend.yearsLabel} years</span>
  </div>`;
}

function computeActiveTrend() {
  const rows = getActiveRows();
  if (!rows?.length) return null;

  let series = extractSeries(rows, APP_STATE.activeMetric, APP_STATE.activeResolution);
  series = filterTrendSeries(series);
  if (series.length < 2) return null;

  const xMean = d3.mean(series, point => point.x);
  const yMean = d3.mean(series, point => point.value);
  const denominator = series.reduce((sum, point) => sum + (point.x - xMean) ** 2, 0);
  const slope = denominator
    ? series.reduce((sum, point) => sum + (point.x - xMean) * (point.value - yMean), 0) / denominator
    : 0;
  const xMin = series[0].x;
  const xMax = series[series.length - 1].x;
  const yearMin = series[0].year;
  const yearMax = series[series.length - 1].year;
  const metric = METRICS[APP_STATE.activeMetric];
  const digits = metric.unit === '°C' || metric.unit === 'm/s' ? 3 : 2;
  const direction = slope >= 0 ? '+' : '';
  const total = slope * (xMax - xMin || 1);
  const totalDirection = total >= 0 ? '+' : '';

  return {
    perYearLabel: `${direction}${slope.toFixed(digits)} ${metric.unit}/year`,
    totalLabel: `${totalDirection}${total.toFixed(metric.unit === 'mm' ? 0 : 2)} ${metric.unit}`,
    yearsLabel: Math.max(1, yearMax - yearMin),
    count: series.length,
    className: trendRecordClass(APP_STATE.activeMetric, slope),
  };
}

function trendRecordClass(metricKey, slope) {
  if (metricKey === 'temp') return slope >= 0 ? 'hot' : 'cold';
  return {
    precip: 'wet',
    wind: 'wind',
    sun: 'sun',
  }[metricKey] || '';
}

function filterTrendSeries(series) {
  if (APP_STATE.focusRange) {
    return series.filter(point =>
      point.year >= APP_STATE.focusRange.start && point.year <= APP_STATE.focusRange.end
    );
  }

  if (APP_STATE.activeRange > 0) {
    const endYear = getSeriesRangeEndYear(series);
    return series.filter(point =>
      point.year >= endYear - APP_STATE.activeRange && point.year <= endYear
    );
  }

  return series;
}

function getSeriesRangeEndYear(series) {
  const minYear = series[0]?.year;
  const maxYear = series[series.length - 1]?.year;
  if (minYear === undefined || maxYear === undefined) return maxYear;

  if (APP_STATE.activeResolution === 'm') {
    const latestPoint = series[series.length - 1];
    if (latestPoint.year > minYear && latestPoint.month && latestPoint.month < 12) {
      return latestPoint.year - 1;
    }
  }

  return maxYear;
}

function toggleDrawer() {
  APP_STATE.drawerOpen = !APP_STATE.drawerOpen;
  document.getElementById('records-drawer').classList.toggle('open', APP_STATE.drawerOpen);

  if (APP_STATE.drawerOpen && APP_STATE.activeStation) {
    loadDailyRecords(APP_STATE.activeStation.id);
  }
}

async function loadDailyRecords(stationId) {
  const grid = document.getElementById('records-grid');
  if (!grid) return;
  if (APP_STATE.activeStation?.id !== stationId) return;

  if (!DATA_CACHE[`${stationId}_d`]) {
    renderRecords(stationId, { dailyStatus: 'loading' });
    try {
      await fetchData(stationId, 'd');
      if (APP_STATE.activeStation?.id !== stationId) return;
    } catch (error) {
      if (APP_STATE.activeStation?.id !== stationId) return;
      renderRecords(stationId, { dailyStatus: 'error' });
      return;
    }
  }

  renderRecords(stationId);
}

function jumpToRecord(metricKey, recordKey) {
  if (!APP_STATE.activeStation) return;

  const records = computeRecords(APP_STATE.activeStation.id);
  const point = records?.[recordKey];
  if (!point) return;

  setActiveMetric(metricKey);
  APP_STATE.activeResolution = 'm';
  APP_STATE.activeRange = 5;
  APP_STATE.activeRecordKey = recordKey;
  APP_STATE.focusRange = {
    start: point.year - 2,
    end: point.year + 2,
  };

  document.querySelectorAll('.res-btn').forEach(button =>
    button.classList.toggle('active', button.dataset.res === 'm')
  );
  document.querySelectorAll('.time-btn').forEach(button =>
    button.classList.toggle('active', parseInt(button.dataset.years, 10) === 5)
  );

  const cacheKey = `${APP_STATE.activeStation.id}_m`;
  if (DATA_CACHE[cacheKey]) {
    drawChart(DATA_CACHE[cacheKey]);
    updateTimeNav();
  } else {
    loadAndDraw(APP_STATE.activeStation.id);
  }
}

function getDataYearBounds() {
  const rows = getActiveRows();
  if (!rows || rows.length === 0) return null;
  const data = extractSeries(rows, APP_STATE.activeMetric, APP_STATE.activeResolution);
  if (!data.length) return null;
  return {
    rows,
    minYear: data[0].year,
    maxYear: data[data.length - 1].year,
    rangeEnd: getSeriesRangeEndYear(data),
  };
}

document.getElementById('compare-btn').addEventListener('click', toggleCompareMode);
document.getElementById('remove-compare-btn').addEventListener('click', clearCompareStation);
document.getElementById('layout-switcher').addEventListener('click', event => {
  const btn = event.target.closest('.layout-btn');
  if (btn) setChartLayout(btn.dataset.layout);
});

function toggleCompareMode() {
  if (APP_STATE.compareStation) return;
  APP_STATE.compareMode = !APP_STATE.compareMode;
  const btn = document.getElementById('compare-btn');
  if (APP_STATE.compareMode) {
    btn.classList.add('active');
    btn.textContent = 'Click a station on the map…';
  } else {
    btn.classList.remove('active');
    btn.textContent = '+ Compare station';
  }
}

function setCompareStation(station) {
  APP_STATE.compareStation = station;
  APP_STATE.compareMode = false;
  document.getElementById('compare-btn').classList.remove('active');
  document.getElementById('compare-btn').textContent = '+ Compare station';
  document.getElementById('st-name-2').textContent = station.name;
  document.getElementById('st-meta-2').textContent =
    `${station.canton} - ${station.alt} m a.s.l.`;
  document.getElementById('compare-card').classList.remove('hidden');
  document.getElementById('layout-switcher').classList.remove('hidden');

  fetchData(station.id, APP_STATE.activeResolution)
    .then(() => { if (APP_STATE.compareStation?.id === station.id) drawChart(getActiveRows()); })
    .catch(() => {});
}

function clearCompareStation() {
  APP_STATE.compareStation = null;
  APP_STATE.compareMode = false;
  document.getElementById('compare-card').classList.add('hidden');
  document.getElementById('layout-switcher').classList.add('hidden');
  document.getElementById('compare-btn').classList.remove('active');
  document.getElementById('compare-btn').textContent = '+ Compare station';
  document.body.classList.remove('split-chart-active');
  window.clearCompareMarker?.();
  const rows = getActiveRows();
  if (rows) drawChart(rows);
}

function setChartLayout(layout) {
  APP_STATE.chartLayout = layout;
  document.querySelectorAll('.layout-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.layout === layout)
  );
  const rows = getActiveRows();
  if (rows) drawChart(rows);
}

function shiftPeriod(direction) {
  if (APP_STATE.activeRange === 0) return;
  const bounds = getDataYearBounds();
  if (!bounds) return;

  const { rows, minYear, maxYear, rangeEnd } = bounds;
  const span = APP_STATE.activeRange;

  const currentEnd   = APP_STATE.focusRange ? APP_STATE.focusRange.end   : rangeEnd;
  const currentStart = APP_STATE.focusRange ? APP_STATE.focusRange.start : Math.max(minYear, rangeEnd - span);

  let newStart = currentStart + direction * span;
  let newEnd   = currentEnd   + direction * span;

  if (newEnd > maxYear)   { newEnd = maxYear;           newStart = Math.max(minYear, maxYear - span); }
  if (newStart < minYear) { newStart = minYear;         newEnd   = Math.min(maxYear, minYear + span); }

  APP_STATE.focusRange = { start: newStart, end: newEnd };
  updateTimeNav();
  drawChart(rows);
  if (APP_STATE.activeStation) renderRecords(APP_STATE.activeStation.id);
}

function updateTimeNav() {
  const nav = document.getElementById('time-nav');
  if (!nav) return;

  if (APP_STATE.activeRange === 0) {
    nav.style.display = 'none';
    return;
  }
  nav.style.display = 'flex';

  const bounds = getDataYearBounds();
  if (!bounds) return;

  const { minYear, maxYear, rangeEnd } = bounds;
  const span  = APP_STATE.activeRange;
  const start = APP_STATE.focusRange ? APP_STATE.focusRange.start : Math.max(minYear, rangeEnd - span);
  const end   = APP_STATE.focusRange ? APP_STATE.focusRange.end   : rangeEnd;

  document.getElementById('prev-period').disabled = start <= minYear;
  document.getElementById('next-period').disabled = end   >= maxYear;
  document.getElementById('time-nav-label').textContent = `${start}–${end}`;
}

window.toggleDrawer = toggleDrawer;
window.jumpToRecord = jumpToRecord;
window.setCompareStation = setCompareStation;
