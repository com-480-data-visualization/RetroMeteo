const COMPARE_COLOR = '#7c5af0';

function drawChart(rowsArg) {
  if (!APP_STATE.activeStation) return;

  const station = APP_STATE.activeStation;
  const metricKey = APP_STATE.activeMetric;
  const metric = METRICS[metricKey];
  const resolution = APP_STATE.activeResolution;
  const rows = rowsArg || DATA_CACHE[`${station.id}_${resolution}`];
  if (!rows) return;

  const compareKey = `${APP_STATE.compareStation?.id}_${resolution}`;
  const compareRows = APP_STATE.compareStation ? DATA_CACHE[compareKey] : null;
  setSplitChartActive(Boolean(compareRows && APP_STATE.chartLayout === 'split'));
  if (compareRows) {
    return APP_STATE.chartLayout === 'split'
      ? drawSplitChart(rows, compareRows, station, APP_STATE.compareStation, metricKey, metric, resolution)
      : drawOverlayChart(rows, compareRows, station, APP_STATE.compareStation, metricKey, metric, resolution);
  }

  let data = extractSeries(rows, metricKey, resolution);

  if (!data.length) {
    document.getElementById('chart-title').textContent = `${metric.label} is not available`;
    document.getElementById('chart-meta').textContent = station.name;
    document.getElementById('chart-empty').textContent =
      `${metric.label} is not available at ${station.name} for this resolution.`;
    document.getElementById('chart-empty').classList.remove('hidden');
    document.getElementById('chart-svg-wrap').classList.add('hidden');
    document.getElementById('year-scrubber')?.classList.add('hidden');
    return;
  }

  syncYearScrubberDomain(data);
  data = filterSeries(data);

  if (!data.length) {
    document.getElementById('chart-empty').textContent = 'No data in selected time range.';
    document.getElementById('chart-empty').classList.remove('hidden');
    document.getElementById('chart-svg-wrap').classList.add('hidden');
    document.getElementById('year-scrubber')?.classList.add('hidden');
    return;
  }

  const [xMin, xMax] = getChartXDomain(data, resolution);
  const yearMin = data[0].year;
  const yearMax = data[data.length - 1].year;
  const aggregation = resolution === 'y' ? metric.yearAgg : metric.monthAgg;

  document.getElementById('chart-title').textContent =
    `${metric.label} (${metric.unit}) - ${aggregation}`;
  document.getElementById('chart-meta').textContent =
    `${station.name} - ${yearMin}-${yearMax}`;
  document.getElementById('period-badge').textContent = `${yearMin}-${yearMax}`;

  document.getElementById('chart-empty').classList.add('hidden');
  const wrap = document.getElementById('chart-svg-wrap');
  wrap.classList.remove('hidden');
  wrap.innerHTML = '';

  const { W, H } = getChartSize(wrap, 108);
  const margin = { top: 8, right: 18, bottom: 24, left: 50 };
  const iW = W - margin.left - margin.right;
  const iH = H - margin.top - margin.bottom;
  const xRange = getPlotXRange(iW, margin);

  const svg = d3.select(wrap)
    .append('svg')
    .attr('width', W)
    .attr('height', H);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear()
    .domain(xMin === xMax ? [xMin - 0.5, xMax + 0.5] : [xMin, xMax])
    .range(xRange);

  const yExtent = d3.extent(data, point => point.value);
  const ySpan = yExtent[1] - yExtent[0] || 1;
  const yPad = Math.max(ySpan * 0.16, metricKey === 'temp' ? 0.4 : 0.01);
  const yScale = d3.scaleLinear()
    .domain([yExtent[0] - yPad, yExtent[1] + yPad])
    .nice()
    .range([iH, 0]);

  drawPlotBackdrop(g, iW, iH, margin);
  drawGridLines(g, yScale, xRange, 4);

  g.append('g')
    .attr('transform', `translate(0,${iH})`)
    .call(
      d3.axisBottom(xScale)
        .tickValues(getYearTicks(yearMin, yearMax))
        .tickFormat(value => d3.format('d')(value))
        .tickSize(3)
    )
    .call(styleAxis);

  g.append('g')
    .attr('transform', `translate(${xRange[0]},0)`)
    .call(d3.axisLeft(yScale).ticks(4).tickSize(3).tickFormat(value => formatYAxisTick(value, metricKey)))
    .call(styleAxis);

  const gradientId = `area-gradient-${metricKey}-${resolution}`;
  const defs = svg.append('defs');
  const gradient = defs.append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');

  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', metric.color)
    .attr('stop-opacity', 0.26);

  gradient.append('stop')
    .attr('offset', '58%')
    .attr('stop-color', metric.color)
    .attr('stop-opacity', 0.08);

  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', metric.color)
    .attr('stop-opacity', 0.02);

  const curve = resolution === 'm' ? d3.curveLinear : d3.curveMonotoneX;
  const area = d3.area()
    .x(point => xScale(point.x))
    .y0(iH)
    .y1(point => yScale(point.value))
    .curve(curve);

  const line = d3.line()
    .x(point => xScale(point.x))
    .y(point => yScale(point.value))
    .curve(curve);

  g.append('path')
    .datum(data)
    .attr('fill', `url(#${gradientId})`)
    .attr('d', area);

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', metric.color)
    .attr('stroke-width', resolution === 'm' ? 3 : 5)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('opacity', 0.13)
    .attr('d', line);

  const path = g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', metric.color)
    .attr('stroke-width', resolution === 'm' ? 1.7 : 2.6)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('d', line);

  const pathNode = path.node();
  if (pathNode) {
    const pathLength = pathNode.getTotalLength();
    path
      .attr('stroke-dasharray', pathLength)
      .attr('stroke-dashoffset', pathLength)
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);
  }

  if (resolution === 'y' && data.length <= 28) {
    g.selectAll('.point')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', point => xScale(point.x))
      .attr('cy', point => yScale(point.value))
      .attr('r', 2.8)
      .attr('fill', '#fff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 4)
      .attr('opacity', 0.72);

    g.selectAll('.point-core')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'point-core')
      .attr('cx', point => xScale(point.x))
      .attr('cy', point => yScale(point.value))
      .attr('r', 2.6)
      .attr('fill', metric.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.94);
  }

  drawRecordHighlight(g, data, xScale, yScale, iW, iH, metricKey, resolution);
  drawTrendLine(g, data, xScale, yScale, xMin, xMax, metric);
  drawActiveYearHighlight(g, data, xScale, yScale, iW, iH, metricKey, resolution);
  attachHover(svg, g, data, xScale, yScale, margin, iW, iH, metricKey, metric, resolution);
}

