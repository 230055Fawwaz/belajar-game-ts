/**
 * =======================================================================
 * PROYEK 2: TYPESCRIPT TYPES UNTUK GAME CANVAS 2D
 * =======================================================================
 * Di sini kita mendefinisikan tipe data untuk sistem koordinat grid,
 * arah pergerakan yang type-safe, dan power-up menggunakan Discriminated Unions.
 */

// 1. KOORDINAT GRID (Immutable Vector)
export interface Vector2D {
  readonly x: number;
  readonly y: number;
}

// 2. DIRECTION (Literal Union Type)
// Membatasi arah hanya 4 kemungkinan
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// 3. STATUS PERMAINAN (Finite Game State)
export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

// 4. JENIS MAKANAN / POWER-UP DENGAN DISCRIMINATED UNIONS
export type FoodKind = 'NORMAL' | 'GOLDEN' | 'ICE';

export interface BaseFood {
  position: Vector2D;
  color: string;
}

export interface NormalFood extends BaseFood {
  kind: 'NORMAL';
  scoreValue: 10;
}

export interface GoldenFood extends BaseFood {
  kind: 'GOLDEN';
  scoreValue: 30;
  bonusSpeedMs: number; // Percepat game sementara
}

export interface IceFood extends BaseFood {
  kind: 'ICE';
  scoreValue: 15;
  slowDownMs: number;  // Perlambat laju gerak ular
}

// Union dari semua tipe makanan
export type FoodItem = NormalFood | GoldenFood | IceFood;

// 5. KONFIGURASI GRID CANVAS
export interface GridConfig {
  readonly cols: number;
  readonly rows: number;
  readonly cellSize: number; // Ukuran 1 kotak dalam pixel
}
