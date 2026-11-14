import assert from 'node:assert/strict';
import test from 'node:test';

test('axisymmetric potential, circular speed and symplectic integration', async (t) => {
  const { galaxies, potential, acceleration, circularSpeed, leapfrog, KM_S_TO_KPC_MYR, orbitFor } = await import('../src/physics.js');
  const model = galaxies.milkyWay;

  await t.test('the force matches the potential gradient in and out of the disk', () => {
    for (const point of [[8.2, 0, 0], [4, 2.1, -0.8], [26, -1, 3]]) {
      const force = acceleration(point, model);
      for (let axis = 0; axis < 3; axis++) {
        const before = point.slice();
        const after = point.slice();
        before[axis] -= 0.0001;
        after[axis] += 0.0001;
        const expected = (potential(before, model) - potential(after, model)) / 0.0002;
        assert.ok(Math.abs(force[axis] / KM_S_TO_KPC_MYR ** 2 - expected) < 0.002);
      }
    }
  });

  await t.test('solar circle has a plausible velocity and the center stays finite', () => {
    const solar = circularSpeed(8.2, model);
    assert.ok(solar.total > 215 && solar.total < 245);
    assert.ok(Math.abs(solar.total ** 2 - solar.disk ** 2 - solar.bulge ** 2 - solar.halo ** 2) < 1e-9);
    assert.ok(potential([0, 0, 0], model) < 0 && Number.isFinite(potential([0, 0, 0], model)));
    assert.equal(circularSpeed(0, model).total, 0);
    assert.ok(circularSpeed(10, galaxies.andromeda).total > solar.total);
  });

  await t.test('an inclined eccentric orbit conserves energy and axial angular momentum', () => {
    let state = { position: [8.2, 0.12, 0], velocity: [0.027, 0.018, 0.20] };
    const energy = ({ position, velocity }) =>
      potential(position, model) + velocity.reduce((sum, v) => sum + (v / KM_S_TO_KPC_MYR) ** 2 / 2, 0);
    const angularMomentum = ({ position: [x, , z], velocity: [vx, , vz] }) => x * vz - z * vx;
    const e = energy(state);
    const l = angularMomentum(state);
    for (let i = 0; i < 3000; i++) {
      state = leapfrog(state, 0.5, model);
      assert.ok(Math.abs((energy(state) - e) / e) < 2e-5);
      assert.ok(Math.abs(angularMomentum(state) - l) < 1e-10);
    }
    assert.equal(orbitFor(8.2, model).length, 361);
  });

  await t.test('the orbit sampler rejects invalid display radii', () => {
    for (const radius of [-1, Infinity, NaN, model.extent + 1]) {
      assert.throws(() => orbitFor(radius, model), RangeError);
    }
  });
});

test('seeded galaxy sampling is repeatable and finite', async () => {
  const { galaxies } = await import('../src/physics.js');
  const { makeGalaxy, STRIDE } = await import('../src/population.js');
  const layers = makeGalaxy(galaxies.milkyWay, 0.02);
  const repeat = makeGalaxy(galaxies.milkyWay, 0.02);
  assert.deepEqual(layers, repeat);
  for (const layer of Object.values(layers)) {
    assert.ok(layer instanceof Float32Array && layer.length > 0);
    assert.equal(layer.length % STRIDE, 0);
    assert.ok(layer.every(Number.isFinite));
  }
  assert.notDeepEqual(layers.stars, makeGalaxy(galaxies.andromeda, 0.02).stars);
});