function filterSeries(data) {
  if (APP_STATE.focusRange) {
    return data.filter(point =>
      point.year >= APP_STATE.focusRange.start && point.year <= APP_STATE.focusRange.end
    );
  }

  if (APP_STATE.activeRange > 0) {
    const endYear = getChartRangeEndYear(data);
    return data.filter(point =>
      point.year >= endYear - APP_STATE.activeRange && point.year <= endYear
    );
  }

  return data;
}

function getChartRangeEndYear(data) {
  const minYear = data[0].year;
  const maxYear = data[data.length - 1].year;

  if (APP_STATE.activeResolution === 'm') {
    const latestPoint = data[data.length - 1];
    if (latestPoint.year > minYear && latestPoint.month && latestPoint.month < 12) {
      return latestPoint.year - 1;
    }
  }

  return maxYear;
}

function getChartXDomain(data, resolution) {
  if (!data.length) return [0, 1];

  const yearMin = Math.min(...data.map(point => point.year));
  const yearMax = Math.max(...data.map(point => point.year));
  if (resolution === 'm') {
    const latestPoint = data.reduce((latest, point) => point.x > latest.x ? point : latest, data[0]);
    const latestMonth = latestPoint.month || 12;
    const xMax = latestMonth >= 12 ? yearMax + 1 : latestPoint.x + 0.5 / 12;
    return [yearMin, xMax];
  }

  const xMin = Math.min(...data.map(point => point.x));
  const xMax = Math.max(...data.map(point => point.x));
  return xMin === xMax ? [xMin - 0.5, xMax + 0.5] : [yearMin, yearMax];
}

