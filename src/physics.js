const G = 4.30091727e-6; // kpc (km/s)² / solar mass
const KM_S_TO_KPC_MYR = 0.001022712165;
export const MODEL_DISK_RADIUS = 160;
export const MAX_AGE = 1000;

export const profiles = {
  milkyWay: {
    extent: 25, reference: 8.2,
    disk: { mass: 6.25e10, a: 3, b: 0.28 },
    bulge: { mass: 9e9, a: 0.55 },
    halo: { mass: 6e11, a: 17 },
  },
  andromeda: {
    extent: 33, reference: 10,
    disk: { mass: 8.9e10, a: 5.4, b: 0.53 },
    bulge: { mass: 3.1e10, a: 0.86 },
    halo: { mass: 9.5e11, a: 19 },
  },
};

export function circularSpeed(r, { disk, bulge, halo }) {
  if (r <= 0) return 0;
  const x = r / halo.a;
  const enclosedFraction = x < 1e-4 ? x * x * (0.5 - 2 * x / 3) : Math.log1p(x) - x / (1 + x);
  const disk2 = disk.mass * r * r / Math.hypot(r, disk.a + disk.b) ** 3;
  const bulge2 = bulge.mass * r / (r + bulge.a) ** 2;
  const halo2 = halo.mass * enclosedFraction / r;
  return Math.sqrt(G * (disk2 + bulge2 + halo2));
}

export function angularSpeed(radius, model) {
  // The unresolved central 350 pc share one angular speed to avoid a cusped singularity.
  const r = Math.max(0.35, radius);
  return circularSpeed(r, model) * KM_S_TO_KPC_MYR / r;
}

export function orbitPeriod(radius, model) {
  return 2 * Math.PI / angularSpeed(radius, model);
}
