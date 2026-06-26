import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { GameSettings, HighScore } from '../types';
import { audio } from '../utils/audio';
import { Heart, Trophy, Zap, Play, RotateCcw, Home, Sparkles, User, Keyboard, Volume2, VolumeX } from 'lucide-react';

interface GameScreenProps {
  settings: GameSettings;
  onClose: () => void;
}

// --------------------------------------------------------
// Types for 3D state
// --------------------------------------------------------
interface Spirit3D {
  id: string;
  x: number;
  z: number;
  y?: number;
  speed: number;
  size: number;
  pulseOffset: number;
  type: 'roam' | 'chase' | 'fast';
  angle: number;
  color: string;
  hits: number;
  knockbackX: number;
  knockbackY: number;
  knockbackZ: number;
  knockbackTime: number;
  flashRedTime: number;
  flashWhiteTime: number;
  isDying: boolean;
  dieTime: number;
  currentRow: number;
  currentFrame: number;
  animTimer: number;
  facingLeft: boolean;
  texture: THREE.Texture;
}

interface Grass3D {
  id: string;
  x: number;
  z: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

interface Collectible3D {
  id: string;
  x: number;
  z: number;
  size: number;
  type: 'bell' | 'star' | 'mask';
  pulseOffset: number;
}

interface Particle3D {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

// --------------------------------------------------------
// ThreeJS Sub-Component: Game Sanctuary Scene
// Handles update loops, physics, and three.js rendering.
// --------------------------------------------------------
function GameSanctuaryScene({
  settings,
  isPlaying,
  isGameOver,
  score,
  setScore,
  lives,
  setLives,
  bellCharge,
  setBellCharge,
  onGameOver,
  mobileKeys,
  setFlashActive,
  defeatedCount,
  setDefeatedCount,
  bossActive,
  setBossActive,
  bossHP,
  setBossHP,
  isGameCleared,
  setIsGameCleared,
}: {
  settings: GameSettings;
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  lives: number;
  setLives: React.Dispatch<React.SetStateAction<number>>;
  bellCharge: number;
  setBellCharge: React.Dispatch<React.SetStateAction<number>>;
  onGameOver: () => void;
  mobileKeys: Set<string>;
  setFlashActive: React.Dispatch<React.SetStateAction<boolean>>;
  defeatedCount: number;
  setDefeatedCount: React.Dispatch<React.SetStateAction<number>>;
  bossActive: boolean;
  setBossActive: React.Dispatch<React.SetStateAction<boolean>>;
  bossHP: number;
  setBossHP: React.Dispatch<React.SetStateAction<number>>;
  isGameCleared: boolean;
  setIsGameCleared: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { camera } = useThree();

  // 1. Textures Loading with fiber hooks
  const playerTexture = useLoader(TextureLoader, 'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439981/player_mask_fmn9yv.png');
  const groundTexture = useLoader(TextureLoader, 'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/ground_d1kjrx.png');
  const itemTexture = useLoader(TextureLoader, 'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439981/item_a371ol.png');
  const enemyTextureOriginal = useLoader(TextureLoader, 'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439979/enemy_mp1zhh.png');
  const grassTexture = useLoader(TextureLoader, 'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/grass_2_kjkske.png');
  const bossTexture = useLoader(TextureLoader, 'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/boss_pblkge.png');

  // Configure textures
  useMemo(() => {
    if (playerTexture) {
      playerTexture.wrapS = THREE.ClampToEdgeWrapping;
      playerTexture.wrapT = THREE.ClampToEdgeWrapping;
      playerTexture.minFilter = THREE.NearestFilter;
      playerTexture.magFilter = THREE.NearestFilter;
      playerTexture.repeat.set(0.25, 0.25);
    }
  }, [playerTexture]);

  useMemo(() => {
    if (bossTexture) {
      bossTexture.wrapS = THREE.ClampToEdgeWrapping;
      bossTexture.wrapT = THREE.ClampToEdgeWrapping;
      bossTexture.minFilter = THREE.NearestFilter;
      bossTexture.magFilter = THREE.NearestFilter;
      bossTexture.repeat.set(0.5, 0.5);
    }
  }, [bossTexture]);

  useMemo(() => {
    if (itemTexture) {
      itemTexture.wrapS = THREE.ClampToEdgeWrapping;
      itemTexture.wrapT = THREE.ClampToEdgeWrapping;
      itemTexture.minFilter = THREE.NearestFilter;
      itemTexture.magFilter = THREE.NearestFilter;
    }
  }, [itemTexture]);

  useMemo(() => {
    if (enemyTextureOriginal) {
      enemyTextureOriginal.wrapS = THREE.ClampToEdgeWrapping;
      enemyTextureOriginal.wrapT = THREE.ClampToEdgeWrapping;
      enemyTextureOriginal.minFilter = THREE.NearestFilter;
      enemyTextureOriginal.magFilter = THREE.NearestFilter;
    }
  }, [enemyTextureOriginal]);

  useMemo(() => {
    if (grassTexture) {
      grassTexture.wrapS = THREE.ClampToEdgeWrapping;
      grassTexture.wrapT = THREE.ClampToEdgeWrapping;
      grassTexture.minFilter = THREE.NearestFilter;
      grassTexture.magFilter = THREE.NearestFilter;
    }
  }, [grassTexture]);

  useMemo(() => {
    if (groundTexture) {
      groundTexture.wrapS = THREE.RepeatWrapping;
      groundTexture.wrapT = THREE.RepeatWrapping;
      groundTexture.repeat.set(12, 12); // fine ground tiling
    }
  }, [groundTexture]);

  // 2. Mutable gameplay variables inside refs for full 60 FPS performance
  const playerPos = useRef({ x: 0, y: 1.25, z: 0 });
  const facingLeft = useRef(false);
  const isMoving = useRef(false);
  const currentRow = useRef(0); // 0=Idle, 1=Walk, 2=Attack, 3=Dance
  const frameIndex = useRef(0);
  
  // Animation state clocks/timers
  const animTimer = useRef(0);
  const attackTimer = useRef(0);
  const danceTimer = useRef(0);
  const invincibilityTimer = useRef(0);
  const shakeTimer = useRef(0);

  // Entities refs
  const spirits = useRef<Spirit3D[]>([]);
  const collectibles = useRef<Collectible3D[]>([]);
  const particles = useRef<Particle3D[]>([]);
  const grasses = useRef<Grass3D[]>([]);
  const idCounter = useRef(0);

  // Initialize randomized grass positions
  useMemo(() => {
    const list: Grass3D[] = [];
    for (let i = 0; i < 45; i++) {
      list.push({
        id: `g_${i}`,
        x: (Math.random() - 0.5) * 44,
        z: (Math.random() - 0.5) * 44,
        scaleX: 1.0 + Math.random() * 0.4,
        scaleY: 1.2 + Math.random() * 0.5,
        scaleZ: 1.0,
      });
    }
    grasses.current = list;
  }, []);

  // Spawning clocks
  const spiritSpawnTimer = useRef(0);
  const spiritSpawnThreshold = useRef(1.0 + Math.random() * 2.0); // randomized 1-3 seconds
  const collectSpawnTimer = useRef(0);

  // Boss & Projectiles Refs
  const bossState = useRef<{
    active: boolean;
    x: number;
    y: number;
    z: number;
    hp: number;
    maxHP: number;
    pattern: 'hover' | 'lunge_prep' | 'lunge' | 'charge_prep' | 'charge' | 'anticipate_shoot' | 'shoot' | 'dying';
    patternTimer: number;
    chargeTargetX: number;
    chargeTargetZ: number;
    facingLeft: boolean;
    flashRedTime: number;
    flashWhiteTime: number;
    scaleX: number;
    scaleY: number;
    currentRow: number;
    currentFrame: number;
    animTimer: number;
    isDying: boolean;
    dieTime: number;
  } | null>(null);

  const fireballs = useRef<{
    id: string;
    x: number;
    y: number;
    z: number;
    targetX: number;
    targetZ: number;
    vy: number;
    timeToLand: number;
    totalTime: number;
    damageDealt: boolean;
  }[]>([]);

  const warpGateActive = useRef(false);

  // Three.js direct meshes refs for mapping positions
  const playerSpriteRef = useRef<THREE.Sprite>(null);
  const spiritMeshesRef = useRef<{ [key: string]: THREE.Group | null }>({});
  const collectibleMeshesRef = useRef<{ [key: string]: THREE.Group | null }>({});
  const particleMeshesRef = useRef<{ [key: string]: THREE.Mesh | null }>({});
  const grassMeshesRef = useRef<{ [key: string]: THREE.Sprite | null }>({});
  const bossMeshRef = useRef<THREE.Group | null>(null);
  const fireballMeshesRef = useRef<{ [key: string]: THREE.Mesh | null }>({});
  const skillRingMeshRef = useRef<THREE.Mesh>(null);

  // Skill Ring visual ward
  const skillRingActive = useRef(false);
  const skillRingRadius = useRef(0);

  // Keyboard hooks
  const activeKeys = useRef(new Set<string>());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || !isPlaying) return;
      const k = e.key.toLowerCase();
      activeKeys.current.add(k);

      // Attack
      if (k === 'p') {
        if (attackTimer.current <= 0 && danceTimer.current <= 0) {
          attackTimer.current = 0.4;
          currentRow.current = 2;
          frameIndex.current = 0;
          if (settings.soundEnabled) audio.playClick();
          
          // Attack hit check immediately (cone in front of player)
          checkAttackCollision();
        }
      }

      // Dance Skill
      if (k === 'o') {
        if (danceTimer.current <= 0 && attackTimer.current <= 0) {
          if (bellCharge >= 35) {
            setBellCharge(prev => {
              const next = Math.max(0, prev - 35);
              if (next < 35) {
                // visual trigger
              }
              return next;
            });
            danceTimer.current = 1.2;
            currentRow.current = 3;
            frameIndex.current = 0;
            
            // Activate expanding ring
            skillRingActive.current = true;
            skillRingRadius.current = 0;

            if (settings.soundEnabled) audio.playWardOff();
            
            // Spawn gorgeous skill burst sparkles around player
            for (let i = 0; i < 25; i++) {
              spawnSparkle(
                playerPos.current.x,
                0.2,
                playerPos.current.z,
                (Math.random() - 0.5) * 6,
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 6,
                '#ef4444',
                1.5
              );
            }
          } else {
            // Insufficient energy audio cue
            if (settings.soundEnabled) audio.playClick();
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      activeKeys.current.delete(k);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isGameOver, bellCharge, settings]);

  // Handle virtual mobile touches
  useEffect(() => {
    // Attack
    if (mobileKeys.has('action_attack')) {
      if (attackTimer.current <= 0 && danceTimer.current <= 0) {
        attackTimer.current = 0.4;
        currentRow.current = 2;
        frameIndex.current = 0;
        if (settings.soundEnabled) audio.playClick();
        checkAttackCollision();
      }
      mobileKeys.delete('action_attack');
    }

    // Dance skill
    if (mobileKeys.has('action_dance')) {
      if (danceTimer.current <= 0 && attackTimer.current <= 0) {
        if (bellCharge >= 35) {
          setBellCharge(prev => Math.max(0, prev - 35));
          danceTimer.current = 1.2;
          currentRow.current = 3;
          frameIndex.current = 0;
          skillRingActive.current = true;
          skillRingRadius.current = 0;

          if (settings.soundEnabled) audio.playWardOff();
          for (let i = 0; i < 25; i++) {
            spawnSparkle(
              playerPos.current.x,
              0.2,
              playerPos.current.z,
              (Math.random() - 0.5) * 6,
              Math.random() * 5 + 2,
              (Math.random() - 0.5) * 6,
              '#ef4444',
              1.5
            );
          }
        } else {
          if (settings.soundEnabled) audio.playClick();
        }
      }
      mobileKeys.delete('action_dance');
    }
  }, [mobileKeys, bellCharge, settings]);

  // Utility to spawn 3D sparks
  const spawnSparkle = (x: number, y: number, z: number, vx: number, vy: number, vz: number, color: string, duration = 1.0) => {
    idCounter.current++;
    particles.current.push({
      id: `p_${idCounter.current}`,
      x, y, z,
      vx, vy, vz,
      size: 0.15 + Math.random() * 0.2,
      color,
      alpha: 1.0,
      life: duration,
      maxLife: duration
    });
  };

  // 3D Collision: Frontal cone attack banish check
  const checkAttackCollision = () => {
    const p = playerPos.current;
    const isFacingLeft = facingLeft.current;
    
    spirits.current.forEach(spirit => {
      if (spirit.isDying) return;

      // Calculate delta distance
      const dx = spirit.x - p.x;
      const dz = spirit.z - p.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Frontal cone check (Left = negative X, Right = positive X)
      const correctDirection = isFacingLeft ? dx < 0.2 : dx > -0.2;
      
      if (dist < 2.5 && correctDirection) {
        spirit.hits += 1;
        
        // Calculate knockback direction away from player
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        const kbDirX = dx / len;
        const kbDirZ = dz / len;

        if (spirit.hits === 1) {
          // First hit: knockback & flash red
          spirit.knockbackX = kbDirX * 12;
          spirit.knockbackZ = kbDirZ * 12;
          spirit.knockbackTime = 0.35;
          spirit.flashRedTime = 0.35;
          
          if (settings.soundEnabled) audio.playHurt();
          
          // Spawn hit particles
          for (let i = 0; i < 8; i++) {
            spawnSparkle(
              spirit.x,
              0.6,
              spirit.z,
              (Math.random() - 0.5) * 4,
              Math.random() * 3 + 1,
              (Math.random() - 0.5) * 4,
              '#ffffff',
              0.5
            );
          }
        } else if (spirit.hits >= 2) {
          // Second hit: flying out of scene / flash white rapid
          spirit.isDying = true;
          spirit.dieTime = 0.8;
          spirit.flashWhiteTime = 0.8;
          spirit.knockbackX = kbDirX * 22;
          spirit.knockbackZ = kbDirZ * 22;
          spirit.knockbackY = 12.0; // fly up!
          spirit.y = 0.6;

          setScore(prev => prev + 100);
          if (settings.soundEnabled) audio.playWardOff();
          
          // Banish explosion particles
          for (let i = 0; i < 20; i++) {
            spawnSparkle(
              spirit.x,
              0.6,
              spirit.z,
              (Math.random() - 0.5) * 6,
              Math.random() * 5 + 2,
              (Math.random() - 0.5) * 6,
              '#ef4444',
              0.8
            );
          }
        }
      }
    });

    // Collision check against Boss
    if (bossState.current && !bossState.current.isDying && bossState.current.flashRedTime <= 0) {
      const boss = bossState.current;
      const dx = boss.x - p.x;
      const dz = boss.z - p.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Frontal cone check (Left = negative X, Right = positive X)
      const correctDirection = isFacingLeft ? dx < 0.2 : dx > -0.2;
      
      if (dist < 3.2 && correctDirection) {
        boss.hp -= 1;
        setBossHP(Math.max(0, boss.hp));
        boss.flashRedTime = 0.25;
        shakeTimer.current = 0.25; // camera shake!

        if (settings.soundEnabled) audio.playBell();

        // Spawn hit sparkles around Boss
        for (let i = 0; i < 15; i++) {
          spawnSparkle(
            boss.x,
            boss.y,
            boss.z,
            (Math.random() - 0.5) * 6,
            Math.random() * 5 + 1.5,
            (Math.random() - 0.5) * 6,
            '#ffcc00',
            0.6
          );
        }

        // Check if Boss is defeated
        if (boss.hp <= 0) {
          boss.isDying = true;
          boss.dieTime = 1.6;
          boss.flashWhiteTime = 1.6;
          boss.pattern = 'dying';
          if (settings.soundEnabled) audio.playWardOff();
        }
      }
    }
  };

  // Handle active game frame loops
  useFrame((state, delta) => {
    if (isGameOver || !isPlaying) return;

    const keys = activeKeys.current;

    // 1. Player movement controls (8 directions)
    let moveX = 0;
    let moveZ = 0;

    if (keys.has('w') || keys.has('arrowup') || mobileKeys.has('up')) moveZ -= 1;
    if (keys.has('s') || keys.has('arrowdown') || mobileKeys.has('down')) moveZ += 1;
    if (keys.has('a') || keys.has('arrowleft') || mobileKeys.has('left')) moveX -= 1;
    if (keys.has('d') || keys.has('arrowright') || mobileKeys.has('right')) moveX += 1;

    // Adjust movement if currently in lock-in actions
    const isAttacking = attackTimer.current > 0;
    const isDancing = danceTimer.current > 0;
    const speedMultiplier = isDancing ? 0.2 : isAttacking ? 0.3 : 1.0;
    const movementSpeed = 6.8 * speedMultiplier;

    if (moveX !== 0 || moveZ !== 0) {
      // Normalize vector
      const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      const dx = (moveX / len) * movementSpeed * delta;
      const dz = (moveZ / len) * movementSpeed * delta;

      playerPos.current.x += dx;
      playerPos.current.z += dz;

      // Bound to the 50x50 map boundaries
      playerPos.current.x = Math.max(-24.0, Math.min(24.0, playerPos.current.x));
      playerPos.current.z = Math.max(-24.0, Math.min(24.0, playerPos.current.z));

      isMoving.current = true;

      // Update facing direction based on X movement
      if (moveX < 0) facingLeft.current = true;
      else if (moveX > 0) facingLeft.current = false;
    } else {
      isMoving.current = false;
    }

    // 2. Action clocks
    if (attackTimer.current > 0) {
      attackTimer.current -= delta;
    }
    if (danceTimer.current > 0) {
      danceTimer.current -= delta;
      // Expand skill ward radius up to 9 units
      if (skillRingActive.current) {
        skillRingRadius.current += 10 * delta;
        if (skillRingRadius.current > 9.0) {
          skillRingRadius.current = 9.0;
        }

        // Banish/launch any spirit in range of expanding ring
        spirits.current.forEach(spirit => {
          if (spirit.isDying) return;

          const dx = spirit.x - playerPos.current.x;
          const dz = spirit.z - playerPos.current.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= skillRingRadius.current) {
            spirit.hits = 2;
            spirit.isDying = true;
            spirit.dieTime = 0.8;
            spirit.flashWhiteTime = 0.8;
            
            const len = dist || 1;
            spirit.knockbackX = (dx / len) * 22;
            spirit.knockbackZ = (dz / len) * 22;
            spirit.knockbackY = 14.0;
            spirit.y = 0.6;

            setScore(prev => prev + 150);
            if (settings.soundEnabled) audio.playBell();
            
            for (let i = 0; i < 15; i++) {
              spawnSparkle(
                spirit.x,
                0.6,
                spirit.z,
                (Math.random() - 0.5) * 5,
                Math.random() * 4 + 2,
                (Math.random() - 0.5) * 5,
                '#ffffff',
                0.8
              );
            }
          }
        });

        // Damage Boss in range of expanding ring
        if (bossState.current && !bossState.current.isDying) {
          const boss = bossState.current;
          const dx = boss.x - playerPos.current.x;
          const dz = boss.z - playerPos.current.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= skillRingRadius.current && boss.flashRedTime <= 0) {
            // Boss takes 3 damage from the heavy sacred circle dance ward!
            boss.hp -= 3;
            setBossHP(Math.max(0, boss.hp));
            boss.flashRedTime = 0.4;
            shakeTimer.current = 0.4; // heavy camera shake!

            if (settings.soundEnabled) audio.playBell();

            // Burst of fire/godly particles
            for (let i = 0; i < 25; i++) {
              spawnSparkle(
                boss.x,
                boss.y,
                boss.z,
                (Math.random() - 0.5) * 8,
                Math.random() * 6 + 1.5,
                (Math.random() - 0.5) * 8,
                '#ffcc00',
                0.8
              );
            }

            if (boss.hp <= 0) {
              boss.isDying = true;
              boss.dieTime = 1.6;
              boss.flashWhiteTime = 1.6;
              boss.pattern = 'dying';
              if (settings.soundEnabled) audio.playWardOff();
            }
          }
        }
      }
    } else {
      skillRingActive.current = false;
      skillRingRadius.current = 0;
    }

    if (invincibilityTimer.current > 0) {
      invincibilityTimer.current -= delta;
    }

    if (shakeTimer.current > 0) {
      shakeTimer.current -= delta;
    }

    // 3. Determine animation frame from state
    const elapsed = state.clock.getElapsedTime();
    if (isDancing) {
      currentRow.current = 3; // Dance
      frameIndex.current = Math.floor(elapsed * 9) % 4;
    } else if (isAttacking) {
      currentRow.current = 2; // Attack
      frameIndex.current = Math.min(3, Math.floor((1.0 - (attackTimer.current / 0.4)) * 4));
    } else if (isMoving.current) {
      currentRow.current = 1; // Walk
      frameIndex.current = Math.floor(elapsed * 10) % 4;
    } else {
      currentRow.current = 0; // Idle
      frameIndex.current = Math.floor(elapsed * 4.5) % 4;
    }

    // Apply texture offset based on current animation
    if (playerTexture) {
      playerTexture.offset.set(frameIndex.current * 0.25, (3 - currentRow.current) * 0.25);
    }

    // 4. Update player model position & scale flip
    if (playerSpriteRef.current) {
      playerSpriteRef.current.position.set(playerPos.current.x, 1.25, playerPos.current.z);
      // Flip X scale if facing left
      playerSpriteRef.current.scale.set(facingLeft.current ? -2.4 : 2.4, 2.4, 1);
      
      // Invincibility flashing visual cue
      if (invincibilityTimer.current > 0) {
        playerSpriteRef.current.material.opacity = Math.floor(elapsed * 16) % 2 === 0 ? 0.3 : 0.8;
      } else {
        playerSpriteRef.current.material.opacity = 1.0;
      }
    }

    // 5. Update skill ring scale & visual properties
    if (skillRingMeshRef.current) {
      if (skillRingActive.current) {
        skillRingMeshRef.current.visible = true;
        skillRingMeshRef.current.position.set(playerPos.current.x, 0.05, playerPos.current.z);
        skillRingMeshRef.current.scale.set(skillRingRadius.current, skillRingRadius.current, 1);
        // fade out slightly as it reaches outer boundary
        const op = 1.0 - (skillRingRadius.current / 9.0);
        if (Array.isArray(skillRingMeshRef.current.material)) {
          // skip
        } else if (skillRingMeshRef.current.material) {
          (skillRingMeshRef.current.material as THREE.MeshBasicMaterial).opacity = op * 0.8;
        }
      } else {
        skillRingMeshRef.current.visible = false;
      }
    }

    // 6. Spawning Entities
    spiritSpawnTimer.current += delta;
    collectSpawnTimer.current += delta;

    // Spawn roaming ghost spirits
    if (spiritSpawnTimer.current >= spiritSpawnThreshold.current && spirits.current.length < 20) {
      spiritSpawnTimer.current = 0;
      spiritSpawnThreshold.current = 1.0 + Math.random() * 2.0; // random 1-3 seconds
      idCounter.current++;
      const id = `s_${idCounter.current}`;
      
      // Spawn on randomized outer circle (perimeter of plane)
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnDist = 24.0;
      const sx = playerPos.current.x + Math.cos(spawnAngle) * spawnDist;
      const sz = playerPos.current.z + Math.sin(spawnAngle) * spawnDist;
      
      const speedSeed = settings.difficulty === 'easy' ? 2.0 : settings.difficulty === 'hard' ? 4.2 : 3.0;
      const sType = Math.random() > 0.6 ? 'chase' : 'roam';

      // Clone the original enemy texture so each spirit has an independent offset
      const spiritTexture = enemyTextureOriginal.clone();
      spiritTexture.repeat.set(0.25, 0.5); // 4 columns, 2 rows

      spirits.current.push({
        id,
        x: Math.max(-24, Math.min(24, sx)),
        z: Math.max(-24, Math.min(24, sz)),
        y: 0.6,
        speed: speedSeed + Math.random() * 1.5,
        size: 0.8 + Math.random() * 0.4,
        pulseOffset: Math.random() * 100,
        type: sType,
        angle: Math.random() * Math.PI * 2,
        color: sType === 'chase' ? '#ff3b30' : '#ff9500',
        hits: 0,
        knockbackX: 0,
        knockbackY: 0,
        knockbackZ: 0,
        knockbackTime: 0,
        flashRedTime: 0,
        flashWhiteTime: 0,
        isDying: false,
        dieTime: 0,
        currentRow: 0,
        currentFrame: 0,
        animTimer: Math.random() * 10,
        facingLeft: Math.random() > 0.5,
        texture: spiritTexture
      });
    }

    // Spawn red mask items / sacred stars
    if (collectSpawnTimer.current >= 3.0 && collectibles.current.length < 7) {
      collectSpawnTimer.current = 0;
      idCounter.current++;
      const id = `c_${idCounter.current}`;
      
      collectibles.current.push({
        id,
        x: (Math.random() - 0.5) * 40,
        z: (Math.random() - 0.5) * 40,
        size: 0.8,
        type: Math.random() > 0.8 ? 'star' : 'mask',
        pulseOffset: Math.random() * 100
      });
    }

    // 7. Update Spirits positions and collision checks
    spirits.current = spirits.current.filter(spirit => {
      // If dying, update dying timer and fly animation
      if (spirit.isDying) {
        spirit.dieTime -= delta;
        if (spirit.dieTime <= 0) {
          setDefeatedCount(prev => prev + 1);
          return false; // remove from list completely!
        }
        
        // Fly upwards and away!
        spirit.x += spirit.knockbackX * delta;
        spirit.z += spirit.knockbackZ * delta;
        
        // Apply vertical knockback and gravity
        spirit.knockbackY -= 15 * delta; // gravity
        if (spirit.y === undefined) spirit.y = 0.6;
        spirit.y += spirit.knockbackY * delta;
        
        if (spirit.flashWhiteTime > 0) {
          spirit.flashWhiteTime -= delta;
        }
        
        // Sync 3D mesh position
        const group = spiritMeshesRef.current[spirit.id];
        if (group) {
          group.position.set(spirit.x, spirit.y, spirit.z);
        }
        return true;
      }

      // If in knockback, move backwards and decrement knockbackTime
      if (spirit.knockbackTime > 0) {
        spirit.knockbackTime -= delta;
        spirit.x += spirit.knockbackX * delta;
        spirit.z += spirit.knockbackZ * delta;
        // Clamp to map boundaries even during knockback
        spirit.x = Math.max(-24.0, Math.min(24.0, spirit.x));
        spirit.z = Math.max(-24.0, Math.min(24.0, spirit.z));
      } else {
        // Normal movement
        if (spirit.type === 'chase') {
          // move directly towards player
          const dx = playerPos.current.x - spirit.x;
          const dz = playerPos.current.z - spirit.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 0.1) {
            spirit.x += (dx / dist) * spirit.speed * delta;
            spirit.z += (dz / dist) * spirit.speed * delta;
            // Update direction
            spirit.facingLeft = dx < 0;
          }
        } else {
          // roam in slightly wavy paths
          spirit.angle += (Math.random() - 0.5) * 3 * delta;
          spirit.x += Math.cos(spirit.angle) * spirit.speed * delta;
          spirit.z += Math.sin(spirit.angle) * spirit.speed * delta;
          
          // bounce on wall boundaries
          if (spirit.x < -24.5 || spirit.x > 24.5) {
            spirit.angle = Math.PI - spirit.angle;
            spirit.x = Math.max(-24.5, Math.min(24.5, spirit.x));
          }
          if (spirit.z < -24.5 || spirit.z > 24.5) {
            spirit.angle = -spirit.angle;
            spirit.z = Math.max(-24.5, Math.min(24.5, spirit.z));
          }
          // direction based on angle
          spirit.facingLeft = Math.cos(spirit.angle) < 0;
        }
      }

      // Update timers
      if (spirit.flashRedTime > 0) {
        spirit.flashRedTime -= delta;
      }

      // Update animation state (Idle row 0, Walk row 1)
      spirit.animTimer += delta;
      const isSpiritMoving = spirit.knockbackTime <= 0 && spirit.speed > 0; // if not knocked back, we are walking
      spirit.currentRow = isSpiritMoving ? 1 : 0;
      const animSpeed = isSpiritMoving ? 10 : 4.5;
      spirit.currentFrame = Math.floor(spirit.animTimer * animSpeed) % 4;

      // Update texture coordinates
      if (spirit.texture) {
        const offset_y = spirit.currentRow === 0 ? 0.5 : 0.0; // row 0 standing (top), row 1 walking (bottom)
        spirit.texture.offset.set(spirit.currentFrame * 0.25, offset_y);
      }

      // Sync 3D mesh position
      const group = spiritMeshesRef.current[spirit.id];
      if (group) {
        const hover = Math.sin(elapsed * 5 + spirit.pulseOffset) * 0.15 + 0.6;
        group.position.set(spirit.x, hover, spirit.z);
      }

      // Check damage collision with player
      const pDist = Math.sqrt((spirit.x - playerPos.current.x) ** 2 + (spirit.z - playerPos.current.z) ** 2);
      if (pDist < 1.3) {
        // Trigger red flash on spirit when attacking/colliding
        spirit.flashRedTime = 0.3;

        if (invincibilityTimer.current <= 0) {
          // Play hurt effect
          setLives(prev => {
            const next = prev - 1;
            if (next <= 0) {
              onGameOver();
            }
            return next;
          });
          invincibilityTimer.current = 1.6; // 1.6s invincibility
          shakeTimer.current = 0.4; // shake camera
          setFlashActive(true);
          setTimeout(() => setFlashActive(false), 200);

          if (settings.soundEnabled) audio.playHurt();

          // Spawn dramatic red hurt particles
          for (let i = 0; i < 20; i++) {
            spawnSparkle(
              playerPos.current.x,
              1.0,
              playerPos.current.z,
              (Math.random() - 0.5) * 8,
              Math.random() * 6 + 1,
              (Math.random() - 0.5) * 8,
              '#ef4444',
              1.0
            );
          }
        }
      }

      return true;
    });

    // 8. Update collectibles floating animation and collection check
    collectibles.current = collectibles.current.filter(collect => {
      const group = collectibleMeshesRef.current[collect.id];
      if (group) {
        const hover = Math.sin(elapsed * 4 + collect.pulseOffset) * 0.1 + 0.6;
        group.position.set(collect.x, hover, collect.z);
        group.rotation.y += 2.0 * delta;
      }

      // Collision check
      const dist = Math.sqrt((collect.x - playerPos.current.x) ** 2 + (collect.z - playerPos.current.z) ** 2);
      if (dist < 1.4) {
        // Collect!
        if (settings.soundEnabled) audio.playBell();

        if (collect.type === 'star') {
          setScore(prev => prev + 50);
          setLives(prev => Math.min(5, prev + 1)); // Star heals +1 life, up to max 5
          setBellCharge(prev => Math.min(100, prev + 25)); // Star adds +25% bell energy
          
          // Spawn healing particles (glowing white sparkles)
          for (let i = 0; i < 18; i++) {
            spawnSparkle(
              collect.x,
              0.5,
              collect.z,
              (Math.random() - 0.5) * 4,
              Math.random() * 4 + 1,
              (Math.random() - 0.5) * 4,
              '#ffffff',
              1.2
            );
          }
        } else {
          setScore(prev => prev + 30);
          setBellCharge(prev => Math.min(100, prev + 20)); // Red mask adds +20% energy
          
          // Spawn vibrant red/gold particles
          for (let i = 0; i < 15; i++) {
            spawnSparkle(
              collect.x,
              0.5,
              collect.z,
              (Math.random() - 0.5) * 3,
              Math.random() * 3 + 1,
              (Math.random() - 0.5) * 3,
              '#ef4444',
              0.8
            );
          }
        }
        return false; // remove
      }
      return true;
    });

    // 9. Update 3D particles physics and mesh scaling
    particles.current = particles.current.filter(p => {
      p.life -= delta;
      if (p.life <= 0) return false;

      // physics movement
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      // gravity-ish vertical pull
      p.vy -= 4.0 * delta;

      // direct sync with Three Mesh
      const m = particleMeshesRef.current[p.id];
      if (m) {
        m.position.set(p.x, p.y, p.z);
        // shrink particle over life
        const scale = (p.life / p.maxLife) * p.size;
        m.scale.set(scale, scale, scale);
        if (m.material) {
          (m.material as THREE.MeshBasicMaterial).opacity = p.life / p.maxLife;
        }
      }
      return true;
    });

    // 9.5 Spawn Boss if player has defeated 10+ enemies and boss is not active yet and warp gate is not active
    if (!bossActive && defeatedCount >= 10 && !warpGateActive.current && !bossState.current) {
      setBossActive(true);
      setBossHP(12); // Boss has 12 HP!
      
      bossState.current = {
        active: true,
        x: 0,
        y: 6.0, // spawns floating down
        z: -12.0,
        hp: 12,
        maxHP: 12,
        pattern: 'hover',
        patternTimer: 2.0,
        chargeTargetX: 0,
        chargeTargetZ: 0,
        facingLeft: true,
        flashRedTime: 0,
        flashWhiteTime: 0,
        scaleX: 3.5,
        scaleY: 3.5,
        currentRow: 0,
        currentFrame: 0,
        animTimer: 0,
        isDying: false,
        dieTime: 0,
      };

      if (settings.soundEnabled) {
        audio.playBell(); // Play epic cue for boss arrival
      }

      // Spawn portal of sparks at boss spawn location
      for (let i = 0; i < 30; i++) {
        spawnSparkle(
          0,
          3.0,
          -12.0,
          (Math.random() - 0.5) * 8,
          Math.random() * 5 + 2,
          (Math.random() - 0.5) * 8,
          '#ef4444',
          1.2
        );
      }
    }

    // 9.6 Update Boss AI and its projectile fireballs
    if (bossState.current) {
      const boss = bossState.current;
      boss.animTimer += delta;

      // Frame selection: row 0 is Idle/Hover, row 1 is Charge/Lunge/Attack
      if (boss.isDying) {
        boss.dieTime -= delta;
        boss.flashWhiteTime -= delta;
        
        // Spin and fly upwards!
        boss.y += 4.5 * delta;
        boss.scaleX = boss.scaleX * (1.0 - 0.5 * delta);
        boss.scaleY = boss.scaleY * (1.0 - 0.5 * delta);

        if (boss.dieTime <= 0) {
          // Boss is completely vanquished! Remove bossState
          bossState.current = null;
          setBossActive(false);
          // Spawn the Warp Gate at the center!
          warpGateActive.current = true;
          if (settings.soundEnabled) audio.playBell(); // holy gong sound for warp appearance!
        }

        // Sync mesh if exists
        if (bossMeshRef.current) {
          bossMeshRef.current.position.set(boss.x, boss.y, boss.z);
          bossMeshRef.current.rotation.y += 5 * delta; // spin dying
        }
      } else {
        // Boss is alive and active! Let's process state machine
        boss.patternTimer -= delta;

        // Visual flash updates
        if (boss.flashRedTime > 0) {
          boss.flashRedTime -= delta;
        }
        if (boss.flashWhiteTime > 0) {
          boss.flashWhiteTime -= delta;
        }

        // Handle pattern transitions
        if (boss.patternTimer <= 0) {
          if (boss.pattern === 'hover') {
            // Decides next attack pattern: lunge (60%) or shoot_anticipation (40%)
            const r = Math.random();
            if (r < 0.6) {
              boss.pattern = 'lunge_prep';
              boss.patternTimer = 0.8; // Time to telegraph lunge
              boss.currentRow = 1; // attack row
            } else {
              boss.pattern = 'anticipate_shoot';
              boss.patternTimer = 1.4; // Time to squish & stretch tell
              boss.currentRow = 0; // standing/idle row
            }
          } else if (boss.pattern === 'lunge_prep') {
            // Lunge now! Select target near the player
            boss.pattern = 'lunge';
            boss.patternTimer = 0.5; // duration of rapid charge
            const dx = playerPos.current.x - boss.x;
            const dz = playerPos.current.z - boss.z;
            const dist = Math.sqrt(dx * dx + dz * dz) || 1;
            // Charge slightly PAST the player to make it look aggressive
            boss.chargeTargetX = playerPos.current.x + (dx / dist) * 3.5;
            boss.chargeTargetZ = playerPos.current.z + (dz / dist) * 3.5;
            boss.currentRow = 1; // attack row
            if (settings.soundEnabled) audio.playJump(); // whoosh sound for charging!
          } else if (boss.pattern === 'lunge') {
            // Finished lunge, return to hover
            boss.pattern = 'hover';
            boss.patternTimer = 1.5 + Math.random() * 1.5;
            boss.currentRow = 0; // idle/hover row
          } else if (boss.pattern === 'anticipate_shoot') {
            // Squash stretch completed, shoot fireballs!
            boss.pattern = 'shoot';
            boss.patternTimer = 0.4; // quick fire delay
            boss.currentRow = 1; // attack row

            // Spawn 3 circular fireballs thrown high into the sky!
            for (let f = 0; f < 3; f++) {
              idCounter.current++;
              const fid = `fb_${idCounter.current}`;
              // Targets: player current position with some random spread
              const targetOffsetX = (Math.random() - 0.5) * 5.0;
              const targetOffsetZ = (Math.random() - 0.5) * 5.0;
              const tx = playerPos.current.x + targetOffsetX;
              const tz = playerPos.current.z + targetOffsetZ;
              
              fireballs.current.push({
                id: fid,
                x: boss.x,
                y: boss.y + 0.8, // starts from boss's height
                z: boss.z,
                targetX: tx,
                targetZ: tz,
                vy: 14.0 + f * 2.0, // varied heights/flight arcs
                timeToLand: 1.8 + f * 0.3, // sequential landing impact!
                totalTime: 1.8 + f * 0.3,
                damageDealt: false,
              });
            }

            if (settings.soundEnabled) audio.playWardOff();
          } else if (boss.pattern === 'shoot') {
            // Finished shooting, return to hover
            boss.pattern = 'hover';
            boss.patternTimer = 2.0 + Math.random() * 1.0;
            boss.currentRow = 0;
          }
        }

        // Apply movement physics based on current active pattern
        if (boss.pattern === 'hover') {
          // Hover gently in place, and slowly float closer to player's general area
          const dx = playerPos.current.x - boss.x;
          const dz = playerPos.current.z - boss.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          
          let targetX = boss.x;
          let targetZ = boss.z;
          
          if (dist > 8.0) {
            // Keep at mid range from player, don't get too close while idle
            targetX += (dx / dist) * 2.2 * delta;
            targetZ += (dz / dist) * 2.2 * delta;
          }
          
          boss.x = THREE.MathUtils.lerp(boss.x, targetX, 0.05);
          boss.z = THREE.MathUtils.lerp(boss.z, targetZ, 0.05);
          boss.y = THREE.MathUtils.lerp(boss.y, 2.2 + Math.sin(elapsed * 4.5) * 0.35, 0.05);
          
          boss.facingLeft = dx < 0;
          
          // Reset squash stretch scale back to normal
          boss.scaleX = THREE.MathUtils.lerp(boss.scaleX, 3.5, 0.1);
          boss.scaleY = THREE.MathUtils.lerp(boss.scaleY, 3.5, 0.1);
        } else if (boss.pattern === 'lunge_prep') {
          // Face the player, pull back slightly to telegraph charge
          const dx = playerPos.current.x - boss.x;
          const dz = playerPos.current.z - boss.z;
          const dist = Math.sqrt(dx * dx + dz * dz) || 1;
          
          boss.x -= (dx / dist) * 1.5 * delta;
          boss.z -= (dz / dist) * 1.5 * delta;
          boss.y = THREE.MathUtils.lerp(boss.y, 2.6, 0.1);
          
          boss.facingLeft = dx < 0;

          // Stretch vertically as indicator
          boss.scaleX = THREE.MathUtils.lerp(boss.scaleX, 2.6, 0.15);
          boss.scaleY = THREE.MathUtils.lerp(boss.scaleY, 4.4, 0.15);
        } else if (boss.pattern === 'lunge') {
          // Charge extremely fast to target
          boss.x = THREE.MathUtils.lerp(boss.x, boss.chargeTargetX, 0.18);
          boss.z = THREE.MathUtils.lerp(boss.z, boss.chargeTargetZ, 0.18);
          boss.y = THREE.MathUtils.lerp(boss.y, 1.2, 0.18); // charge low to the ground!

          // Squash down flat due to speed
          boss.scaleX = THREE.MathUtils.lerp(boss.scaleX, 4.2, 0.2);
          boss.scaleY = THREE.MathUtils.lerp(boss.scaleY, 2.4, 0.2);

          // Check player contact damage
          const dx = playerPos.current.x - boss.x;
          const dz = playerPos.current.z - boss.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 1.6 && invincibilityTimer.current <= 0) {
            setLives(prev => {
              const next = Math.max(0, prev - 1);
              if (next === 0) onGameOver();
              return next;
            });
            invincibilityTimer.current = 1.2;
            setFlashActive(true);
            setTimeout(() => setFlashActive(false), 150);
            if (settings.soundEnabled) audio.playHurt();
          }
        } else if (boss.pattern === 'anticipate_shoot') {
          // Squash and stretch rapidly as anticipation visual step
          const cycleSpeed = 16.0;
          const squashAmt = Math.sin(boss.patternTimer * cycleSpeed) * 0.9;
          boss.scaleX = 3.5 * (1.0 + squashAmt * 0.25);
          boss.scaleY = 3.5 * (1.0 - squashAmt * 0.25);
          
          // Hover high up
          boss.y = THREE.MathUtils.lerp(boss.y, 3.4, 0.1);
        }

        // Clamp to map bounds
        boss.x = Math.max(-23.0, Math.min(23.0, boss.x));
        boss.z = Math.max(-23.0, Math.min(23.0, boss.z));

        // Sync mesh position
        if (bossMeshRef.current) {
          bossMeshRef.current.position.set(boss.x, boss.y, boss.z);
        }
      }
    }