function getYearTicks(yearMin, yearMax) {
  const span = Math.max(1, yearMax - yearMin);
  const step = span > 100 ? 20 : span > 50 ? 10 : span > 20 ? 5 : span > 10 ? 2 : 1;
  const ticks = [];

  for (let year = Math.ceil(yearMin / step) * step; year <= yearMax; year += step) {
    ticks.push(year);
  }

  ticks.unshift(yearMin);
  ticks.push(yearMax);
  return [...new Set(ticks)].sort((a, b) => a - b);
}

function setSplitChartActive(isActive) {
  document.body.classList.toggle('split-chart-active', isActive);
}

function drawRecordHighlight(g, data, xScale, yScale, iW, iH, metricKey, resolution) {
  const defaultRecordKey = { temp: 'hot', precip: 'wet', sun: 'sun' }[metricKey];
  const recordKey = APP_STATE.activeRecordKey || defaultRecordKey;
  if (!recordKey) return;

  const recordMetric = { hot: 'temp', cold: 'temp', wet: 'precip', wind: 'wind', sun: 'sun' }[recordKey];
  if (recordMetric !== metricKey) return;

  const records = APP_STATE.activeStation && computeRecords(APP_STATE.activeStation.id);
  const record = records?.[recordKey];
  if (!record) return;

  const match = data.find(point =>
    point.year === record.year && (resolution === 'y' || point.month === record.month)
  );
  if (!match) return;

  const x = xScale(match.x);
  const y = yScale(match.value);
  const metric = METRICS[metricKey];
  const label = resolution === 'y'
    ? `${formatValue(match.value, metricKey)} (${match.year})`
    : `${formatValue(match.value, metricKey)} - ${monthLabel(match.year, match.month)}`;
  const plotBounds = getXRangeBounds(xScale);

  g.append('line')
    .attr('x1', x)
    .attr('x2', x)
    .attr('y1', 0)
    .attr('y2', iH)
    .attr('stroke', metric.color)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3 3')
    .attr('opacity', 0.42);

  g.append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', 10)
    .attr('fill', metric.color)
    .attr('opacity', 0.14);

  g.append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', 4.8)
    .attr('fill', metric.color)
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.6);

  const labelWidth = Math.min(label.length * 5.8 + 12, plotBounds.width - 4);
  const labelX = Math.max(
    plotBounds.left + 2,
    Math.min(plotBounds.right - labelWidth - 2, x - labelWidth / 2)
  );
  const sitsAbove = y > 24;
  const labelY = sitsAbove ? y - 24 : y + 12;

  g.append('rect')
    .attr('x', labelX)
    .attr('y', labelY)
    .attr('width', labelWidth)
    .attr('height', 16)
    .attr('rx', 6)
    .attr('fill', metric.color)
    .attr('opacity', 0.92);

  g.append('text')
    .attr('x', labelX + labelWidth / 2)
    .attr('y', labelY + 11)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'DM Mono, monospace')
    .attr('font-size', 9.5)
    .attr('font-weight', 500)
    .attr('fill', '#fff')
    .text(label);
}

