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
} from '../types';
import { RESOURCE_ITEMS, SHELTERS, WEAPONS } from './constants';
import { CENTER_X, CENTER_Y, ISLAND_RADIUS, MAP_SIZE } from './mapGenerator';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private animTick: number = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  public setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public render(
    player: PlayerStats,
    animals: Animal[],
    resourceNodes: ResourceNode[],
    droppedItems: DroppedItemEntity[],
    structures: PlacedStructure[],
    projectiles: Projectile[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    timeOfDay: TimeOfDay,
    timeProgress: number,
    levelTheme: string,
    isPlacementMode: boolean,
    placementStructureId: string | null,
    mouseWorldPos: { x: number; y: number }
  ) {
    this.animTick++;
    const ctx = this.ctx;

    // Camera offset - centered on player
    const cameraX = Math.round(this.width / 2 - player.x);
    const cameraY = Math.round(this.height / 2 - player.y);

    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Ocean Background
    this.drawOcean(ctx, cameraX, cameraY);

    // 2. Draw Island Terrain
    this.drawIsland(ctx, cameraX, cameraY, levelTheme);

    // 3. Draw Placed Structures (Campfires, Huts, Walls, Towers)
    this.drawStructures(ctx, structures, cameraX, cameraY);

    // 4. Draw Resource Nodes (Trees, Rocks, Bushes, Crystals)
    this.drawResourceNodes(ctx, resourceNodes, cameraX, cameraY);

    // 5. Draw Dropped Loot Items
    this.drawDroppedItems(ctx, droppedItems, cameraX, cameraY);

    // 6. Draw Strange Animals
    this.drawAnimals(ctx, animals, cameraX, cameraY);

    // 7. Draw Player Character
    this.drawPlayer(ctx, player, cameraX, cameraY);

    // 8. Draw Projectiles (Arrows, Fireballs)
    this.drawProjectiles(ctx, projectiles, cameraX, cameraY);

    // 9. Draw Particles (Sparks, Dust, Blood, Leaves)
    this.drawParticles(ctx, particles, cameraX, cameraY);

    // 10. Placement Hologram Preview
    if (isPlacementMode && placementStructureId) {
      this.drawPlacementPreview(ctx, placementStructureId, mouseWorldPos, structures, cameraX, cameraY);
    }

    // 11. Day/Night and Atmospheric Lighting
    this.drawLightingAndAtmosphere(ctx, player, structures, timeOfDay, timeProgress, cameraX, cameraY);

    // 12. Floating Texts (+Points, Damage numbers)
    this.drawFloatingTexts(ctx, floatingTexts, cameraX, cameraY);

    ctx.restore();
  }

  private drawOcean(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    // Gradient ocean water
    const oceanGrad = ctx.createRadialGradient(
      CENTER_X + camX,
      CENTER_Y + camY,
      ISLAND_RADIUS * 0.8,
      CENTER_X + camX,
      CENTER_Y + camY,
      ISLAND_RADIUS * 1.6
    );
    oceanGrad.addColorStop(0, '#0284c7');
    oceanGrad.addColorStop(0.5, '#0369a1');
    oceanGrad.addColorStop(1, '#082f49');

    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Animated gentle ocean waves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    const waveOffset = (this.animTick * 0.03) % (Math.PI * 2);

    for (let r = ISLAND_RADIUS + 30; r < ISLAND_RADIUS + 240; r += 45) {
      ctx.beginPath();
      const waveR = r + Math.sin(waveOffset + r * 0.05) * 8;
      ctx.arc(CENTER_X + camX, CENTER_Y + camY, waveR, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawIsland(ctx: CanvasRenderingContext2D, camX: number, camY: number, theme: string) {
    ctx.save();
    ctx.translate(CENTER_X + camX, CENTER_Y + camY);

    // Outer shoreline foam
    ctx.beginPath();
    ctx.arc(0, 0, ISLAND_RADIUS + 12 + Math.sin(this.animTick * 0.05) * 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();

    // 1. Sandy Beach ring
    ctx.beginPath();
    ctx.arc(0, 0, ISLAND_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = theme === 'VOLCANIC_RUINS' ? '#44403c' : '#f5d0a6';
    ctx.fill();

    // 2. Coastal Grass Transition
    ctx.beginPath();
    ctx.arc(0, 0, ISLAND_RADIUS * 0.86, 0, Math.PI * 2);
    ctx.fillStyle = theme === 'VOLCANIC_RUINS' ? '#292524' : '#65a30d';
    ctx.fill();

    // 3. Dense Interior Jungle
    ctx.beginPath();
    ctx.arc(0, 0, ISLAND_RADIUS * 0.68, 0, Math.PI * 2);
    if (theme === 'MURKY_SWAMP') {
      ctx.fillStyle = '#166534';
    } else if (theme === 'CORRUPTED_JUNGLE') {
      ctx.fillStyle = '#14532d';
    } else if (theme === 'VOLCANIC_RUINS') {
      ctx.fillStyle = '#1c1917';
    } else {
      ctx.fillStyle = '#15803d';
    }
    ctx.fill();

    // 4. Mysterious Island Heart / Ancient Stone Ruins
    ctx.beginPath();
    ctx.arc(0, 0, ISLAND_RADIUS * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = theme === 'VOLCANIC_RUINS' ? '#7f1d1d' : '#334155';
    ctx.fill();

    // Ancient Stone Ruin Runes in the center
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, ISLAND_RADIUS * 0.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.lineTo(60, 0);
    ctx.moveTo(0, -60);
    ctx.lineTo(0, 60);
    ctx.stroke();

    // Shipwreck beach detail at player's arrival shore
    const wreckX = -520;
    const wreckY = 440;
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(wreckX, wreckY, 40, 18, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Broken mast & tattered cloth
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(wreckX - 10, wreckY + 10);
    ctx.lineTo(wreckX + 25, wreckY - 30);
    ctx.stroke();

    ctx.fillStyle = 'rgba(254, 243, 199, 0.7)';
    ctx.beginPath();
    ctx.moveTo(wreckX + 15, wreckY - 20);
    ctx.lineTo(wreckX + 35, wreckY - 15);
    ctx.lineTo(wreckX + 20, wreckY - 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawStructures(ctx: CanvasRenderingContext2D, structures: PlacedStructure[], camX: number, camY: number) {
    structures.forEach((struct) => {
      const sx = struct.x + camX;
      const sy = struct.y + camY;
      const def = SHELTERS[struct.structureId];
      if (!def) return;

      // Safe Haven Aura ring around active shelter
      ctx.save();
      const pulse = Math.sin(this.animTick * 0.05) * 4;
      ctx.beginPath();
      ctx.arc(sx, sy, def.radius + pulse, 0, Math.PI * 2);
      ctx.fillStyle = struct.type === 'CAMPFIRE' ? 'rgba(249, 115, 22, 0.08)' : 'rgba(34, 197, 94, 0.08)';
      ctx.fill();
      ctx.strokeStyle = struct.type === 'CAMPFIRE' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(34, 197, 94, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.restore();

      // Structure visuals
      if (struct.type === 'CAMPFIRE') {
        // Stones ring
        ctx.fillStyle = '#57534e';
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(sx + Math.cos(a) * 18, sy + Math.sin(a) * 18, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        // Logs
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(sx - 14, sy - 10);
        ctx.lineTo(sx + 14, sy + 10);
        ctx.moveTo(sx - 14, sy + 10);
        ctx.lineTo(sx + 14, sy - 10);
        ctx.stroke();

        // Flickering fire
        const flameHeight = 16 + Math.sin(this.animTick * 0.2) * 5;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(sx, sy - 4, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(sx - 7, sy);
        ctx.lineTo(sx, sy - flameHeight);
        ctx.lineTo(sx + 7, sy);
        ctx.closePath();
        ctx.fill();
      } else if (struct.type === 'HUT') {
        // Leaf Thatched Hut
        // Base shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 14, 28, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wooden posts
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx - 20, sy - 10, 40, 24);

        // Thatched woven roof
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(sx, sy - 34);
        ctx.lineTo(sx - 32, sy);
        ctx.lineTo(sx + 32, sy);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Doorway
        ctx.fillStyle = '#292524';
        ctx.fillRect(sx - 7, sy + 2, 14, 12);
      } else if (struct.type === 'SPIKE') {
        // Spiked Barricade
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx - 22, sy - 6, 44, 12);

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 4;
        for (let i = -18; i <= 18; i += 9) {
          ctx.beginPath();
          ctx.moveTo(sx + i, sy);
          ctx.lineTo(sx + i + 4, sy - 18);
          ctx.stroke();
        }
      } else if (struct.type === 'TOWER') {
        // Watchtower
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 16, 26, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Four wooden stilts
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx - 18, sy + 14);
        ctx.lineTo(sx - 12, sy - 20);
        ctx.moveTo(sx + 18, sy + 14);
        ctx.lineTo(sx + 12, sy - 20);
        ctx.stroke();

        // Platform
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx - 24, sy - 26, 48, 12);

        // Lookout roof & flag
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(sx, sy - 46);
        ctx.lineTo(sx - 26, sy - 26);
        ctx.lineTo(sx + 26, sy - 26);
        ctx.closePath();
        ctx.fill();
      } else if (struct.type === 'STONE_FORT') {
        // Citadel
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(sx, sy, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Battlements
        ctx.fillStyle = '#64748b';
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(sx + Math.cos(a) * 32, sy + Math.sin(a) * 32, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        // Center torch crystal
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Structure Health Bar if damaged
      if (struct.hp < struct.maxHp) {
        const hpPct = Math.max(0, struct.hp / struct.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(sx - 20, sy - 44, 40, 5);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(sx - 20, sy - 44, 40 * hpPct, 5);
      }
    });
  }

  private drawResourceNodes(ctx: CanvasRenderingContext2D, nodes: ResourceNode[], camX: number, camY: number) {
    nodes.forEach((node) => {
      if (node.health <= 0) return; // Depleted, awaiting respawn
      const nx = node.x + camX;
      const ny = node.y + camY;

      // Culling check for performance
      if (nx < -80 || nx > this.width + 80 || ny < -80 || ny > this.height + 80) return;

      const itemDef = RESOURCE_ITEMS[node.itemId];

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(nx, ny + node.size * 0.6, node.size * 0.9, node.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (node.itemId === 'wood') {
        // Tree: trunk + lush layered foliage
        ctx.fillStyle = '#78350f';
        ctx.fillRect(nx - 5, ny - 6, 10, node.size * 0.9);

        // Foliage layers with gentle wind sway
        const sway = Math.sin(this.animTick * 0.04 + nx * 0.01) * 3;
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(nx + sway, ny - 16, node.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(nx + sway - 3, ny - 24, node.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else if (node.itemId === 'stone') {
        // Granite boulder
        ctx.fillStyle = '#78716c';
        ctx.beginPath();
        ctx.arc(nx, ny, node.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#57534e';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Rock facet highlights
        ctx.fillStyle = '#a8a29e';
        ctx.beginPath();
        ctx.ellipse(nx - 4, ny - 4, node.size * 0.45, node.size * 0.35, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (node.itemId === 'iron') {
        // Iron Ore with shiny metallic veins
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(nx, ny, node.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(nx - 6, ny - 6, 5, 5);
        ctx.fillRect(nx + 3, ny + 2, 6, 6);
      } else if (node.itemId === 'crystal') {
        // Strange Island Crystal with pulse glow
        const glow = Math.sin(this.animTick * 0.08) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(6, 182, 212, ${glow * 0.4})`;
        ctx.beginPath();
        ctx.arc(nx, ny, node.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(nx, ny - node.size * 1.2);
        ctx.lineTo(nx + node.size * 0.8, ny + node.size * 0.5);
        ctx.lineTo(nx - node.size * 0.8, ny + node.size * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(nx, ny - node.size * 1.2);
        ctx.lineTo(nx, ny + node.size * 0.5);
        ctx.lineTo(nx - node.size * 0.6, ny + node.size * 0.5);
        ctx.closePath();
        ctx.fill();
      } else if (node.itemId === 'coconut') {
        // Palm Tree
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(nx, ny + 8);
        ctx.quadraticCurveTo(nx + 10, ny - 15, nx + 4, ny - 32);
        ctx.stroke();

        // Palm fronds
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 4;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(nx + 4, ny - 32);
          ctx.lineTo(nx + 4 + Math.cos(a) * 22, ny - 32 + Math.sin(a) * 16);
          ctx.stroke();
        }

        // Coconuts
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(nx + 2, ny - 28, 4, 0, Math.PI * 2);
        ctx.arc(nx + 7, ny - 27, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (node.itemId === 'berries') {
        // Berry Bush
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(nx, ny, node.size, 0, Math.PI * 2);
        ctx.fill();

        // Purple berries
        ctx.fillStyle = '#a855f7';
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(nx + Math.cos(a) * (node.size * 0.6), ny + Math.sin(a) * (node.size * 0.6), 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Fiber Vine Bush
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(nx, ny, node.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Small node health indicator if hit
      if (node.health < node.maxHealth) {
        const hpPct = node.health / node.maxHealth;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(nx - 14, ny - node.size - 8, 28, 4);
        ctx.fillStyle = itemDef?.color || '#22c55e';
        ctx.fillRect(nx - 14, ny - node.size - 8, 28 * hpPct, 4);
      }
    });
  }

  private drawDroppedItems(ctx: CanvasRenderingContext2D, items: DroppedItemEntity[], camX: number, camY: number) {
    items.forEach((item) => {
      const ix = item.x + camX;
      const iy = item.y + camY;
      const itemDef = RESOURCE_ITEMS[item.itemId];
      if (!itemDef) return;

      const bob = Math.sin(this.animTick * 0.08 + item.x) * 4;

      // Glow beacon
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(ix, iy + bob, 14, 0, Math.PI * 2);
      ctx.fill();

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(ix, iy + 10, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Icon badge
      ctx.fillStyle = itemDef.color;
      ctx.beginPath();
      ctx.arc(ix, iy + bob, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Emoji/Icon text
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(itemDef.icon, ix, iy + bob + 1);

      // Item count tag if > 1
      if (item.count > 1) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(ix + 8, iy + bob - 8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Outfit, sans-serif';
        ctx.fillText(`${item.count}`, ix + 8, iy + bob - 8);
      }
    });
  }

  private drawAnimals(ctx: CanvasRenderingContext2D, animals: Animal[], camX: number, camY: number) {
    animals.forEach((animal) => {
      const ax = animal.x + camX;
      const ay = animal.y + camY;

      ctx.save();
      ctx.translate(ax, ay);

      // Rotate towards velocity / target
      const angle = Math.atan2(animal.vy, animal.vx);
      ctx.rotate(angle);

      // Animal Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 0, animal.size * 1.1, animal.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Scuttling / Running Legs
      const legCycle = Math.sin(this.animTick * 0.35) * 8;
      ctx.strokeStyle = animal.color;
      ctx.lineWidth = animal.size > 25 ? 5 : 3;

      for (let i = 0; i < animal.legs / 2; i++) {
        const xPos = -animal.size * 0.5 + (i / (animal.legs / 2 - 1 || 1)) * animal.size;
        const sideOffset = i % 2 === 0 ? legCycle : -legCycle;

        // Left leg
        ctx.beginPath();
        ctx.moveTo(xPos, -animal.size * 0.5);
        ctx.lineTo(xPos + sideOffset * 0.4, -animal.size * 0.9);
        ctx.stroke();

        // Right leg
        ctx.beginPath();
        ctx.moveTo(xPos, animal.size * 0.5);
        ctx.lineTo(xPos - sideOffset * 0.4, animal.size * 0.9);
        ctx.stroke();
      }

      // Tail
      if (animal.hasTail) {
        const tailWag = Math.sin(this.animTick * 0.25) * 6;
        ctx.strokeStyle = animal.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-animal.size * 0.8, 0);
        ctx.quadraticCurveTo(-animal.size * 1.3, tailWag, -animal.size * 1.6, tailWag * 1.5);
        ctx.stroke();
      }

      // Beast Body (Strange mutant shapes)
      ctx.fillStyle = animal.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, animal.size * 0.9, animal.size * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spikes / Armored Plates along spine
      if (animal.hasHorns || animal.typeId === 'spike_boar') {
        ctx.fillStyle = '#ffffff';
        for (let s = -animal.size * 0.5; s <= animal.size * 0.4; s += 7) {
          ctx.beginPath();
          ctx.moveTo(s, -2);
          ctx.lineTo(s + 3, -animal.size * 0.6);
          ctx.lineTo(s + 6, -2);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Wings (Titan Chimera)
      if (animal.hasWings) {
        const wingFlap = Math.sin(this.animTick * 0.3) * 12;
        ctx.fillStyle = 'rgba(190, 18, 60, 0.7)';
        ctx.beginPath();
        ctx.moveTo(0, -animal.size * 0.5);
        ctx.lineTo(-animal.size * 0.5, -animal.size * 1.4 + wingFlap);
        ctx.lineTo(animal.size * 0.4, -animal.size * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, animal.size * 0.5);
        ctx.lineTo(-animal.size * 0.5, animal.size * 1.4 - wingFlap);
        ctx.lineTo(animal.size * 0.4, animal.size * 0.8);
        ctx.closePath();
        ctx.fill();
      }

      // Glowing Mutant Beast Eyes (facing right in local space)
      ctx.fillStyle = animal.glowColor || '#ef4444';
      ctx.beginPath();
      ctx.arc(animal.size * 0.5, -animal.size * 0.25, 3.5, 0, Math.PI * 2);
      ctx.arc(animal.size * 0.5, animal.size * 0.25, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Sharp fangs
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(animal.size * 0.75, -2);
      ctx.lineTo(animal.size * 1.05, 0);
      ctx.lineTo(animal.size * 0.75, 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Overhead status: Exclamation mark if chasing + HP bar
      if (animal.behavior === 'CHASE') {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px "Chakra Petch", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', ax, ay - animal.size - 14);
      }

      // Health bar
      if (animal.hp < animal.maxHp || animal.behavior === 'CHASE') {
        const hpPct = Math.max(0, animal.hp / animal.maxHp);
        const barWidth = Math.max(28, animal.size * 1.4);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(ax - barWidth / 2, ay - animal.size - 8, barWidth, 4);

        ctx.fillStyle = animal.glowColor || '#ef4444';
        ctx.fillRect(ax - barWidth / 2, ay - animal.size - 8, barWidth * hpPct, 4);
      }
    });
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerStats, camX: number, camY: number) {
    const px = player.x + camX;
    const py = player.y + camY;
    const isMoving = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1;

    ctx.save();
    ctx.translate(px, py);

    // Player Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotate player body towards aiming/movement angle
    ctx.rotate(player.angle);

    // Backpack
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-14, -8, 7, 16);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-14, -8, 7, 16);

    // Walking leg cycle
    const walkCycle = isMoving ? Math.sin(this.animTick * 0.3) * 6 : 0;
    ctx.fillStyle = '#44403c';
    ctx.fillRect(-5 + walkCycle, -9, 8, 4); // Left leg
    ctx.fillRect(-5 - walkCycle, 5, 8, 4); // Right leg

    // Survivor Torso (Ragged shirt)
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Survivor Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(3, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Dark hair / headband
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(0, 0, 7, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
    ctx.strokeStyle = '#dc2626'; // Red headband
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(2, 0, 7.5, -Math.PI * 0.3, Math.PI * 0.3);
    ctx.stroke();

    // Equipped Weapon & Attack Swing Animation
    const weapon = WEAPONS[player.equippedWeaponId] || WEAPONS.fists;
    const swingProgress = player.attackProgress; // 0 to 1

    ctx.save();
    if (player.isAttacking) {
      if (weapon.type === 'THRUST') {
        // Spear thrust
        const thrust = Math.sin(swingProgress * Math.PI) * 22;
        ctx.translate(12 + thrust, 4);
      } else {
        // Melee swing arc
        const swingAngle = -Math.PI * 0.4 + swingProgress * (Math.PI * 0.8);
        ctx.rotate(swingAngle);
        ctx.translate(14, 6);

        // Visual weapon trail slash
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, weapon.range * 0.8, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.stroke();
      }
    } else {
      ctx.translate(10, 6);
    }

    // Draw weapon visual
    if (weapon.id === 'wooden_club') {
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(0, -3, 20, 6);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(14, -5, 8, 10);
    } else if (weapon.id === 'stone_spear' || weapon.id === 'plasma_spear') {
      ctx.strokeStyle = weapon.id === 'plasma_spear' ? '#06b6d4' : '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(28, 0);
      ctx.stroke();
      ctx.fillStyle = weapon.id === 'plasma_spear' ? '#38bdf8' : '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(28, -5);
      ctx.lineTo(38, 0);
      ctx.lineTo(28, 5);
      ctx.closePath();
      ctx.fill();
    } else if (weapon.id === 'hunting_bow') {
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(8, 0, 14, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(18, -10);
      ctx.lineTo(18, 10);
      ctx.stroke();
    } else if (weapon.id === 'fire_torch') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -2, 14, 4);
      // Flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(16, 0, 6 + Math.sin(this.animTick * 0.3) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(16, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (weapon.id === 'machete' || weapon.id === 'obsidian_blade') {
      ctx.fillStyle = weapon.id === 'obsidian_blade' ? '#581c87' : '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(22, -4);
      ctx.lineTo(25, 0);
      ctx.lineTo(20, 3);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();

    // Player Overhead Health & Stamina
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(px - 20, py - 26, 40, 5);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(px - 20, py - 26, 40 * (player.hp / player.maxHp), 5);

    // Stamina sub-bar
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px - 20, py - 21, 40 * (player.stamina / player.maxStamina), 2.5);
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[], camX: number, camY: number) {
    projectiles.forEach((proj) => {
      const px = proj.x + camX;
      const py = proj.y + camY;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.atan2(proj.vy, proj.vx));

      // Arrow
      ctx.strokeStyle = proj.color || '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(10, -3);
      ctx.lineTo(15, 0);
      ctx.lineTo(10, 3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], camX: number, camY: number) {
    particles.forEach((p) => {
      const px = p.x + camX;
      const py = p.y + camY;
      const alpha = p.life / p.maxLife;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private drawPlacementPreview(
    ctx: CanvasRenderingContext2D,
    structId: string,
    mouseWorldPos: { x: number; y: number },
    structures: PlacedStructure[],
    camX: number,
    camY: number
  ) {
    const def = SHELTERS[structId];
    if (!def) return;

    const sx = mouseWorldPos.x + camX;
    const sy = mouseWorldPos.y + camY;

    // Radius circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, def.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    // Center icon
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, sx, sy);
    ctx.restore();
  }

  private drawLightingAndAtmosphere(
    ctx: CanvasRenderingContext2D,
    player: PlayerStats,
    structures: PlacedStructure[],
    timeOfDay: TimeOfDay,
    progress: number,
    camX: number,
    camY: number
  ) {
    let darknessAlpha = 0;
    let tintColor = 'rgba(0, 0, 0, ';

    if (timeOfDay === 'DAY') {
      darknessAlpha = 0;
    } else if (timeOfDay === 'DUSK') {
      darknessAlpha = 0.35;
      tintColor = 'rgba(124, 45, 18, '; // Amber dusk
    } else if (timeOfDay === 'NIGHT') {
      darknessAlpha = 0.78;
      tintColor = 'rgba(5, 10, 24, '; // Deep midnight
    } else if (timeOfDay === 'BLOOD_MOON') {
      darknessAlpha = 0.72;
      tintColor = 'rgba(69, 10, 10, '; // Crimson blood moon
    }

    if (darknessAlpha <= 0) return;

    // Create darkness canvas mask
    ctx.save();
    const darkGradient = ctx.createRadialGradient(
      player.x + camX,
      player.y + camY,
      30,
      player.x + camX,
      player.y + camY,
      timeOfDay === 'NIGHT' ? 140 : 200
    );

    // Cut hole around player torch / vision
    const equippedWeapon = WEAPONS[player.equippedWeaponId];
    const hasTorch = equippedWeapon?.specialEffect === 'FIRE';
    const playerVisionRadius = hasTorch ? 240 : 130;

    darkGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    darkGradient.addColorStop(playerVisionRadius / 350, 'rgba(0, 0, 0, 0.1)');
    darkGradient.addColorStop(1, `${tintColor}${darknessAlpha})`);

    ctx.fillStyle = darkGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Cut light holes around Campfires
    structures.forEach((st) => {
      if (st.type === 'CAMPFIRE' || st.type === 'TOWER' || st.type === 'STONE_FORT') {
        const cx = st.x + camX;
        const cy = st.y + camY;
        const radius = st.type === 'CAMPFIRE' ? 140 : 180;

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        const fireGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
        fireGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        fireGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore();
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[], camX: number, camY: number) {
    texts.forEach((ft) => {
      const tx = ft.x + camX;
      const ty = ft.y + camY;
      const alpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px "Chakra Petch", Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, tx, ty);
      ctx.fillText(ft.text, tx, ty);
      ctx.restore();
    });
  }
}
