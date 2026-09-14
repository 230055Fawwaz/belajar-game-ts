/**
 * =======================================================================
 * PROYEK 3: TYPES, INTERFACES & UTILITY TYPES UNTUK ARCADE ACTION GAME
 * =======================================================================
 * Konsep:
 * 1. Interface BoundingBox untuk deteksi tabrakan (AABB)
 * 2. Generic Constraint Interface `Poolable`
 * 3. Utility Types: `Partial`, `Pick`, `Omit`
 */

// 1. BOUNDING BOX (Untuk Axis-Aligned Bounding Box Collision)
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 2. KONTRAK GENERIC UNTUK OBJECT POOLING
// Setiap objek yang ingin disimpan di dalam ObjectPool<T> wajib mengimplementasikan interface ini
export interface Poolable {
  active: boolean;
  reset(): void;
}

// 3. ENUM / LITERAL JENIS MUSUH
export type EnemyRank = 'SCOUT' | 'FIGHTER' | 'BOMBER';

export interface EnemyConfig {
  rank: EnemyRank;
  maxHp: number;
  speed: number;
  scoreValue: number;
  color: string;
  width: number;
  height: number;
  shootIntervalSec: number;
}

// 4. WEAPON CONFIG & CONTOH PENGGUNAAN UTILITY TYPES
export interface WeaponConfig {
  damage: number;
  fireRateSec: number; // Interval jeda antar tembakan (detik)
  projectileSpeed: number;
  color: string;
  isTripleShot?: boolean;
}

// Contoh Utility Type: Omit
// Menghilangkan 'isTripleShot' untuk senjata standar
export type BasicWeaponConfig = Omit<WeaponConfig, 'isTripleShot'>;

// Contoh Utility Type: Partial
// Opsi upgrade kapal yang semua nilainya opsional (bisa diisi sebagian)
export type ShipUpgradeOptions = Partial<{
  shieldBonus: number;
  speedMultiplier: number;
  weaponUpgrade: WeaponConfig;
}>;

// 5. STATUS GAMEPLAY SPACE DEFENDER
export type SpaceGameStatus = 'READY' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';