function drawActiveYearHighlight(g, data, xScale, yScale, iW, iH, metricKey, resolution) {
  const year = APP_STATE.activeYear;
  if (year === null || year === undefined) return;

  const xDomain = xScale.domain();
  if (year < Math.floor(xDomain[0]) || year > Math.ceil(xDomain[1])) return;

  const metric = METRICS[metricKey];
  const yearlyPoints = data.filter(point => point.year === year);
  if (!yearlyPoints.length) return;

  const highlightPoint = resolution === 'm'
    ? getMonthlyHighlightPoint(yearlyPoints, xDomain, year)
    : yearlyPoints[0];
  const x = xScale(highlightPoint.x);
  const value = highlightPoint.value;
  const y = yScale(value);
  const average = d3.mean(data, point => point.value);
  const anomaly = value - average;
  const color = anomalyColor(metricKey, anomaly);
  const valueLabel = formatValue(value, metricKey);
  const label = resolution === 'm'
    ? `${monthLabel(highlightPoint.year, highlightPoint.month)}: ${valueLabel}`
    : `${year}: ${valueLabel}`;
  const plotBounds = getXRangeBounds(xScale);

  if (resolution === 'm') {
    const bandStart = Math.max(xDomain[0], year);
    const bandEnd = Math.min(xDomain[1], year + 1);
    g.append('rect')
      .attr('x', xScale(bandStart))
      .attr('y', 0)
      .attr('width', Math.max(2, xScale(bandEnd) - xScale(bandStart)))
      .attr('height', iH)
      .attr('fill', color)
      .attr('opacity', 0.09);
  }

  g.append('line')
    .attr('x1', x)
    .attr('x2', x)
    .attr('y1', 0)
    .attr('y2', iH)
    .attr('stroke', color)
    .attr('stroke-width', 1.4)
    .attr('stroke-dasharray', '4 4')
    .attr('opacity', 0.72);

  g.append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', 11)
    .attr('fill', color)
    .attr('opacity', 0.16);

  g.append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', 5)
    .attr('fill', color)
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.8);

  const labelWidth = Math.min(label.length * 6 + 14, plotBounds.width - 4);
  const labelX = Math.max(
    plotBounds.left + 2,
    Math.min(plotBounds.right - labelWidth - 2, x - labelWidth / 2)
  );
  const labelY = y > 25 ? y - 25 : y + 12;

  g.append('rect')
    .attr('x', labelX)
    .attr('y', labelY)
    .attr('width', labelWidth)
    .attr('height', 17)
    .attr('rx', 6)
    .attr('fill', color)
    .attr('opacity', 0.94);

  g.append('text')
    .attr('x', labelX + labelWidth / 2)
    .attr('y', labelY + 12)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'DM Mono, monospace')
    .attr('font-size', 9.5)
    .attr('font-weight', 500)
    .attr('fill', '#fff')
    .text(label);

}

function getMonthlyHighlightPoint(points, xDomain, year) {
  const targetX = Math.max(xDomain[0], Math.min(year + 0.5, xDomain[1]));
  return points.reduce((closest, point) =>
    Math.abs(point.x - targetX) < Math.abs(closest.x - targetX) ? point : closest
  );
}

function anomalyColor(metricKey, anomaly) {
  if (Math.abs(anomaly) < 0.0001) return '#8c97a8';

  const palettes = {
    temp: { positive: '#c0392b', negative: '#1a6fc4' },
    precip: { positive: '#1a6fc4', negative: '#b45309' },
    sun: { positive: '#b45309', negative: '#1a6fc4' },
    wind: { positive: '#2d7a4f', negative: '#6b7280' },
  };

  const palette = palettes[metricKey] || palettes.temp;
  return anomaly >= 0 ? palette.positive : palette.negative;
}

function drawTrendLine(g, data, xScale, yScale, xMin, xMax, metric) {
  const xMean = d3.mean(data, point => point.x);
  const yMean = d3.mean(data, point => point.value);
  const denominator = d3.sum(data, point => (point.x - xMean) ** 2);
  const slope = denominator
    ? d3.sum(data, point => (point.x - xMean) * (point.value - yMean)) / denominator
    : 0;
  const intercept = yMean - slope * xMean;

  g.append('line')
    .attr('x1', xScale(xMin))
    .attr('y1', yScale(slope * xMin + intercept))
    .attr('x2', xScale(xMax))
    .attr('y2', yScale(slope * xMax + intercept))
    .attr('stroke', metric.trendColor)
    .attr('stroke-width', 1.8)
    .attr('stroke-dasharray', '6 5')
    .attr('opacity', 0.78);

  document.getElementById('temp-badge').textContent =
    APP_STATE.activeMetric === 'temp' ? 'Warming signal' : `${metric.label} signal`;
}

