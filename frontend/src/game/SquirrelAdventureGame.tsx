import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import SquirrelModel from "./SquirrelModel";
import {
  generateWorld,
  createNutsFromWorld,
  worldLength,
  type WorldConfig,
  type SceneryProp,
} from "./worldGen";
import {
  INITIAL_STATE,
  PLAYER_H,
  MOVE_SPEED,
  HORIZONTAL_COLLECT,
  nextNut,
  type GameState,
  type Nut,
} from "./types";
import { stepPhysics, applyJump } from "./physics";

type MoveDir = -1 | 0 | 1;
type JumpKind = "small" | "big";

interface GameInput {
  move: MoveDir;
  jumpSmall: number;
  jumpBig: number;
}

const NUT_COLOR = "#7a5230";
const NUT_CAP = "#4a3018";

function NutMesh({ nut }: { nut: Nut }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && !nut.collected) {
      ref.current.rotation.y = clock.getElapsedTime() * 1.2;
      ref.current.position.y = nut.y + Math.sin(clock.getElapsedTime() * 2) * 0.04;
    }
  });
  if (nut.collected) return null;

  return (
    <group ref={ref} position={[nut.x, nut.y, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshStandardMaterial color={NUT_COLOR} roughness={0.5} metalness={0.06} />
      </mesh>
      <mesh position={[0, 0.12, 0.12]} rotation={[0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.14, 8]} />
        <meshStandardMaterial color={NUT_CAP} roughness={0.75} />
      </mesh>
      {nut.step === 1 ? (
        <mesh position={[0, 0.42, 0.15]}>
          <ringGeometry args={[0.12, 0.18, 16]} />
          <meshStandardMaterial color="#f5d080" emissive="#d4a040" emissiveIntensity={0.3} />
        </mesh>
      ) : (
        <>
          <mesh position={[0, 0.42, 0.14]}>
            <ringGeometry args={[0.14, 0.17, 16]} />
            <meshStandardMaterial color="#f5d080" emissive="#d4a040" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.42, 0.16]}>
            <ringGeometry args={[0.19, 0.22, 16]} />
            <meshStandardMaterial color="#f5d080" emissive="#d4a040" emissiveIntensity={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
}

function Scenery({ prop }: { prop: SceneryProp }) {
  const green = "#2d5a2a";
  const dark = "#4a4038";
  if (prop.kind === "tree") {
    return (
      <group position={[prop.x, 0, prop.z]} scale={prop.scale}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, 1, 6]} />
          <meshStandardMaterial color="#4a3520" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.3, 0]} castShadow>
          <coneGeometry args={[0.45, 1.1, 8]} />
          <meshStandardMaterial color={green} roughness={0.85} />
        </mesh>
      </group>
    );
  }
  if (prop.kind === "bush") {
    return (
      <mesh position={[prop.x, 0.25, prop.z]} scale={prop.scale} castShadow>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial color={green} roughness={0.9} />
      </mesh>
    );
  }
  if (prop.kind === "rock") {
    return (
      <mesh position={[prop.x, 0.15, prop.z]} scale={prop.scale} castShadow>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color={dark} roughness={0.95} />
      </mesh>
    );
  }
  return (
    <mesh position={[prop.x, 0.12, prop.z]} scale={prop.scale * 0.5}>
      <sphereGeometry args={[0.12, 6, 6]} />
      <meshStandardMaterial color="#e8a040" emissive="#c07020" emissiveIntensity={0.15} />
    </mesh>
  );
}

function Ground({ length, color }: { length: number; color: string }) {
  const cx = length / 2;
  return (
    <group>
      <mesh position={[cx, -0.35, 0]} receiveShadow>
        <boxGeometry args={[length, 0.7, 4]} />
        <meshStandardMaterial color="#2a3d28" roughness={0.88} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.01, 0.1]} receiveShadow>
        <planeGeometry args={[length, 6]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
    </group>
  );
}

/** Camera scrolls forward — squirrel stays left-of-centre, world moves ahead */
function CameraRig({ targetX }: { targetX: number }) {
  const { camera } = useThree();
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const lookX = targetX + 2.2;
    const desired = new THREE.Vector3(targetX + 0.8, 2.35, 8.8);
    cam.position.lerp(desired, 0.38);
    cam.lookAt(lookX, 1.05, 0);
  });
  return null;
}

