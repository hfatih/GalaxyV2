import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei/web/Html.js';
import { OrbitControls } from '@react-three/drei/core/OrbitControls.js';
import { Stars } from '@react-three/drei/core/Stars.js';
import { AdditiveBlending, BufferAttribute, BufferGeometry, GLSL3, Vector4 } from 'three';
import { generateBulgeStars, generateHaloStars, sampleDisk } from './model.js';
import { angularSpeed, MAX_AGE, MODEL_DISK_RADIUS, profiles } from './physics.js';
import { diskVertex, diskFragment } from './diskShaders.js';

const views = { oblique: [0, -289, 315], top: [0, -0.01, 428], edge: [0, -427, 15] };
const camera = { position: views.oblique, fov: 46, up: [0, 0, 1], far: 4000 };

function makeGeometry(samples) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(samples.positions, 3));
  geometry.setAttribute('color', new BufferAttribute(samples.colors, 3));
  if (samples.orbits) geometry.setAttribute('orbit', new BufferAttribute(samples.orbits, 4));
  return geometry;
}

const markers = [
  { label: 'Güneş Sistemi', x: 85, y: 0, tint: 'solar' },
  { label: 'Orion Kolu', x: 120, y: 20, tint: 'orion' },
  { label: 'Galaktik Merkez', x: 0, y: 0, tint: 'center' },
];

function Galaxy({ controls, playing, showMarkers, preset, evolution, clock, qualityLabel, seek, onResolution }) {
  const disk = useMemo(() => makeGeometry(sampleDisk(400000)), []);
  const bulge = useMemo(() => makeGeometry(generateBulgeStars({ count: 80000, radius: 20, seed: 43 })), []);
  const halo = useMemo(() => makeGeometry(generateHaloStars({ count: 100000, radius: 800, seed: 44 })), []);
  const uniforms = useMemo(() => ({
    uShape: { value: new Vector4() },
    uAge: { value: 0 },
    uRadiusReferenceSpeed: { value: 0 },
    uEvolve: { value: 0 },
    uAndromeda: { value: 0 },
    uSize: { value: 0 },
    uPixelScale: { value: 0 },
    uOpacity: { value: 0.5 },
  }), []);
  const labelGroups = useRef([]);
  const profile = profiles[preset] ?? profiles.milkyWay;
  const referenceSpeed = angularSpeed(profile.reference, profile);
  const markerSpeeds = useMemo(() => markers.map(({ x, y }) =>
    angularSpeed(Math.hypot(x, y) / MODEL_DISK_RADIUS * profile.extent, profile)), [profile]);
  const details = useRef({ ratio: 1, dpr: 1, frames: 0, elapsed: 0, fast: 0 });
  const invalidate = useThree(state => state.invalidate);

  useEffect(() => () => [disk, bulge, halo].forEach(geometry => geometry.dispose()), [disk, bulge, halo]);
  useEffect(() => invalidate(), [invalidate, controls, evolution, preset, showMarkers, seek]);

  useFrame(({ gl }, dt) => {
    if (playing && !document.hidden) {
      clock.current = Math.min(MAX_AGE, clock.current + Math.min(dt, 0.15) * controls.rotationSpeed * 350);
    }
    const age = clock.current;
    uniforms.uShape.value.set(controls.arms, controls.armTwist, controls.armSpread, controls.diskWarp);
    uniforms.uAge.value = age;
    uniforms.uRadiusReferenceSpeed.value = referenceSpeed;
    uniforms.uEvolve.value = evolution ? 1 : 0;
    uniforms.uAndromeda.value = preset === 'andromeda' ? 1 : 0;
    uniforms.uSize.value = controls.starSize * 2.1;
    uniforms.uPixelScale.value = gl.domElement.height * 0.49;

    const quality = details.current;
    if (dt > 0 && (playing || dt < 0.24) && !document.hidden) {
      quality.frames++;
      quality.elapsed += Math.min(dt, 0.4);
      if (quality.elapsed >= 0.55) {
        const average = quality.elapsed / quality.frames;
        const previousDpr = quality.dpr;
        if (average > 0.026) {
          quality.ratio = Math.max(0.18, quality.ratio * 0.69);
          quality.dpr = Math.max(0.58, quality.dpr - 0.13);
          quality.fast = 0;
        } else if (average < 0.018) {
          quality.fast++;
          if (quality.fast >= 5 && quality.ratio < 1) {
            quality.ratio = Math.min(1, quality.ratio * 1.14);
            quality.dpr = Math.min(1, quality.dpr + 0.05);
            quality.fast = 0;
          }
        } else {
          quality.fast = 0;
        }
        if (quality.dpr !== previousDpr) queueMicrotask(() => onResolution(quality.dpr));
        quality.frames = 0;
        quality.elapsed = 0;
      }
    }
    const ratio = quality.ratio;
    disk.setDrawRange(0, Math.ceil(controls.starCount * ratio));
    bulge.setDrawRange(0, Math.ceil(controls.bulgeCount * ratio));
    halo.setDrawRange(0, Math.ceil(controls.haloCount * ratio));
    uniforms.uOpacity.value = Math.min(0.78, 0.39 / Math.sqrt(ratio));
    if (qualityLabel.current) {
      const text = ratio < 1 ? 'Otomatik kalite · %' + Math.round(ratio * 100) : 'Otomatik kalite';
      if (qualityLabel.current.textContent !== text) qualityLabel.current.textContent = text;
    }

    labelGroups.current.forEach((group, index) => {
      if (!group) return;
      const { x, y } = markers[index];
      const phase = -age * (evolution ? markerSpeeds[index] : referenceSpeed);
      group.position.set(x * Math.cos(phase) - y * Math.sin(phase), x * Math.sin(phase) + y * Math.cos(phase), 0);
    });
  });

  return (
    <>
      <points geometry={disk} frustumCulled={false}>
        <shaderMaterial glslVersion={GLSL3} uniforms={uniforms} vertexShader={diskVertex} fragmentShader={diskFragment}
          vertexColors transparent blending={AdditiveBlending} depthWrite={false} />
      </points>
      <points geometry={bulge}>
        <pointsMaterial size={1.65} transparent opacity={0.11} vertexColors blending={AdditiveBlending} depthWrite={false} />
      </points>
      <points geometry={halo}>
        <pointsMaterial size={0.72} transparent opacity={0.40} vertexColors blending={AdditiveBlending} depthWrite={false} />
      </points>
      <points geometry={halo} visible={controls.showDust}>
        <pointsMaterial size={1.14} transparent opacity={0.09} vertexColors blending={AdditiveBlending} depthWrite={false} />
      </points>
      {showMarkers && markers.map((marker, index) => (
        <group key={marker.tint} ref={group => { labelGroups.current[index] = group; }} position={[marker.x, marker.y, 0]}>
          <Html zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}>
            <div className={'map-marker ' + marker.tint}>{marker.label}</div>
          </Html>
        </group>
      ))}
    </>
  );
}