function attachHover(svg, g, data, xScale, yScale, margin, iW, iH, metricKey, metric, resolution) {
  const hover = g.append('g').style('display', 'none');
  const plotBounds = getXRangeBounds(xScale);

  hover.append('line')
    .attr('y1', 0)
    .attr('y2', iH)
    .attr('stroke', metric.color)
    .attr('stroke-opacity', 0.28)
    .attr('stroke-width', 1.2)
    .attr('stroke-dasharray', '3 4');

  hover.append('circle')
    .attr('r', 5.2)
    .attr('fill', metric.color)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2.4);

  const hoverLabel = hover.append('g');
  const hoverRect = hoverLabel.append('rect')
    .attr('rx', 6)
    .attr('fill', 'rgba(255,255,255,0.94)')
    .attr('stroke', 'rgba(21,37,62,0.10)');
  const hoverText = hoverLabel.append('text')
    .attr('font-family', 'DM Mono, monospace')
    .attr('font-size', 10)
    .attr('fill', '#17202c');

  svg.append('rect')
    .attr('x', margin.left + plotBounds.left)
    .attr('y', margin.top)
    .attr('width', plotBounds.width)
    .attr('height', iH)
    .attr('fill', 'transparent')
    .on('mouseenter', () => hover.style('display', null))
    .on('mouseleave', () => hover.style('display', 'none'))
    .on('mousemove', event => {
      const [mouseX] = d3.pointer(event, g.node());
      const xValue = xScale.invert(mouseX);
      const point = data.reduce((closest, current) =>
        Math.abs(current.x - xValue) < Math.abs(closest.x - xValue) ? current : closest
      );
      const x = xScale(point.x);
      const y = yScale(point.value);
      const label = resolution === 'm' ? monthLabel(point.year, point.month) : point.year;

      hover.attr('transform', `translate(${x},0)`);
      hover.select('circle').attr('cy', y);
      hoverLabel
        .attr('transform', `translate(${x > plotBounds.right - 130 ? -124 : 8},${y > 24 ? y - 37 : y + 10})`);
      hoverText
        .attr('x', 8)
        .attr('y', 13)
        .text(`${label}: ${formatValue(point.value, metricKey)}`);
      const bbox = hoverText.node().getBBox();
      hoverRect
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', bbox.width + 16)
        .attr('height', 21);
    });
}

function styleAxis(axis) {
  axis.select('.domain').attr('stroke', 'rgba(21,37,62,0.08)');
  axis.selectAll('.tick line').attr('stroke', 'rgba(21,37,62,0.12)');
  axis.selectAll('.tick text')
    .attr('font-family', 'DM Mono, monospace')
    .attr('font-size', '10px')
    .attr('fill', '#8c97a8');
}

function formatYAxisTick(value, metricKey) {
  const abs = Math.abs(value);

  if (metricKey === 'temp' || metricKey === 'wind') {
    return abs < 10 ? value.toFixed(1) : value.toFixed(0);
  }

  if (abs >= 1000) return formatCompactK(value);
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 10) return value.toFixed(metricKey === 'precip' ? 0 : 1);
  return value.toFixed(1);
}

function formatCompactK(value) {
  const compact = value / 1000;
  const rounded = Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1);
  return `${rounded}k`;
}

function getChartSize(wrap, minHeight) {
  const W = wrap.clientWidth || 640;
  const panel = document.getElementById('chart-panel');
  const fallbackH = panel ? panel.clientHeight - 86 : minHeight;
  const H = Math.max(minHeight, wrap.clientHeight || fallbackH || minHeight);
  return { W, H };
}

function getPlotXRange(width, margin) {
  const inset = 35;
  return [-margin.left + inset, width + margin.right - inset];
}

function getXRangeBounds(xScale) {
  const [rangeA, rangeB] = xScale.range();
  const left = Math.min(rangeA, rangeB);
  const right = Math.max(rangeA, rangeB);
  return { left, right, width: right - left };
}

function drawPlotBackdrop(g, width, height, margin = { top: 0, right: 0, bottom: 0, left: 0 }) {
  const inset = 0.5;
  g.append('rect')
    .attr('x', -margin.left + inset)
    .attr('y', -margin.top + inset)
    .attr('width', width + margin.left + margin.right - inset * 2)
    .attr('height', height + margin.top + margin.bottom - inset * 2)
    .attr('rx', 8)
    .attr('fill', 'rgba(255,255,255,0.34)')
    .attr('stroke', 'rgba(21,37,62,0.055)');
}

