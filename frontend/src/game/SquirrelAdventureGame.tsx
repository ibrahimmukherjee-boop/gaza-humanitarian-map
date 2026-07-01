import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Cloud, Stars } from "@react-three/drei";
import * as THREE from "three";
import SquirrelModel from "./SquirrelModel";
import {
  PLATFORMS,
  createNuts,
  GRAVITY,
  JUMP_FORCE,
  MOVE_SPEED,
  SQUIRREL_W,
  SQUIRREL_H,
  INITIAL_STATE,
  type GameState,
  type Nut,
  type Platform,
} from "./types";

type Keys = { left: boolean; right: boolean; jump: boolean };

function collideAABB(
  px: number,
  py: number,
  pw: number,
  ph: number,
  plat: Platform
): { hit: boolean; top?: number } {
  const pl = plat.x - plat.width / 2;
  const pr = plat.x + plat.width / 2;
  const pb = plat.y;
  const pt = plat.y + plat.height;

  const sl = px - pw / 2;
  const sr = px + pw / 2;
  const sb = py;
  const st = py + ph;

  if (sr < pl || sl > pr || st < pb || sb > pt) return { hit: false };

  const overlapTop = st - pb;
  const overlapBottom = pt - sb;
  const overlapLeft = sr - pl;
  const overlapRight = pr - sl;

  const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);

  if (minOverlap === overlapTop && overlapTop < 0.4) {
    return { hit: true, top: pb };
  }
  return { hit: true };
}

function NutMesh({ nut, visible }: { nut: Nut; visible: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && visible) {
      ref.current.rotation.y = clock.getElapsedTime() * 2;
      ref.current.position.y = nut.y + Math.sin(clock.getElapsedTime() * 3) * 0.06;
    }
  });
  if (!visible) return null;
  return (
    <group ref={ref} position={[nut.x, nut.y, 0]}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#8B6914" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.15, 8]} />
        <meshStandardMaterial color="#5C4033" roughness={0.85} />
      </mesh>
    </group>
  );
}

