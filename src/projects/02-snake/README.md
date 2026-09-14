# Proyek 2: Retro 2D Snake (Level 2)

Selamat datang di Proyek 2! Di proyek ini, kamu belajar cara memprogram game grafis nyata menggunakan **HTML5 Canvas 2D API** murni tanpa framework game pihak ketiga, dipadukan dengan kekuatan **TypeScript**.

---

## 🎯 Konsep TypeScript yang Dipelajari

### 1. Penanganan Tipe Data DOM & Canvas Context
Dalam browser standar JavaScript, `canvas.getContext('2d')` bisa mengembalikan `null` jika browser tidak mendukungnya. Di TypeScript, compiler memaksa kita melakukan *type checking*:
```typescript
const context = canvas.getContext('2d');
if (!context) {
  throw new Error('Gagal menginisialisasi CanvasRenderingContext2D!');
}
// Setelah baris di atas, TypeScript tahu bahwa `context` 100% adalah CanvasRenderingContext2D yang valid!
this.ctx = context;
```

### 2. Vektor Koordinat yang Aman (`readonly`)
Dengan menandai properti sebagai `readonly`, kita mencegah *accidental state mutation* (bug di mana koordinat berubah tanpa sengaja di tempat lain):
```typescript
export interface Vector2D {
  readonly x: number;
  readonly y: number;
}
```

### 3. Record Mapping untuk Validasi Arah
Menggunakan `Record<K, V>` untuk membuat kamus pemetaan yang dijamin memiliki seluruh entri arah tanpa ada yang terlewat:
```typescript
const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};
```
Jika kamu menambah satu arah baru pada tipe `Direction` (misal `'DIAGONAL'`), TypeScript akan langsung memberi tahu error jika di `OPPOSITE_DIRECTIONS` belum ada kuncinya!

### 4. Game Loop dengan `requestAnimationFrame`
Game loop memisahkan antara:
- **Tick Logika** (dieksekusi setiap interval tertentu, misalnya per 130ms).
- **Tick Grafis/Render** (dieksekusi secepat mungkin oleh GPU browser, sekitar 60 FPS).

---

## 🏋️ Tantangan Belajar Mandiri (Mini-Challenges)

1. **Tantangan 1: Makanan Beracun (Poison Mushroom)**
   - Buka file [src/projects/02-snake/types.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/02-snake/types.ts).
   - Tambahkan varian baru pada `FoodItem`:
     ```typescript
     export interface PoisonFood extends BaseFood {
       kind: 'POISON';
       scorePenalty: number;
     }
     export type FoodItem = NormalFood | GoldenFood | IceFood | PoisonFood;
     ```
   - Amati bagaimana TypeScript di file [game.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/02-snake/game.ts) langsung mengingatkanmu untuk menangani `case 'POISON'`!

2. **Tantangan 2: Menembus Dinding (Wrap-around / Portal Border)**
   - Di [game.ts](file:///d:/Projek%20Pribadi/Daftar%20Proyek/belajar-game-ts/src/projects/02-snake/game.ts), ubah logika tabrakan dinding agar jika kepala ular melewati batas kanan ($x \ge \text{cols}$), ia muncul kembali di batas kiri ($x = 0$)!
