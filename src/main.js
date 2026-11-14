import { drawRotationCurve } from './chart.js';
import { circularSpeed, galaxies, orbitFor, orbitPeriod } from './physics.js';
import { createRenderer } from './renderer.js';

const $ = id => document.getElementById(id);
const canvas = $('space');
const chart = $('rotation');
const radiusInput = $('radius');
const timeInput = $('time');
const play = $('play');
const probeTag = $('probe-tag');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 779px)');
const integer = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

let key = 'milkyWay';
let model = galaxies[key];
let radius = model.reference;
let period;
let orbit;
let renderer;
let frameId = 0;
let lastFrame;
let lastUi = -Infinity;
let elapsed = 0;
let paused = reducedMotion.matches;
let dirty = true;
let cameras = 'perspective';
const camera = { azimuth: -0.41, elevation: 0.59, distance: 65 };
const target = { ...camera };
const visibility = { stars: true, gas: true, dust: true, orbit: true };

function setPaused(value) {
  paused = value;
  play.dataset.paused = String(paused);
  play.setAttribute('aria-label', paused ? 'Oynat' : 'Duraklat');
  invalidate();
}

function readouts() {
  period = orbitPeriod(radius, model);
  orbit = orbitFor(radius, model);
  renderer?.setOrbit(orbit);
  $('radius-value').textContent = decimal.format(radius) + ' kpc';
  radiusInput.setAttribute('aria-valuetext', decimal.format(radius) + ' kiloparsek');
  setRangeFill(radiusInput);
  $('velocity').innerHTML = integer.format(circularSpeed(radius, model).total) + ' <small>km/s</small>';
  $('period').innerHTML = integer.format(period) + ' <small>Myr</small>';
  drawRotationCurve(chart, model, radius);
  invalidate();
}

function setCamera(mode, snap = false) {
  cameras = mode;
  target.azimuth = mode === 'edge' ? -0.30 : -0.41;
  target.elevation = { perspective: key === 'andromeda' ? 0.42 : 0.59, top: 1.565, edge: 0.035 }[mode];
  target.distance = (narrow.matches ? 54 : 65) * (model.extent / 25);
  if (snap || reducedMotion.matches) Object.assign(camera, target);
  document.querySelectorAll('[data-camera]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.camera === mode));
  });
  invalidate();
}

function populate() {
  const count = renderer?.setGalaxy(model, narrow.matches ? 0.53 : 1);
  $('population').textContent = count ? integer.format(count) : '—';
}

function selectGalaxy(id, snap = false) {
  key = id;
  model = galaxies[id];
  radius = model.reference;
  radiusInput.max = model.extent;
  radiusInput.value = radius;
  $('catalog').textContent = model.catalog;
  $('morphology').textContent = model.type.toLocaleUpperCase('tr');
  $('galaxy-name').textContent = model.name;
  $('diameter').innerHTML = (model.extent * 2) + ' <small>kpc</small>';
  $('arms').textContent = model.arms;
  document.querySelectorAll('[data-galaxy]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.galaxy === id));
  });
  elapsed = 0;
  populate();
  setCamera('perspective', snap);
  readouts();
  updateTime();
}

function updateTime() {
  timeInput.max = Math.max(500, Math.ceil(elapsed / 500) * 500);
  timeInput.value = elapsed;
  setRangeFill(timeInput);
  $('time-value').textContent = decimal.format(elapsed) + ' Myr';
}

function setRangeFill(input) {
  const min = Number(input.min);
  const fraction = (input.valueAsNumber - min) / (Number(input.max) - min);
  input.style.setProperty('--fill', fraction * 100 + '%');
}

function refreshRenderer() {
  try {
    renderer = createRenderer(canvas);
    canvas.dataset.renderer = renderer ? 'ready' : 'unavailable';
  } catch (error) {
    console.error(error);
    renderer = null;
    canvas.dataset.renderer = 'unavailable';
  }
  $('render-error').hidden = !!renderer;
}

function invalidate() {
  dirty = true;
  if (!frameId) frameId = requestAnimationFrame(tick);
}

