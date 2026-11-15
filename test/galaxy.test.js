import assert from 'node:assert/strict';
import test from 'node:test';

import { sampleDisk, generateBulgeStars, generateHaloStars, presets, formatScale } from '../src/model.js';

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

test('the same disk samples survive a sampling budget change', () => {
  const first = sampleDisk(64);
  const larger = sampleDisk(100);
  for (const layer of ['positions', 'colors', 'orbits']) {
    assert.deepEqual(first[layer], larger[layer].slice(0, first[layer].length));
    assert.notDeepEqual(first[layer], sampleDisk(64, 43)[layer]);
  }
});

test('disk, bulge and halo allocate the requested sample counts', () => {
  const layers = [
    [sampleDisk(20000), 20000],
    [generateBulgeStars({ count: 2000, seed: 43 }), 2000],
    [generateHaloStars({ count: 100000, seed: 44 }), 100000],
  ];
  for (const [layer, count] of layers) {
    assert.equal(layer.positions.length, count * 3);
    assert.equal(layer.colors.length, count * 3);
    assert.ok(layer.positions.every(Number.isFinite));
  }
});
