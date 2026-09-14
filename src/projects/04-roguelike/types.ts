/**
 * =======================================================================
 * PROYEK 4: TYPESCRIPT ADVANCED TYPES UNTUK ROGUELIKE DUNGEON CRAWLER
 * =======================================================================
 * Konsep:
 * 1. Finite State Machine (FSM) States
 * 2. 2D Matrix Grid Tile Types
 * 3. Inventory & Item Discriminated Unions
 * 4. Type Predicates untuk Safe Serialization
 */

// 1. FINITE STATE MACHINE (FSM) STATES
export type DungeonGameState =
  | 'EXPLORING'  // Sedang menjelajah lorong dungeon
  | 'INVENTORY'  // Layar tas terbuka
  | 'GAME_OVER'  // HP pemain habis
  | 'FLOOR_CLEAR'// Berhasil turun ke lantai berikutnya
  | 'VICTORY';   // Berhasil menyelesaikan lantai terdalam!

// 2. TILEMAP TYPES
export type TileType =
  | 'WALL'
  | 'FLOOR'
  | 'DOOR_CLOSED'
  | 'DOOR_OPEN'
  | 'STAIRS_DOWN';

export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

// 3. ITEM SYSTEM DENGAN DISCRIMINATED UNIONS
export type ItemRarity = 'COMMON' | 'RARE' | 'LEGENDARY';

export interface BaseItem {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  icon: string;
}

export interface WeaponItem extends BaseItem {
  kind: 'WEAPON';
  attackBonus: number;
  critRateBonus: number;
}

export interface PotionItem extends BaseItem {
  kind: 'POTION';
  healAmount: number;
}

export interface ScrollItem extends BaseItem {
  kind: 'SCROLL';
  mapRevealRadius: number; // Membuka kabut dungeon dalam radius tertentu
}

export type DungeonItem = WeaponItem | PotionItem | ScrollItem;

// 4. ENTITY STATS
export interface EntityStats {
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  critRate: number;
}

// 5. DATA SIMPANAN GAME (Untuk Save / Load System)
export interface SavedGameState {
  version: 1;
  floor: number;
  score: number;
  playerStats: EntityStats;
  playerPos: GridPoint;
  inventoryItemIds: string[];
  equippedWeaponId: string | null;
}
