import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";

interface SquirrelModelProps {
  facing: 1 | -1;
  onGround: boolean;
  eating: boolean;
  velocityX: number;
}

export default function SquirrelModel({
  facing,
  onGround,
  eating,
  velocityX,
}: SquirrelModelProps) {
  const group = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const head = useRef<Group>(null);
  const pawL = useRef<Group>(null);
  const pawR = useRef<Group>(null);

  const fur = "#9B4E23";
  const furLight = "#C47840";
  const furDark = "#6B3410";
  const belly = "#E8C4A0";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      const runBob =
        Math.abs(velocityX) > 1 && onGround ? Math.sin(t * 12) * 0.025 : 0;
      group.current.position.y = runBob;
      const targetScaleY = !onGround ? 1.05 : 1;
      group.current.scale.y = THREE.MathUtils.lerp(group.current.scale.y, targetScaleY, 0.1);
      group.current.scale.x = THREE.MathUtils.lerp(
        group.current.scale.x,
        onGround ? 1 : 0.95,
        0.1
      );
    }
    if (tail.current) {
      tail.current.rotation.z = Math.sin(t * 3) * 0.15 + (eating ? 0.3 : 0);
    }
    if (head.current) {
      head.current.rotation.x = eating
        ? Math.sin(t * 18) * 0.12
        : !onGround
          ? -0.08
          : Math.sin(t * 2) * 0.03;
    }
    if (pawL.current && pawR.current) {
      const pawUp = eating ? 0.5 : 0;
      pawL.current.rotation.x = THREE.MathUtils.lerp(pawL.current.rotation.x, pawUp, 0.2);
      pawR.current.rotation.x = THREE.MathUtils.lerp(pawR.current.rotation.x, pawUp, 0.2);
    }
  });

  return (
    <group ref={group} scale={[facing, 1, 1]} rotation={[0, facing === -1 ? Math.PI : 0, 0]}>
      {/* Body */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color={fur} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Belly */}
      <mesh position={[0, 0.28, 0.12]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={belly} roughness={0.9} />
      </mesh>

      {/* Head group */}
      <group ref={head} position={[0.05, 0.62, 0.08]}>
        <mesh castShadow>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial color={furLight} roughness={0.8} />
        </mesh>
        {/* Snout */}
        <mesh position={[0.18, -0.04, 0.06]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={furLight} roughness={0.75} />
        </mesh>
        <mesh position={[0.24, -0.02, 0.08]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.08, 0.06, 0.18]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#1a1008" roughness={0.2} />
        </mesh>
        <mesh position={[0.08, 0.08, 0.21]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[-0.08, 0.06, 0.18]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#1a1008" roughness={0.2} />
        </mesh>
        <mesh position={[-0.08, 0.08, 0.21]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
        {/* Ear tufts */}
        {([-0.12, 0.12] as const).map((x) => (
          <group key={x} position={[x, 0.2, -0.02]}>
            <mesh castShadow rotation={[0.2, 0, x > 0 ? -0.3 : 0.3]}>
              <coneGeometry args={[0.07, 0.18, 8]} />
              <meshStandardMaterial color={furDark} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.06, 0]} rotation={[0.2, 0, 0]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color={furLight} roughness={0.85} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Paws */}
      <group ref={pawL} position={[-0.15, 0.08, 0.15]}>
        <mesh castShadow>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color={furDark} roughness={0.85} />
        </mesh>
      </group>
      <group ref={pawR} position={[0.15, 0.08, 0.15]}>
        <mesh castShadow>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color={furDark} roughness={0.85} />
        </mesh>
      </group>

      {/* Bushy tail */}
      <group ref={tail} position={[-0.28, 0.45, -0.05]}>
        {[0, 0.15, 0.3, 0.45, 0.58].map((y, i) => (
          <mesh key={i} position={[ -0.08 - i * 0.06, y * 0.35, -0.04 - i * 0.03]} castShadow>
            <sphereGeometry args={[0.14 - i * 0.015, 12, 12]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? fur : furLight}
              roughness={0.92}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
