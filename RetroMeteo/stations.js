const STATIONS = [
  { id: 'AIG', name: 'Aigle', canton: 'Vaud', alt: 381, lat: 46.318, lng: 6.960 },
  { id: 'BER', name: 'Bern/Zollikofen', canton: 'Bern', alt: 553, lat: 46.990, lng: 7.463 },
  { id: 'KLO', name: 'Zurich/Kloten', canton: 'Zurich', alt: 426, lat: 47.479, lng: 8.534 },
  { id: 'GVE', name: 'Geneva/Cointrin', canton: 'Geneva', alt: 412, lat: 46.248, lng: 6.129 },
  { id: 'LUG', name: 'Lugano', canton: 'Ticino', alt: 273, lat: 46.004, lng: 8.960 },
  { id: 'DAV', name: 'Davos', canton: 'Graubunden', alt: 1594, lat: 46.813, lng: 9.844 },
  { id: 'BAS', name: 'Basel/Binningen', canton: 'Basel-Land', alt: 316, lat: 47.541, lng: 7.583 },
  { id: 'SIO', name: 'Sion', canton: 'Valais', alt: 482, lat: 46.218, lng: 7.330 },
  { id: 'LUZ', name: 'Lucerne', canton: 'Lucerne', alt: 456, lat: 47.036, lng: 8.301 },
  { id: 'STG', name: 'St. Gallen', canton: 'St. Gallen', alt: 776, lat: 47.423, lng: 9.370 },
  { id: 'CHU', name: 'Chur', canton: 'Graubunden', alt: 556, lat: 46.868, lng: 9.530 },
  { id: 'NEU', name: 'Neuchatel', canton: 'Neuchatel', alt: 485, lat: 46.998, lng: 6.952 },
  { id: 'PAY', name: 'Payerne', canton: 'Vaud', alt: 490, lat: 46.812, lng: 6.944 },
  { id: 'SAE', name: 'Saentis', canton: 'St. Gallen', alt: 2502, lat: 47.249, lng: 9.343 },
  { id: 'INT', name: 'Interlaken', canton: 'Bern', alt: 577, lat: 46.670, lng: 7.870 },
  { id: 'ELM', name: 'Elm', canton: 'Glarus', alt: 958, lat: 46.927, lng: 9.174 },
];

const METRICS = {
  temp: {
    label: 'Temperature',
    unit: '°C',
    color: '#c0392b',
    trendColor: '#c0392b',
    yearCode: 'tre200y0',
    monthCode: 'tre200m0',
    yearAgg: 'yearly mean',
    monthAgg: 'monthly mean',
  },
  precip: {
    label: 'Precipitation',
    unit: 'mm',
    color: '#1a6fc4',
    trendColor: '#1a6fc4',
    yearCode: 'rre150y0',
    monthCode: 'rre150m0',
    yearAgg: 'yearly total',
    monthAgg: 'monthly total',
  },
  wind: {
    label: 'Wind speed',
    unit: 'm/s',
    color: '#2d7a4f',
    trendColor: '#2d7a4f',
    yearCode: 'fkl010y0',
    monthCode: 'fkl010m0',
    yearAgg: 'yearly mean',
    monthAgg: 'monthly mean',
  },
  sun: {
    label: 'Sunshine hours',
    unit: 'h',
    color: '#b45309',
    trendColor: '#b45309',
    yearCode: 'sre000y0',
    monthCode: 'sre000m0',
    yearAgg: 'yearly total',
    monthAgg: 'monthly total',
  },
};

const OGD_BASE = 'https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn';
const DATA_CACHE = {};
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function fetchData(stationId, resolution) {
  const cacheKey = `${stationId}_${resolution}`;
  if (DATA_CACHE[cacheKey]) return DATA_CACHE[cacheKey];

  const stationCode = stationId.toLowerCase();
  let rows;

  if (resolution === 'd') {
    const urls = [
      `${OGD_BASE}/${stationCode}/ogd-smn_${stationCode}_d_historical.csv`,
      `${OGD_BASE}/${stationCode}/ogd-smn_${stationCode}_d_recent.csv`,
    ];
    const responses = await Promise.all(urls.map(url => fetch(url)));
    const texts = await Promise.all(responses.filter(response => response.ok).map(response => response.text()));

    if (!texts.length) {
      throw new Error(`Could not load daily files (${responses.map(response => response.status).join(', ')})`);
    }

    rows = dedupeRows(texts.flatMap(parseCSV));
  } else {
    const url = `${OGD_BASE}/${stationCode}/ogd-smn_${stationCode}_${resolution}.csv`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    rows = parseCSV(await response.text());
  }

  DATA_CACHE[cacheKey] = rows;
  return rows;
}

function parseCSV(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  const headerLine = normalized.split('\n', 1)[0];
  const delimiter = headerLine.includes(';') ? ';' : ',';
  const parser = d3.dsvFormat(delimiter);

  return parser.parse(normalized, row => {
    const normalizedRow = {};
    Object.entries(row).forEach(([key, value]) => {
      normalizedRow[key.trim().toLowerCase()] = typeof value === 'string' ? value.trim() : value;
    });
    return normalizedRow;
  });
}

