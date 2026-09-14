import { GridPoint, EntityStats } from './types';
import { Inventory } from './inventory';

export class PlayerEntity {
  public pos: GridPoint;
  public stats: EntityStats;
  public level: number = 1;
  public xp: number = 0;
  public xpToNextLevel: number = 100;
  public inventory: Inventory;

  constructor(spawnPos: GridPoint) {
    this.pos = { ...spawnPos };
    this.stats = {
      maxHp: 100,
      currentHp: 100,
      attack: 16,
      defense: 8,
      critRate: 0.12,
    };
    this.inventory = new Inventory();
  }

  public getTotalAttack(): number {
    return this.stats.attack + this.inventory.getWeaponAttackBonus();
  }

  public getTotalCritRate(): number {
    return Math.min(1.0, this.stats.critRate + this.inventory.getWeaponCritBonus());
  }

  public takeDamage(damage: number): number {
    const actual = Math.max(1, Math.round(damage - this.stats.defense * 0.4));
    this.stats.currentHp = Math.max(0, this.stats.currentHp - actual);
    return actual;
  }

  public heal(amount: number): number {
    const prev = this.stats.currentHp;
    this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + amount);
    return this.stats.currentHp - prev;
  }

  public isAlive(): boolean {
    return this.stats.currentHp > 0;
  }

  public addXp(amount: number): boolean {
    this.xp += amount;
    if (this.xp >= this.xpToNextLevel) {
      this.levelUp();
      return true;
    }
    return false;
  }

  private levelUp(): void {
    this.level++;
    this.xp -= this.xpToNextLevel;
    this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.5);
    this.stats.maxHp += 20;
    this.stats.currentHp = this.stats.maxHp;
    this.stats.attack += 4;
    this.stats.defense += 2;
  }
}

export type MonsterKind = 'GOBLIN' | 'SKELETON' | 'ORC';

export interface MonsterBlueprint {
  kind: MonsterKind;
  name: string;
  icon: string;
  maxHp: number;
  attack: number;
  defense: number;
  xpReward: number;
}

export const MONSTER_BLUEPRINTS: Record<MonsterKind, MonsterBlueprint> = {
  GOBLIN: {
    kind: 'GOBLIN',
    name: 'Cave Goblin',
    icon: '👺',
    maxHp: 30,
    attack: 12,
    defense: 4,
    xpReward: 35,
  },
  SKELETON: {
    kind: 'SKELETON',
    name: 'Skeleton Archer',
    icon: '💀',
    maxHp: 45,
    attack: 18,
    defense: 6,
    xpReward: 55,
  },
  ORC: {
    kind: 'ORC',
    name: 'Orc Warrior',
    icon: '👹',
    maxHp: 80,
    attack: 25,
    defense: 12,
    xpReward: 110,
  },
};

export class MonsterEntity {
  public readonly id: string;
  public pos: GridPoint;
  public blueprint: MonsterBlueprint;
  public currentHp: number;

  constructor(id: string, pos: GridPoint, blueprint: MonsterBlueprint) {
    this.id = id;
    this.pos = { ...pos };
    this.blueprint = blueprint;
    this.currentHp = blueprint.maxHp;
  }

  public takeDamage(amount: number): number {
    const actual = Math.max(1, Math.round(amount - this.blueprint.defense * 0.3));
    this.currentHp = Math.max(0, this.currentHp - actual);
    return actual;
  }

  public isAlive(): boolean {
    return this.currentHp > 0;
  }

  /**
   * Logika AI Langkah:
   * Jika jarak ke pemain <= 5 petak:
   * - Jika bersebelahan (distance == 1), serang!
   * - Jika belum bersebelahan, melangkah 1 petak mendekati pemain
   */
  public calculateTurnAction(
    playerPos: GridPoint,
    isWalkable: (x: number, y: number) => boolean,
    isOccupied: (x: number, y: number) => boolean
  ): { type: 'ATTACK' } | { type: 'MOVE'; nextPos: GridPoint } | { type: 'IDLE' } {
    const dx = playerPos.x - this.pos.x;
    const dy = playerPos.y - this.pos.y;
    const distance = Math.abs(dx) + Math.abs(dy); // Manhattan Distance

    // Jika tepat di sebelah pemain, serang!
    if (distance === 1) {
      return { type: 'ATTACK' };
    }

    // Jika pemain dalam radius deteksi (5 petak)
    if (distance <= 5) {
      const stepX = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
      const stepY = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;

      // Coba jalan di sumbu dominan
      if (Math.abs(dx) >= Math.abs(dy)) {
        const nextX = this.pos.x + stepX;
        if (isWalkable(nextX, this.pos.y) && !isOccupied(nextX, this.pos.y)) {
          return { type: 'MOVE', nextPos: { x: nextX, y: this.pos.y } };
        }
      }

      // Coba jalan di sumbu Y
      const nextY = this.pos.y + stepY;
      if (isWalkable(this.pos.x, nextY) && !isOccupied(this.pos.x, nextY)) {
        return { type: 'MOVE', nextPos: { x: this.pos.x, y: nextY } };
      }
    }

    return { type: 'IDLE' };
  }
}
