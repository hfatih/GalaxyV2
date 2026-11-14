import { STRIDE, makeGalaxy } from './population.js';
import { particleFragment, particleVertex, screenFragment, screenVertex } from './shaders.js';

function programFor(gl, vertex, fragment) {
  const program = gl.createProgram();
  for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  return program;
}

export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const hdr = gl.getExtension('EXT_color_buffer_float');
  const particles = programFor(gl, particleVertex, particleFragment);
  const screen = programFor(gl, screenVertex, screenFragment);
  const names = ['Eye', 'Right', 'Up', 'Forward', 'Projection', 'Offset', 'Time', 'PointScale', 'Dpr', 'Mode', 'Gain'];
  const loc = Object.fromEntries(names.map(name => [name, gl.getUniformLocation(particles, 'u' + name)]));
  const framebuffer = gl.createFramebuffer();
  const target = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, target);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const marker = mesh(new Float32Array(STRIDE), gl.DYNAMIC_DRAW);
  let layers = {};
  let trail;
  let size;
  let view;

  function mesh(data, usage = gl.STATIC_DRAW) {
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    for (const [index, count, offset] of [[0, 3, 0], [1, 3, 3], [2, 4, 6]]) {
      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(index, count, gl.FLOAT, false, 4 * STRIDE, 4 * offset);
    }
    return { vao, buffer, count: data.length / STRIDE };
  }

  function remove({ vao, buffer }) {
    gl.deleteVertexArray(vao);
    gl.deleteBuffer(buffer);
  }

  function setGalaxy(model, density) {
    Object.values(layers).forEach(remove);
    layers = Object.fromEntries(Object.entries(makeGalaxy(model, density)).map(([key, data]) => [key, mesh(data)]));
    return layers.stars.count + layers.core.count + layers.halo.count;
  }

  function setOrbit(points) {
    if (trail) remove(trail);
    const data = new Float32Array((points.length - 1) * STRIDE);
    for (let i = 0; i < points.length - 1; i++) {
      const [x, y, z] = points[i];
      data.set([Math.hypot(x, z), Math.atan2(z, x), y, 1, 0.71, 0.38, 1, 0.18, 0, 0], i * STRIDE);
    }
    trail = mesh(data);
  }

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return false;
    const dpr = Math.min(devicePixelRatio || 1, width < 700 ? 1.45 : 1.6, 1920 / width, 1400 / height);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (!size || size.pixelWidth !== pixelWidth || size.pixelHeight !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      gl.bindTexture(gl.TEXTURE_2D, target);
      gl.texImage2D(gl.TEXTURE_2D, 0, hdr ? gl.RGBA16F : gl.RGBA8, pixelWidth, pixelHeight, 0,
        gl.RGBA, hdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw Error('WebGL framebuffer unavailable');
    }
    size = { width, height, pixelWidth, pixelHeight, dpr };
    return true;
  }

  function project(point) {
    if (!view) return null;
    const d = point.map((p, i) => p - view.eye[i]);
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const depth = dot(d, view.forward);
    if (depth < 0.3) return null;
    const x = dot(d, view.right) * view.fx / depth + view.offset[0];
    const y = dot(d, view.up) * view.fy / depth + view.offset[1];
    return [(x + 1) * size.width / 2, (1 - y) * size.height / 2];
  }

  function render(camera, time, visibility, probe) {
    if (!resize()) return;
    const { width, height, dpr, pixelWidth, pixelHeight } = size;
    const { azimuth, elevation, distance } = camera;
    const ca = Math.cos(azimuth), sa = Math.sin(azimuth);
    const ce = Math.cos(elevation), se = Math.sin(elevation);
    const eye = [ca * ce * distance, se * distance, sa * ce * distance];
    const right = [sa, 0, -ca], up = [-ca * se, ce, -sa * se], forward = [-ca * ce, -se, -sa * ce];
    const lens = width < 780 ? 2.06 : 2.88;
    const fx = lens * Math.min(1, height / width);
    const fy = fx * width / height;
    const offset = width < 780 ? [0, 0.15] : [0.09, 0.10];
    view = { eye, right, up, forward, fx, fy, offset };

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, pixelWidth, pixelHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.useProgram(particles);
    gl.uniform3fv(loc.Eye, eye);
    gl.uniform3fv(loc.Right, right);
    gl.uniform3fv(loc.Up, up);
    gl.uniform3fv(loc.Forward, forward);
    gl.uniform2f(loc.Projection, fx, fy);
    gl.uniform2fv(loc.Offset, offset);
    gl.uniform1f(loc.Time, time);
    gl.uniform1f(loc.Dpr, dpr);
    gl.uniform1f(loc.PointScale, fy * pixelHeight);
    draw(layers.background, 0, 0.82);
    draw(layers.glow, 1, 0.55);
    if (visibility.gas) draw(layers.gas, 1, 1.0);
    if (visibility.dust) {
      gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
      draw(layers.dust, 2, 0.92);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    }
    if (visibility.stars) {
      draw(layers.halo, 3, 0.66);
      draw(layers.stars, 3, 0.86);
      draw(layers.core, 3, 0.34);
    }
    if (visibility.orbit && trail && probe) {
      draw(trail, 4, 1, gl.LINES);
      const [x, y, z] = probe;
      gl.bindBuffer(gl.ARRAY_BUFFER, marker.buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array([
        Math.hypot(x, z), Math.atan2(z, x), y, 1, 0.74, 0.40, 7, 0.95, 0, 0,
      ]));
      draw(marker, 3, 1);
    }
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
    gl.useProgram(screen);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function draw(layer, mode, gain, primitive = gl.POINTS) {
    gl.uniform1i(loc.Mode, mode);
    gl.uniform1f(loc.Gain, gain);
    gl.bindVertexArray(layer.vao);
    gl.drawArrays(primitive, 0, layer.count);
  }

  return { setGalaxy, setOrbit, render, project };
}
