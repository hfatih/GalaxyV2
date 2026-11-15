import assert from 'node:assert/strict';
import test from 'node:test';

import { generateSpiralArmStars, generateBulgeStars, generateHaloStars, presets, formatScale } from '../src/model.js';

const sample = (values, index) => [...values.slice(index * 3, index * 3 + 3)];
const disk = (settings = {}) => generateSpiralArmStars({
  count: 64, arms: 4, armSpread: 0.42, armTwist: 1.6, radius: 160, randomness: 0.9,
  height: 6, warp: 0, seed: 42, ...settings,
});

test('the original preset defaults and star-scale calculation are available', () => {
  assert.deepEqual(presets.milkyWay.controls, {
    arms: 4, armTwist: 1.6, armSpread: 0.42, diskWarp: 10, starCount: 120000,
    bulgeCount: 22000, haloCount: 18000, showDust: true, starSize: 1.6, rotationSpeed: 0.02,
  });
  assert.deepEqual(presets.andromeda.controls, {
    arms: 5, armTwist: 1.3, armSpread: 0.35, diskWarp: 6, starCount: 165000,
    bulgeCount: 30000, haloCount: 26000, showDust: true, starSize: 1.4, rotationSpeed: 0.018,
  });
  assert.equal(formatScale(150e9, 160000), '1 nokta ≈ 937,5 bin yıldız');
  assert.equal(formatScale(1e12, 221000), '1 nokta ≈ 4,52 milyon yıldız');
});

test('same seed reproduces the disk, and each shape parameter changes the points', () => {
  const initial = disk().positions;
  assert.deepEqual(disk().positions, initial);
  const reference = sample(initial, 1);
  assert.notDeepEqual(sample(disk({ arms: 8 }).positions, 1), reference);
  assert.notDeepEqual(sample(disk({ armTwist: 4 }).positions, 1), reference);
  assert.notDeepEqual(sample(disk({ armSpread: 1.2 }).positions, 1), reference);
  const warped = sample(disk({ warp: 40 }).positions, 1);
  assert.deepEqual(warped.slice(0, 2), reference.slice(0, 2));
  assert.notEqual(warped[2], reference[2]);
});

test('disk, bulge and halo allocate the requested sample counts', () => {
  const layers = [
    [disk({ count: 20000 }), 20000],
    [generateBulgeStars({ count: 2000, seed: 43 }), 2000],
    [generateHaloStars({ count: 100000, seed: 44 }), 100000],
  ];
  for (const [layer, count] of layers) {
    assert.equal(layer.positions.length, count * 3);
    assert.equal(layer.colors.length, count * 3);
    assert.ok(layer.positions.every(Number.isFinite));
  }
});
