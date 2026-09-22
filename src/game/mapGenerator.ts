import { ResourceNode, DroppedItemEntity } from '../types';

export const MAP_SIZE = 2200;
export const ISLAND_RADIUS = 950;
export const CENTER_X = MAP_SIZE / 2;
export const CENTER_Y = MAP_SIZE / 2;

export interface BiomeZone {
  type: 'BEACH' | 'JUNGLE' | 'DENSE_FOREST' | 'RUINS' | 'ROCKY_PEAK';
  x: number;
  y: number;
  radius: number;
}

export function isInsideIsland(x: number, y: number, buffer = 60): boolean {
  const dx = x - CENTER_X;
  const dy = y - CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Add organic coastline distortion using simple sin waves
  const angle = Math.atan2(dy, dx);
  const wave = Math.sin(angle * 5) * 45 + Math.cos(angle * 3) * 35;
  const effectiveRadius = ISLAND_RADIUS + wave - buffer;

  return dist <= effectiveRadius;
}

export function generateResourceNodes(level: number): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  let idCounter = 1;

  // Resource quotas based on level
  const counts = {
    wood: 28 + level * 4,
    stone: 22 + level * 3,
    fiber: 20 + level * 2,
    berries: 16 + level * 2,
    coconut: 14,
    iron: 10 + level * 3,
    crystal: 6 + level * 2,
  };

  const addItemNodes = (itemId: string, count: number, minDistanceRatio: number, maxDistanceRatio: number) => {
    let created = 0;
    let attempts = 0;
    while (created < count && attempts < count * 20) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const dist = (minDistanceRatio + Math.random() * (maxDistanceRatio - minDistanceRatio)) * ISLAND_RADIUS;
      const x = CENTER_X + Math.cos(angle) * dist;
      const y = CENTER_Y + Math.sin(angle) * dist;

      if (!isInsideIsland(x, y, 70)) continue;

      let size = 18;
      let maxHealth = 3;
      let yieldPerHit = 1;

      if (itemId === 'wood') {
        size = 24;
        maxHealth = 4;
        yieldPerHit = 2;
      } else if (itemId === 'stone') {
        size = 22;
        maxHealth = 4;
        yieldPerHit = 2;
      } else if (itemId === 'iron') {
        size = 26;
        maxHealth = 6;
        yieldPerHit = 1;
      } else if (itemId === 'crystal') {
        size = 20;
        maxHealth = 5;
        yieldPerHit = 1;
      } else if (itemId === 'coconut') {
        size = 22;
        maxHealth = 3;
        yieldPerHit = 1;
      }

      nodes.push({
        id: `node_${idCounter++}`,
        itemId,
        x,
        y,
        size,
        health: maxHealth,
        maxHealth,
        yieldPerHit,
        totalYieldRemaining: maxHealth * yieldPerHit,
        respawnTimer: 0,
      });
      created++;
    }
  };

  // Coconuts close to shore (beach)
  addItemNodes('coconut', counts.coconut, 0.72, 0.95);

  // Wood & Fiber throughout middle & inner jungle
  addItemNodes('wood', counts.wood, 0.15, 0.85);
  addItemNodes('fiber', counts.fiber, 0.2, 0.8);
  addItemNodes('berries', counts.berries, 0.25, 0.75);

  // Stone and Iron further inland and rocky areas
  addItemNodes('stone', counts.stone, 0.2, 0.85);
  addItemNodes('iron', counts.iron, 0.1, 0.65);

  // Strange Crystals in deep mystic interior
  addItemNodes('crystal', counts.crystal, 0.05, 0.5);

  return nodes;
}

export function getInitialDroppedItems(): DroppedItemEntity[] {
  // A few starter items near the spawn shipwreck on the beach
  const spawnX = CENTER_X - 520;
  const spawnY = CENTER_Y + 440;

  return [
    { id: 'drop_init_1', itemId: 'wood', count: 3, x: spawnX + 35, y: spawnY - 20, spawnTime: Date.now() },
    { id: 'drop_init_2', itemId: 'wood', count: 2, x: spawnX - 25, y: spawnY + 30, spawnTime: Date.now() },
    { id: 'drop_init_3', itemId: 'stone', count: 2, x: spawnX + 40, y: spawnY + 45, spawnTime: Date.now() },
    { id: 'drop_init_4', itemId: 'berries', count: 3, x: spawnX - 45, y: spawnY - 30, spawnTime: Date.now() },
  ];
}
