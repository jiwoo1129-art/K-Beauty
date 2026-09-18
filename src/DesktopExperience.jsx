import { useEffect, useMemo, useRef } from 'react';
import { ContactShadows, useAnimations, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MODEL_URL = './assets/comply-serum-white.glb';

function SerumProduct() {
  const group = useRef();
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, group);
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    Object.values(actions).forEach((action) => action?.reset().fadeIn(0.6).play());
    return () => Object.values(actions).forEach((action) => action?.fadeOut(0.2));
  }, [actions]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    const targetX = state.pointer.y * 0.08 + Math.sin(time * 0.72) * 0.025;
    const targetY = state.pointer.x * 0.18 - 0.24;
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 3.2, delta);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 3.2, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, -0.2 + Math.sin(time * 0.9) * 0.08, 3, delta);
  });

  return <group ref={group} scale={0.92} position={[0, -0.2, 0]} rotation={[0, -0.24, 0]}><primitive object={model} /></group>;
}

export default function DesktopExperience() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.15, 6.1], fov: 34, near: 0.1, far: 50 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.2; }}>
      <ambientLight intensity={1.45} />
      <directionalLight position={[4, 5, 5]} intensity={4.2} color="#fffaf0" />
      <directionalLight position={[-4, 1, 3]} intensity={2.1} color="#d8ebff" />
      <pointLight position={[2.4, -1, 2]} intensity={42} color="#ff9900" distance={8} />
      <SerumProduct />
      <ContactShadows position={[0, -1.7, 0]} opacity={0.32} scale={5} blur={2.4} far={4} color="#000000" />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
