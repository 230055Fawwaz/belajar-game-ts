# Proyek 3: Space Defender Arcade (Level 3)

Selamat datang di Proyek 3! Di level ini, kamu melompat ke arsitektur game profesional: **Generics `<T>`**, **Abstract Classes & Polymorphism**, **Delta Time Physics ($dt$)**, dan teknik optimasi memori industri game: **Object Pooling**.

---

## 🎯 Konsep Kunci TypeScript yang Dipelajari

### 1. TypeScript Generics (`<T extends Poolable>`)
- Seringkali kita ingin membuat struktur data yang bisa dipakai untuk jenis data apa saja, tetapi tetap *type-safe*.
- Perhatikan [src/projects/03-space-defender/pool.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/03-space-defender/pool.ts):
  ```typescript
  export class ObjectPool<T extends Poolable> {
    private pool: T[] = [];
    public obtain(): T { ... }
    public release(item: T): void { ... }
  }
  ```
  Di sini, `T` bisa berupa `Laser`, `Particle`, maupun `EnemyShip`. Compiler TypeScript secara otomatis memastikan bahwa saat kamu memanggil `laserPool.obtain()`, tipe data yang dikembalikan 100% adalah `Laser` lengkap dengan method dan propertinya!

### 2. `abstract class Entity` (Inheritance & Polymorphism)
- Class abstrak tidak dapat dibuat langsung dengan `new Entity()`, melainkan harus diturunkan oleh class lain:
  ```typescript
  export abstract class Entity implements BoundingBox {
    public x: number;
    public y: number;
    
    public abstract update(dt: number): void;
    public abstract draw(ctx: CanvasRenderingContext2D): void;
  }
  ```
- Ini menjamin semua entitas dalam game memiliki interface yang seragam saat dipanggil oleh game loop.

### 3. Delta Time ($dt$) Matematika Fisika Game
- Delta time adalah selisih waktu antara frame sebelumnya dan frame sekarang dalam satuan detik:
  $$dt = \frac{\text{currentTimestamp} - \text{lastTimestamp}}{1000}$$
- Formula gerak berbasis $dt$:
  $$\text{position} = \text{position} + (\text{velocity} \times dt)$$
- Hasilnya: kecepatan pesawat bergerak sama persis baik dimainkan di monitor 60Hz, 120Hz, maupun 144Hz.

### 4. Utility Types (`Partial`, `Omit`, `Pick`)
- TypeScript menyediakan utility bawaan untuk memodifikasi tipe data yang sudah ada:
  ```typescript
  // Mengambil tipe tanpa properti 'isTripleShot'
  export type BasicWeaponConfig = Omit<WeaponConfig, 'isTripleShot'>;

  // Membuat semua properti menjadi opsional
  export type ShipUpgradeOptions = Partial<ShipConfig>;
  ```

---

## 🏋️ Tantangan Belajar Mandiri (Mini-Challenges)

1. **Tantangan 1: Tembakan Ganda (Dual Laser / Triple Shot)**
   - Buka file [entities.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/03-space-defender/entities.ts).
   - Di method tembak [game.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/03-space-defender/game.ts#L152-L170), coba spawing 2 laser sekaligus (satu dari sayap kiri pesawat, satu dari sayap kanan pesawat)!

2. **Tantangan 2: Power-Up Drop dari Musuh**
   - Buat class baru `PowerUpDrop extends Entity implements Poolable`.
   - Ketika musuh bertipe `BOMBER` hancur, munculkan drop item yang memulihkan Energy Shield pemain!