function Navigation({ view, viewport }) {
  const controls = useRef();
  const aspect = useThree(state => state.size.height / Math.max(1, state.size.width));
  useEffect(() => {
    const navigation = controls.current;
    const fit = Math.max(1, 0.90 * aspect);
    navigation.object.position.set(...views[view.angle].map(value => value * fit));
    navigation.target.set(0, 0, 0);
    navigation.update();
  }, [aspect, view]);
  useEffect(() => {
    const navigation = controls.current;
    const host = viewport.current;
    if (!host) return;
    navigation.listenToKeyEvents(host);
    return () => navigation.stopListenToKeyEvents();
  }, [viewport]);
  return <OrbitControls ref={controls} enablePan enableZoom minDistance={8} maxDistance={2100} />;
}

export default memo(function Scene({ controls, preset, showMarkers, playing, view, viewport, evolution, clock, qualityLabel, seek }) {
  const [dpr, setDpr] = useState(1);
  return (
    <Canvas
      camera={camera}
      dpr={dpr}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      frameloop={playing && controls.rotationSpeed > 0 ? 'always' : 'demand'}
      fallback={<p className="webgl-message">3B sahneyi görüntülemek için WebGL destekli bir tarayıcı kullan.</p>}
    >
      <Stars radius={2000} depth={50} count={2600} factor={2.7} saturation={0} fade />
      <Galaxy controls={controls} preset={preset} playing={playing} showMarkers={showMarkers} evolution={evolution}
        clock={clock} qualityLabel={qualityLabel} seek={seek} onResolution={setDpr} />
      <Navigation view={view} viewport={viewport} />
    </Canvas>
  );
});
