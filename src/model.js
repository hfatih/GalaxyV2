import { Color } from 'three';
import { angularSpeed, MODEL_DISK_RADIUS, profiles } from './physics.js';

export const presets = {
  milkyWay: {
    name: 'Samanyolu', catalog: 'MW', type: 'Çubuklu sarmal',
    description: 'Yıldız yoğun bir merkez ve dört belirgin sarmal kol.',
    referenceStars: 150e9,
    controls: {
      arms: 4, armTwist: 1.6, armSpread: 0.42, diskWarp: 10, starCount: 120000,
      bulgeCount: 22000, haloCount: 18000, showDust: true, starSize: 1.6, rotationSpeed: 0.02,
    },
  },
  andromeda: {
    name: 'Andromeda', catalog: 'M31', type: 'Sarmal',
    description: 'Daha sıkı kollar ve daha yoğun bir yıldız diski.',
    referenceStars: 1e12,
    controls: {
      arms: 5, armTwist: 1.3, armSpread: 0.35, diskWarp: 6, starCount: 165000,
      bulgeCount: 30000, haloCount: 26000, showDust: true, starSize: 1.4, rotationSpeed: 0.018,
    },
  },
  custom: {
    name: 'Özel Galaksi', catalog: 'ÖZEL', type: 'Özel ayar',
    description: 'Kolları, diski ve yıldız dağılımını kendi ayarlarınla şekillendir.',
    referenceStars: 150e9,
  },
};

const scaleNumber = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });

export function formatScale(realCount, sampleCount) {
  if (!realCount || !sampleCount) return '—';
  const ratio = realCount / sampleCount;
  const units = [[1e12, 'trilyon'], [1e9, 'milyar'], [1e6, 'milyon'], [1e3, 'bin']];
  const [divisor, unit] = units.find(([value]) => ratio >= value) ?? [1, ''];
  return '1 nokta ≈ ' + scaleNumber.format(ratio / divisor) + (unit ? ' ' + unit : '') + ' yıldız';
}

// The original seeded disk distribution is assembled in the vertex shader.
export function sampleDisk(count, seed = 42) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const orbits = new Float32Array(count * 4);
  const rng = mulberry32(seed);
  const color = new Color();
  for (let i = 0; i < count; i++) {
    const r = Math.pow(rng(), 0.7) * MODEL_DISK_RADIUS;
    const t = r / MODEL_DISK_RADIUS;
    const scatter = normalRandom(rng);
    const z = normalRandom(rng) * (1 - t) * 6;
    const rr = r + normalRandom(rng) * 0.9 * (1 + t);
    const normalized = Math.abs(rr) / MODEL_DISK_RADIUS;
    positions[3 * i] = r;
    positions[3 * i + 1] = rr;
    positions[3 * i + 2] = z;
    orbits[4 * i] = scatter;
    orbits[4 * i + 1] = Math.pow(t, 1.2);
    orbits[4 * i + 2] = angularSpeed(normalized * profiles.milkyWay.extent, profiles.milkyWay);
    orbits[4 * i + 3] = angularSpeed(normalized * profiles.andromeda.extent, profiles.andromeda);
    color.setHSL(0.6 - 0.4 * t, 0.8 - 0.5 * t, 0.5 + 0.4 * (1 - t));
    colors[3 * i] = color.r;
    colors[3 * i + 1] = color.g;
    colors[3 * i + 2] = color.b;
  }
  return { positions, colors, orbits };
}
export function generateBulgeStars({ count = 20000, radius = 18, seed = 1337 }) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const rng = mulberry32(seed);
  const color = new Color();
  for (let i = 0; i < count; i++) {
    const u = rng();
    const r = radius * Math.pow(u, 1 / 3) * (0.3 + 0.7 * rng());
    const theta = Math.acos(2 * rng() - 1);
    const phi = 2 * Math.PI * rng();
    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.sin(theta) * Math.sin(phi);
    const z = r * Math.cos(theta) * (0.6 + 0.4 * rng());
    positions[3 * i] = x;
    positions[3 * i + 1] = y;
    positions[3 * i + 2] = z;
    color.setHSL(0.08, 0.6 + 0.2 * rng(), 0.45 + 0.1 * rng());
    colors[3 * i] = color.r;
    colors[3 * i + 1] = color.g;
    colors[3 * i + 2] = color.b;
  }
  return { positions, colors };
}
export function generateHaloStars({ count = 15000, radius = 800, seed = 777 }) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const rng = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const u = rng();
    const r = radius * Math.pow(u, 1 / 3);
    const theta = Math.acos(2 * rng() - 1);
    const phi = 2 * Math.PI * rng();
    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.sin(theta) * Math.sin(phi);
    const z = r * Math.cos(theta);
    positions[3 * i] = x;
    positions[3 * i + 1] = y;
    positions[3 * i + 2] = z;
    const gray = 0.8 - 0.4 * rng();
    colors[3 * i] = gray;
    colors[3 * i + 1] = gray;
    colors[3 * i + 2] = gray;
  }
  return { positions, colors };
}
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function normalRandom(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
