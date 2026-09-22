/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayerStats,
  Animal,
  ResourceNode,
  DroppedItemEntity,
  PlacedStructure,
  Projectile,
  Particle,
  FloatingText,
  TimeOfDay,
  Language,
  GameState,
} from './types';
import {
  LEVELS,
  RESOURCE_ITEMS,
  WEAPONS,
  SHELTERS,
  ANIMAL_SPECIES,
  UI_TEXT,
} from './game/constants';
import {
  generateResourceNodes,
  getInitialDroppedItems,
  isInsideIsland,
  CENTER_X,
  CENTER_Y,
} from './game/mapGenerator';
import { GameRenderer } from './game/renderer';
import { soundManager } from './audio/soundManager';
import { GameHUD } from './components/GameHUD';
import { CraftingModal } from './components/CraftingModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { GameOverModal } from './components/GameOverModal';
import { MobileControls } from './components/MobileControls';
import { Compass, Play, Languages, Volume2, VolumeX, Shield, Skull, Hammer } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [language, setLanguage] = useState<Language>('hi');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

  // Player state
  const [player, setPlayer] = useState<PlayerStats>({
    score: 0,
    level: 1,
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    hunger: 100,
    maxHunger: 100,
    x: CENTER_X - 520,
    y: CENTER_Y + 440,
    vx: 0,
    vy: 0,
    speed: 3.4,
    angle: 0,
    equippedWeaponId: 'fists',
    isAttacking: false,
    attackProgress: 0,
    resourcesGatheredCount: 0,
    structuresBuiltCount: 0,
    beastsDefeatedCount: 0,
    daysSurvived: 1,
  });

  // Inventory: item id -> count
  const [inventory, setInventory] = useState<Record<string, number>>({
    wood: 3,
    stone: 2,
    fiber: 2,
    berries: 3,
  });

  // Game world entities
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [resourceNodes, setResourceNodes] = useState<ResourceNode[]>([]);
  const [droppedItems, setDroppedItems] = useState<DroppedItemEntity[]>([]);
  const [structures, setStructures] = useState<PlacedStructure[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Time & environment
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('DAY');
  const [timeProgress, setTimeProgress] = useState(0);
  const [isInSafeZone, setIsInSafeZone] = useState(false);
  const [activeSanctuary, setActiveSanctuary] = useState<PlacedStructure | null>(null);

  // UI Modals
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [craftingInitialTab, setCraftingInitialTab] = useState<'WEAPONS' | 'SHELTERS' | 'SUPPLIES'>('WEAPONS');
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [placementStructureId, setPlacementStructureId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Canvas and refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const mouseWorldPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const keysDownRef = useRef<Record<string, boolean>>({});
  const mobileVectorRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const lastAttackTimeRef = useRef<number>(0);
  const lastStepSoundTimeRef = useRef<number>(0);
  const lastAnimalSpawnTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Current level configuration
  const currentLevelConfig = LEVELS[currentLevelIndex] || LEVELS[LEVELS.length - 1];
  const nextLevelConfig = currentLevelIndex < LEVELS.length - 1 ? LEVELS[currentLevelIndex + 1] : null;

  // Initialize Game World
  const initializeWorld = useCallback((levelIdx: number) => {
    const nodes = generateResourceNodes(levelIdx + 1);
    const initialDrops = levelIdx === 0 ? getInitialDroppedItems() : [];

    setResourceNodes(nodes);
    setDroppedItems(initialDrops);
    setAnimals([]);
    setProjectiles([]);
    setParticles([]);
    setFloatingTexts([]);

    // Spawn 2 initial animals safely away from player
    const initialAnimals: Animal[] = [];
    const pool = LEVELS[levelIdx].animalPool;
    for (let i = 0; i < 2; i++) {
      const typeId = pool[Math.floor(Math.random() * pool.length)];
      const species = ANIMAL_SPECIES[typeId];
      if (species) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 350 + Math.random() * 250;
        initialAnimals.push({
          ...species,
          id: `animal_init_${i}`,
          x: CENTER_X + Math.cos(angle) * dist,
          y: CENTER_Y + Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          behavior: 'WANDER',
          wanderTarget: null,
          stateTimer: 0,
          lastAttackTime: 0,
        });
      }
    }
    setAnimals(initialAnimals);
  }, []);

  // Start new game
  const handleStartGame = () => {
    soundManager.playStep();
    setGameState('PLAYING');
    initializeWorld(0);
  };

  // Resize canvas handler
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        if (rendererRef.current) {
          rendererRef.current.setDimensions(window.innerWidth, window.innerHeight);
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = true;

      if (e.key === 'c' || e.key === 'C') {
        if (gameState === 'PLAYING') {
          setIsCraftingOpen((prev) => !prev);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        handleInteract();
      } else if (e.key === ' ') {
        handleAttack();
      } else if (e.key === 'Escape') {
        if (isPlacementMode) {
          setIsPlacementMode(false);
          setPlacementStructureId(null);
        } else if (isCraftingOpen) {
          setIsCraftingOpen(false);
        } else if (gameState === 'PLAYING') {
          setIsPaused((p) => !p);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gameState, isPlacementMode, isCraftingOpen]);

  // Pointer position tracker
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert screen coordinates to world coordinates relative to player center
    const worldX = screenX - window.innerWidth / 2 + player.x;
    const worldY = screenY - window.innerHeight / 2 + player.y;
    mouseWorldPosRef.current = { x: worldX, y: worldY };

    // Update player facing angle towards mouse if playing
    if (gameState === 'PLAYING') {
      const dx = worldX - player.x;
      const dy = worldY - player.y;
      setPlayer((p) => ({ ...p, angle: Math.atan2(dy, dx) }));
    }
  };

  // Primary Canvas Click / Tap (Attack or Place Structure)
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || isPaused) return;

    if (isPlacementMode && placementStructureId) {
      handleFinalizeStructurePlacement();
    } else {
      handleAttack();
    }
  };

  // Perform Attack Action
  const handleAttack = useCallback(() => {
    if (gameState !== 'PLAYING' || isPaused) return;
    const now = Date.now();
    const weapon = WEAPONS[player.equippedWeaponId] || WEAPONS.fists;

    if (now - lastAttackTimeRef.current < weapon.attackSpeed) return;
    lastAttackTimeRef.current = now;

    // Trigger visual swing
    setPlayer((p) => ({ ...p, isAttacking: true, attackProgress: 0 }));

    if (weapon.type === 'RANGED') {
      // Bow shot
      soundManager.playBowShot();
      const speed = weapon.projectileSpeed || 8;
      const angle = player.angle;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      setProjectiles((prev) => [
        ...prev,
        {
          id: `proj_${Date.now()}_${Math.random()}`,
          x: player.x + Math.cos(angle) * 18,
          y: player.y + Math.sin(angle) * 18,
          vx,
          vy,
          damage: weapon.damage,
          range: weapon.range,
          distanceTraveled: 0,
          isPlayerProjectile: true,
          color: '#f59e0b',
          effect: weapon.specialEffect,
        },
      ]);
      return;
    }

    // Melee or Thrust attack
    soundManager.playAttackSwing();

    // 1. Check hits against Strange Animals
    let beastHit = false;
    setAnimals((prevAnimals) =>
      prevAnimals.map((animal) => {
        const dx = animal.x - player.x;
        const dy = animal.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Check weapon reach
        if (dist <= weapon.range + animal.size) {
          // Check directional cone (front 160 degrees)
          const angleToAnimal = Math.atan2(dy, dx);
          let angleDiff = Math.abs(angleToAnimal - player.angle);
          if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

          if (angleDiff < Math.PI * 0.45 || dist < 45) {
            beastHit = true;
            const newHp = animal.hp - weapon.damage;

            // Blood/impact particles
            const bloodColor = animal.glowColor || '#ef4444';
            addSparks(animal.x, animal.y, bloodColor, 8);

            // Floating damage text
            addFloatingText(`-${weapon.damage}`, animal.x, animal.y - 12, '#f87171');

            // Knockback
            const knock = weapon.specialEffect === 'KNOCKBACK' ? 14 : 6;
            const kx = Math.cos(angleToAnimal) * knock;
            const ky = Math.sin(angleToAnimal) * knock;

            // Retaliation aggro
            return {
              ...animal,
              hp: newHp,
              x: animal.x + kx,
              y: animal.y + ky,
              behavior: 'CHASE',
            };
          }
        }
        return animal;
      })
    );

    if (beastHit) {
      soundManager.playMonsterHit();
    }

    // 2. Check hits against Resource Nodes (Trees, Boulders, Iron, Crystals)
    let nodeHit = false;
    setResourceNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.health <= 0) return node;
        const dx = node.x - player.x;
        const dy = node.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= weapon.range + node.size) {
          nodeHit = true;
          const newHealth = node.health - 1;
          const itemDef = RESOURCE_ITEMS[node.itemId];

          // Particle chips
          addSparks(node.x, node.y, itemDef?.color || '#a8a29e', 6);

          // Drop scavenged item entity into the world
          const dropX = node.x + (Math.random() - 0.5) * 30;
          const dropY = node.y + (Math.random() - 0.5) * 30;
          setDroppedItems((prev) => [
            ...prev,
            {
              id: `drop_${Date.now()}_${Math.random()}`,
              itemId: node.itemId,
              count: node.yieldPerHit,
              x: dropX,
              y: dropY,
              spawnTime: Date.now(),
            },
          ]);

          // Sound per resource type
          if (node.itemId === 'wood') {
            soundManager.playChopWood();
          } else if (node.itemId === 'stone' || node.itemId === 'iron') {
            soundManager.playMineStone();
          } else {
            soundManager.playHarvest();
          }

          return {
            ...node,
            health: newHealth,
            respawnTimer: newHealth <= 0 ? 1200 : 0, // Starts respawn cycle if depleted
          };
        }
        return node;
      })
    );
  }, [gameState, isPaused, player]);

  // Perform Gather / Pick up dropped items in proximity
  const handleInteract = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    setDroppedItems((prevDrops) => {
      const remaining: DroppedItemEntity[] = [];
      let totalGainedPoints = 0;
      const gatheredCounts: Record<string, number> = {};

      prevDrops.forEach((item) => {
        const dx = item.x - player.x;
        const dy = item.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 75) {
          // Collected item!
          const itemDef = RESOURCE_ITEMS[item.itemId];
          const pts = (itemDef?.points || 15) * item.count;
          totalGainedPoints += pts;
          gatheredCounts[item.itemId] = (gatheredCounts[item.itemId] || 0) + item.count;

          // Sound & floating text
          soundManager.playPickup();
          addFloatingText(
            `+${item.count} ${language === 'hi' ? itemDef?.nameHi || item.itemId : itemDef?.name || item.itemId} (+${pts} Pts!)`,
            player.x,
            player.y - 25,
            '#facc15'
          );
        } else {
          remaining.push(item);
        }
      });

      if (totalGainedPoints > 0) {
        setPlayer((p) => ({
          ...p,
          score: p.score + totalGainedPoints,
          resourcesGatheredCount: p.resourcesGatheredCount + Object.values(gatheredCounts).reduce((a, b) => a + b, 0),
        }));

        setInventory((inv) => {
          const nextInv = { ...inv };
          Object.entries(gatheredCounts).forEach(([id, count]) => {
            nextInv[id] = (nextInv[id] || 0) + count;
          });
          return nextInv;
        });
      }

      return remaining;
    });
  }, [gameState, player, language]);

  // Crafting a Weapon
  const handleCraftWeapon = (weaponId: string) => {
    const weapon = WEAPONS[weaponId];
    if (!weapon) return;

    // Deduct cost
    setInventory((prev) => {
      const nextInv = { ...prev };
      Object.entries(weapon.cost).forEach(([matId, count]) => {
        nextInv[matId] = Math.max(0, (nextInv[matId] || 0) - count);
      });
      return nextInv;
    });

    // Equip and award points
    setPlayer((p) => ({
      ...p,
      equippedWeaponId: weaponId,
      score: p.score + weapon.damage * 5,
    }));

    addFloatingText(
      `Forged ${language === 'hi' ? weapon.nameHi : weapon.name}!`,
      player.x,
      player.y - 30,
      '#f59e0b'
    );
  };

  // Enter placement mode for a Shelter
  const handleSelectStructureToPlace = (structureId: string) => {
    setPlacementStructureId(structureId);
    setIsPlacementMode(true);
  };

  // Finalize placing structure at cursor
  const handleFinalizeStructurePlacement = () => {
    if (!placementStructureId) return;
    const def = SHELTERS[placementStructureId];
    if (!def) return;

    const targetX = mouseWorldPosRef.current.x;
    const targetY = mouseWorldPosRef.current.y;

    if (!isInsideIsland(targetX, targetY, 40)) {
      addFloatingText('Cannot build in ocean water!', targetX, targetY, '#ef4444');
      return;
    }

    // Deduct cost
    setInventory((prev) => {
      const nextInv = { ...prev };
      Object.entries(def.cost).forEach(([matId, count]) => {
        nextInv[matId] = Math.max(0, (nextInv[matId] || 0) - count);
      });
      return nextInv;
    });

    // Place structure
    setStructures((prev) => [
      ...prev,
      {
        id: `struct_${Date.now()}`,
        structureId: placementStructureId,
        x: targetX,
        y: targetY,
        hp: def.maxHp,
        maxHp: def.maxHp,
        type: def.category,
        placedAt: Date.now(),
      },
    ]);

    soundManager.playBuildPlace();
    addSparks(targetX, targetY, '#eab308', 12);
    addFloatingText(
      `Built ${language === 'hi' ? def.nameHi : def.name}! (+100 Pts)`,
      targetX,
      targetY - 20,
      '#22c55e'
    );

    // Update player score & stats
    setPlayer((p) => ({
      ...p,
      score: p.score + 100,
      structuresBuiltCount: p.structuresBuiltCount + 1,
    }));

    setIsPlacementMode(false);
    setPlacementStructureId(null);
  };

  // Consume Rations (Berries / Coconut / Crafted Salves)
  const handleConsumeItem = (itemId: string) => {
    if ((inventory[itemId] || 0) <= 0) return;

    soundManager.playHarvest();
    setInventory((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1),
    }));

    if (itemId === 'berries') {
      setPlayer((p) => ({
        ...p,
        hp: Math.min(p.maxHp, p.hp + 20),
        hunger: Math.min(p.maxHunger, p.hunger + 15),
      }));
      addFloatingText('+20 HP!', player.x, player.y - 20, '#22c55e');
    } else if (itemId === 'coconut') {
      setPlayer((p) => ({
        ...p,
        stamina: p.maxStamina,
        hunger: Math.min(p.maxHunger, p.hunger + 25),
      }));
      addFloatingText('Stamina Refilled!', player.x, player.y - 20, '#38bdf8');
    }
  };

  const handleCraftFood = (foodType: string) => {
    if (foodType === 'salve') {
      setInventory((prev) => ({
        ...prev,
        berries: Math.max(0, (prev.berries || 0) - 3),
        fiber: Math.max(0, (prev.fiber || 0) - 2),
      }));
      setPlayer((p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + 45) }));
      soundManager.playCraftSuccess();
      addFloatingText('+45 HP Restored!', player.x, player.y - 20, '#22c55e');
    } else if (foodType === 'tonic') {
      setInventory((prev) => ({
        ...prev,
        coconut: Math.max(0, (prev.coconut || 0) - 2),
      }));
      setPlayer((p) => ({ ...p, stamina: p.maxStamina, speed: 4.5 }));
      soundManager.playCraftSuccess();
      addFloatingText('Adrenaline Boost Active!', player.x, player.y - 20, '#f59e0b');
      setTimeout(() => {
        setPlayer((p) => ({ ...p, speed: 3.4 }));
      }, 15000);
    }
  };

  // Helper: Particles & Floating texts
  const addSparks = (x: number, y: number, color: string, count = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3.5;
      newParticles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 18 + Math.random() * 10,
        maxLife: 28,
        size: 2.5 + Math.random() * 2.5,
        color,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const addFloatingText = (text: string, x: number, y: number, color: string) => {
    setFloatingTexts((prev) => [
      ...prev,
      {
        id: `ft_${Date.now()}_${Math.random()}`,
        text,
        x,
        y,
        color,
        life: 45,
        maxLife: 45,
        vy: -0.9,
      },
    ]);
  };

  // Check Level Clear Conditions
  useEffect(() => {
    if (gameState === 'PLAYING') {
      const isPointsMet = player.score >= currentLevelConfig.pointsRequired;
      const isResourcesMet = player.resourcesGatheredCount >= currentLevelConfig.resourcesToGather;
      const isSheltersMet = player.structuresBuiltCount >= currentLevelConfig.structuresToBuild;
      const isBeastsMet = player.beastsDefeatedCount >= currentLevelConfig.beastsToDefeat;

      if (isPointsMet && isResourcesMet && isSheltersMet && isBeastsMet) {
        setGameState('LEVEL_CLEAR');
      }
    }
  }, [
    gameState,
    player.score,
    player.resourcesGatheredCount,
    player.structuresBuiltCount,
    player.beastsDefeatedCount,
    currentLevelConfig,
  ]);

  // Proceed to next level
  const handleProceedToNextLevel = () => {
    const nextIdx = Math.min(LEVELS.length - 1, currentLevelIndex + 1);
    setCurrentLevelIndex(nextIdx);
    setGameState('PLAYING');

    // Refill player health on completing level
    setPlayer((p) => ({
      ...p,
      level: nextIdx + 1,
      hp: p.maxHp,
      stamina: p.maxStamina,
    }));

    initializeWorld(nextIdx);
  };

  // Restart game after falling
  const handleRestart = () => {
    setCurrentLevelIndex(0);
    setPlayer({
      score: 0,
      level: 1,
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      hunger: 100,
      maxHunger: 100,
      x: CENTER_X - 520,
      y: CENTER_Y + 440,
      vx: 0,
      vy: 0,
      speed: 3.4,
      angle: 0,
      equippedWeaponId: 'fists',
      isAttacking: false,
      attackProgress: 0,
      resourcesGatheredCount: 0,
      structuresBuiltCount: 0,
      beastsDefeatedCount: 0,
      daysSurvived: 1,
    });
    setInventory({
      wood: 3,
      stone: 2,
      fiber: 2,
      berries: 3,
    });
    setStructures([]);
    setGameState('PLAYING');
    initializeWorld(0);
  };

  // PRIMARY GAME ENGINE LOOP (requestAnimationFrame)
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(100, currentTime - lastTime);
      lastTime = currentTime;

      if (gameState === 'PLAYING' && !isPaused) {
        // 1. Player Movement & Keyboard / Mobile Joystick input
        let moveX = 0;
        let moveY = 0;
        const keys = keysDownRef.current;

        if (keys['w'] || keys['arrowup']) moveY -= 1;
        if (keys['s'] || keys['arrowdown']) moveY += 1;
        if (keys['a'] || keys['arrowleft']) moveX -= 1;
        if (keys['d'] || keys['arrowright']) moveX += 1;

        // Combine with mobile virtual joystick
        if (mobileVectorRef.current.vx !== 0 || mobileVectorRef.current.vy !== 0) {
          moveX += mobileVectorRef.current.vx;
          moveY += mobileVectorRef.current.vy;
        }

        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        if (len > 0.05) {
          const normX = (moveX / (len > 1 ? len : 1)) * player.speed;
          const normY = (moveY / (len > 1 ? len : 1)) * player.speed;

          const nextX = player.x + normX;
          const nextY = player.y + normY;

          // Boundary collision check with island coastline
          if (isInsideIsland(nextX, nextY, 30)) {
            player.x = nextX;
            player.y = nextY;
            player.vx = normX;
            player.vy = normY;
          }

          // Step sounds
          if (currentTime - lastStepSoundTimeRef.current > 320) {
            soundManager.playStep();
            lastStepSoundTimeRef.current = currentTime;
          }
        } else {
          player.vx = 0;
          player.vy = 0;
        }

        // Attack animation progress
        if (player.isAttacking) {
          player.attackProgress += 0.08;
          if (player.attackProgress >= 1) {
            player.isAttacking = false;
            player.attackProgress = 0;
          }
        }

        // Auto pickup items within 40px radius
        handleInteract();

        // 2. Safe Sanctuary & Shelter Healing Buff
        let inSanctuary = false;
        let currentSanctuary: PlacedStructure | null = null;
        structures.forEach((st) => {
          const def = SHELTERS[st.structureId];
          if (!def) return;
          const dx = st.x - player.x;
          const dy = st.y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= def.radius) {
            inSanctuary = true;
            currentSanctuary = st;
            // Passive shelter health regeneration
            if (def.healRate > 0) {
              player.hp = Math.min(player.maxHp, player.hp + (def.healRate * dt) / 1000);
            }
          }
        });
        setIsInSafeZone(inSanctuary);
        setActiveSanctuary(currentSanctuary);

        // 3. Day / Night Cycle
        const cycleSeconds = currentLevelConfig.timeCycleSpeed;
        const progress = (currentTime % (cycleSeconds * 1000)) / (cycleSeconds * 1000);
        setTimeProgress(progress);

        if (progress < 0.45) {
          setTimeOfDay('DAY');
        } else if (progress < 0.58) {
          setTimeOfDay('DUSK');
        } else if (progress < 0.88) {
          setTimeOfDay('NIGHT');
        } else {
          setTimeOfDay(currentLevelIndex >= 3 ? 'BLOOD_MOON' : 'NIGHT');
        }

        // 4. Animal Spawning Engine
        if (
          animals.length < currentLevelConfig.maxConcurrentAnimals &&
          currentTime - lastAnimalSpawnTimeRef.current > currentLevelConfig.animalSpawnInterval
        ) {
          lastAnimalSpawnTimeRef.current = currentTime;
          const pool = currentLevelConfig.animalPool;
          const randomType = pool[Math.floor(Math.random() * pool.length)];
          const species = ANIMAL_SPECIES[randomType];

          if (species) {
            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnDist = 420 + Math.random() * 200;
            const sx = player.x + Math.cos(spawnAngle) * spawnDist;
            const sy = player.y + Math.sin(spawnAngle) * spawnDist;

            if (isInsideIsland(sx, sy, 50)) {
              animals.push({
                ...species,
                id: `animal_${currentTime}`,
                x: sx,
                y: sy,
                vx: 0,
                vy: 0,
                behavior: 'WANDER',
                wanderTarget: null,
                stateTimer: 0,
                lastAttackTime: 0,
              });
              soundManager.playMonsterRoar();
            }
          }
        }

        // 5. Update Strange Beasts AI
        for (let i = animals.length - 1; i >= 0; i--) {
          const a = animals[i];

          // Check if beast is dead
          if (a.hp <= 0) {
            soundManager.playMonsterHit();
            addSparks(a.x, a.y, a.glowColor || '#ef4444', 16);
            addFloatingText(`+${a.pointsOnKill} Points!`, a.x, a.y - 14, '#facc15');

            // Drop items
            a.drops.forEach((d) => {
              if (Math.random() <= d.chance) {
                droppedItems.push({
                  id: `drop_${currentTime}_${Math.random()}`,
                  itemId: d.itemId,
                  count: d.count,
                  x: a.x + (Math.random() - 0.5) * 20,
                  y: a.y + (Math.random() - 0.5) * 20,
                  spawnTime: currentTime,
                });
              }
            });

            player.score += a.pointsOnKill;
            player.beastsDefeatedCount += 1;
            animals.splice(i, 1);
            continue;
          }

          const dxToPlayer = player.x - a.x;
          const dyToPlayer = player.y - a.y;
          const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

          // Check if beast is repelled by nearby campfires / torches
          let isRepelledByFire = false;
          structures.forEach((st) => {
            const def = SHELTERS[st.structureId];
            if (def && def.frightensBeasts) {
              const dxFire = a.x - st.x;
              const dyFire = a.y - st.y;
              if (Math.sqrt(dxFire * dxFire + dyFire * dyFire) < def.radius + 40) {
                isRepelledByFire = true;
                // Flee from fire
                a.vx = (dxFire / (Math.sqrt(dxFire * dxFire + dyFire * dyFire) || 1)) * a.speed;
                a.vy = (dyFire / (Math.sqrt(dxFire * dxFire + dyFire * dyFire) || 1)) * a.speed;
              }
            }
          });

          // Check collision with spiked barricades
          structures.forEach((st) => {
            if (st.type === 'SPIKE') {
              const dxSpike = a.x - st.x;
              const dySpike = a.y - st.y;
              const distSpike = Math.sqrt(dxSpike * dxSpike + dySpike * dySpike);
              if (distSpike < 35) {
                // Takes spike damage
                a.hp -= 20;
                st.hp -= 10;
                addSparks(a.x, a.y, '#f59e0b', 6);
                a.x += (dxSpike / (distSpike || 1)) * 10;
                a.y += (dySpike / (distSpike || 1)) * 10;
              }
            }
          });

          if (!isRepelledByFire) {
            // Aggro detection
            if (distToPlayer < a.aggroRadius) {
              a.behavior = 'CHASE';
              const speedMult = timeOfDay === 'BLOOD_MOON' ? 1.25 : 1.0;
              a.vx = (dxToPlayer / distToPlayer) * (a.speed * speedMult);
              a.vy = (dyToPlayer / distToPlayer) * (a.speed * speedMult);

              // Attack player if within striking range
              if (distToPlayer <= a.size + 16 && currentTime - a.lastAttackTime > a.attackCooldown) {
                a.lastAttackTime = currentTime;
                soundManager.playPlayerHit();

                // Calculate damage with shelter defense reduction
                let incomingDmg = a.damage;
                if (inSanctuary && currentSanctuary) {
                  const sanctuaryObj = currentSanctuary as PlacedStructure;
                  const sDef = SHELTERS[sanctuaryObj.structureId];
                  if (sDef) {
                    incomingDmg = Math.round(incomingDmg * (1 - sDef.defenseBoost / 100));
                  }
                }

                player.hp = Math.max(0, player.hp - incomingDmg);
                addFloatingText(`-${incomingDmg}`, player.x, player.y - 18, '#ef4444');
                addSparks(player.x, player.y, '#dc2626', 8);

                // Player death check
                if (player.hp <= 0) {
                  setGameState('GAME_OVER');
                }
              }
            } else {
              // Idle wandering
              a.stateTimer -= dt;
              if (a.stateTimer <= 0) {
                a.stateTimer = 2000 + Math.random() * 3000;
                const wanderAngle = Math.random() * Math.PI * 2;
                a.vx = Math.cos(wanderAngle) * (a.speed * 0.4);
                a.vy = Math.sin(wanderAngle) * (a.speed * 0.4);
              }
            }
          }

          // Move animal
          a.x += a.vx;
          a.y += a.vy;

          // Keep animals inside island
          if (!isInsideIsland(a.x, a.y, 40)) {
            a.vx = -a.vx;
            a.vy = -a.vy;
          }
        }

        // 6. Projectiles update (Player Arrows)
        for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
          const proj = projectiles[pIdx];
          proj.x += proj.vx;
          proj.y += proj.vy;
          proj.distanceTraveled += Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);

          // Check hit against animals
          let hitAnimal = false;
          animals.forEach((an) => {
            const dx = an.x - proj.x;
            const dy = an.y - proj.y;
            if (Math.sqrt(dx * dx + dy * dy) < an.size + 10) {
              hitAnimal = true;
              an.hp -= proj.damage;
              an.behavior = 'CHASE';
              addSparks(an.x, an.y, an.glowColor || '#ef4444', 8);
              addFloatingText(`-${proj.damage}`, an.x, an.y - 12, '#f87171');
              soundManager.playMonsterHit();
            }
          });

          if (hitAnimal || proj.distanceTraveled >= proj.range) {
            projectiles.splice(pIdx, 1);
          }
        }

        // 7. Particles update
        for (let ptIdx = particles.length - 1; ptIdx >= 0; ptIdx--) {
          const p = particles[ptIdx];
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          if (p.life <= 0) {
            particles.splice(ptIdx, 1);
          }
        }

        // 8. Floating texts update
        for (let ftIdx = floatingTexts.length - 1; ftIdx >= 0; ftIdx--) {
          const ft = floatingTexts[ftIdx];
          ft.y += ft.vy;
          ft.life--;
          if (ft.life <= 0) {
            floatingTexts.splice(ftIdx, 1);
          }
        }

        // 9. Resource node respawning
        resourceNodes.forEach((node) => {
          if (node.health <= 0) {
            node.respawnTimer -= dt;
            if (node.respawnTimer <= 0) {
              node.health = node.maxHealth;
            }
          }
        });
      }

      // Render Frame
      if (rendererRef.current && canvasRef.current) {
        rendererRef.current.render(
          player,
          animals,
          resourceNodes,
          droppedItems,
          structures,
          projectiles,
          particles,
          floatingTexts,
          timeOfDay,
          timeProgress,
          currentLevelConfig.ambientTheme,
          isPlacementMode,
          placementStructureId,
          mouseWorldPosRef.current
        );
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        rendererRef.current = new GameRenderer(ctx, window.innerWidth, window.innerHeight);
      }
    }

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    gameState,
    isPaused,
    player,
    animals,
    resourceNodes,
    droppedItems,
    structures,
    projectiles,
    particles,
    floatingTexts,
    timeOfDay,
    timeProgress,
    currentLevelConfig,
    isPlacementMode,
    placementStructureId,
    handleInteract,
  ]);

  const t = UI_TEXT[language];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none">
      {/* Primary HTML5 Canvas Game Stage */}
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handleCanvasPointerDown}
        className="block w-full h-full cursor-crosshair touch-none"
      />

      {/* START SCREEN PROLOGUE */}
      {gameState === 'START' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-stone-900/95 border-2 border-amber-600/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-stone-100 flex flex-col items-center text-center space-y-6">
            {/* Top Language Toggle */}
            <div className="w-full flex justify-between items-center pb-3 border-b border-stone-800">
              <span className="flex items-center gap-2 text-xs font-mono text-amber-400">
                <Compass className="w-4 h-4" />
                ISLAND SURVIVAL RPG
              </span>
              <button
                id="btn-intro-lang"
                onClick={() => setLanguage((l) => (l === 'hi' ? 'en' : 'hi'))}
                className="flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg border border-stone-700 cursor-pointer"
              >
                <Languages className="w-4 h-4 text-cyan-400" />
                <span>{language === 'hi' ? 'English में खेलें' : 'हिन्दी में खेलें'}</span>
              </button>
            </div>

            {/* Title & Lore */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-amber-400 font-mono">
                {t.appTitle}
              </h1>
              <p className="text-sm sm:text-base text-amber-200/90 max-w-lg mx-auto font-medium">
                {t.subtitle}
              </p>
            </div>

            {/* Mission Story Box */}
            <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 sm:p-5 text-left text-xs sm:text-sm leading-relaxed text-stone-300 space-y-2.5">
              <p>
                {language === 'hi' ? (
                  <>
                    जहाज के टुकड़े होने के बाद आप <strong>अकेले एक अज्ञात और रहस्यमयी द्वीप</strong> पर फंस चुके हैं। यहाँ चारों ओर अजीब, आक्रामक और भयानक जानवर छिपे हुए हैं।
                  </>
                ) : (
                  <>
                    Following a catastrophic shipwreck, you have washed ashore <strong>alone on an uncharted jungle island</strong>. Mutant beasts and apex predators stalk the wilderness.
                  </>
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2 text-amber-300 bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                  <span>🪵</span>
                  <span>{language === 'hi' ? 'जंगल में सामान ढूंढें और अंक (Points) बढ़ाएं' : 'Scavenge jungle materials & earn score'}</span>
                </div>
                <div className="flex items-center gap-2 text-rose-300 bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                  <span>🗡️</span>
                  <span>{language === 'hi' ? 'लाठी, भाला, धनुष और तलवार बनाएं' : 'Forge spears, bows & deadly blades'}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300 bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                  <span>🛖</span>
                  <span>{language === 'hi' ? 'अलाव, झोपड़ी और रक्षात्मक बाड़ बनाएं' : 'Build campfires, huts & fortress bases'}</span>
                </div>
                <div className="flex items-center gap-2 text-purple-300 bg-stone-900/80 p-2 rounded-lg border border-stone-800">
                  <span>⚡</span>
                  <span>{language === 'hi' ? 'लेवल पूरा होते ही अगला स्तर और भयानक होगा' : 'Each cleared level escalates danger!'}</span>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              id="btn-start-survival"
              onClick={handleStartGame}
              className="w-full py-4 px-8 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black tracking-wide text-base sm:text-lg rounded-xl shadow-2xl flex items-center justify-center gap-3 transition-transform active:scale-98 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-stone-950" />
              <span>{t.start}</span>
            </button>

            <span className="text-[11px] text-stone-400">
              {t.controlsHelp}
            </span>
          </div>
        </div>
      )}

      {/* GAME IN-PLAY HEADS UP DISPLAY */}
      {gameState === 'PLAYING' && (
        <>
          <GameHUD
            player={player}
            inventory={inventory}
            levelConfig={currentLevelConfig}
            timeOfDay={timeOfDay}
            timeProgress={timeProgress}
            isInSafeZone={isInSafeZone}
            activeSanctuary={activeSanctuary}
            language={language}
            onToggleLanguage={() => setLanguage((l) => (l === 'hi' ? 'en' : 'hi'))}
            onOpenCrafting={(tab) => {
              if (tab) setCraftingInitialTab(tab);
              setIsCraftingOpen(true);
            }}
            onConsumeItem={handleConsumeItem}
            onTogglePause={() => setIsPaused((p) => !p)}
            isPaused={isPaused}
            isPlacementMode={isPlacementMode}
            onCancelPlacement={() => {
              setIsPlacementMode(false);
              setPlacementStructureId(null);
            }}
            animalsCount={animals.length}
          />

          {/* Touch controls for smartphones & tablets */}
          <MobileControls
            onMoveVector={(vx, vy) => {
              mobileVectorRef.current = { vx, vy };
            }}
            onAttack={handleAttack}
            onInteract={handleInteract}
            onOpenCrafting={() => setIsCraftingOpen(true)}
            language={language}
          />
        </>
      )}

      {/* CRAFTING & BASE BUILDING MODAL */}
      <CraftingModal
        isOpen={isCraftingOpen}
        onClose={() => setIsCraftingOpen(false)}
        inventory={inventory}
        equippedWeaponId={player.equippedWeaponId}
        onCraftWeapon={handleCraftWeapon}
        onSelectStructureToPlace={handleSelectStructureToPlace}
        onCraftFood={handleCraftFood}
        language={language}
        initialTab={craftingInitialTab}
      />

      {/* LEVEL COMPLETE MODAL (Warning about escalating danger) */}
      <LevelCompleteModal
        isOpen={gameState === 'LEVEL_CLEAR'}
        currentLevel={currentLevelConfig}
        nextLevel={nextLevelConfig}
        score={player.score}
        resourcesGathered={player.resourcesGatheredCount}
        beastsDefeated={player.beastsDefeatedCount}
        structuresBuilt={player.structuresBuiltCount}
        onProceedToNextLevel={handleProceedToNextLevel}
        language={language}
      />

      {/* GAME OVER MODAL */}
      <GameOverModal
        isOpen={gameState === 'GAME_OVER'}
        score={player.score}
        level={currentLevelConfig.level}
        beastsDefeated={player.beastsDefeatedCount}
        resourcesGathered={player.resourcesGatheredCount}
        onRestart={handleRestart}
        language={language}
      />
    </div>
  );
}
