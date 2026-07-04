import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import SquirrelModel from "./SquirrelModel";
import {
  createNuts,
  INITIAL_STATE,
  PLAYER_H,
  MOVE_SPEED,
  NUTS,
  type GameState,
  type Nut,
  collectRadius,
} from "./types";
import { stepPhysics, applyJump } from "./physics";

type MoveDir = -1 | 0 | 1;

interface GameInput {
  move: MoveDir;
  jumpSmall: number;
  jumpBig: number;
}

function NutMesh({ nut }: { nut: Nut }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && !nut.collected) {
      ref.current.rotation.y = clock.getElapsedTime() * 1.5;
      ref.current.position.y = nut.y + Math.sin(clock.getElapsedTime() * 2.5) * 0.05;
    }
  });
  if (nut.collected) return null;

  const glow = nut.tier === "high" ? "#ffd080" : "#ffe8c0";

  return (
    <group ref={ref} position={[nut.x, nut.y, 0]}>
      <mesh position={[0, -nut.y + 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.35, 0.4, 0.04, 16]} />
        <meshStandardMaterial color="#4a6741" roughness={0.9} transparent opacity={0.35} />
      </mesh>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.24, 1]} />
        <meshStandardMaterial color="#6B4423" roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[0.25, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.13, 0.2, 10]} />
        <meshStandardMaterial color="#3D2817" roughness={0.75} />
      </mesh>
      <pointLight position={[0, 0.1, 0.4]} intensity={0.45} color={glow} distance={2.5} />
    </group>
  );
}

function HeightMarker({ x, y, tier }: { x: number; y: number; tier: "low" | "high" }) {
  const color = tier === "high" ? "#9b87f5" : "#7cb8a0";
  return (
    <group position={[x, 0, -0.2]}>
      <mesh position={[0, y / 2, 0]}>
        <boxGeometry args={[0.06, y, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.5} transparent opacity={0.25} />
      </mesh>
      <mesh position={[0, y, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Ground() {
  return (
    <group>
      <mesh position={[17, -0.35, 0]} receiveShadow>
        <boxGeometry args={[42, 0.7, 3.5]} />
        <meshStandardMaterial color="#2a3d28" roughness={0.88} metalness={0.02} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[17, -0.01, 0.15]} receiveShadow>
        <planeGeometry args={[42, 5]} />
        <meshStandardMaterial color="#3d5c3a" roughness={0.92} />
      </mesh>
    </group>
  );
}

function CameraRig({ targetX }: { targetX: number }) {
  const { camera } = useThree();
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const target = new THREE.Vector3(targetX + 1.2, 2.6, 10.5);
    cam.position.lerp(target, 0.07);
    cam.lookAt(targetX, 1.6, 0);
  });
  return null;
}

function StudioLights({ targetX }: { targetX: number }) {
  return (
    <>
      <ambientLight intensity={0.18} color="#807888" />
      <directionalLight
        position={[-5, 9, 6]}
        intensity={1.8}
        color="#ffd4a8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={40}
        shadow-camera-left={-15}
        shadow-camera-right={15}
      />
      <directionalLight position={[10, 3, -5]} intensity={0.65} color="#7c6cf0" />
      <pointLight position={[targetX + 1, 4, 4]} intensity={0.5} color="#ffb870" distance={14} />
    </>
  );
}

function GameWorld({
  inputRef,
  onScore,
  onWin,
}: {
  inputRef: React.MutableRefObject<GameInput>;
  onScore: (s: number) => void;
  onWin: () => void;
}) {
  const state = useRef<GameState>({ ...INITIAL_STATE });
  const nuts = useRef<Nut[]>(createNuts());
  const squirrelPos = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.033);
    const s = state.current;
    const input = inputRef.current;

    if (input.jumpSmall > 0) {
      applyJump(s, "small");
      input.jumpSmall = 0;
    }
    if (input.jumpBig > 0) {
      applyJump(s, "big");
      input.jumpBig = 0;
    }

    const move = input.move;
    if (move === -1) {
      s.vx = -MOVE_SPEED;
      s.facing = -1;
    } else if (move === 1) {
      s.vx = MOVE_SPEED;
      s.facing = 1;
    } else {
      s.vx *= 0.7;
      if (Math.abs(s.vx) < 0.05) s.vx = 0;
    }

    stepPhysics(s, dt);

    if (s.y < -3) {
      Object.assign(s, { ...INITIAL_STATE, score: s.score });
      nuts.current = createNuts();
    }

    const cx = s.x;
    const cy = s.y + PLAYER_H * 0.55;
    const r = collectRadius();

    for (const nut of nuts.current) {
      if (nut.collected) continue;
      if (Math.hypot(cx - nut.x, cy - nut.y) < r) {
        nut.collected = true;
        s.score += 10;
        onScore(s.score);
      }
    }

    if (nuts.current.every((n) => n.collected)) onWin();

    if (squirrelPos.current) {
      squirrelPos.current.position.set(s.x, s.y + PLAYER_H * 0.5 - 0.05, 0.45);
    }
  });

  const s = state.current;

  return (
    <>
      <color attach="background" args={["#0f0d14"]} />
      <fog attach="fog" args={["#0f0d14", 16, 42]} />
      <CameraRig targetX={s.x} />
      <StudioLights targetX={s.x} />
      <Ground />
      {NUTS.map((n) => (
        <HeightMarker key={`m-${n.id}`} x={n.x} y={n.y} tier={n.tier} />
      ))}
      {nuts.current.map((n) => (
        <NutMesh key={n.id} nut={n} />
      ))}
      <group ref={squirrelPos}>
        <SquirrelModel facing={s.facing} onGround={s.onGround} airborne={!s.onGround} />
      </group>
    </>
  );
}

