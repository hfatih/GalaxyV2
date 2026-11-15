export const diskVertex = `
in vec4 orbit;
uniform vec4 uShape;
uniform float uAge;
uniform float uRadiusReferenceSpeed;
uniform float uEvolve;
uniform float uAndromeda;
uniform float uSize;
uniform float uPixelScale;
out vec3 vTint;

void main() {
  float arm = mod(float(gl_VertexID), uShape.x);
  float phi0 = arm / uShape.x * 6.283185307 + position.x * uShape.y * 0.02 + orbit.x * uShape.z;
  float frequency = mix(uRadiusReferenceSpeed, mix(orbit.z, orbit.w, uAndromeda), uEvolve);
  float phase = phi0 - frequency * uAge;
  float z = position.z + uShape.w * orbit.y * sin(2.0 * phi0 + position.x * 0.035);
  vec4 viewPosition = modelViewMatrix * vec4(position.y * cos(phase), position.y * sin(phase), z, 1.0);
  gl_Position = projectionMatrix * viewPosition;
  gl_PointSize = clamp(uSize * uPixelScale / max(1.0, -viewPosition.z), 1.25, 8.0);
  vec3 tint = sqrt(max(color, vec3(0.0)));
  vTint = mix(tint, tint * vec3(0.65, 0.81, 1.30), 0.48);
}`;

export const diskFragment = `
uniform float uOpacity;
in vec3 vTint;
out vec4 outColor;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float alpha = max(0.0, 1.0 - dot(p, p));
  outColor = vec4(vTint, uOpacity * alpha * alpha * alpha);
}`;
