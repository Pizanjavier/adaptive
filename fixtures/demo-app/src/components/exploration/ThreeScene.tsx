import { Component, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial } from '@react-three/drei';
import type { Mesh } from 'three';

function RotatingShape() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1, 0.35, 128, 32]} />
      <MeshDistortMaterial
        color="#4f7df5"
        roughness={0.2}
        metalness={0.8}
        distort={0.15}
        speed={2}
      />
    </mesh>
  );
}

function FloatingRing({ radius, speed }: { radius: number; speed: number }) {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed) * 0.3;
      ref.current.rotation.z = Math.cos(state.clock.elapsedTime * speed * 0.7) * 0.5;
    }
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.02, 16, 64]} />
      <meshStandardMaterial color="#94a3b8" transparent opacity={0.4} />
    </mesh>
  );
}

interface ErrorState {
  hasError: boolean;
}

class SceneErrorBoundary extends Component<{ children: ReactNode }, ErrorState> {
  state: ErrorState = { hasError: false };

  static getDerivedStateFromError(): ErrorState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="scene-static">
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontSize: 14 }}>WebGL is not available in this environment.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              On a device with GPU support, this would render an interactive Three.js scene with a
              rotating torus knot, PBR materials, and orbit controls.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ThreeScene() {
  return (
    <SceneErrorBoundary>
      <div className="scene-container">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-5, -5, -5]} intensity={0.5} color="#60a5fa" />

          <RotatingShape />
          <FloatingRing radius={2} speed={0.5} />
          <FloatingRing radius={2.5} speed={0.3} />

          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  );
}