function PlatformBlock({ plat }: { plat: Platform }) {
  const color =
    plat.type === "ground"
      ? "#4ade80"
      : plat.type === "question"
        ? "#fbbf24"
        : "#c2410c";
  const topColor = plat.type === "ground" ? "#22c55e" : plat.type === "question" ? "#fde047" : "#ea580c";

  return (
    <group position={[plat.x, plat.y + plat.height / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[plat.width, plat.height, plat.type === "ground" ? 2 : 0.8]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {plat.type !== "ground" && (
        <mesh position={[0, plat.height / 2 + 0.01, 0.41]} receiveShadow>
          <boxGeometry args={[plat.width * 0.95, 0.08, 0.02]} />
          <meshStandardMaterial color={topColor} roughness={0.5} />
        </mesh>
      )}
      {plat.type === "question" && (
        <mesh position={[0, 0, 0.42]}>
          <circleGeometry args={[0.2, 16]} />
          <meshStandardMaterial color="#fde047" emissive="#fbbf24" emissiveIntensity={0.2} />
        </mesh>
      )}
      {plat.type === "ground" && (
        <>
          {Array.from({ length: Math.floor(plat.width / 1.5) }, (_, i) => (
            <mesh
              key={i}
              position={[(i - plat.width / 3) * 1.4, plat.height / 2 + 0.02, 0.3]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[0.15, 8]} />
              <meshStandardMaterial color="#16a34a" roughness={0.9} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

function CameraRig({ targetX }: { targetX: number }) {
  const { camera } = useThree();
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const target = new THREE.Vector3(targetX + 2, 3.5, 9);
    cam.position.lerp(target, 0.08);
    cam.lookAt(targetX, 2, 0);
  });
  return null;
}

function GameWorld({
  keysRef,
  onScore,
  onWin,
}: {
  keysRef: React.MutableRefObject<Keys>;
  onScore: (s: number) => void;
  onWin: () => void;
}) {
  const state = useRef<GameState>({ ...INITIAL_STATE });
  const nuts = useRef<Nut[]>(createNuts());
  const squirrelPos = useRef(new THREE.Group());
  const [, tick] = useState(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = state.current;
    const keys = keysRef.current;

    if (s.eating) {
      s.eatTimer -= dt;
      if (s.eatTimer <= 0) s.eating = false;
    } else {
      if (keys.left) {
        s.vx = -MOVE_SPEED;
        s.facing = -1;
      } else if (keys.right) {
        s.vx = MOVE_SPEED;
        s.facing = 1;
      } else {
        s.vx *= 0.82;
      }

      if (keys.jump && s.onGround) {
        s.vy = JUMP_FORCE;
        s.onGround = false;
        s.jumpCount++;
      }
    }

    s.vy += GRAVITY * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    s.onGround = false;
    for (const plat of PLATFORMS) {
      const col = collideAABB(s.x, s.y, SQUIRREL_W, SQUIRREL_H, plat);
      if (col.hit && col.top !== undefined && s.vy <= 0) {
        s.y = col.top;
        s.vy = 0;
        s.onGround = true;
      } else if (col.hit && s.vy > 0) {
        s.vy = -2;
      }
    }

    if (s.y < -2) {
      Object.assign(s, { ...INITIAL_STATE });
      nuts.current = createNuts();
    }

    if (!s.eating) {
      for (const nut of nuts.current) {
        if (nut.collected) continue;
        const dx = s.x - nut.x;
        const dy = s.y + SQUIRREL_H / 2 - nut.y;
        if (Math.hypot(dx, dy) < 0.65) {
          nut.collected = true;
          s.score += 10;
          s.eating = true;
          s.eatTimer = 0.5;
          s.vx = 0;
          onScore(s.score);
        }
      }
    }

    if (nuts.current.every((n) => n.collected)) onWin();

    if (squirrelPos.current) {
      squirrelPos.current.position.set(s.x, s.y + SQUIRREL_H / 2 - 0.1, 0.3);
    }
    tick((n) => n + 1);
  });

  const s = state.current;

  return (
    <>
      <CameraRig targetX={s.x} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[s.x, 5, 4]} intensity={0.4} color="#ffd699" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, -1.2, -2]} receiveShadow>
        <planeGeometry args={[120, 30]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      <Stars radius={80} depth={40} count={800} factor={3} saturation={0.2} fade speed={0.5} />
      <Cloud opacity={0.35} speed={0.2} position={[10, 8, -8]} />
      <Cloud opacity={0.3} speed={0.15} position={[30, 9, -10]} />

      {PLATFORMS.map((p) => (
        <PlatformBlock key={p.id} plat={p} />
      ))}

      {nuts.current.map((n) => (
        <NutMesh key={n.id} nut={n} visible={!n.collected} />
      ))}

      <group ref={squirrelPos}>
        <SquirrelModel
          facing={s.facing}
          velocityY={s.vy}
          onGround={s.onGround}
          eating={s.eating}
          velocityX={s.vx}
        />
      </group>
    </>
  );
}

interface SquirrelAdventureGameProps {
  onScoreChange?: (score: number) => void;
}

export default function SquirrelAdventureGame({ onScoreChange }: SquirrelAdventureGameProps) {
  const { t } = useTranslation();
  const keysRef = useRef<Keys>({ left: false, right: false, jump: false });
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const setKey = useCallback((k: keyof Keys, v: boolean) => {
    keysRef.current[k] = v;
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a") setKey("left", true);
      if (e.key === "ArrowRight" || e.key === "d") setKey("right", true);
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        setKey("jump", true);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a") setKey("left", false);
      if (e.key === "ArrowRight" || e.key === "d") setKey("right", false);
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") setKey("jump", false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [setKey]);

  function handleScore(s: number) {
    setScore(s);
    onScoreChange?.(s);
  }

  function restart() {
    setWon(false);
    setScore(0);
    setGameKey((k) => k + 1);
  }

  return (
    <div className="relative w-full h-full touch-none select-none">
      <Canvas
        shadows
        camera={{ fov: 45, near: 0.1, far: 200, position: [2, 3.5, 9] }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "linear-gradient(180deg, #7ec8e3 0%, #b8e0f0 40%, #87CEEB 100%)" }}
      >
        <fog attach="fog" args={["#b8e0f0", 15, 45]} />
        <GameWorld
          key={gameKey}
          keysRef={keysRef}
          onScore={handleScore}
          onWin={() => setWon(true)}
        />
      </Canvas>

      {/* Mobile controls */}
      <div className="absolute bottom-4 inset-x-4 flex justify-between items-end pointer-events-none gap-2">
        <div className="flex gap-2 pointer-events-auto">
          <button
            type="button"
            className="game-btn"
            onTouchStart={() => setKey("left", true)}
            onTouchEnd={() => setKey("left", false)}
            onMouseDown={() => setKey("left", true)}
            onMouseUp={() => setKey("left", false)}
            onMouseLeave={() => setKey("left", false)}
            aria-label="Move left"
          >
            ◀
          </button>
          <button
            type="button"
            className="game-btn"
            onTouchStart={() => setKey("right", true)}
            onTouchEnd={() => setKey("right", false)}
            onMouseDown={() => setKey("right", true)}
            onMouseUp={() => setKey("right", false)}
            onMouseLeave={() => setKey("right", false)}
            aria-label="Move right"
          >
            ▶
          </button>
        </div>
        <button
          type="button"
          className="game-btn game-btn-jump"
          onTouchStart={() => setKey("jump", true)}
          onTouchEnd={() => setKey("jump", false)}
          onMouseDown={() => setKey("jump", true)}
          onMouseUp={() => setKey("jump", false)}
          onMouseLeave={() => setKey("jump", false)}
          aria-label="Jump"
        >
          ↑
        </button>
      </div>

      <div className="absolute top-3 left-3 bg-black/50 text-white px-3 py-1.5 rounded-lg font-bold text-lg pointer-events-none">
        🌰 {score}
      </div>

      {won && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 text-center shadow-xl max-w-xs mx-4">
            <p className="text-4xl mb-2">🐿️🎉</p>
            <p className="text-xl font-bold text-slate-900 mb-1">{t("children_game.win_title")}</p>
            <p className="text-slate-600 mb-4">{t("children_game.score")}: {score}</p>
            <button type="button" className="btn btn-primary w-full" onClick={restart}>
              {t("children_game.play_again")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
