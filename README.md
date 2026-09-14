# 🎮 Belajar TypeScript: Game Dev (PBL)

Repositori pembelajaran **TypeScript** berbasis **Project-Based Learning (PBL)** dalam konteks pengembangan game.

---

## 🗺️ Roadmap PBL

- [x] **Level 1: Hero Duel Arena** (Fundamental TS: Types, Interfaces, Enums, Discriminated Unions, OOP)
- [x] **Level 2: Retro 2D Grid / Snake** (Canvas 2D API, Game Loop 60 FPS, Keyboard Events, Tuples)
- [x] **Level 3: Space Defender** (Generics `<T>`, Abstract Classes, Object Pooling, Delta Time)
- [x] **Level 4: Mini Roguelike** (Finite State Machine, Exhaustive Checking `never`, Tile Mapping, Type Predicates)

---

## 🚀 Cara Menjalankan

```bash
# 1. Install dependensi
npm install

# 2. Jalankan development server
npm run dev

# 3. Pengecekan Type-Checking
npm run type-check
```

Buka `http://localhost:5173` di browsermu.

---

## 📂 Struktur Proyek

```text
├── index.html                     # Dashboard launcher game
├── package.json                   # Dependensi Vite & TypeScript
├── tsconfig.json                  # Konfigurasi TypeScript Strict
└── src/
    ├── style.css                  # UI Gaming Modern
    ├── main.ts                    # Entry point aplikasi
    └── projects/
        └── 01-hero-duel/          # [Level 1] Hero Duel
            ├── README.md          # Materi & Tantangan Belajar
            ├── types.ts           # Type Aliases, Interfaces, Enums
            ├── character.ts       # Class & Enkapsulasi Hero
            ├── battle.ts          # Combat Engine & Discriminated Unions
            └── ui.ts              # Antarmuka Interaktif
```
