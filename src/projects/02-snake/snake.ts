import { Vector2D, Direction } from './types';

/**
 * Pemetaan arah berlawanan untuk mencegah ular berputar 180 derajat langsung
 * (misal sedang bergerak ke KANAN, tidak boleh langsung putar ke KIRI karena menabrak diri sendiri).
 *
 * Menggunakan `Record<Direction, Direction>`: memastikan semua kunci Direction terisi secara lengkap!
 */
const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

// Vektor offset untuk setiap arah
const DIRECTION_OFFSETS: Record<Direction, Vector2D> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export class Snake {
  private body: Vector2D[];
  private currentDirection: Direction;
  private nextDirection: Direction;

  constructor(initialHead: Vector2D, initialLength: number = 3) {
    this.currentDirection = 'RIGHT';
    this.nextDirection = 'RIGHT';

    // Buat tubuh awal memanjang ke kiri dari posisi kepala
    this.body = [];
    for (let i = 0; i < initialLength; i++) {
      this.body.push({
        x: initialHead.x - i,
        y: initialHead.y,
      });
    }
  }

  public getHead(): Vector2D {
    // Karena noUncheckedIndexedAccess: true, kita beri fallback yang aman
    const head = this.body[0];
    if (!head) {
      throw new Error('Tubuh ular kosong!');
    }
    return head;
  }

  public getBody(): ReadonlyArray<Vector2D> {
    return this.body;
  }

  public getDirection(): Direction {
    return this.currentDirection;
  }

  /**
   * Mengubah arah pergerakan dengan validasi type-safe
   */
  public setDirection(newDirection: Direction): boolean {
    // Cek apakah arah baru berlawanan dengan arah yang sedang berjalan
    if (OPPOSITE_DIRECTIONS[this.currentDirection] === newDirection) {
      return false; // Abaikan arah berlawanan
    }
    this.nextDirection = newDirection;
    return true;
  }

  /**
   * Menggerakkan ular 1 langkah ke depan.
   * Jika `shouldGrow` bernilai true, ekor tidak dihapus sehingga panjang ular bertambah.
   */
  public step(shouldGrow: boolean = false): void {
    this.currentDirection = this.nextDirection;
    const offset = DIRECTION_OFFSETS[this.currentDirection];
    const head = this.getHead();

    const newHead: Vector2D = {
      x: head.x + offset.x,
      y: head.y + offset.y,
    };

    // Tambahkan kepala baru di depan
    this.body.unshift(newHead);

    // Jika tidak makan, buang segmen ekor terakhir
    if (!shouldGrow) {
      this.body.pop();
    }
  }

  /**
   * Mengecek apakah kepala ular menabrak segmen tubuhnya sendiri
   */
  public hasSelfCollision(): boolean {
    const head = this.getHead();
    // Cek mulai dari indeks 1 (abaikan kepala itu sendiri)
    for (let i = 1; i < this.body.length; i++) {
      const segment = this.body[i];
      if (segment && segment.x === head.x && segment.y === head.y) {
        return true;
      }
    }
    return false;
  }

  /**
   * Mengecek apakah suatu koordinat ditempati oleh tubuh ular
   * (Berguna saat memunculkan makanan baru agar tidak spawn di dalam ular)
   */
  public occupies(pos: Vector2D): boolean {
    return this.body.some((segment) => segment.x === pos.x && segment.y === pos.y);
  }

  public reset(initialHead: Vector2D, initialLength: number = 3): void {
    this.currentDirection = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.body = [];
    for (let i = 0; i < initialLength; i++) {
      this.body.push({
        x: initialHead.x - i,
        y: initialHead.y,
      });
    }
  }
}
