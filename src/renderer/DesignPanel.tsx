import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type * as THREE from 'three';
import './DesignPanel.css';

// ─── Character mesh: simple humanoid from primitives ─────────────────────────

interface CharacterProps {
  wireframe: boolean;
}

function CharacterMesh({ wireframe }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.07;
    }
  });

  const matProps = { color: '#c045b0', roughness: 0.28, metalness: 0.55, wireframe };

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 1.58, 0]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Body */}
      <mesh position={[0, 0.92, 0]}>
        <capsuleGeometry args={[0.2, 0.66, 8, 16]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.4, 0.98, 0]} rotation={[0, 0, 0.42]}>
        <capsuleGeometry args={[0.08, 0.44, 4, 8]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Right arm */}
      <mesh position={[0.4, 0.98, 0]} rotation={[0, 0, -0.42]}>
        <capsuleGeometry args={[0.08, 0.44, 4, 8]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Left leg */}
      <mesh position={[-0.14, 0.33, 0]}>
        <capsuleGeometry args={[0.1, 0.52, 4, 8]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Right leg */}
      <mesh position={[0.14, 0.33, 0]}>
        <capsuleGeometry args={[0.1, 0.52, 4, 8]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
    </group>
  );
}

// ─── Spinning accent orb ─────────────────────────────────────────────────────

function AccentOrb() {
  const orbRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!orbRef.current) return;
    const t = state.clock.elapsedTime;
    orbRef.current.position.x = Math.sin(t * 0.7) * 1.1;
    orbRef.current.position.y = 1.4 + Math.cos(t * 0.9) * 0.25;
    orbRef.current.position.z = Math.cos(t * 0.7) * 1.1;
  });

  return (
    <mesh ref={orbRef}>
      <sphereGeometry args={[0.07, 16, 16]} />
      <meshStandardMaterial color="#4fc3f7" emissive="#4fc3f7" emissiveIntensity={1.8} />
    </mesh>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────

function Scene({ wireframe }: { wireframe: boolean }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 4, 3]} intensity={1.8} color="#e085e0" />
      <pointLight position={[-3, 2, -2]} intensity={0.9} color="#4fc3f7" />
      <directionalLight position={[0, 8, 4]} intensity={0.5} />

      <CharacterMesh wireframe={wireframe} />
      <AccentOrb />

      <Grid
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.4}
        cellColor="#22263a"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#323650"
        fadeDistance={16}
        fadeStrength={1.5}
      />

      <OrbitControls
        makeDefault
        minDistance={1.5}
        maxDistance={14}
        target={[0, 0.9, 0]}
      />
    </>
  );
}

// ─── DesignPanel ─────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export default function DesignPanel({ onClose }: Props) {
  const [wireframe, setWireframe] = useState(false);

  return (
    <div className="dp-container">
      <div className="dp-header">
        <span className="dp-header-title">Design Space</span>
        <span className="dp-header-sub">3D Character Designer · Phase 1</span>
        <button className="dp-close-btn" onClick={onClose} title="Exit Design Space">
          ✕ Exit Design
        </button>
      </div>

      <div className="dp-canvas-wrap">
        <Canvas
          camera={{ position: [0, 1.6, 3.8], fov: 48 }}
          gl={{ antialias: true }}
          shadows
        >
          <color attach="background" args={['#0d0f14']} />
          <Scene wireframe={wireframe} />
        </Canvas>
      </div>

      <div className="dp-toolbar">
        <button
          className={`dp-tool-btn${wireframe ? ' dp-tool-btn--active' : ''}`}
          onClick={() => setWireframe((w) => !w)}
        >
          Wireframe
        </button>
        <span className="dp-toolbar-hint">Drag to orbit · Scroll to zoom · Right-drag to pan</span>
      </div>
    </div>
  );
}
