export const G = 4.30091727e-6; // kpc (km/s)² / solar mass
export const KM_S_TO_KPC_MYR = 0.001022712165;
const TAU = 2 * Math.PI;

export const galaxies = {
  milkyWay: {
    name: 'Samanyolu', catalog: 'MW', type: 'Çubuklu sarmal',
    disk: { mass: 6.25e10, a: 3, b: 0.28 },
    bulge: { mass: 9e9, a: 0.55 },
    halo: { mass: 6e11, a: 17 },
    extent: 25, scale: 4.2, pitch: 15, arms: 4, bar: 3.4, reference: 8.2, pattern: 23, seed: 8705,
  },
  andromeda: {
    name: 'Andromeda', catalog: 'M31', type: 'Halkalı sarmal',
    disk: { mass: 8.9e10, a: 5.4, b: 0.53 },
    bulge: { mass: 3.1e10, a: 0.86 },
    halo: { mass: 9.5e11, a: 19 },
    extent: 33, scale: 5.9, pitch: 12, arms: 2, bar: 4, reference: 10, pattern: 20, seed: 20531,
    ring: 10,
  },
};

function nfwMassFraction(x) {
  return x < 1e-4 ? x * x * (0.5 - (2 / 3) * x + 0.75 * x * x) : Math.log1p(x) - x / (1 + x);
}

export function potential([x, y, z], { disk, bulge, halo }) {
  const r = Math.hypot(x, y, z);
  const vertical = Math.hypot(y, disk.b);
  const diskDistance = Math.hypot(x, z, disk.a + vertical);
  const haloTerm = r === 0 ? 1 / halo.a : Math.log1p(r / halo.a) / r;
  return -G * (disk.mass / diskDistance + bulge.mass / (r + bulge.a) + halo.mass * haloTerm);
}

export function acceleration([x, y, z], { disk, bulge, halo }) {
  const r = Math.hypot(x, y, z);
  const vertical = Math.hypot(y, disk.b);
  const diskDistance = Math.hypot(x, z, disk.a + vertical);
  const diskForce = disk.mass / diskDistance ** 3;
  const sphericalForce = r === 0 ? 0 :
    bulge.mass / (r * (r + bulge.a) ** 2) + halo.mass * nfwMassFraction(r / halo.a) / r ** 3;
  const units = -G * KM_S_TO_KPC_MYR ** 2;
  return [
    units * x * (diskForce + sphericalForce),
    units * y * (diskForce * (disk.a + vertical) / vertical + sphericalForce),
    units * z * (diskForce + sphericalForce),
  ];
}

export function circularSpeed(r, { disk, bulge, halo }) {
  const disk2 = G * disk.mass * r * r / Math.hypot(r, disk.a + disk.b) ** 3;
  const bulge2 = G * bulge.mass * r / (r + bulge.a) ** 2;
  const halo2 = r === 0 ? 0 : G * halo.mass * nfwMassFraction(r / halo.a) / r;
  return {
    disk: Math.sqrt(disk2), bulge: Math.sqrt(bulge2), halo: Math.sqrt(halo2),
    total: Math.sqrt(disk2 + bulge2 + halo2),
  };
}

export function angularSpeed(r, model) {
  return r === 0 ? 0 : circularSpeed(r, model).total * KM_S_TO_KPC_MYR / r;
}

export function orbitPeriod(r, model) {
  return TAU / angularSpeed(r, model);
}

export function leapfrog({ position, velocity }, dt, model) {
  const initialForce = acceleration(position, model);
  const halfVelocity = velocity.map((v, i) => v + initialForce[i] * dt / 2);
  const nextPosition = position.map((p, i) => p + halfVelocity[i] * dt);
  const nextForce = acceleration(nextPosition, model);
  const nextVelocity = halfVelocity.map((v, i) => v + nextForce[i] * dt / 2);
  return { position: nextPosition, velocity: nextVelocity };
}

export function orbitFor(radius, model) {
  if (!Number.isFinite(radius) || radius <= 0 || radius > model.extent) {
    throw new RangeError('Orbit radius must be within the display extent');
  }
  const period = orbitPeriod(radius, model);
  const stepsPerPoint = Math.ceil(period / 180);
  const dt = period / (360 * stepsPerPoint);
  let state = { position: [radius, 0, 0], velocity: [0, 0, circularSpeed(radius, model).total * KM_S_TO_KPC_MYR] };
  const points = [state.position];
  for (let i = 0; i < 360; i++) {
    for (let j = 0; j < stepsPerPoint; j++) state = leapfrog(state, dt, model);
    points.push(state.position);
  }
  return points;
}
