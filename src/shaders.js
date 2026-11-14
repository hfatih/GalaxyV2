export const particleVertex = `#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aTint;
layout(location=2) in vec4 aAppearance;
uniform vec3 uEye;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uForward;
uniform vec2 uProjection;
uniform vec2 uOffset;
uniform float uTime;
uniform float uPointScale;
uniform float uDpr;
uniform int uMode;
out vec3 vTint;
out float vAlpha;
out float vSeed;

void main() {
  float theta = aPosition.y + aAppearance.z * uTime;
  vec3 world = vec3(aPosition.x * cos(theta), aPosition.z, aPosition.x * sin(theta));
  vec3 relative = world - uEye;
  float depth = dot(relative, uForward);
  vec2 xy = vec2(dot(relative, uRight), dot(relative, uUp)) * uProjection;
  gl_Position = vec4(xy + uOffset * depth, depth - 0.5, depth);
  float perspective = clamp(67.0 / max(depth, 1.0), 0.38, 3.4);
  gl_PointSize = uMode == 1 || uMode == 2
    ? clamp(aAppearance.x * uPointScale / max(depth, 1.0), 2.0, 96.0)
    : max(1.3, aAppearance.x * uDpr * (uMode == 0 ? 1.0 : sqrt(perspective)));
  vTint = aTint;
  vAlpha = aAppearance.y;
  vSeed = aAppearance.w;
}`;

export const particleFragment = `#version 300 es
precision highp float;
precision highp int;
uniform int uMode;
uniform float uGain;
in vec3 vTint;
in float vAlpha;
in float vSeed;
out vec4 outColor;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1)), f.x), f.y);
}

void main() {
  if (uMode == 4) {
    outColor = vec4(vTint, vAlpha);
    return;
  }
  vec2 p = 2.0 * gl_PointCoord - 1.0;
  float r2 = dot(p, p);
  float edge = 1.0 - smoothstep(0.42, 1.0, r2);
  if (r2 >= 1.0) discard;
  float weight;
  if (uMode == 1 || uMode == 2) {
    vec2 q = p * 3.5 + vSeed * 119.0;
    float cloud = 0.5 * noise(q) + 0.3 * noise(q * 2.3) + 0.2 * noise(q * 4.8);
    weight = edge * exp(-2.3 * r2) * smoothstep(0.12, 0.81, cloud);
  } else {
    weight = edge * (exp(-5.1 * r2) * 0.84 + exp(-1.65 * r2) * 0.16);
  }
  outColor = vec4(vTint, weight * vAlpha * uGain);
}`;

export const screenVertex = `#version 300 es
out vec2 vUv;
void main() {
  vUv = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(vUv * 2.0 - 1.0, 0.0, 1.0);
}`;

export const screenFragment = `#version 300 es
precision highp float;
uniform sampler2D uScene;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec3 light = texture(uScene, vUv).rgb;
  vec2 p = vUv - vec2(0.52, 0.53);
  float vignette = smoothstep(0.18, 0.74, length(p));
  vec3 base = mix(vec3(0.018, 0.025, 0.042), vec3(0.010, 0.014, 0.026), vignette);
  float peak = max(max(light.r, light.g), light.b);
  float exposed = pow(1.0 - exp(-peak * 1.30), 0.70);
  vec3 hue = pow(light / max(peak, 0.0001), vec3(0.66));
  vec3 color = mix(hue, vec3(1.0), 0.55 * smoothstep(0.25, 4.0, peak))
    * exposed * (1.0 - vignette * 0.24);
  float grain = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  outColor = vec4(base + (1.0 - base) * color + (grain - 0.5) * 0.009, 1.0);
}`;
