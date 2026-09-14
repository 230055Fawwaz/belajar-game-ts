import { TileType, GridPoint } from './types';

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class DungeonMap {
  public readonly cols: number;
  public readonly rows: number;

  // Matriks 2D Grid
  private tiles: TileType[][];
  private revealed: boolean[][]; // Kabut Perang (Fog of War)
  private rooms: Room[] = [];
  private stairsPos: GridPoint = { x: 0, y: 0 };
  private playerSpawnPos: GridPoint = { x: 0, y: 0 };

  constructor(cols: number = 24, rows: number = 18) {
    this.cols = cols;
    this.rows = rows;
    this.tiles = [];
    this.revealed = [];

    this.generateFloor();
  }

  public getTile(x: number, y: number): TileType {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
      return 'WALL';
    }
    const row = this.tiles[y];
    return row && row[x] !== undefined ? row[x] : 'WALL';
  }

  public isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile === 'FLOOR' || tile === 'DOOR_OPEN' || tile === 'STAIRS_DOWN';
  }

  public isRevealed(x: number, y: number): boolean {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
    const row = this.revealed[y];
    return row ? !!row[x] : false;
  }

  public getPlayerSpawn(): GridPoint {
    return this.playerSpawnPos;
  }

  public getStairsPos(): GridPoint {
    return this.stairsPos;
  }

  public revealRadius(centerX: number, centerY: number, radius: number): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const tx = centerX + dx;
          const ty = centerY + dy;
          if (tx >= 0 && tx < this.cols && ty >= 0 && ty < this.rows) {
            const row = this.revealed[ty];
            if (row) row[tx] = true;
          }
        }
      }
    }
  }

  public openDoor(x: number, y: number): boolean {
    if (this.getTile(x, y) === 'DOOR_CLOSED') {
      const row = this.tiles[y];
      if (row) row[x] = 'DOOR_OPEN';
      return true;
    }
    return false;
  }

  public generateFloor(): void {
    // 1. Inisialisasi seluruh petak sebagai dinding 'WALL'
    this.tiles = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => 'WALL')
    );

    // Inisialisasi kabut perang gelap (false)
    this.revealed = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => false)
    );

    this.rooms = [];

    // 2. Buat beberapa ruangan terisolasi
    const roomCount = 5;
    for (let i = 0; i < roomCount; i++) {
      const w = Math.floor(Math.random() * 3) + 4; // lebar 4 - 6
      const h = Math.floor(Math.random() * 3) + 3; // tinggi 3 - 5
      const x = Math.floor(Math.random() * (this.cols - w - 2)) + 1;
      const y = Math.floor(Math.random() * (this.rows - h - 2)) + 1;

      const newRoom: Room = { x, y, w, h };

      // Cek overlap
      const overlaps = this.rooms.some(
        (r) =>
          x < r.x + r.w + 1 &&
          x + w + 1 > r.x &&
          y < r.y + r.h + 1 &&
          y + h + 1 > r.y
      );

      if (!overlaps) {
        this.carveRoom(newRoom);
        this.rooms.push(newRoom);
      }
    }

    // 3. Hubungkan antar ruangan dengan lorong (Corridors)
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const roomA = this.rooms[i];
      const roomB = this.rooms[i + 1];
      if (roomA && roomB) {
        const centerAX = Math.floor(roomA.x + roomA.w / 2);
        const centerAY = Math.floor(roomA.y + roomA.h / 2);
        const centerBX = Math.floor(roomB.x + roomB.w / 2);
        const centerBY = Math.floor(roomB.y + roomB.h / 2);

        this.carveCorridor(centerAX, centerAY, centerBX, centerBY);
      }
    }

    // 4. Tetapkan Posisi Spawn Pemain di Ruangan Pertama
    const firstRoom = this.rooms[0] || { x: 2, y: 2, w: 3, h: 3 };
    this.playerSpawnPos = {
      x: Math.floor(firstRoom.x + firstRoom.w / 2),
      y: Math.floor(firstRoom.y + firstRoom.h / 2),
    };

    // 5. Tetapkan Posisi Tangga Turun di Ruangan Terakhir
    const lastRoom = this.rooms[this.rooms.length - 1] || firstRoom;
    this.stairsPos = {
      x: Math.floor(lastRoom.x + lastRoom.w / 2),
      y: Math.floor(lastRoom.y + lastRoom.h / 2),
    };

    // Pasang petak STAIRS_DOWN
    const stairsRow = this.tiles[this.stairsPos.y];
    if (stairsRow) {
      stairsRow[this.stairsPos.x] = 'STAIRS_DOWN';
    }

    // Buka kabut di sekitar pemain
    this.revealRadius(this.playerSpawnPos.x, this.playerSpawnPos.y, 4);
  }

  public getRandomFloorPosition(exclude: GridPoint[]): GridPoint {
    let pt: GridPoint;
    let attempts = 0;
    do {
      const rx = Math.floor(Math.random() * (this.cols - 2)) + 1;
      const ry = Math.floor(Math.random() * (this.rows - 2)) + 1;
      pt = { x: rx, y: ry };
      attempts++;
    } while (
      (!this.isWalkable(pt.x, pt.y) ||
        exclude.some((p) => p.x === pt.x && p.y === pt.y)) &&
      attempts < 150
    );
    return pt;
  }

  private carveRoom(room: Room): void {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        const row = this.tiles[y];
        if (row) row[x] = 'FLOOR';
      }
    }
  }

  private carveCorridor(x1: number, y1: number, x2: number, y2: number): void {
    let curX = x1;
    let curY = y1;

    // Gerak Horizontal dulu
    while (curX !== x2) {
      const row = this.tiles[curY];
      if (row) row[curX] = 'FLOOR';
      curX += curX < x2 ? 1 : -1;
    }

    // Gerak Vertikal
    while (curY !== y2) {
      const row = this.tiles[curY];
      if (row) row[curX] = 'FLOOR';
      curY += curY < y2 ? 1 : -1;
    }
  }
}
