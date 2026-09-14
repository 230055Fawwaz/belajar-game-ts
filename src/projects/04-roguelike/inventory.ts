import { DungeonItem, WeaponItem } from './types';

// KATALOG ITEM DUNGEON
export const ITEM_DATABASE: Record<string, DungeonItem> = {
  health_potion: {
    id: 'health_potion',
    name: 'Elixir of Healing',
    description: 'Memulihkan 45 poin Health secara instan.',
    rarity: 'COMMON',
    kind: 'POTION',
    healAmount: 45,
    icon: '🧪',
  },
  greater_potion: {
    id: 'greater_potion',
    name: 'Greater Elixir',
    description: 'Memulihkan 80 poin Health secara penuh.',
    rarity: 'RARE',
    kind: 'POTION',
    healAmount: 80,
    icon: '⚗️',
  },
  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Longsword',
    description: 'Pedang besi kokoh (+10 ATK, +5% CRIT).',
    rarity: 'COMMON',
    kind: 'WEAPON',
    attackBonus: 10,
    critRateBonus: 0.05,
    icon: '🗡️',
  },
  crystal_blade: {
    id: 'crystal_blade',
    name: 'Crystal Blade',
    description: 'Bilah kristal berkilau (+22 ATK, +15% CRIT).',
    rarity: 'RARE',
    kind: 'WEAPON',
    attackBonus: 22,
    critRateBonus: 0.15,
    icon: '💎',
  },
  scroll_vision: {
    id: 'scroll_vision',
    name: 'Scroll of Clairvoyance',
    description: 'Membuka kabut perang di area sekitar (radius 6 petak).',
    rarity: 'COMMON',
    kind: 'SCROLL',
    mapRevealRadius: 6,
    icon: '📜',
  },
};

export class Inventory {
  private maxCapacity: number = 8;
  private items: DungeonItem[] = [];
  private equippedWeapon: WeaponItem | null = null;

  constructor() {
    // Beri item awal
    const potion = ITEM_DATABASE['health_potion'];
    const scroll = ITEM_DATABASE['scroll_vision'];
    if (potion) this.addItem(potion);
    if (scroll) this.addItem(scroll);
  }

  public getItems(): ReadonlyArray<DungeonItem> {
    return this.items;
  }

  public getEquippedWeapon(): WeaponItem | null {
    return this.equippedWeapon;
  }

  public isFull(): boolean {
    return this.items.length >= this.maxCapacity;
  }

  public addItem(item: DungeonItem): boolean {
    if (this.isFull()) return false;
    this.items.push(item);
    return true;
  }

  public removeItem(itemId: string): boolean {
    const idx = this.items.findIndex((item) => item.id === itemId);
    if (idx >= 0) {
      this.items.splice(idx, 1);
      return true;
    }
    return false;
  }

  public equipWeapon(weapon: WeaponItem): void {
    this.equippedWeapon = weapon;
  }

  public unequipWeapon(): void {
    this.equippedWeapon = null;
  }

  public getWeaponAttackBonus(): number {
    return this.equippedWeapon ? this.equippedWeapon.attackBonus : 0;
  }

  public getWeaponCritBonus(): number {
    return this.equippedWeapon ? this.equippedWeapon.critRateBonus : 0;
  }

  public getItemIds(): string[] {
    return this.items.map((i) => i.id);
  }

  public restoreFromIds(itemIds: string[], equippedWeaponId: string | null): void {
    this.items = [];
    itemIds.forEach((id) => {
      const item = ITEM_DATABASE[id];
      if (item) this.items.push(item);
    });

    if (equippedWeaponId) {
      const weapon = ITEM_DATABASE[equippedWeaponId];
      if (weapon && weapon.kind === 'WEAPON') {
        this.equippedWeapon = weapon;
      }
    } else {
      this.equippedWeapon = null;
    }
  }
}
