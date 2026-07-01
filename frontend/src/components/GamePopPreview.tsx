import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import SquirrelModel from "../game/SquirrelModel";

function PopSquirrel() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) {
      const t = clock.getElapsedTime();
      group.current.position.y = Math.sin(t * 2.5) * 0.08;
      group.current.rotation.y = Math.sin(t * 0.8) * 0.15;
    }
  });

  return (
    <group ref={group} position={[0, -0.15, 0.8]} scale={1.35} rotation={[0.1, 0.3, 0]}>
      <SquirrelModel
        facing={1}
        velocityY={0}
        onGround
        eating={false}
        velocityX={0}
      />
    </group>
  );
}

/** Mini 3D squirrel that appears to pop out of a glass card */
export default function GamePopPreview() {
  return (
    <div className="game-pop-frame relative mx-auto w-full max-w-sm h-36 overflow-visible">
      <div className="glass-card game-pop-card absolute inset-x-0 bottom-0 h-24 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-t from-sky-200/40 to-transparent" />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ clipPath: "none" }}>
        <Canvas
          camera={{ position: [0, 0.5, 2.2], fov: 42 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 5, 4]} intensity={1.2} />
          <pointLight position={[-2, 2, 3]} intensity={0.5} color="#ffd699" />
          <PopSquirrel />
        </Canvas>
      </div>
      <div className="absolute bottom-2 inset-x-4 z-20 flex justify-center gap-3 pointer-events-none">
        <span className="glass-pill text-xs px-3 py-1">🌰</span>
        <span className="glass-pill text-xs px-3 py-1">↑ jump</span>
      </div>
    </div>
  );
}
