import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei/web/Html.js';
import { OrbitControls } from '@react-three/drei/core/OrbitControls.js';
import { Stars } from '@react-three/drei/core/Stars.js';
import { AdditiveBlending, DataTexture, LinearFilter, RGBAFormat } from 'three';
import { generateBulgeStars, generateHaloStars, generateSpiralArmStars } from './model.js';

const views = {
  oblique: [0, -268, 286],
  top: [0, -0.01, 400],
  edge: [0, -392, 12],
};
const camera = { position: views.oblique, fov: 46, up: [0, 0, 1], far: 4000 };

const starSprite = (() => {
  const side = 32;
  const pixels = new Uint8Array(side * side * 4);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const radius = Math.hypot((x + 0.5) / side - 0.5, (y + 0.5) / side - 0.5);
      const falloff = Math.max(0, Math.exp(-16 * radius ** 2) - Math.exp(-4));
      const brightness = Math.round(255 * falloff);
      pixels.set([brightness, brightness, brightness, 255], (y * side + x) * 4);
    }
  }
  const texture = new DataTexture(pixels, side, side, RGBAFormat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
})();

function StarCloud({ data, size, opacity, visible = true }) {
  return (
    <points visible={visible}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={size} alphaMap={starSprite} transparent opacity={opacity} vertexColors
        blending={AdditiveBlending} depthWrite={false} />
    </points>
  );
}

const markers = [
  { label: 'Güneş Sistemi', position: [85, 0, 0], tint: 'solar' },
  { label: 'Orion Kolu', position: [120, 20, 0], tint: 'orion' },
  { label: 'Galaktik Merkez', position: [0, 0, 0], tint: 'center' },
];

function Galaxy({ controls, playing, showMarkers }) {
  const group = useRef();
  const { arms, armTwist, armSpread, diskWarp, starCount, bulgeCount, haloCount, showDust, starSize, rotationSpeed } = controls;
  const disk = useMemo(() => generateSpiralArmStars({
    count: starCount, arms, armTwist, armSpread, warp: diskWarp, radius: 160, height: 6, randomness: 0.9, seed: 42,
  }), [arms, armTwist, armSpread, diskWarp, starCount]);
  const bulge = useMemo(() => generateBulgeStars({ count: bulgeCount, radius: 20, seed: 43 }), [bulgeCount]);
  const halo = useMemo(() => generateHaloStars({ count: haloCount, radius: 800, seed: 44 }), [haloCount]);

  useFrame((_, dt) => {
    if (playing) group.current.rotation.z += rotationSpeed * dt * 10;
  });

  return (
    <group ref={group}>
      <StarCloud data={disk} size={starSize * 1.65} opacity={0.68} />
      <StarCloud data={bulge} size={2.1} opacity={0.24} />
      <StarCloud data={halo} size={1.6} opacity={0.42} />
      <StarCloud data={halo} size={1.1} opacity={0.5} visible={showDust} />
      <mesh>
        <sphereGeometry args={[6.5, 32, 32]} />
        <meshBasicMaterial color={[1, 0.9, 0.6]} transparent opacity={0.07} depthWrite={false} />
      </mesh>
      {showMarkers && markers.map(marker => (
        <Html key={marker.tint} position={marker.position} zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}>
          <div className={'map-marker ' + marker.tint}>{marker.label}</div>
        </Html>
      ))}
    </group>
  );
}

function Navigation({ view, viewport }) {
  const controls = useRef();
  useEffect(() => {
    const navigation = controls.current;
    navigation.object.position.set(...views[view.angle]);
    navigation.target.set(0, 0, 0);
    navigation.update();
  }, [view]);
  useEffect(() => {
    const navigation = controls.current;
    const host = viewport.current;
    if (!host) return;
    navigation.listenToKeyEvents(host);
    return () => navigation.stopListenToKeyEvents();
  }, [viewport]);
  return <OrbitControls ref={controls} enablePan enableZoom minDistance={8} maxDistance={1700} />;
}

export default function Scene({ controls, showMarkers, playing, view, viewport }) {
  return (
    <Canvas
      camera={camera}
      dpr={[1, 1.55]}
      gl={{ antialias: true, alpha: true }}
      frameloop={playing && controls.rotationSpeed > 0 ? 'always' : 'demand'}
      fallback={<p className="webgl-message">3B sahneyi görüntülemek için WebGL destekli bir tarayıcı kullan.</p>}
    >
      <Stars radius={2000} depth={50} count={5000} factor={2.5} saturation={0} fade />
      <Galaxy controls={controls} playing={playing} showMarkers={showMarkers} />
      <Navigation view={view} viewport={viewport} />
    </Canvas>
  );
}
