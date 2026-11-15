import assert from 'node:assert/strict';
import test from 'node:test';
import { angularSpeed, circularSpeed, MODEL_DISK_RADIUS, orbitPeriod, profiles } from '../src/physics.js';

test('the three mass components produce a plausible solar-circle speed', () => {
  const speed = circularSpeed(8.2, profiles.milkyWay);
  assert.ok(speed > 215 && speed < 245);
  assert.ok(circularSpeed(10, profiles.andromeda) > speed);
  assert.equal(circularSpeed(0, profiles.milkyWay), 0);
  assert.equal(MODEL_DISK_RADIUS, 160);
});

test('an inner ring accumulates more azimuth over equal time than an outer ring', () => {
  const model = profiles.milkyWay;
  assert.ok(angularSpeed(4, model) > angularSpeed(14, model));
  assert.ok(Number.isFinite(angularSpeed(0, model)));
  assert.ok(orbitPeriod(4, model) < orbitPeriod(14, model));
  assert.ok(Math.abs(orbitPeriod(8.2, model) - 221) < 2);
});