interface SquirrelAdventureGameProps {
  onScoreChange?: (score: number) => void;
}

export default function SquirrelAdventureGame({ onScoreChange }: SquirrelAdventureGameProps) {
  const { t } = useTranslation();
  const inputRef = useRef<GameInput>({ move: 0, jumpSmall: 0, jumpBig: 0 });
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const setMove = useCallback((dir: MoveDir) => {
    inputRef.current.move = dir;
  }, []);

  const jumpGuard = useRef(0);

  const jumpSmall = useCallback(() => {
    const now = performance.now();
    if (now - jumpGuard.current < 100) return;
    jumpGuard.current = now;
    inputRef.current.jumpSmall = 1;
  }, []);

  const jumpBig = useCallback(() => {
    const now = performance.now();
    if (now - jumpGuard.current < 100) return;
    jumpGuard.current = now;
    inputRef.current.jumpBig = 1;
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a") setMove(-1);
      if (e.key === "ArrowRight" || e.key === "d") setMove(1);
      if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") {
        e.preventDefault();
        if (e.shiftKey) jumpBig();
        else jumpSmall();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "ArrowRight" || e.key === "d") {
        setMove(0);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [setMove, jumpSmall, jumpBig]);

  function handleScore(s: number) {
    setScore(s);
    onScoreChange?.(s);
  }

  function restart() {
    setWon(false);
    setScore(0);
    inputRef.current = { move: 0, jumpSmall: 0, jumpBig: 0 };
    setGameKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="relative flex-1 min-h-[220px] rounded-t-xl overflow-hidden border border-b-0 border-slate-200 bg-[#0f0d14]">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ fov: 42, near: 0.1, far: 80, position: [3, 2.6, 10.5] }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
        >
          <GameWorld
            key={gameKey}
            inputRef={inputRef}
            onScore={handleScore}
            onWin={() => setWon(true)}
          />
        </Canvas>

        <div className="absolute top-2 left-2 z-10 card py-1 px-2.5 font-semibold text-base pointer-events-none">
          🌰 {score}
        </div>

        {won && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45">
            <div className="card text-center max-w-xs mx-4">
              <p className="text-4xl mb-2">🐿️🎉</p>
              <p className="text-xl font-bold text-slate-900 mb-1">{t("children_game.win_title")}</p>
              <p className="text-slate-600 mb-4">
                {t("children_game.score")}: {score}
              </p>
              <button type="button" className="btn btn-primary w-full" onClick={restart}>
                {t("children_game.play_again")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls below canvas — never blocked by WebGL */}
      <div className="game-controls shrink-0 rounded-b-xl border border-t-0 border-slate-200 bg-white p-3">
        <div className="flex items-stretch justify-between gap-2 max-w-lg mx-auto">
          <button
            type="button"
            className="game-btn flex-1 max-w-[72px]"
            aria-label={t("children_game.move_left")}
            onTouchStart={(e) => {
              e.preventDefault();
              setMove(-1);
            }}
            onTouchEnd={() => setMove(0)}
            onTouchCancel={() => setMove(0)}
            onMouseDown={() => setMove(-1)}
            onMouseUp={() => setMove(0)}
            onMouseLeave={() => setMove(0)}
          >
            ◀
          </button>
          <button
            type="button"
            className="game-btn flex-1 max-w-[72px]"
            aria-label={t("children_game.move_right")}
            onTouchStart={(e) => {
              e.preventDefault();
              setMove(1);
            }}
            onTouchEnd={() => setMove(0)}
            onTouchCancel={() => setMove(0)}
            onMouseDown={() => setMove(1)}
            onMouseUp={() => setMove(0)}
            onMouseLeave={() => setMove(0)}
          >
            ▶
          </button>
          <button
            type="button"
            className="game-btn flex-1 max-w-[80px]"
            aria-label={t("children_game.jump_small")}
            onTouchStart={(e) => {
              e.preventDefault();
              jumpSmall();
            }}
            onClick={(e) => {
              e.preventDefault();
              jumpSmall();
            }}
          >
            <span className="text-sm leading-none">↑</span>
            <span className="block text-[10px] font-normal opacity-75 mt-0.5">1</span>
          </button>
          <button
            type="button"
            className="game-btn game-btn-jump flex-1 max-w-[88px]"
            aria-label={t("children_game.jump_big")}
            onTouchStart={(e) => {
              e.preventDefault();
              jumpBig();
            }}
            onClick={(e) => {
              e.preventDefault();
              jumpBig();
            }}
          >
            <span className="text-sm leading-none">↑↑</span>
            <span className="block text-[10px] font-normal opacity-75 mt-0.5">2</span>
          </button>
        </div>
      </div>
    </div>
  );
}
