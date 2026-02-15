// ===== Mini Chart Library (Canvas-based) =====

const DPR = window.devicePixelRatio || 1;

function setupCanvas(canvas, width, height) {
  canvas.width = width * DPR;
  canvas.height = height * DPR;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);
  return ctx;
}

// ===== Line Chart =====
export function drawLineChart(canvas, { labels, datasets, yLabel = '', showDots = true }) {
  const width = canvas.parentElement?.clientWidth || 320;
  const height = 200;
  const ctx = setupCanvas(canvas, width, height);

  const pad = { top: 20, right: 20, bottom: 35, left: 45 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  // Clear
  ctx.clearRect(0, 0, width, height);

  if (!datasets || datasets.length === 0 || labels.length === 0) {
    drawEmptyState(ctx, width, height, 'Pas encore de données');
    return;
  }

  // Find y range across all datasets
  let allValues = datasets.flatMap(d => d.data);
  let yMin = Math.min(0, ...allValues);
  let yMax = Math.max(1, ...allValues);
  if (yMax === yMin) yMax = yMin + 1;

  // Y axis gridlines
  const ySteps = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#555577';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'right';

  for (let i = 0; i <= ySteps; i++) {
    const val = yMin + (yMax - yMin) * (i / ySteps);
    const y = pad.top + chartH - (i / ySteps) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillText(Math.round(val).toString(), pad.left - 8, y + 4);
  }

  // X axis labels
  ctx.textAlign = 'center';
  ctx.fillStyle = '#555577';
  const labelStep = Math.max(1, Math.floor(labels.length / 7));
  for (let i = 0; i < labels.length; i += labelStep) {
    const x = pad.left + (i / (labels.length - 1 || 1)) * chartW;
    ctx.fillText(labels[i], x, height - pad.bottom + 18);
  }

  // Draw each dataset
  for (const ds of datasets) {
    const data = ds.data;
    const color = ds.color || '#6c63ff';

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    gradient.addColorStop(0, color + '30');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = pad.left + (i / (data.length - 1 || 1)) * chartW;
      const y = pad.top + chartH - ((data[i] - yMin) / (yMax - yMin)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // Fill area
    const lastX = pad.left + chartW;
    ctx.lineTo(lastX, pad.top + chartH);
    ctx.lineTo(pad.left, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Stroke line
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = pad.left + (i / (data.length - 1 || 1)) * chartW;
      const y = pad.top + chartH - ((data[i] - yMin) / (yMax - yMin)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Dots
    if (showDots && data.length <= 31) {
      for (let i = 0; i < data.length; i++) {
        const x = pad.left + (i / (data.length - 1 || 1)) * chartW;
        const y = pad.top + chartH - ((data[i] - yMin) / (yMax - yMin)) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }
}

// ===== Donut Chart =====
export function drawDonutChart(canvas, { segments, centerText = '', centerSub = '' }) {
  const size = 200;
  const ctx = setupCanvas(canvas, size, size);

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = 85;
  const innerR = 58;

  const total = segments.reduce((s, seg) => s + seg.value, 0);

  if (total === 0) {
    // Empty donut
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();

    ctx.fillStyle = '#555577';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pas de données', cx, cy + 5);
    return;
  }

  let startAngle = -Math.PI / 2;

  for (const seg of segments) {
    if (seg.value <= 0) continue;
    const sliceAngle = (seg.value / total) * Math.PI * 2;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();

    startAngle += sliceAngle;
  }

  // Center text
  if (centerText) {
    ctx.fillStyle = '#e8e8f0';
    ctx.font = 'bold 28px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(centerText, cx, cy + (centerSub ? -2 : 8));

    if (centerSub) {
      ctx.fillStyle = '#8888aa';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText(centerSub, cx, cy + 18);
    }
  }
}

// ===== Bar Chart =====
export function drawBarChart(canvas, { labels, data, color = '#6c63ff', yLabel = '' }) {
  const width = canvas.parentElement?.clientWidth || 320;
  const height = 180;
  const ctx = setupCanvas(canvas, width, height);

  const pad = { top: 15, right: 15, bottom: 35, left: 45 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  ctx.clearRect(0, 0, width, height);

  if (!data || data.length === 0 || data.every(v => v === 0)) {
    drawEmptyState(ctx, width, height, 'Pas encore de données');
    return;
  }

  const maxVal = Math.max(1, ...data);

  // Y axis
  const ySteps = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#555577';

  for (let i = 0; i <= ySteps; i++) {
    const val = (maxVal * i) / ySteps;
    const y = pad.top + chartH - (i / ySteps) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillText(formatTime(val), pad.left - 8, y + 4);
  }

  // Bars
  const barGap = 6;
  const barW = Math.max(8, (chartW - barGap * (data.length + 1)) / data.length);

  for (let i = 0; i < data.length; i++) {
    const barH = (data[i] / maxVal) * chartH;
    const x = pad.left + barGap + i * (barW + barGap);
    const y = pad.top + chartH - barH;

    // Bar gradient
    const gradient = ctx.createLinearGradient(x, y, x, pad.top + chartH);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '60');

    ctx.fillStyle = gradient;
    roundedRect(ctx, x, y, barW, barH, 4);
    ctx.fill();

    // Label
    if (labels && labels[i]) {
      ctx.fillStyle = '#555577';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barW / 2, height - pad.bottom + 16);
    }
  }
}

// ===== Heatmap (Streak Calendar) =====
export function drawHeatmap(canvas, { data, weeks = 4 }) {
  // data is a Map or object: { 'YYYY-MM-DD': activityLevel (0-4) }
  const cellSize = 18;
  const cellGap = 3;
  const labelW = 28;
  const days = 7;
  const width = labelW + weeks * (cellSize + cellGap);
  const height = 20 + days * (cellSize + cellGap);
  const ctx = setupCanvas(canvas, width, height);

  ctx.clearRect(0, 0, width, height);

  const colors = [
    'rgba(255,255,255,0.04)',   // 0: no activity
    'rgba(108,99,255,0.25)',    // 1: low
    'rgba(108,99,255,0.45)',    // 2: medium
    'rgba(108,99,255,0.7)',     // 3: high
    'rgba(108,99,255,1)',       // 4: max
  ];

  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Day labels
  ctx.fillStyle = '#555577';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'right';
  for (let d = 0; d < 7; d++) {
    if (d % 2 === 0) {
      ctx.fillText(dayLabels[d], labelW - 6, 20 + d * (cellSize + cellGap) + cellSize / 2 + 4);
    }
  }

  // Calculate date range
  const today = new Date();
  const startDate = new Date(today);
  // Go back to Monday of (weeks) weeks ago
  const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
  startDate.setDate(startDate.getDate() - dayOfWeek - (weeks - 1) * 7);

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7 + d);
      const dateStr = date.toISOString().slice(0, 10);

      // Skip future dates
      if (date > today) continue;

      const level = data[dateStr] || 0;
      const x = labelW + w * (cellSize + cellGap);
      const y = 20 + d * (cellSize + cellGap);

      ctx.fillStyle = colors[Math.min(level, 4)];
      roundedRect(ctx, x, y, cellSize, cellSize, 4);
      ctx.fill();
    }
  }
}

// ===== Helpers =====
function roundedRect(ctx, x, y, w, h, r) {
  if (h <= 0) { h = 1; y = y + h - 1; }
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawEmptyState(ctx, w, h, text) {
  ctx.fillStyle = '#555577';
  ctx.font = '13px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2);
}

function formatTime(seconds) {
  if (seconds < 60) return Math.round(seconds) + 's';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m + 'min';
}
