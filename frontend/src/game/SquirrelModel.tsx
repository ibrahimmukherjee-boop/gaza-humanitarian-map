import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";

interface SquirrelModelProps {
  facing: 1 | -1;
  onGround: boolean;
  airborne: boolean;
}

function furMaterial(color: string, roughness = 0.68) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={roughness}
      metalness={0.03}
      clearcoat={0.15}
      clearcoatRoughness={0.4}
      sheen={0.35}
      sheenRoughness={0.6}
      sheenColor={new THREE.Color("#ffe8d0")}
    />
  );
}

export default function SquirrelModel({ facing, onGround, airborne }: SquirrelModelProps) {
  const group = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const head = useRef<Group>(null);

  const fur = "#8B4518";
  const furLight = "#C47840";
  const furDark = "#4A2511";
  const belly = "#E8C4A0";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.scale.set(facing, 1, 1);
    }
    if (tail.current) {
      const wag = onGround ? Math.sin(t * 5) * 0.06 : 0.15;
      tail.current.rotation.z = THREE.MathUtils.lerp(tail.current.rotation.z, wag, 0.1);
    }
    if (head.current) {
      const tilt = airborne ? -0.1 : 0.03;
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, tilt, 0.12);
    }
  });

  return (
    <group ref={group}>
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.34, 32, 32]} />
        {furMaterial(fur)}
      </mesh>
      <mesh position={[0, 0.3, 0.14]} castShadow>
        <sphereGeometry args={[0.24, 24, 24]} />
        {furMaterial(belly, 0.78)}
      </mesh>

      <group ref={head} position={[0.06, 0.68, 0.1]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.26, 32, 32]} />
          {furMaterial(furLight, 0.62)}
        </mesh>
        <mesh position={[0.2, -0.03, 0.08]} castShadow>
          <sphereGeometry args={[0.11, 20, 20]} />
          {furMaterial(furLight, 0.58)}
        </mesh>
        <mesh position={[0.26, -0.01, 0.1]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#1a0a00" roughness={0.3} metalness={0.15} />
        </mesh>
        {([-0.09, 0.09] as const).map((x) => (
          <group key={x}>
            <mesh position={[x, 0.08, 0.2]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color="#1a1008" roughness={0.22} />
            </mesh>
            <mesh position={[x, 0.1, 0.23]}>
              <sphereGeometry args={[0.022, 10, 10]} />
              <meshStandardMaterial
                color="#fff8f0"
                emissive="#ffe8d0"
                emissiveIntensity={0.2}
                roughness={0.15}
              />
            </mesh>
          </group>
        ))}
        {([-0.14, 0.14] as const).map((x) => (
          <mesh
            key={x}
            position={[x, 0.22, -0.02]}
            rotation={[0.15, 0, x > 0 ? -0.35 : 0.35]}
            castShadow
          >
            <coneGeometry args={[0.08, 0.2, 10]} />
            {furMaterial(furDark, 0.85)}
          </mesh>
        ))}
      </group>

      {([-0.17, 0.17] as const).map((x) => (
        <mesh key={x} position={[x, 0.06, 0.16]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          {furMaterial(furDark, 0.82)}
        </mesh>
      ))}

      <group ref={tail} position={[-0.3, 0.48, -0.06]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={i}
            position={[-0.1 - i * 0.07, i * 0.12, -0.05 - i * 0.02]}
            castShadow
          >
            <sphereGeometry args={[0.16 - i * 0.018, 16, 16]} />
            {furMaterial(i % 2 === 0 ? furLight : fur, 0.88)}
          </mesh>
        ))}
      </group>
    </group>
  );
}