function drawGridLines(g, yScale, xRange, tickCount) {
  const [x1, x2] = xRange;

  g.selectAll('.grid-y')
    .data(yScale.ticks(tickCount))
    .enter()
    .append('line')
    .attr('class', 'grid-y')
    .attr('x1', x1)
    .attr('x2', x2)
    .attr('y1', value => yScale(value))
    .attr('y2', value => yScale(value))
    .attr('stroke', 'rgba(21,37,62,0.075)')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '2 5')
    .attr('stroke-linecap', 'round');
}

function drawSeriesOnG(g, svg, data, color, gradId, curve, xScale, yScale, iH, resolution) {
  const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
  const grad = defs.append('linearGradient')
    .attr('id', gradId).attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
  grad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.22);
  grad.append('stop').attr('offset', '58%').attr('stop-color', color).attr('stop-opacity', 0.07);
  grad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.01);

  const area = d3.area().x(p => xScale(p.x)).y0(iH).y1(p => yScale(p.value)).curve(curve);
  const line = d3.line().x(p => xScale(p.x)).y(p => yScale(p.value)).curve(curve);

  g.append('path').datum(data).attr('fill', `url(#${gradId})`).attr('d', area);
  g.append('path').datum(data)
    .attr('fill', 'none').attr('stroke', color)
    .attr('stroke-width', resolution === 'm' ? 2.8 : 4.6)
    .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round')
    .attr('opacity', 0.12)
    .attr('d', line);
  const path = g.append('path').datum(data)
    .attr('fill', 'none').attr('stroke', color)
    .attr('stroke-width', resolution === 'm' ? 1.7 : 2.5)
    .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round')
    .attr('d', line);
  const pathNode = path.node();
  if (pathNode) {
    const l = pathNode.getTotalLength();
    path.attr('stroke-dasharray', l).attr('stroke-dashoffset', l)
      .transition().duration(650).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);
  }
}