function StudioLights({ targetX }: { targetX: number }) {
  return (
    <>
      <ambientLight intensity={0.38} color="#908898" />
      <directionalLight
        position={[targetX - 3, 10, 7]}
        intensity={1.45}
        color="#ffd4a8"
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight position={[targetX + 8, 3, -4]} intensity={0.4} color="#9080c0" />
    </>
  );
}

function tryCollectOnJump(
  s: GameState,
  nuts: Nut[],
  kind: JumpKind,
  onScore: (n: number) => void
): boolean {
  const step = kind === "small" ? 1 : 2;
  let target: Nut | undefined;
  let best = HORIZONTAL_COLLECT;

  for (const nut of nuts) {
    if (nut.collected || nut.step !== step) continue;
    const d = Math.abs(s.x - nut.x);
    if (d < best) {
      best = d;
      target = nut;
    }
  }

  if (!target) return false;
  target.collected = true;
  s.score += 10;
  onScore(s.score);
  return true;
}

function GameWorld({
  world,
  inputRef,
  onScore,
  onWin,
  onHint,
}: {
  world: WorldConfig;
  inputRef: React.MutableRefObject<GameInput>;
  onScore: (s: number) => void;
  onWin: () => void;
  onHint: (step: 1 | 2 | null) => void;
}) {
  const state = useRef<GameState>({ ...INITIAL_STATE });
  const nuts = useRef<Nut[]>(createNutsFromWorld(world));
  const squirrelPos = useRef<THREE.Group>(null);
  const maxX = worldLength(world);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.033);
    const s = state.current;
    const input = inputRef.current;

    if (input.jumpSmall > 0) {
      applyJump(s, "small");
      tryCollectOnJump(s, nuts.current, "small", onScore);
      input.jumpSmall = 0;
    }
    if (input.jumpBig > 0) {
      applyJump(s, "big");
      tryCollectOnJump(s, nuts.current, "big", onScore);
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
      s.vx *= 0.72;
      if (Math.abs(s.vx) < 0.05) s.vx = 0;
    }

    stepPhysics(s, dt, maxX);

    if (s.y < -2) {
      Object.assign(s, { ...INITIAL_STATE, score: s.score });
    }

    const n = nextNut(nuts.current);
    onHint(n ? n.step : null);

    if (nuts.current.every((nut) => nut.collected)) onWin();

    if (squirrelPos.current) {
      squirrelPos.current.position.set(s.x, s.y + PLAYER_H * 0.5 - 0.05, 0.35);
    }
  });

  const s = state.current;
  const len = maxX + 4;

  return (
    <>
      <color attach="background" args={[world.skyTop]} />
      <fog attach="fog" args={[world.skyBottom, 28, 65]} />
      <CameraRig targetX={s.x} />
      <StudioLights targetX={s.x} />
      <Ground length={len} color={world.grass} />
      {world.props.map((p) => (
        <Scenery key={p.id} prop={p} />
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
  const [hint, setHint] = useState<1 | 2 | null>(1);
  const seed = useMemo(() => Date.now() + gameKey * 9973, [gameKey]);
  const world = useMemo(() => generateWorld(seed), [seed]);

  const setMove = useCallback((dir: MoveDir) => {
    inputRef.current.move = dir;
  }, []);

  const jumpGuard = useRef(0);

  const jumpSmall = useCallback(() => {
    const now = performance.now();
    if (now - jumpGuard.current < 80) return;
    jumpGuard.current = now;
    inputRef.current.jumpSmall = 1;
  }, []);

  const jumpBig = useCallback(() => {
    const now = performance.now();
    if (now - jumpGuard.current < 80) return;
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
    setHint(1);
    inputRef.current = { move: 0, jumpSmall: 0, jumpBig: 0 };
    setGameKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="relative flex-1 min-h-[220px] rounded-t-xl overflow-hidden border border-b-0 border-slate-200 bg-[#1a1820]">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ fov: 50, near: 0.1, far: 100, position: [2, 2.35, 8.8] }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
        >
          <GameWorld
            key={gameKey}
            world={world}
            inputRef={inputRef}
            onScore={handleScore}
            onWin={() => setWon(true)}
            onHint={setHint}
          />
        </Canvas>

        <div className="absolute top-2 left-2 z-10 card py-1 px-2.5 font-semibold text-base pointer-events-none">
          🌰 {score}/{world.nuts.length}
        </div>

        {hint && !won && (
          <div className="absolute top-2 right-2 z-10 card py-1 px-2.5 text-xs pointer-events-none text-slate-600">
            {t(`children_game.hint_${hint}`)}
          </div>
        )}

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