function dedupeRows(rows) {
  const seen = new Set();

  return rows.filter(row => {
    const keys = Object.keys(row);
    const dedupeKey = row.reference_timestamp || row.referenz_ts || keys.map(key => row[key]).join('|');
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
}

function parseDate(raw) {
  const value = String(raw || '').trim();
  let match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return { year: +match[1], month: +match[2], day: +match[3] };

  match = value.match(/^(\d{4})-(\d{2})/);
  if (match) return { year: +match[1], month: +match[2], day: null };

  match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (match) return { year: +match[1], month: +match[2], day: +match[3] };

  match = value.match(/^(\d{4})$/);
  if (match) return { year: +match[1], month: null, day: null };

  match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (match) return { year: +match[3], month: +match[2], day: +match[1] };

  match = value.match(/^(\d{2})\.(\d{4})/);
  if (match) return { year: +match[2], month: +match[1], day: null };

  return null;
}

function extractSeries(rows, metricKey, resolution) {
  if (!rows?.length) return [];

  const keys = Object.keys(rows[0]);
  const metric = METRICS[metricKey];
  const columnCode = resolution === 'y' ? metric.yearCode : metric.monthCode;
  const valueKey = columnCode.toLowerCase();
  const dateKey = findDateKey(keys);

  if (!keys.includes(valueKey)) return [];

  const series = [];
  rows.forEach(row => {
    const date = parseDate(row[dateKey]);
    if (!date || date.year < 1850 || date.year > 2035) return;

    let value = parseFloat(row[valueKey]);
    if (Number.isNaN(value)) return;

    value = normalizeMetricValue(value, metricKey);

    if (metricKey === 'sun' && resolution === 'm') {
      value /= 60;
    }

    const x = resolution === 'y' ? date.year : date.year + ((date.month || 1) - 0.5) / 12;
    series.push({ x, value, year: date.year, month: date.month, day: date.day });
  });

  series.sort((a, b) => a.x - b.x);

  const seen = new Set();
  return series.filter(point => {
    const key = point.x.toFixed(6);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeMetricValue(value, metricKey) {
  if (metricKey === 'precip' && Math.abs(value) > 5000) {
    return value / 100;
  }

  return value;
}

function findDateKey(keys) {
  const knownDateKeys = ['reference_timestamp', 'referenz_ts', 'date', 'datum', 'time', 'messdatum'];
  return knownDateKeys.find(key => keys.includes(key)) ||
    keys.find(key => key.includes('timestamp') || key.includes('date') || key.includes('datum')) ||
    keys[0];
}

function monthLabel(year, month) {
  return month ? `${MONTH_NAMES[(month - 1) % 12]} ${year}` : `${year}`;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function dateLabel(point) {
  if (!point) return '';
  if (point.day) return `${point.day} ${MONTH_NAMES[point.month - 1]} ${point.year}`;
  return point.month ? monthLabel(point.year, point.month) : `${point.year}`;
}

function computeRecords(stationId) {
  const rows = DATA_CACHE[`${stationId}_m`];
  if (!rows) return null;

  const tempSeries = extractSeries(rows, 'temp', 'm');
  const precipSeries = extractSeries(rows, 'precip', 'm');
  const windSeries = extractSeries(rows, 'wind', 'm');
  const sunSeries = extractSeries(rows, 'sun', 'm');

  return {
    hot: findExtremum(tempSeries, (a, b) => a >= b),
    cold: findExtremum(tempSeries, (a, b) => a <= b),
    wet: findExtremum(precipSeries, (a, b) => a >= b),
    wind: findExtremum(windSeries, (a, b) => a >= b),
    sun: findExtremum(sunSeries, (a, b) => a >= b),
  };
}

function findExtremum(series, keepCurrent) {
  if (!series.length) return null;
  const point = series.reduce((current, candidate) =>
    keepCurrent(current.value, candidate.value) ? current : candidate
  );
  return { value: point.value, year: point.year, month: point.month, day: point.day };
}

function computeDailyRecords(stationId) {
  const rows = DATA_CACHE[`${stationId}_d`];
  if (!rows?.length) return null;

  const keys = Object.keys(rows[0]);
  const dateKey = findDateKey(keys);

  return {
    hotDay: findDailyExtremum(rows, dateKey, 'tre200dx', true, 'temp'),
    coldDay: findDailyExtremum(rows, dateKey, 'tre200dn', false, 'temp'),
    wetDay: findDailyExtremum(rows, dateKey, 'rre150d0', true, 'precip'),
    windDay: findDailyExtremum(rows, dateKey, 'fkl010d0', true, 'wind'),
    sunDay: findDailyExtremum(rows, dateKey, 'sre000d0', true, 'sun'),
  };
}

function findDailyExtremum(rows, dateKey, columnCode, maximize, metricKey) {
  const valueKey = columnCode.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(rows[0], valueKey)) return null;

  let best = null;
  rows.forEach(row => {
    let value = parseFloat(row[valueKey]);
    const date = parseDate(row[dateKey]);
    if (Number.isNaN(value) || !date) return;
    value = normalizeMetricValue(value, metricKey);
    if (!best || (maximize ? value > best.value : value < best.value)) {
      best = { value, year: date.year, month: date.month, day: date.day };
    }
  });

  return best;
}

function formatValue(value, metricKey, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  return `${value.toFixed(digits)} ${METRICS[metricKey].unit}`;
}