function drawOverlayChart(rows1, rows2, station1, station2, metricKey, metric, resolution) {
  const data1 = filterSeries(extractSeries(rows1, metricKey, resolution));
  const data2 = filterSeries(extractSeries(rows2, metricKey, resolution));

  const aggregation = resolution === 'y' ? metric.yearAgg : metric.monthAgg;
  document.getElementById('chart-title').textContent = `${metric.label} (${metric.unit}) - ${aggregation}`;
  document.getElementById('chart-meta').textContent = `${station1.name}  vs  ${station2.name}`;
  document.getElementById('chart-empty').classList.add('hidden');

  const wrap = document.getElementById('chart-svg-wrap');
  wrap.classList.remove('hidden');
  wrap.innerHTML = '';

  if (!data1.length && !data2.length) {
    document.getElementById('chart-empty').textContent = 'No data in selected time range.';
    document.getElementById('chart-empty').classList.remove('hidden');
    wrap.classList.add('hidden');
    return;
  }

  const allData = [...data1, ...data2];
  const [xMin, xMax] = getChartXDomain(allData, resolution);
  const yearMin = Math.min(...allData.map(p => p.year));
  const yearMax = Math.max(...allData.map(p => p.year));
  document.getElementById('period-badge').textContent = `${yearMin}–${yearMax}`;

  const { W, H } = getChartSize(wrap, 132);
  const margin = { top: 8, right: 18, bottom: 24, left: 50 };
  const iW = W - margin.left - margin.right;
  const iH = H - margin.top - margin.bottom;
  const xRange = getPlotXRange(iW, margin);

  const svg = d3.select(wrap).append('svg').attr('width', W).attr('height', H);
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear()
    .domain(xMin === xMax ? [xMin - 0.5, xMax + 0.5] : [xMin, xMax])
    .range(xRange);

  const yExtent = d3.extent(allData, p => p.value);
  const ySpan = yExtent[1] - yExtent[0] || 1;
  const yPad = Math.max(ySpan * 0.16, metricKey === 'temp' ? 0.4 : 0.01);
  const yScale = d3.scaleLinear()
    .domain([yExtent[0] - yPad, yExtent[1] + yPad]).nice().range([iH, 0]);

  drawPlotBackdrop(g, iW, iH, margin);
  drawGridLines(g, yScale, xRange, 4);

  g.append('g').attr('transform', `translate(0,${iH})`)
    .call(d3.axisBottom(xScale)
      .tickValues(getYearTicks(yearMin, yearMax))
      .tickFormat(v => d3.format('d')(v)).tickSize(3))
    .call(styleAxis);
  g.append('g')
    .attr('transform', `translate(${xRange[0]},0)`)
    .call(d3.axisLeft(yScale).ticks(4).tickSize(3).tickFormat(value => formatYAxisTick(value, metricKey)))
    .call(styleAxis);

  const curve = resolution === 'm' ? d3.curveLinear : d3.curveMonotoneX;
  if (data1.length) drawSeriesOnG(g, svg, data1, metric.color, `ov-grad-1-${metricKey}`, curve, xScale, yScale, iH, resolution);
  if (data2.length) drawSeriesOnG(g, svg, data2, COMPARE_COLOR, `ov-grad-2-${metricKey}`, curve, xScale, yScale, iH, resolution);

  // Legend
  const legend = g.append('g').attr('transform', `translate(2, 2)`);
  [[station1.name, metric.color], [station2.name, COMPARE_COLOR]].forEach(([name, color], i) => {
    const row = legend.append('g').attr('transform', `translate(0, ${i * 14})`);
    row.append('line').attr('x1', 0).attr('x2', 14).attr('y1', 5).attr('y2', 5)
      .attr('stroke', color).attr('stroke-width', 2).attr('stroke-linecap', 'round');
    row.append('text').attr('x', 18).attr('y', 9)
      .attr('font-family', 'DM Mono, monospace').attr('font-size', 9).attr('fill', '#17202c')
      .text(name.length > 18 ? name.slice(0, 18) + '…' : name);
  });

  // Hover for both series
  const hover = g.append('g').style('display', 'none');
  const plotBounds = getXRangeBounds(xScale);
  hover.append('line').attr('y1', 0).attr('y2', iH)
    .attr('stroke', 'rgba(21,37,62,0.18)')
    .attr('stroke-width', 1.1)
    .attr('stroke-dasharray', '3 4');
  const circ1 = hover.append('circle').attr('r', 5).attr('fill', metric.color).attr('stroke', '#fff').attr('stroke-width', 2.3);
  const circ2 = hover.append('circle').attr('r', 5).attr('fill', COMPARE_COLOR).attr('stroke', '#fff').attr('stroke-width', 2.3);
  const hoverText1 = hover.append('text').attr('font-family', 'DM Mono, monospace').attr('font-size', 10).attr('fill', '#17202c');
  const hoverText2 = hover.append('text').attr('font-family', 'DM Mono, monospace').attr('font-size', 10).attr('fill', COMPARE_COLOR);

  svg.append('rect').attr('x', margin.left + plotBounds.left).attr('y', margin.top).attr('width', plotBounds.width).attr('height', iH)
    .attr('fill', 'transparent')
    .on('mouseenter', () => hover.style('display', null))
    .on('mouseleave', () => hover.style('display', 'none'))
    .on('mousemove', event => {
      const [mouseX] = d3.pointer(event, g.node());
      const xValue = xScale.invert(mouseX);
      const nearest = arr => arr.length === 0 ? null :
        arr.reduce((c, p) => Math.abs(p.x - xValue) < Math.abs(c.x - xValue) ? p : c);
      const p1 = nearest(data1);
      const p2 = nearest(data2);
      const ref = p1 || p2;
      hover.attr('transform', `translate(${xScale(ref.x)}, 0)`);
      const isRight = xScale(ref.x) > plotBounds.right - 130;
      const tx = isRight ? -8 : 8;
      const anchor = isRight ? 'end' : 'start';
      if (p1) {
        const y1 = yScale(p1.value);
        circ1.attr('cy', y1);
        const lbl = resolution === 'm' ? monthLabel(p1.year, p1.month) : p1.year;
        hoverText1.attr('x', tx).attr('text-anchor', anchor).attr('y', y1 > 20 ? y1 - 8 : y1 + 16)
          .text(`${lbl}: ${formatValue(p1.value, metricKey)}`);
      }
      if (p2) {
        const y2 = yScale(p2.value);
        circ2.attr('cy', y2);
        hoverText2.attr('x', tx).attr('text-anchor', anchor).attr('y', y2 > 32 ? y2 - 20 : y2 + 28)
          .text(formatValue(p2.value, metricKey));
      }
    });
}

