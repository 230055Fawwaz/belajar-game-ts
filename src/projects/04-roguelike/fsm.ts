import { DungeonGameState } from './types';

/**
 * =======================================================================
 * MATERI EXHAUSTIVE CHECKING & TIPE `never`
 * =======================================================================
 * Fungsi pembantu compiler: jika suatu hari kita menambah state baru
 * pada `DungeonGameState` (misal: 'SHOP') tetapi kita lupa menuliskannya
 * di blok switch-case, TypeScript akan menampilkan pesan error compile time:
 * "Argument of type 'SHOP' is not assignable to parameter of type 'never'."
 */
export function assertNever(x: never): never {
  throw new Error(`State tidak dikenali: ${JSON.stringify(x)}`);
}

export type StateListener = (newState: DungeonGameState, oldState: DungeonGameState) => void;

export class DungeonStateMachine {
  private currentState: DungeonGameState;
  private listeners: StateListener[] = [];

  constructor(initialState: DungeonGameState = 'EXPLORING') {
    this.currentState = initialState;
  }

  public getState(): DungeonGameState {
    return this.currentState;
  }

  public subscribe(listener: StateListener): void {
    this.listeners.push(listener);
  }

  /**
   * Mengubah status permainan dengan validasi transisi
   */
  public transitionTo(newState: DungeonGameState): void {
    if (this.currentState === newState) return;

    const oldState = this.currentState;
    this.currentState = newState;

    // Beritahu semua subscriber
    this.listeners.forEach((listener) => listener(newState, oldState));
  }

  /**
   * Menjelaskan deskripsi aksi yang diizinkan pada status saat ini
   * (Contoh implementasi Exhaustive Checking dengan `never`)
   */
  public getStatusDescription(): string {
    switch (this.currentState) {
      case 'EXPLORING':
        return 'Jelajahi dungeon, hindari monster atau serang mereka.';
      case 'INVENTORY':
        return 'Tas terbuka. Pilih item untuk digunakan atau dipasang.';
      case 'GAME_OVER':
        return 'Karakter telah gugur di dalam labirin gelap.';
      case 'FLOOR_CLEAR':
        return 'Menemukan tangga dan berhasil turun ke lantai berikutnya!';
      case 'VICTORY':
        return 'Selamat! Kamu telah menaklukkan seluruh lantai dungeon!';
      default:
        // Jika semua case tertangani, maka nilai di default ini bertipe `never`
        return assertNever(this.currentState);
    }
  }
}
