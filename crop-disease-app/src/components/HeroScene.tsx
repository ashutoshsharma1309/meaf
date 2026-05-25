/**
 * HeroScene — premium agritech intelligence orb.
 *
 * A single iridescent glass orb floats centre-stage with a soft glowing
 * core inside. Sparse particles drift around it. Multiple coloured lights
 * create gentle refraction. Clean, calm, premium — designed for a light
 * background, not a dark cyberpunk scene.
 */
import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

/* slow drifting particle field */
function Particles({ count = 600 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.5 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.02;
      ref.current.rotation.x += dt * 0.008;
    }
  });
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial
        size={0.035}
        sizeAttenuation
        color="#56b574"
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

/* central iridescent glass orb */
function GlassOrb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.12;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.8}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.6, 6]} />
        <MeshDistortMaterial
          color="#bbe5c7"
          roughness={0.05}
          metalness={0.15}
          transmission={1}
          thickness={1.6}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.05}
          iridescence={0.6}
          iridescenceIOR={1.4}
          distort={0.18}
          speed={1.6}
          attach="material"
          transparent
          opacity={0.95}
        />
      </mesh>
    </Float>
  );
}

/* small inner emissive core — "intelligence" */
function Core() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      const s = 1 + 0.08 * Math.sin(t * 2);
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.32, 64, 64]} />
      <meshStandardMaterial
        color="#329a55"
        emissive="#56b574"
        emissiveIntensity={2.2}
        roughness={0.4}
      />
    </mesh>
  );
}

/* subtle outer halo ring (very faint) */
function HaloRing() {
  return (
    <mesh rotation={[Math.PI / 2.2, 0.3, 0]}>
      <torusGeometry args={[2.55, 0.006, 16, 200]} />
      <meshBasicMaterial color="#1f7c42" transparent opacity={0.18} />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      {/* soft ambient + cinematic key/fill lights */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 6, 5]} intensity={1.1} color="#ffffff" />
      <pointLight position={[-6, 2, 4]} intensity={1.5} color="#3aa6f9" />
      <pointLight position={[6, -2, -4]} intensity={1.2} color="#faa423" />
      <pointLight position={[0, -3, 4]} intensity={0.7} color="#56b574" />

      <Particles />
      <HaloRing />
      <GlassOrb />
      <Core />
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 5.4], fov: 38 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
