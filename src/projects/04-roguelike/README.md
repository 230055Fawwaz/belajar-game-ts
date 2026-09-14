# Proyek 4: Mini Roguelike Dungeon Crawler (Level 4)

Selamat datang di Proyek 4, puncak kurikulum **Project-Based Learning** kita! Di sini, kita menerapkan pola arsitektur TypeScript paling kokoh: **Finite State Machine (FSM)** dengan **Exhaustive Checking (`never`)**, **Type Predicates (`is`)**, serta **2D Tilemap Matrix**.

---

## 🎯 Konsep Kunci TypeScript yang Dipelajari

### 1. Exhaustive Checking dengan Tipe `never` & `assertNever`
- Di file [src/projects/04-roguelike/fsm.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/04-roguelike/fsm.ts):
  ```typescript
  export function assertNever(x: never): never {
    throw new Error(`State tidak dikenali: ${JSON.stringify(x)}`);
  }
  ```
- **Mengapa ini pola terkuat di TypeScript?**
  Jika kamu menambahkan status baru ke tipe union:
  ```typescript
  type DungeonGameState = 'EXPLORING' | 'INVENTORY' | 'GAME_OVER' | 'SHOP';
  ```
  Tetapi kamu lupa menambahkan `case 'SHOP'` di dalam `switch-case`, maka variabel `this.currentState` yang jatuh ke blok `default` **BUKAN lagi bertipe never**, melainkan bertipe `'SHOP'`. Akibatnya, TypeScript akan menolak meng-compile kode tersebut! Ini menjamin 100% semua kemungkinan state tertangani tanpa celah bug.

### 2. Type Predicates (`data is SavedGameState`)
- Di JavaScript biasa, saat kita mengambil data JSON dari `localStorage`, kita tidak pernah tahu apakah data tersebut sudah dimanipulasi atau rusak:
  ```typescript
  export function isSavedGameState(data: unknown): data is SavedGameState {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
      d['version'] === 1 &&
      typeof d['floor'] === 'number' &&
      typeof d['score'] === 'number' &&
      Array.isArray(d['inventoryItemIds'])
    );
  }
  ```
- Begitu fungsi ini mengembalikan `true`, compiler TypeScript memperlakukan `data` sebagai tipe `SavedGameState` yang terverifikasi dan aman digunakan tanpa resiko crash runtime.

### 3. Matriks 2D Grid (`TileType[][]` dan `boolean[][]`)
- Mengatur tata letak dunia game menggunakan array dua dimensi bertipe kuat.
- Sistem *Fog of War* (kabut perang) yang mencatat petak yang sudah dikunjungi oleh pemain.

---

## 🏋️ Tantangan Belajar Mandiri (Mini-Challenges)

1. **Tantangan 1: Item Baru (Scroll of Fireball)**
   - Buka file [inventory.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/04-roguelike/inventory.ts).
   - Tambahkan item baru `scroll_fireball` ke `ITEM_DATABASE`.
   - Di method `useItem` pada [game.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/04-roguelike/game.ts), buat logika di mana scroll ini memberi 50 damage ke seluruh monster yang terlihat di layar!

2. **Tantangan 2: State Baru pada FSM (SHOP State)**
   - Tambahkan `'SHOP'` ke dalam `DungeonGameState` di [types.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/04-roguelike/types.ts).
   - Amati bagaimana file [fsm.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/04-roguelike/fsm.ts) langsung memicu error compile karena adanya fungsi `assertNever`!
