export type Language = 'hi' | 'en';

export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'LEVEL_CLEAR' | 'GAME_OVER';

export type TimeOfDay = 'DAY' | 'DUSK' | 'NIGHT' | 'BLOOD_MOON';

export type ResourceCategory = 'WOOD' | 'STONE' | 'FIBER' | 'FOOD' | 'IRON' | 'CRYSTAL' | 'BEAST_DROP';

export interface ResourceItem {
  id: string;
  name: string;
  nameHi: string;
  category: ResourceCategory;
  points: number; // Point value awarded on gather
  icon: string;
  color: string;
  description: string;
  descriptionHi: string;
}

export interface InventorySlot {
  itemId: string;
  count: number;
}

export interface Weapon {
  id: string;
  name: string;
  nameHi: string;
  damage: number;
  range: number;
  attackSpeed: number; // Cooldown in ms
  type: 'MELEE' | 'THRUST' | 'RANGED';
  projectileSpeed?: number;
  specialEffect?: 'FIRE' | 'POISON' | 'KNOCKBACK' | 'NONE';
  icon: string;
  cost: { [itemId: string]: number };
  description: string;
  descriptionHi: string;
}

export interface ShelterStructure {
  id: string;
  name: string;
  nameHi: string;
  maxHp: number;
  radius: number; // Safe zone radius
  defenseBoost: number; // % damage reduction when inside
  healRate: number; // HP healed per second
  frightensBeasts: boolean; // Repels certain animals
  icon: string;
  cost: { [itemId: string]: number };
  description: string;
  descriptionHi: string;
  category: 'CAMPFIRE' | 'HUT' | 'WALL' | 'SPIKE' | 'TOWER' | 'STONE_FORT';
}

export interface PlacedStructure {
  id: string;
  structureId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  type: ShelterStructure['category'];
  placedAt: number;
}

export interface Animal {
  id: string;
  typeId: string;
  name: string;
  nameHi: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  lastAttackTime: number;
  aggroRadius: number;
  color: string;
  glowColor?: string;
  legs: number;
  hasWings?: boolean;
  hasHorns?: boolean;
  hasTail?: boolean;
  behavior: 'WANDER' | 'CHASE' | 'ATTACK' | 'FLEE' | 'STUNNED';
  wanderTarget: { x: number; y: number } | null;
  stateTimer: number;
  drops: { itemId: string; count: number; chance: number }[];
  pointsOnKill: number;
}

export interface ResourceNode {
  id: string;
  itemId: string;
  x: number;
  y: number;
  size: number;
  health: number;
  maxHealth: number;
  yieldPerHit: number;
  totalYieldRemaining: number;
  respawnTimer: number;
}

export interface DroppedItemEntity {
  id: string;
  itemId: string;
  count: number;
  x: number;
  y: number;
  spawnTime: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  range: number;
  distanceTraveled: number;
  isPlayerProjectile: boolean;
  color: string;
  effect?: 'FIRE' | 'POISON' | 'KNOCKBACK' | 'NONE';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  fade?: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
}

export interface LevelConfig {
  level: number;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  pointsRequired: number;
  resourcesToGather: number;
  structuresToBuild: number;
  beastsToDefeat: number;
  animalSpawnInterval: number; // ms
  maxConcurrentAnimals: number;
  animalPool: string[]; // type IDs of animals that can spawn
  dangerRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' | 'NIGHTMARE';
  ambientTheme: 'TROPICAL' | 'MURKY_SWAMP' | 'CORRUPTED_JUNGLE' | 'VOLCANIC_RUINS';
  timeCycleSpeed: number; // Seconds for full day-night
}

export interface PlayerStats {
  score: number;
  level: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  hunger: number;
  maxHunger: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  angle: number;
  equippedWeaponId: string;
  isAttacking: boolean;
  attackProgress: number; // 0 to 1
  resourcesGatheredCount: number;
  structuresBuiltCount: number;
  beastsDefeatedCount: number;
  daysSurvived: number;
}