function tick(now) {
  frameId = 0;
  const dt = lastFrame === undefined ? 0 : Math.min((now - lastFrame) * 0.001, 0.05);
  lastFrame = now;
  if (!paused) {
    elapsed += dt * Number($('rate').value);
    if (elapsed >= 1e6) {
      elapsed = 1e6;
      setPaused(true);
    }
    dirty = true;
    if (now - lastUi > 110) {
      updateTime();
      lastUi = now;
    }
  }
  let moving = false;
  for (const name of Object.keys(camera)) {
    const delta = target[name] - camera[name];
    if (Math.abs(delta) < 0.0001) continue;
    camera[name] += delta * (reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 15));
    moving = true;
  }
  if ((dirty || moving) && renderer) {
    const index = (elapsed % period) / period * 360;
    const step = Math.floor(index);
    const probe = orbit[step].map((p, axis) => p + (orbit[step + 1][axis] - p) * (index - step));
    try {
      renderer.render(camera, elapsed, visibility, probe);
      const projected = visibility.orbit ? renderer.project(probe) : null;
      probeTag.hidden = !projected || projected[0] < 30 || projected[0] > canvas.clientWidth - 120
        || projected[1] < 0.26 * canvas.clientHeight || projected[1] > 0.77 * canvas.clientHeight;
      if (!probeTag.hidden) {
        const isReference = Math.abs(radius - model.reference) < 0.001;
        probeTag.textContent = isReference ? (key === 'milkyWay' ? 'Güneş çevresi' : '10 kpc halkası') :
          decimal.format(radius) + ' kpc';
        probeTag.style.transform = 'translate(' + (projected[0] + 12) + 'px, ' + (projected[1] - 12) + 'px)';
      }
    } catch (error) {
      console.error(error);
      renderer = null;
      canvas.dataset.renderer = 'unavailable';
      $('render-error').hidden = false;
      probeTag.hidden = true;
    }
  }
  dirty = false;
  if (!paused || moving) {
    if (!frameId) frameId = requestAnimationFrame(tick);
  } else {
    lastFrame = undefined;
  }
}

function orbitCamera(dx, dy) {
  target.azimuth -= dx;
  target.elevation = clamp(target.elevation + dy, -1.565, 1.565);
  cameras = 'free';
  document.querySelectorAll('[data-camera][aria-pressed="true"]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  invalidate();
}

function zoom(factor) {
  target.distance = clamp(target.distance * factor, 5, model.extent * 5);
  invalidate();
}

const pointers = new Map();
const distanceBetween = ([a, b]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
canvas.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  if (pointers.size === 2) return;
  canvas.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, [event.clientX, event.clientY]);
});
canvas.addEventListener('pointermove', event => {
  const previous = pointers.get(event.pointerId);
  if (!previous) return;
  const before = pointers.size === 2 ? distanceBetween(pointers.values()) : 0;
  pointers.set(event.pointerId, [event.clientX, event.clientY]);
  if (pointers.size === 2) {
    const after = distanceBetween(pointers.values());
    if (before > 2 && after > 2) zoom(before / after);
  } else {
    orbitCamera((event.clientX - previous[0]) * 0.006, (event.clientY - previous[1]) * 0.006);
  }
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(type, event => pointers.delete(event.pointerId));
}
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
  zoom(Math.exp(clamp(delta, -140, 140) * 0.0017));
}, { passive: false });
canvas.addEventListener('keydown', event => {
  const directions = { ArrowLeft: [-0.16, 0], ArrowRight: [0.16, 0], ArrowUp: [0, 0.10], ArrowDown: [0, -0.10] };
  if (event.key in directions) orbitCamera(...directions[event.key]);
  else if (event.key === '+' || event.key === '=') zoom(0.85);
  else if (event.key === '-') zoom(1.18);
  else return;
  event.preventDefault();
});
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  renderer = null;
  canvas.dataset.renderer = 'lost';
  probeTag.hidden = true;
  $('render-error').hidden = false;
});
canvas.addEventListener('webglcontextrestored', () => {
  refreshRenderer();
  populate();
  readouts();
});

document.querySelectorAll('[data-galaxy]').forEach(button => {
  button.addEventListener('click', () => {
    if (key !== button.dataset.galaxy) selectGalaxy(button.dataset.galaxy);
  });
});
document.querySelectorAll('[data-camera]').forEach(button => {
  button.addEventListener('click', () => setCamera(button.dataset.camera));
});
document.querySelectorAll('[data-layer]').forEach(input => {
  input.addEventListener('change', () => {
    visibility[input.dataset.layer] = input.checked;
    invalidate();
  });
});
radiusInput.addEventListener('input', () => {
  radius = Number(radiusInput.value);
  readouts();
});
play.addEventListener('click', () => setPaused(!paused));
$('reset-time').addEventListener('click', () => {
  elapsed = 0;
  updateTime();
  invalidate();
});
timeInput.addEventListener('input', () => {
  elapsed = Number(timeInput.value);
  setRangeFill(timeInput);
  $('time-value').textContent = decimal.format(elapsed) + ' Myr';
  setPaused(true);
});
$('open-model').addEventListener('click', () => $('model').showModal());
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) setPaused(true);
});
narrow.addEventListener('change', () => {
  populate();
  if (cameras !== 'free') setCamera(cameras, true);
  invalidate();
});
const observer = new ResizeObserver(() => {
  drawRotationCurve(chart, model, radius);
  invalidate();
});
observer.observe(canvas);
observer.observe(chart);

refreshRenderer();
selectGalaxy(key, true);
setPaused(paused);
