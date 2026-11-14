import { circularSpeed } from './physics.js';

const palette = { total: '#f1bf89', disk: '#86a5ef', bulge: '#db8fba', halo: '#78c9b4' };

export function drawRotationCurve(canvas, model, radius) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const left = 31, right = width - 10, top = 14, bottom = height - 22;
  const maxRadius = model.extent;
  const maxSpeed = 300;
  const x = r => left + (right - left) * r / maxRadius;
  const y = v => bottom - (bottom - top) * v / maxSpeed;
  ctx.font = '9px ui-monospace, monospace';
  ctx.fillStyle = '#a0a8bb';
  ctx.strokeStyle = '#9da8c127';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  for (const value of [0, 100, 200, 300]) {
    ctx.beginPath();
    ctx.moveTo(left, y(value));
    ctx.lineTo(right, y(value));
    ctx.stroke();
    ctx.fillText(value, left - 5, y(value));
  }
  ctx.textAlign = 'left';
  ctx.fillText('km/s', left + 2, 5);
  ctx.textAlign = 'center';
  for (let value = 0; value <= maxRadius; value += 5) ctx.fillText(value, x(value), bottom + 11);
  ctx.textAlign = 'right';
  ctx.fillText('kpc', right, top - 9);

  const samples = Array.from({ length: 151 }, (_, i) => circularSpeed(i * maxRadius / 150, model));
  for (const key of ['halo', 'bulge', 'disk', 'total']) {
    ctx.beginPath();
    ctx.strokeStyle = palette[key];
    ctx.lineWidth = key === 'total' ? 1.65 : 1;
    samples.forEach((sample, i) => ctx.lineTo(x(i * maxRadius / 150), y(sample[key])));
    ctx.stroke();
  }
  const vx = x(radius);
  const vy = y(circularSpeed(radius, model).total);
  ctx.beginPath();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = '#f1bf8977';
  ctx.lineWidth = 1;
  ctx.moveTo(vx, top);
  ctx.lineTo(vx, bottom);
  ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = palette.total;
  ctx.arc(vx, vy, 3.6, 0, 2 * Math.PI);
  ctx.fill();
}
