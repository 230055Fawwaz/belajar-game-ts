# Proyek 1: Hero Duel Arena (Level 1)

Selamat datang di Proyek 1! Di proyek ini, kamu belajar konsep paling fundamental dan esensial dari **TypeScript** melalui simulasi sistem pertarungan RPG (Turn-Based Combat).

---

## 🎯 Konsep TypeScript yang Dipelajari

### 1. `enum` vs Literal Types
- **Enum** digunakan saat kita memiliki sekumpulan nilai konstan yang saling berhubungan:
  ```typescript
  export enum ElementType {
    FIRE = 'FIRE',
    WATER = 'WATER',
    GRASS = 'GRASS',
    NEUTRAL = 'NEUTRAL',
  }
  ```
- **Literal Type** membatasi nilai string ke beberapa opsi eksklusif:
  ```typescript
  export type HeroRole = 'WARRIOR' | 'MAGE' | 'ARCHER' | 'PALADIN';
  ```

### 2. `interface` untuk Struktur Data
- `interface` bertindak sebagai kontrak bentuk data (*shape contract*). Jika sebuah objek tidak memenuhi field wajib, TypeScript akan langsung memberi tahu error sebelum kode dijalankan di browser!
  ```typescript
  export interface CharacterStats {
    maxHp: number;
    currentHp: number;
    maxMp: number;
    currentMp: number;
    attack: number;
    defense: number;
    critRate: number;
    speed: number;
  }
  ```

### 3. Discriminated Unions (Pola Favorit Game Dev)
- Memungkinkan satu tipe data memiliki banyak varian dengan sebuah tanda pengenal (`kind`):
  ```typescript
  export type AttackAction = { kind: 'ATTACK' };
  export type SkillAction = { kind: 'SKILL'; skill: Skill };
  export type DefendAction = { kind: 'DEFEND' };
  export type HealAction = { kind: 'HEAL'; healAmount: number };

  export type BattleAction = AttackAction | SkillAction | DefendAction | HealAction;
  ```
- Ketika kamu menggunakan `switch (action.kind)`:
  - Di dalam `case 'SKILL'`, TypeScript otomatis tahu ada properti `action.skill`.
  - Di dalam `case 'HEAL'`, TypeScript otomatis tahu ada properti `action.healAmount`.

### 4. OOP & Enkapsulasi (`class`, `private`, `public`, `readonly`)
- Melindungi data seperti `HP` agar tidak bisa diubah sembarangan tanpa melewati aturan permainan (misalnya `Math.max(0, ...)`):
  ```typescript
  export class Hero {
    public readonly name: string;
    private stats: CharacterStats; // Tidak bisa diakses langsung dari luar!
    
    public takeDamage(damage: number): number {
      this.stats.currentHp = Math.max(0, this.stats.currentHp - damage);
      return damage;
    }
  }
  ```

---

## 🏋️ Tantangan Belajar Mandiri (Mini-Challenges)

Coba modifikasi kode ini untuk melatih pemahamanmu:

1. **Tantangan 1: Tambahkan Skill Baru**
   - Buka file [src/projects/01-hero-duel/ui.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/01-hero-duel/ui.ts).
   - Di array skill `this.player`, tambahkan skill kedua bernama `"Inferno Burst"` dengan `mpCost: 30`, `powerMultiplier: 2.2`.
   - Tambahkan tombol baru di UI untuk mengaktifkan skill tersebut.

2. **Tantangan 2: Tipe Elemen Baru (WATER Hero)**
   - Tambahkan elemen `WATER` pada logika efektivitas di [src/projects/01-hero-duel/battle.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/01-hero-duel/battle.ts).
   - Coba buat karakter musuh baru yang berelemen `WATER` dan perhatikan bagaimana keunggulan elemen bekerja!

3. **Tantangan 3: Status Effect (Poison/Burn)**
   - Buat tipe data status effect:
     ```typescript
     export type StatusEffect = 'BURN' | 'POISON' | 'STUN';
     ```
   - Berikan field opsional `status?: StatusEffect;` di dalam `CharacterStats`.