function drawSplitChart(rows1, rows2, station1, station2, metricKey, metric, resolution) {
  const data1 = filterSeries(extractSeries(rows1, metricKey, resolution));
  const data2 = filterSeries(extractSeries(rows2, metricKey, resolution));

  const aggregation = resolution === 'y' ? metric.yearAgg : metric.monthAgg;
  document.getElementById('chart-title').textContent = `${metric.label} (${metric.unit}) - ${aggregation}`;
  document.getElementById('chart-meta').textContent = `${station1.name}  vs  ${station2.name}`;
  document.getElementById('chart-empty').classList.add('hidden');

  const wrap = document.getElementById('chart-svg-wrap');
  wrap.classList.remove('hidden');
  wrap.innerHTML = '';

  const { H: totalH } = getChartSize(wrap, 132);
  const gap = 8;
  const chartH = Math.floor((totalH - gap) / 2);

  const allData = [...data1, ...data2];
  const [xMin, xMax] = getChartXDomain(allData, resolution);
  const yearMin = allData.length ? Math.min(...allData.map(p => p.year)) : 0;
  const yearMax = allData.length ? Math.max(...allData.map(p => p.year)) : 1;
  document.getElementById('period-badge').textContent = `${yearMin}–${yearMax}`;

  const metric2 = { ...metric, color: COMPARE_COLOR };

  [[data1, metric, station1, 'sp-grad-1'], [data2, metric2, station2, 'sp-grad-2']].forEach(([data, m, station, gradId], idx) => {
    const subWrap = document.createElement('div');
    if (idx === 1) subWrap.style.marginTop = `${gap}px`;
    wrap.appendChild(subWrap);

    const margin = { top: 8, right: 18, bottom: idx === 1 ? 24 : 8, left: 50 };
    const W = wrap.clientWidth || 640;
    const iW = W - margin.left - margin.right;
    const iH = chartH - margin.top - margin.bottom;
    const xRange = getPlotXRange(iW, margin);

    const svg = d3.select(subWrap).append('svg').attr('width', W).attr('height', chartH);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain(xMin === xMax ? [xMin - 0.5, xMax + 0.5] : [xMin, xMax])
      .range(xRange);

    const yExtent = data.length ? d3.extent(data, p => p.value) : [0, 1];
    const ySpan = yExtent[1] - yExtent[0] || 1;
    const yPad = Math.max(ySpan * 0.16, metricKey === 'temp' ? 0.4 : 0.01);
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - yPad, yExtent[1] + yPad]).nice().range([iH, 0]);

    drawPlotBackdrop(g, iW, iH, margin);
    drawGridLines(g, yScale, xRange, 3);

    if (idx === 1) {
      g.append('g').attr('transform', `translate(0,${iH})`)
        .call(d3.axisBottom(xScale)
          .tickValues(getYearTicks(yearMin, yearMax))
          .tickFormat(v => d3.format('d')(v)).tickSize(3))
        .call(styleAxis);
    }
    g.append('g')
      .attr('transform', `translate(${xRange[0]},0)`)
      .call(d3.axisLeft(yScale).ticks(3).tickSize(3).tickFormat(value => formatYAxisTick(value, metricKey)))
      .call(styleAxis);

    if (data.length) {
      const curve = resolution === 'm' ? d3.curveLinear : d3.curveMonotoneX;
      drawSeriesOnG(g, svg, data, m.color, `${gradId}-${metricKey}`, curve, xScale, yScale, iH, resolution);
    }

    // Station label
    g.append('text').attr('x', 4).attr('y', 11)
      .attr('font-family', 'DM Mono, monospace').attr('font-size', 9).attr('font-weight', '700')
      .attr('fill', m.color).text(station.name);

    if (data.length) attachHover(svg, g, data, xScale, yScale, margin, iW, iH, metricKey, m, resolution);
  });
}
