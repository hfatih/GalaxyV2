import { angularSpeed, KM_S_TO_KPC_MYR } from './physics.js';

const TAU = 2 * Math.PI;
export const STRIDE = 10;

function randomSource(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function makeGalaxy(model, density) {
  const random = randomSource(model.seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(TAU * random());
  const pattern = model.pattern * KM_S_TO_KPC_MYR;
  const winding = 1 / Math.tan(model.pitch * Math.PI / 180);

  function diskRadius() {
    let r;
    do r = -model.scale * Math.log((1 - random()) * (1 - random()));
    while (r > model.extent);
    return r;
  }

  function arm() {
    const branch = Math.floor(random() * model.arms);
    if (model.ring && random() < 0.37) {
      const angle = TAU * random();
      return [model.ring + 0.43 * Math.cos(angle + 0.8) + normal() * 0.54, angle, branch];
    }
    const edge = model.extent * (1 - 0.09 * Math.sin(branch * 2.37) ** 2);
    const r = model.bar + (edge - model.bar) * random() ** 1.62;
    const angle = 0.4 + branch * TAU / model.arms + (winding + 0.10 * Math.sin(branch * 2.37)) * Math.log(r / model.bar)
      + 0.085 * Math.sin(r * 1.44 + branch) + 0.044 * Math.sin(r * 3.7 + 1.2 * branch);
    return [r, angle, branch];
  }

  function data(count, sample) {
    const result = new Float32Array(Math.ceil(count * density) * STRIDE);
    for (let i = 0; i < result.length; i += STRIDE) result.set(sample(), i);
    return result;
  }

  function point(r, angle, y, rgb, size, alpha, speed) {
    return [r, angle, y, ...rgb, size, alpha, speed, random()];
  }

  const background = data(2200, () => {
    const r = 125, y = (2 * random() - 1) * r;
    const tint = random();
    return point(Math.sqrt(r * r - y * y), TAU * random(), y, [0.48 + 0.32 * tint, 0.59 + 0.11 * tint, 0.85],
      0.7 + 2.3 * random() ** 9, 0.10 + 0.50 * random() ** 3, 0);
  });

  const gas = data(4900, () => {
    const [r, angle, branch] = arm();
    const knot = 0.33 + 0.67 * Math.sin(r * 1.32 + 2.5 * branch) ** 4;
    const warm = random() < 0.14 + 0.16 * Math.sin(2.3 * angle - branch) ** 4;
    const spread = (0.36 + r * 0.04) * normal();
    return point(r, angle + spread / r, normal() * 0.15,
      warm ? [0.98, 0.26, 0.50] : [0.15, 0.38 + 0.16 * random(), 0.97], 0.38 + random() ** 2 * 2.45,
      (0.018 + knot * 0.060) * Math.exp(-r / 33), pattern);
  });

  const glow = data(3350, () => {
    const onBar = random() < 0.37;
    const x = normal() * (onBar ? model.bar * 0.55 : 1.05);
    const z = normal() * (onBar ? 0.43 : 0.77);
    return point(Math.hypot(x, z), Math.atan2(z, x) + 0.4, normal() * 0.34,
      [1, 0.55 + random() * 0.23, 0.24 + random() * 0.27], 0.25 + random() ** 2 * 1.84,
      0.021 + 0.045 * random(), pattern);
  });

  const dust = data(4800, () => {
    const [r, angle, branch] = arm();
    const offset = (0.31 + 0.19 * Math.sin(r * 1.75 + branch) + normal() * 0.17) / r;
    return point(r, angle + offset, normal() * 0.12, [0.024, 0.018, 0.036],
      0.25 + random() ** 2 * 1.15, 0.15 + random() * 0.18, pattern);
  });

  const stars = data(155000, () => {
    const young = random() < 0.33;
    const radius = diskRadius();
    const [r, angle, branch] = young ? arm() : [radius, TAU * random(), 0];
    const warp = Math.max(0, r - 11) * 0.037 * Math.sin(angle + 0.8);
    const height = normal() * (young ? 0.10 : 0.18 + r * 0.018) + warp;
    const spread = young ? normal() * (0.29 + r * 0.043) / r : 0;
    const tint = random();
    const clusters = young ? 0.28 + 0.72 * Math.sin(r * 1.38 + 1.9 * branch) ** 4 : 1;
    const color = young ? (tint < 0.14 ? [1, 0.53, 0.64] : [0.39 + 0.32 * tint, 0.62 + 0.22 * tint, 1]) :
      [1, 0.58 + 0.33 * tint, 0.44 + 0.46 * tint];
    return point(r, angle + spread, height, color, 0.64 + 1.9 * random() ** 14,
      (young ? 0.23 : 0.19) * clusters * (0.21 + random() ** 3) * Math.exp(-r / 45),
      young ? pattern : angularSpeed(r, model));
  });

  const core = data(19100, () => {
    const onBar = random() < 0.39;
    const x = normal() * (onBar ? model.bar * 0.55 : 0.92);
    const z = normal() * (onBar ? 0.43 : 0.80);
    const r = Math.hypot(x, z);
    return point(r, Math.atan2(z, x) + 0.4, normal() * (onBar ? 0.28 : 0.39),
      [1, 0.63 + 0.32 * random(), 0.29 + 0.47 * random()], 0.68 + random() ** 7 * 1.15,
      0.075 + random() ** 3 * 0.23, pattern);
  });

  const halo = data(7800, () => {
    const r = 1.7 + random() ** 2.2 * model.extent;
    const y = (2 * random() - 1) * r;
    return point(Math.sqrt(r * r - y * y), TAU * random(), y * 0.62, [0.64, 0.72, 0.93],
      0.68 + random() ** 8 * 1.3, 0.025 + random() ** 3 * 0.20, 0);
  });

  return { background, glow, gas, dust, stars, core, halo };
}