    // Update Fireballs physics
    fireballs.current = fireballs.current.filter(fb => {
      fb.timeToLand -= delta;
      
      const progress = 1.0 - (fb.timeToLand / fb.totalTime);
      
      if (fb.timeToLand <= 0) {
        // Fireball IMPACTS the ground!
        // Explosion logic: check damage to player
        const dx = playerPos.current.x - fb.targetX;
        const dz = playerPos.current.z - fb.targetZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 2.0 && !fb.damageDealt) {
          fb.damageDealt = true;
          if (invincibilityTimer.current <= 0) {
            setLives(prev => {
              const next = Math.max(0, prev - 1);
              if (next === 0) onGameOver();
              return next;
            });
            invincibilityTimer.current = 1.2;
            setFlashActive(true);
            setTimeout(() => setFlashActive(false), 150);
            if (settings.soundEnabled) audio.playHurt();
          }
        }

        // Play explosion sound cue
        if (settings.soundEnabled) audio.playHurt();

        // Screen shake on close impact
        if (dist < 8.0) {
          shakeTimer.current = 0.3;
        }

        // Spawn orange/yellow flame sparkle explosion particles
        for (let i = 0; i < 16; i++) {
          spawnSparkle(
            fb.targetX,
            0.1,
            fb.targetZ,
            (Math.random() - 0.5) * 5,
            Math.random() * 5 + 1.5,
            (Math.random() - 0.5) * 5,
            Math.random() > 0.5 ? '#ff4500' : '#ffcc00',
            0.7
          );
        }

        return false; // remove fireball
      }

      // Parabolic flight height
      fb.x = THREE.MathUtils.lerp(fb.x, fb.targetX, progress);
      fb.z = THREE.MathUtils.lerp(fb.z, fb.targetZ, progress);
      
      const arcHeight = 5.0 * Math.sin(progress * Math.PI);
      fb.y = THREE.MathUtils.lerp(bossState.current ? bossState.current.y : 2.5, 0.1, progress) + arcHeight;

      // Sync 3D mesh
      const m = fireballMeshesRef.current[fb.id];
      if (m) {
        m.position.set(fb.x, fb.y, fb.z);
      }

      return true;
    });

