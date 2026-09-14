/**
 * =======================================================================
 * MATERI 1: TYPES & INTERFACES DALAM GAME STATS
 * =======================================================================
 * Dalam TypeScript, kita menggunakan:
 * 1. `enum` untuk nilai konstan yang saling berhubungan (seperti Elemen).
 * 2. `type` untuk union, tuple, atau alias tipe data kombinasi.
 * 3. `interface` untuk mendefinisikan bentuk/blueprint objek (karakter, skill, item).
 */

// 1. ENUM: Kumpulan nilai tetap yang mudah dibaca dan type-safe
export enum ElementType {
  FIRE = 'FIRE',
  WATER = 'WATER',
  GRASS = 'GRASS',
  NEUTRAL = 'NEUTRAL',
}

// 2. LITERAL TYPE & UNION TYPE:
// Membatasi nilai string hanya boleh berupa opsi yang kita tentukan.
export type HeroRole = 'WARRIOR' | 'MAGE' | 'ARCHER' | 'PALADIN';

// 3. INTERFACE STATS:
// Mendefinisikan atribut angka sebuah entitas
export interface CharacterStats {
  maxHp: number;
  currentHp: number;
  maxMp: number;
  currentMp: number;
  attack: number;
  defense: number;
  critRate: number; // 0.0 sampai 1.0 (misal 0.25 = 25%)
  speed: number;
}

// 4. INTERFACE SKILL:
export interface Skill {
  readonly id: string; // 'readonly': tidak boleh diubah setelah dibuat
  name: string;
  mpCost: number;
  powerMultiplier: number;
  element: ElementType;
  description: string;
}

// 5. DISCRIMINATED UNIONS: Pola Paling Kuat di TypeScript untuk Game Action
// Setiap tipe aksi memiliki properti pembeda yang sama ('kind')
// Ini memungkinkan compiler TypeScript tahu persis struktur data aksi yang sedang aktif!
export type AttackAction = {
  kind: 'ATTACK';
};

export type SkillAction = {
  kind: 'SKILL';
  skill: Skill;
};

export type DefendAction = {
  kind: 'DEFEND';
};

export type HealAction = {
  kind: 'HEAL';
  healAmount: number;
};

// Gabungan aksi pertarungan yang mungkin dilakukan hero:
export type BattleAction = AttackAction | SkillAction | DefendAction | HealAction;

// 6. HASIL KALKULASI COMBAT (Combat Result)
export interface BattleTurnResult {
  actorName: string;
  targetName: string;
  actionTaken: BattleAction;
  damageDealt: number;
  isCritical: boolean;
  elementMultiplier: number; // 1.5x (super effective), 0.75x (resisted), atau 1.0x (normal)
  healedAmount?: number;     // Tanda '?' artinya opsional (optional property)
  logMessage: string;
}