    // 9.7 Warp Gate Trigger check
    if (warpGateActive.current) {
      const dx = playerPos.current.x;
      const dz = playerPos.current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.6) {
        // WALK INTO WARP PORTAL! Clear game!
        setIsGameCleared(true);
        onGameOver(); // Stops game and opens game cleared ending screen!
        if (settings.soundEnabled) {
          audio.playBell();
        }
      }
    }

    // 10. Smooth Camera Follow with Lerping and Screen Shake!
    const targetCamX = playerPos.current.x;
    const targetCamY = playerPos.current.y + 7.5;
    const targetCamZ = playerPos.current.z + 8.2;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.08);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.08);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.08);

    // Apply screen shake if active
    if (shakeTimer.current > 0) {
      const shakeAmt = 0.28 * (shakeTimer.current / 0.4);
      camera.position.x += (Math.random() - 0.5) * shakeAmt;
      camera.position.y += (Math.random() - 0.5) * shakeAmt;
      camera.position.z += (Math.random() - 0.5) * shakeAmt;
    }

    camera.lookAt(playerPos.current.x, playerPos.current.y - 0.6, playerPos.current.z);

    // 11. Update grass squash scale and position based on Player distance
    grasses.current.forEach(grass => {
      const dx = playerPos.current.x - grass.x;
      const dz = playerPos.current.z - grass.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      let targetScaleY = grass.scaleY;
      if (dist < 1.25) {
        // Step on grass: squashes it down based on proximity
        const squashFactor = Math.max(0.12, dist / 1.25);
        targetScaleY = grass.scaleY * squashFactor;
      }

      const m = grassMeshesRef.current[grass.id];
      if (m) {
        // Lerp scale Y for smooth squash/expand transition
        m.scale.y = THREE.MathUtils.lerp(m.scale.y, targetScaleY, 0.22);
        // Anchor bottom to the ground by setting Y to scaleY / 2
        m.position.y = m.scale.y / 2;
      }
    });
  });

  // State mapping for rendering JSX elements in 3D (to dynamically spawn ThreeJS nodes)
  const [renderSpirits, setRenderSpirits] = useState<Spirit3D[]>([]);
  const [renderCollectibles, setRenderCollectibles] = useState<Collectible3D[]>([]);
  const [renderParticles, setRenderParticles] = useState<Particle3D[]>([]);
  const [renderFireballs, setRenderFireballs] = useState<{
    id: string;
    x: number;
    y: number;
    z: number;
    targetX: number;
    targetZ: number;
    vy: number;
    timeToLand: number;
    totalTime: number;
    damageDealt: boolean;
  }[]>([]);

  // Periodically update React structure from high frequency refs (prevents blocking main state resets)
  useEffect(() => {
    const renderInterval = setInterval(() => {
      setRenderSpirits([...spirits.current]);
      setRenderCollectibles([...collectibles.current]);
      setRenderParticles([...particles.current]);
      setRenderFireballs([...fireballs.current]);
    }, 32); // ~30fps visual updates for adding/removing nodes
    return () => clearInterval(renderInterval);
  }, []);

  return (
    <>
      {/* 1. Ambient & Spooky Forest Lights */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[15, 30, 20]} 
        intensity={0.9} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight 
        position={[playerPos.current.x, 2.0, playerPos.current.z]} 
        color="#ff3333" 
        intensity={3.5} 
        distance={9} 
      />

      {/* 2. Central Sanctuary Pagoda Shrine */}
      <group position={[0, 0, 0]}>
        {/* Pagoda steps foundation */}
        <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.5, 0.5, 4.5]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
        {/* Main relic platform */}
        <mesh position={[0, 0.75, 0]} receiveShadow castShadow>
          <boxGeometry args={[3.2, 0.5, 3.2]} />
          <meshStandardMaterial color="#292524" roughness={0.8} />
        </mesh>
        {/* 4 Corner columns */}
        {[-1.3, 1.3].map((cx) =>
          [-1.3, 1.3].map((cz) => (
            <mesh key={`${cx}_${cz}`} position={[cx, 2.2, cz]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 2.4, 8]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.5} />
            </mesh>
          ))
        )}
        {/* Pagoda Shrine Roof */}
        <mesh position={[0, 3.8, 0]} castShadow>
          <coneGeometry args={[2.8, 1.5, 4]} />
          <meshStandardMaterial color="#1a0c0c" roughness={0.7} />
        </mesh>
        {/* Sacred floating relic core */}
        <mesh position={[0, 1.8, 0]}>
          <octahedronGeometry args={[0.45]} />
          <meshBasicMaterial color="#ef4444" wireframe />
        </mesh>
        {/* Glowing relic light source */}
        <pointLight position={[0, 1.8, 0]} color="#ef4444" intensity={4} distance={6} />
      </group>

      {/* 3. 4 Ancient Sanctuary Glowing Lantern Pillars */}
      {[
        { x: -16, z: -16 },
        { x: 16, z: -16 },
        { x: -16, z: 16 },
        { x: 16, z: 16 },
      ].map((p, idx) => (
        <group key={`p_${idx}`} position={[p.x, 0, p.z]}>
          {/* Base stone */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#292524" />
          </mesh>
          {/* Tall wooden pillar */}
          <mesh position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 2.4, 6]} />
            <meshStandardMaterial color="#444" />
          </mesh>
          {/* Glowing lantern ball */}
          <mesh position={[0, 3.3, 0]}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshBasicMaterial color="#ff3b30" />
          </mesh>
          <pointLight position={[0, 3.3, 0]} color="#ff3b30" intensity={2} distance={5} />
        </group>
      ))}

      {/* 4. Tiled Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial map={groundTexture} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* 4b. Randomly Spawned Grass Sprites with Proximity Squashing */}
      {grasses.current.map(grass => (
        <sprite
          key={grass.id}
          ref={(el: THREE.Sprite | null) => {
            if (el) grassMeshesRef.current[grass.id] = el;
          }}
          position={[grass.x, grass.scaleY / 2, grass.z]}
          scale={[grass.scaleX, grass.scaleY, grass.scaleZ]}
        >
          <spriteMaterial
            map={grassTexture}
            transparent
            alphaTest={0.15}
            depthWrite={false}
          />
        </sprite>
      ))}

      {/* 5. Glowing position marker ring directly underneath the Player */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[playerPos.current.x, 0.012, playerPos.current.z]}>
        <ringGeometry args={[0.55, 0.7, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* 6. Main 2D Player Sprite Facing Camera */}
      <sprite ref={playerSpriteRef} position={[0, 1.25, 0]}>
        <spriteMaterial
          attach="material"
          map={playerTexture}
          transparent
          alphaTest={0.25}
          depthWrite={false}
        />
      </sprite>

      {/* 7. Skill Ward Expanding Circle mesh */}
      <mesh ref={skillRingMeshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[0.96, 1.0, 64]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* 8. Spooky Roaming Ghost Spirits (Enemies) */}
      {renderSpirits.map(spirit => {
        // Default facing direction left (scaleX positive = facing left, negative = facing right)
        const scaleX = spirit.facingLeft ? 2.2 : -2.2;
        const colorVal = spirit.flashWhiteTime > 0 
          ? (Math.floor(Date.now() / 50) % 2 === 0 ? '#ffffff' : '#333333') // rapid white flashing
          : (spirit.flashRedTime > 0 ? '#ff3333' : '#ffffff');

        return (
          <group
            key={spirit.id}
            ref={(el: THREE.Group | null) => {
              if (el) spiritMeshesRef.current[spirit.id] = el;
            }}
            position={[spirit.x, 0.6, spirit.z]}
          >
            {/* 2D Enemy Character Sprite Sheet Facing Camera */}
            <sprite scale={[scaleX, 2.2, 1]}>
              <spriteMaterial
                map={spirit.texture}
                transparent
                alphaTest={0.2}
                depthWrite={false}
                color={new THREE.Color(colorVal)}
              />
            </sprite>

            {/* Glowing health/aura bar ring (for showing damage state) */}
            {spirit.hits > 0 && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                <ringGeometry args={[0.4, 0.5, 16]} />
                <meshBasicMaterial color="#ffcc00" transparent opacity={0.7} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* 9. Floating Golden Bells & Sacred Healing Stars */}
      {renderCollectibles.map(collect => (
        <group
          key={collect.id}
          ref={(el: THREE.Group | null) => {
            if (el) collectibleMeshesRef.current[collect.id] = el;
          }}
          position={[collect.x, 0.6, collect.z]}
        >
          {collect.type === 'star' ? (
            /* Sacred Star double pyramid shape */
            <mesh>
              <octahedronGeometry args={[0.4]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} />
            </mesh>
          ) : (
            /* Red Mask Item 2D Sprite facing camera */
            <sprite scale={[1.2, 1.2, 1]}>
              <spriteMaterial
                map={itemTexture}
                transparent
                alphaTest={0.15}
                depthWrite={false}
              />
            </sprite>
          )}
          {/* Sparkly pointlight on items */}
          <pointLight color={collect.type === 'star' ? '#ffffff' : '#ef4444'} intensity={1.8} distance={4} />
        </group>
      ))}

      {/* 10. Dynamic 3D Particle System pool */}
      {renderParticles.map(p => (
        <mesh
          key={p.id}
          ref={(el: THREE.Mesh | null) => {
            if (el) particleMeshesRef.current[p.id] = el;
          }}
          position={[p.x, p.y, p.z]}
        >
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshBasicMaterial color={p.color} transparent opacity={p.alpha} />
        </mesh>
      ))}

      {/* 11. Boss rendering */}
      {bossState.current && (
        <group
          ref={bossMeshRef}
          position={[bossState.current.x, bossState.current.y, bossState.current.z]}
        >
          <sprite
            scale={[bossState.current.facingLeft ? bossState.current.scaleX : -bossState.current.scaleX, bossState.current.scaleY, 1]}
          >
            <spriteMaterial
              map={bossTexture}
              transparent
              alphaTest={0.15}
              depthWrite={false}
              color={
                bossState.current.flashWhiteTime > 0
                  ? (Math.floor(Date.now() / 50) % 2 === 0 ? '#ffffff' : '#333333')
                  : (bossState.current.flashRedTime > 0 ? '#ff3333' : '#ffffff')
              }
            />
          </sprite>
          
          {/* Boss floating shadow on ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -bossState.current.y + 0.02, 0]}>
            <ringGeometry args={[0, 1.4, 32]} />
            <meshBasicMaterial color="#000000" transparent opacity={Math.max(0.1, 0.6 - (bossState.current.y * 0.1))} />
          </mesh>
        </group>
      )}

      {/* 12. Fireball projectiles */}
      {renderFireballs.map(fb => {
        const timeToLandRatio = fb.timeToLand / fb.totalTime;
        return (
          <group key={fb.id}>
            {/* Parabolic flying fireball */}
            <mesh
              ref={(el: THREE.Mesh | null) => {
                if (el) fireballMeshesRef.current[fb.id] = el;
              }}
              position={[fb.x, fb.y, fb.z]}
            >
              <sphereGeometry args={[0.42, 16, 16]} />
              <meshBasicMaterial color="#ff4500" />
            </mesh>

            {/* Ground shadow target danger indicator */}
            {fb.timeToLand > 0 && (
              <group position={[fb.targetX, 0.02, fb.targetZ]}>
                {/* Outermost ring */}
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[1.8, 2.0, 32]} />
                  <meshBasicMaterial color="#ff0000" transparent opacity={0.65} side={THREE.DoubleSide} />
                </mesh>
                {/* Expanding target inner disk */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
                  <ringGeometry args={[0, 1.8 * (1.0 - timeToLandRatio), 32]} />
                  <meshBasicMaterial color="#ff3300" transparent opacity={0.35} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}
          </group>
        );
      })}

      {/* 13. Warp Gate portal rendering */}
      {warpGateActive.current && (
        <group position={[0, 0.015, 0]}>
          {/* Swirling portal rings */}
          <mesh rotation={[-Math.PI / 2, 0, (Date.now() * 0.001) * 2.0]}>
            <ringGeometry args={[1.4, 1.8, 32]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, -(Date.now() * 0.001) * 3.5]}>
            <ringGeometry args={[0, 1.4, 32]} />
            <meshBasicMaterial color="#ffcc00" transparent opacity={0.55} side={THREE.DoubleSide} />
          </mesh>
          {/* Light tunnel aura */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[1.4, 1.4, 3.0, 32, 1, true]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.25} side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0, 1.0, 0]} color="#ef4444" intensity={3} distance={5} />
        </group>
      )}
    </>
  );
}

// --------------------------------------------------------
// Main Component Wrapper
// --------------------------------------------------------
export default function GameScreen({ settings, onClose }: GameScreenProps) {
  // Game states
  const [isPlaying, setIsPlaying] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [bellCharge, setBellCharge] = useState(100);

  // Boss encounter states
  const [defeatedCount, setDefeatedCount] = useState(0);
  const [bossActive, setBossActive] = useState(false);
  const [bossHP, setBossHP] = useState(12);
  const [isGameCleared, setIsGameCleared] = useState(false);

  // Red flash overlay on hit
  const [flashActive, setFlashActive] = useState(false);

  // High scores & leaderboard
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState<HighScore[]>([]);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Audio configuration sync
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);

  // Mobile controller touches
  const mobileKeys = useMemo(() => new Set<string>(), []);

  // Load leaderboard and local high score
  useEffect(() => {
    const savedHighScore = localStorage.getItem('dansai_high_score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
    const savedLeaderboard = localStorage.getItem('dansai_leaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    } else {
      const defaults: HighScore[] = [
        { name: 'เจ้าสัวรื่น', score: 1500, date: '2026-06-25' },
        { name: 'ผู้ใหญ่คำดี', score: 1000, date: '2026-06-24' },
        { name: 'เด็กด่านซ้าย', score: 600, date: '2026-06-25' },
      ];
      localStorage.setItem('dansai_leaderboard', JSON.stringify(defaults));
      setLeaderboard(defaults);
    }

    // Play initial click audio
    if (settings.soundEnabled) {
      audio.init();
    }
  }, [settings.soundEnabled]);

  // Listen to Escape key globally to toggle pause
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isGameOver) {
          setIsPlaying(prev => {
            audio.playClick();
            return !prev;
          });
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isGameOver]);

  const handlePauseToggle = () => {
    audio.playClick();
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    audio.playClick();
    setScore(0);
    setLives(5);
    setBellCharge(100);
    setIsGameOver(false);
    setIsPlaying(true);
    setScoreSubmitted(false);
    setPlayerName('');
    setDefeatedCount(0);
    setBossActive(false);
    setBossHP(12);
    setIsGameCleared(false);
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    
    // Save personal best if applicable
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('dansai_high_score', String(score));
    }
  };

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    audio.playClick();
    const newEntry: HighScore = {
      name: playerName.trim(),
      score: score,
      date: new Date().toISOString().split('T')[0],
    };

    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Keep top 5

    setLeaderboard(updated);
    localStorage.setItem('dansai_leaderboard', JSON.stringify(updated));
    setScoreSubmitted(true);
  };

  return (
    <div className="w-full max-w-4xl bg-[#030005] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(215,25,32,0.18)] font-sans flex flex-col relative">
      
      {/* Red screen flash on hit */}
      {flashActive && (
        <div className="absolute inset-0 bg-red-600/30 z-40 pointer-events-none duration-100 transition-opacity" />
      )}

      {/* 1. Top HUD Dashboard */}
      <div className="bg-[#09050b]/90 border-b border-white/10 px-6 py-4 flex items-center justify-between z-30 relative">
        <div className="flex items-center gap-6">
          {/* Hearts HP Bar */}
          <div className="flex items-center gap-1.5" title="พลังชีวิต">
            {[1, 2, 3, 4, 5].map((heartVal) => (
              <Heart
                key={heartVal}
                className={`w-5 h-5 transition-transform duration-300 ${
                  heartVal <= lives
                    ? 'text-red-500 fill-red-500 scale-110 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                    : 'text-stone-700 scale-95'
                }`}
              />
            ))}
          </div>

          {/* Current Score */}
          <div className="flex items-center gap-2">
            <Trophy className="w-4.5 h-4.5 text-red-500" />
            <span className="font-mono text-red-500 font-extrabold text-lg tracking-wider">
              {String(score).padStart(6, '0')}
            </span>
          </div>
        </div>

        {/* Action controls helper in Desktop layout */}
        <div className="hidden md:flex items-center gap-4 text-xs font-kanit text-stone-400">
          <div className="bg-black/50 px-2 py-1 rounded border border-white/5">
            <kbd className="font-mono text-red-500 font-bold mr-1">WASD</kbd> เดิน 8 ทิศ
          </div>
          <div className="bg-black/50 px-2 py-1 rounded border border-white/5">
            <kbd className="font-mono text-red-500 font-bold mr-1">P</kbd> ต่อยโจมตี
          </div>
          <div className="bg-black/50 px-2 py-1 rounded border border-white/5 flex items-center gap-1">
            <kbd className="font-mono text-red-500 font-bold mr-1">O</kbd> เต้นทำลาย (ใช้ 35%)
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          </div>
        </div>

        {/* Home & Sound Toggles */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audio.playClick();
              const next = !soundEnabled;
              setSoundEnabled(next);
              settings.soundEnabled = next;
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-900 transition-colors cursor-pointer"
            title="สลับเสียง"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handlePauseToggle}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-900 transition-colors cursor-pointer"
            title="หยุดเกมชั่วคราว"
          >
            <Play className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-900 transition-colors cursor-pointer"
            title="กลับหน้าหลัก"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Interactive 3D Canvas stage container */}
      <div className="relative aspect-[16/10] md:h-[530px] w-full bg-black overflow-hidden select-none z-10">
        
        {/* Boss Health Bar HTML Overlay */}
        {bossActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/90 border border-red-500/30 rounded-full px-6 py-2.5 z-20 flex items-center gap-4 shadow-[0_0_20px_rgba(239,68,68,0.25)] min-w-[280px]">
            <div className="flex flex-col flex-1">
              <div className="flex justify-between items-center text-[10px] text-stone-400 uppercase tracking-widest font-mono">
                <span className="text-red-500 font-extrabold font-kanit">จอมอสูรหน้ากากยักษ์ (BOSS)</span>
                <span className="font-bold">{bossHP} / 12 HP</span>
              </div>
              <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-white/5 mt-1.5">
                <div
                  className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 h-full transition-all duration-300"
                  style={{ width: `${(bossHP / 12) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#05010a] text-stone-400 text-sm font-kanit">
            <Sparkles className="w-8 h-8 text-red-500 animate-spin mb-3" />
            <p className="tracking-widest uppercase">กำลังเตรียมดินแดนหน้ากากสามมิติ...</p>
          </div>
        }>
          <Canvas
            shadows
            camera={{ position: [0, 8, 8], fov: 50 }}
            gl={{ antialias: true }}
          >
            {/* Dark Spooky Fog */}
            <fog attach="fog" args={['#030005', 9, 23]} />
            
            <GameSanctuaryScene
              settings={settings}
              isPlaying={isPlaying}
              isGameOver={isGameOver}
              score={score}
              setScore={setScore}
              lives={lives}
              setLives={setLives}
              bellCharge={bellCharge}
              setBellCharge={setBellCharge}
              onGameOver={handleGameOver}
              mobileKeys={mobileKeys}
              setFlashActive={setFlashActive}
              defeatedCount={defeatedCount}
              setDefeatedCount={setDefeatedCount}
              bossActive={bossActive}
              setBossActive={setBossActive}
              bossHP={bossHP}
              setBossHP={setBossHP}
              isGameCleared={isGameCleared}
              setIsGameCleared={setIsGameCleared}
            />
          </Canvas>
        </Suspense>

        {/* Left Side: Mobile Joystick D-Pad Overlay (Only active/visible on touch-ready viewports or default layout) */}
        <div className="absolute bottom-6 left-6 flex flex-col items-center gap-1.5 z-20 pointer-events-none md:scale-100 scale-90">
          <button
            onTouchStart={() => mobileKeys.add('up')}
            onTouchEnd={() => mobileKeys.delete('up')}
            onMouseDown={() => mobileKeys.add('up')}
            onMouseUp={() => mobileKeys.delete('up')}
            onMouseLeave={() => mobileKeys.delete('up')}
            className="w-11 h-11 bg-black/60 active:bg-red-600/40 border border-white/10 rounded-xl flex items-center justify-center text-white font-black select-none pointer-events-auto cursor-pointer"
          >
            ▲
          </button>
          <div className="flex gap-1.5">
            <button
              onTouchStart={() => mobileKeys.add('left')}
              onTouchEnd={() => mobileKeys.delete('left')}
              onMouseDown={() => mobileKeys.add('left')}
              onMouseUp={() => mobileKeys.delete('left')}
              onMouseLeave={() => mobileKeys.delete('left')}
              className="w-11 h-11 bg-black/60 active:bg-red-600/40 border border-white/10 rounded-xl flex items-center justify-center text-white font-black select-none pointer-events-auto cursor-pointer"
            >
              ◀
            </button>
            <div className="w-11 h-11 bg-black/30 border border-white/5 rounded-xl flex items-center justify-center text-stone-600 text-[10px] select-none">
              D-PAD
            </div>
            <button
              onTouchStart={() => mobileKeys.add('right')}
              onTouchEnd={() => mobileKeys.delete('right')}
              onMouseDown={() => mobileKeys.add('right')}
              onMouseUp={() => mobileKeys.delete('right')}
              onMouseLeave={() => mobileKeys.delete('right')}
              className="w-11 h-11 bg-black/60 active:bg-red-600/40 border border-white/10 rounded-xl flex items-center justify-center text-white font-black select-none pointer-events-auto cursor-pointer"
            >
              ▶
            </button>
          </div>
          <button
            onTouchStart={() => mobileKeys.add('down')}
            onTouchEnd={() => mobileKeys.delete('down')}
            onMouseDown={() => mobileKeys.add('down')}
            onMouseUp={() => mobileKeys.delete('down')}
            onMouseLeave={() => mobileKeys.delete('down')}
            className="w-11 h-11 bg-black/60 active:bg-red-600/40 border border-white/10 rounded-xl flex items-center justify-center text-white font-black select-none pointer-events-auto cursor-pointer"
          >
            ▼
          </button>
        </div>

        {/* Right Side: Action Keys Overlay */}
        <div className="absolute bottom-6 right-6 flex items-center gap-3 z-20 pointer-events-none md:scale-100 scale-90">
          <button
            onTouchStart={() => mobileKeys.add('action_attack')}
            onMouseDown={() => mobileKeys.add('action_attack')}
            className="w-14 h-14 bg-black/60 active:bg-red-600/40 border border-white/10 rounded-full flex flex-col items-center justify-center text-white select-none pointer-events-auto cursor-pointer"
          >
            <span className="text-xs font-bold tracking-wider">ต่อย (P)</span>
          </button>
          <button
            onTouchStart={() => mobileKeys.add('action_dance')}
            onMouseDown={() => mobileKeys.add('action_dance')}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-xs font-bold select-none pointer-events-auto border transition-colors cursor-pointer ${
              bellCharge >= 35
                ? 'bg-red-600 text-white border-white/20 animate-pulse'
                : 'bg-black/60 text-stone-500 border-white/5'
            }`}
          >
            <span className="text-xs">เต้น (O)</span>
            <span className="text-[9px] opacity-75">{bellCharge}%</span>
          </button>
        </div>

        {/* Pause Screen Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
            <p className="text-2xl font-kanit font-black text-red-500 mb-4 tracking-widest animate-pulse uppercase">
              เกมหยุดชั่วคราว (PAUSED)
            </p>
            <button
              onClick={handlePauseToggle}
              className="px-8 py-3.5 bg-white text-black font-extrabold uppercase tracking-widest hover:bg-red-600 hover:text-white border border-transparent hover:border-white transition-all duration-300 flex items-center gap-2 shadow-lg cursor-pointer text-sm"
            >
              <Play className="w-5 h-5 fill-current" />
              เล่นต่อ (RESUME)
            </button>
          </div>
        )}

        {/* Game Over / Cleared Panel Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col md:flex-row items-center justify-center p-6 gap-8 z-30">
            {/* Left Score summary */}
            <div className="flex-1 w-full max-w-sm flex flex-col justify-center text-center md:text-left font-kanit">
              {isGameCleared ? (
                <>
                  <span className="text-yellow-400 font-extrabold tracking-widest text-lg uppercase animate-pulse">
                    ✓ สำเร็จเสร็จสิ้น! บรรลุการผจญภัยอันศักดิ์สิทธิ์
                  </span>
                  <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-red-500 mt-1 mb-2">GAME CLEARED</h3>
                  <p className="text-xs text-stone-300 leading-relaxed mb-4">
                    ท่านได้ปราบจอมอสูรยักษ์สำเร็จและเดินเข้าสู่ประตูวาร์ปมิติกลับคืนสู่เทศกาลอย่างสมเกียรติ! แผ่นดินด่านซ้ายกลับมาสงบสุขร่มเย็นด้วยพลังแห่งหน้ากากผีตาโขนของท่าน!
                  </p>
                </>
              ) : (
                <>
                  <span className="text-red-500 font-extrabold tracking-widest text-lg uppercase animate-pulse">
                    ภารกิจสิ้นสุดลงแล้ว!
                  </span>
                  <h3 className="text-4xl font-black text-white mt-1 mb-4">GAME OVER</h3>
                </>
              )}
              
              <div className="bg-[#111] border border-white/10 rounded-xl p-4 space-y-2.5 mb-4">
                <div className="flex justify-between text-stone-400 text-sm">
                  <span>คะแนนด่านซ้ายของคุณ:</span>
                  <strong className="text-red-500 font-mono text-base">{score}</strong>
                </div>
                <div className="flex justify-between text-stone-400 text-sm">
                  <span>คะแนนสูงสุด (High Score):</span>
                  <strong className="text-white font-mono text-base">{Math.max(score, highScore)}</strong>
                </div>
                <div className="flex justify-between text-stone-400 text-sm border-t border-white/5 pt-2">
                  <span>ระดับความยาก:</span>
                  <span className="text-red-500 font-bold uppercase text-xs">
                    {settings.difficulty === 'easy' ? 'ง่าย' : settings.difficulty === 'normal' ? 'ปกติ' : 'ยาก'}
                  </span>
                </div>
              </div>

              {/* Leaderboard Submit Form */}
              {!scoreSubmitted ? (
                <form onSubmit={handleSaveScore} className="flex gap-2 w-full">
                  <input
                    type="text"
                    maxLength={12}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="ใส่ชื่อผู้กล้าด่านซ้าย..."
                    className="flex-1 px-3 py-2 bg-stone-900 border border-white/10 rounded-lg text-white font-kanit text-sm focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={!playerName.trim()}
                    className="px-5 py-2 bg-white hover:bg-red-600 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black text-black font-extrabold uppercase text-sm transition-colors cursor-pointer rounded-lg border-2 border-transparent hover:border-white"
                  >
                    บันทึก
                  </button>
                </form>
              ) : (
                <div className="bg-red-950/25 border border-red-500/20 py-2.5 px-4 rounded-xl text-red-500 text-xs text-center md:text-left">
                  ✓ บันทึกอันดับเกียรติยศลงทำเนียบผู้กล้าเรียบร้อยแล้ว!
                </div>
              )}
            </div>

            {/* Right Leaderboard Column */}
            <div className="w-full max-w-xs bg-[#111] border border-white/10 rounded-xl p-4 flex flex-col font-kanit">
              <h4 className="text-stone-300 font-bold text-sm border-b border-white/10 pb-2 mb-3 flex items-center gap-1.5 uppercase">
                <Trophy className="w-4 h-4 text-red-500" /> ทำเนียบผู้กล้าด่านซ้าย
              </h4>
              <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar font-mono text-xs">
                {leaderboard.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-center px-2.5 py-1.5 rounded ${
                      idx === 0
                        ? 'bg-red-600/10 text-red-500 border-l-2 border-red-500 font-bold'
                        : 'text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-stone-500">{idx + 1}.</span>
                      <span className="truncate max-w-[100px]">{item.name}</span>
                    </div>
                    <span className="font-extrabold text-white">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Energy and Play Controls Bar */}
      <div className="bg-[#0b050d] px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 relative">
        {/* Dynamic Sacred Bell Energy Bar */}
        <div className="flex items-center gap-3 w-full sm:w-auto max-w-sm">
          <Zap className={`w-5 h-5 ${bellCharge >= 35 ? 'text-red-500 animate-bounce' : 'text-stone-600'}`} />
          <div className="flex-1 w-32 bg-stone-950 rounded-full h-3 overflow-hidden border border-white/5 relative">
            <div
              className="bg-gradient-to-r from-red-800 via-red-600 to-red-400 h-full transition-all duration-300"
              style={{ width: `${bellCharge}%` }}
            />
            {/* 35% Mark Line indicator */}
            <div className="absolute left-[35%] top-0 w-[1px] h-full bg-white/25" />
          </div>
          <span className="text-xs font-mono font-bold text-stone-400 w-10">
            {bellCharge}%
          </span>
          <span className="text-[10px] font-kanit bg-red-950/40 text-red-500 border border-red-900/40 px-1.5 py-0.5 rounded">
            เต้นรำ (ใช้ 35%)
          </span>
        </div>

        {/* Play control buttons */}
        <div className="flex gap-3 w-full sm:w-auto justify-end">
          {isGameOver ? (
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-white text-black font-extrabold uppercase tracking-widest hover:bg-red-600 hover:text-white border-2 border-transparent hover:border-white rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              เล่นอีกครั้ง (PLAY AGAIN)
            </button>
          ) : (
            <button
              onClick={handleRestart}
              className="px-4 py-2 border-2 border-white/20 text-white font-bold hover:bg-white hover:text-black hover:border-white rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              เริ่มใหม่ (RESTART)
            </button>
          )}

          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="px-5 py-2.5 border border-white/10 text-stone-400 hover:text-white hover:border-red-500 rounded-xl font-kanit text-xs font-bold transition-all cursor-pointer"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    </div>
  );
}
