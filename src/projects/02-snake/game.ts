import { Vector2D, Direction, GameStatus, FoodItem, GridConfig } from './types';
import { Snake } from './snake';

export interface GameCallbacks {
  onScoreChange: (score: number, highScore: number) => void;
  onStatusChange: (status: GameStatus) => void;
  onSpeedChange: (speedMs: number) => void;
}

export class SnakeGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: GridConfig;
  private callbacks: GameCallbacks;

  private snake: Snake;
  private currentFood: FoodItem | null = null;
  private status: GameStatus = 'IDLE';

  private score: number = 0;
  private highScore: number = 0;

  // Game Loop Timers
  private baseSpeedMs: number = 130; // Milliseconds per movement tick
  private currentSpeedMs: number = 130;
  private lastTickTimestamp: number = 0;
  private animationFrameId: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    config: GridConfig,
    callbacks: GameCallbacks
  ) {
    this.canvas = canvas;
    this.config = config;
    this.callbacks = callbacks;

    // Type Guarding yang kuat untuk konteks Canvas 2D
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Gagal menginisialisasi CanvasRenderingContext2D!');
    }
    this.ctx = context;

    // Sinkronisasi resolusi internal canvas dengan grid
    this.canvas.width = this.config.cols * this.config.cellSize;
    this.canvas.height = this.config.rows * this.config.cellSize;

    // Inisialisasi posisi awal Ular di tengah grid
    const centerHead: Vector2D = {
      x: Math.floor(this.config.cols / 3),
      y: Math.floor(this.config.rows / 2),
    };
    this.snake = new Snake(centerHead, 4);

    // Muat high score dari localStorage secara aman
    this.loadHighScore();

    // Render tampilan grid awal
    this.spawnFood();
    this.render();
  }

  public getStatus(): GameStatus {
    return this.status;
  }

  public start(): void {
    if (this.status === 'PLAYING') return;

    if (this.status === 'GAME_OVER') {
      this.resetGame();
    }

    this.status = 'PLAYING';
    this.callbacks.onStatusChange(this.status);
    this.lastTickTimestamp = performance.now();
    this.loop(this.lastTickTimestamp);
  }

  public pause(): void {
    if (this.status !== 'PLAYING') return;
    this.status = 'PAUSED';
    this.callbacks.onStatusChange(this.status);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.render(); // Render overlay pause
  }

  public resume(): void {
    if (this.status !== 'PAUSED') return;
    this.status = 'PLAYING';
    this.callbacks.onStatusChange(this.status);
    this.lastTickTimestamp = performance.now();
    this.loop(this.lastTickTimestamp);
  }

  public changeDirection(dir: Direction): void {
    if (this.status === 'PLAYING') {
      this.snake.setDirection(dir);
    }
  }

  public resetGame(): void {
    const centerHead: Vector2D = {
      x: Math.floor(this.config.cols / 3),
      y: Math.floor(this.config.rows / 2),
    };
    this.snake.reset(centerHead, 4);
    this.score = 0;
    this.currentSpeedMs = this.baseSpeedMs;
    this.spawnFood();
    this.callbacks.onScoreChange(this.score, this.highScore);
    this.callbacks.onSpeedChange(this.currentSpeedMs);
    this.status = 'IDLE';
    this.callbacks.onStatusChange(this.status);
    this.render();
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // --- CORE GAME LOOP (Fixed Timestep via requestAnimationFrame) ---
  private loop = (currentTimestamp: number): void => {
    if (this.status !== 'PLAYING') return;

    const delta = currentTimestamp - this.lastTickTimestamp;

    if (delta >= this.currentSpeedMs) {
      this.updateLogic();
      this.lastTickTimestamp = currentTimestamp;
    }

    this.render();

    if (this.status === 'PLAYING') {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  };

  private updateLogic(): void {
    const head = this.snake.getHead();
    const currentDir = this.snake.getDirection();

    // Hitung posisi kepala berikutnya
    let nextX = head.x;
    let nextY = head.y;

    switch (currentDir) {
      case 'UP': nextY -= 1; break;
      case 'DOWN': nextY += 1; break;
      case 'LEFT': nextX -= 1; break;
      case 'RIGHT': nextX += 1; break;
    }

    // 1. Deteksi Tabrakan Dinding (Wall Collision)
    if (
      nextX < 0 ||
      nextX >= this.config.cols ||
      nextY < 0 ||
      nextY >= this.config.rows
    ) {
      this.triggerGameOver('Menabrak dinding pembatas!');
      return;
    }

    // 2. Deteksi Makanan
    const isEatingFood =
      this.currentFood !== null &&
      nextX === this.currentFood.position.x &&
      nextY === this.currentFood.position.y;

    // Gerakkan ular
    this.snake.step(isEatingFood);

    // 3. Deteksi Tabrakan Tubuh Sendiri (Self Collision)
    if (this.snake.hasSelfCollision()) {
      this.triggerGameOver('Ular menabrak badannya sendiri!');
      return;
    }

    // Jika makan, proses efek makanan dengan Discriminated Union
    if (isEatingFood && this.currentFood) {
      this.handleFoodConsumption(this.currentFood);
      this.spawnFood();
    }
  }

  private handleFoodConsumption(food: FoodItem): void {
    this.score += food.scoreValue;

    // Pola Discriminated Union: compiler otomatis tahu field unik tiap kind!
    switch (food.kind) {
      case 'NORMAL':
        // Sedikit percepat game seiring bertambahnya panjang ular
        this.currentSpeedMs = Math.max(65, this.currentSpeedMs - 1.5);
        break;

      case 'GOLDEN':
        // Golden food memberi speed burst & skor besar
        this.currentSpeedMs = Math.max(50, this.currentSpeedMs - food.bonusSpeedMs);
        break;

      case 'ICE':
        // Ice food memperlambat laju (efek beku memberi napas bagi pemain)
        this.currentSpeedMs = Math.min(this.baseSpeedMs + 30, this.currentSpeedMs + food.slowDownMs);
        break;
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    this.callbacks.onScoreChange(this.score, this.highScore);
    this.callbacks.onSpeedChange(Math.round(this.currentSpeedMs));
  }

  private triggerGameOver(reason: string): void {
    console.log(`Game Over: ${reason}`);
    this.status = 'GAME_OVER';
    this.callbacks.onStatusChange(this.status);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.render();
  }

  private spawnFood(): void {
    let newPos: Vector2D;
    let attempts = 0;

    // Cari posisi acak yang belum ditempati tubuh ular
    do {
      newPos = {
        x: Math.floor(Math.random() * this.config.cols),
        y: Math.floor(Math.random() * this.config.rows),
      };
      attempts++;
    } while (this.snake.occupies(newPos) && attempts < 100);

    const roll = Math.random();
    if (roll < 0.15) {
      // 15% kesempatan muncul Golden Apple
      this.currentFood = {
        kind: 'GOLDEN',
        position: newPos,
        scoreValue: 30,
        bonusSpeedMs: 6,
        color: '#fbbf24', // Emas
      };
    } else if (roll < 0.30) {
      // 15% kesempatan muncul Ice Berry
      this.currentFood = {
        kind: 'ICE',
        position: newPos,
        scoreValue: 15,
        slowDownMs: 10,
        color: '#38bdf8', // Biru Es
      };
    } else {
      // 70% Makanan Normal
      this.currentFood = {
        kind: 'NORMAL',
        position: newPos,
        scoreValue: 10,
        color: '#ef4444', // Merah Apel
      };
    }
  }

  // --- RENDERING CANVAS 2D ---
  private render(): void {
    const { cols, rows, cellSize } = this.config;
    const width = cols * cellSize;
    const height = rows * cellSize;

    // 1. Bersihkan Canvas (Background Gelap)
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, width, height);

    // 2. Gambar Garis Kisi Grid (Grid Lines)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * cellSize, 0);
      this.ctx.lineTo(c * cellSize, height);
      this.ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * cellSize);
      this.ctx.lineTo(width, r * cellSize);
      this.ctx.stroke();
    }

    // 3. Gambar Makanan
    if (this.currentFood) {
      const { x, y } = this.currentFood.position;
      const px = x * cellSize;
      const py = y * cellSize;
      const radius = cellSize / 2 - 2;

      this.ctx.save();
      // Efek bayangan neon bersinar (glow)
      this.ctx.shadowColor = this.currentFood.color;
      this.ctx.shadowBlur = 12;
      this.ctx.fillStyle = this.currentFood.color;

      this.ctx.beginPath();
      this.ctx.arc(px + cellSize / 2, py + cellSize / 2, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 4. Gambar Tubuh Ular
    const body = this.snake.getBody();
    const head = this.snake.getHead();

    body.forEach((segment, index) => {
      const px = segment.x * cellSize;
      const py = segment.y * cellSize;
      const isHead = segment.x === head.x && segment.y === head.y;

      if (isHead) {
        // Kepala Ular (Neon Hijau Terang)
        this.ctx.save();
        this.ctx.shadowColor = '#10b981';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#34d399';
        this.ctx.beginPath();
        this.ctx.roundRect(px + 1, py + 1, cellSize - 2, cellSize - 2, 6);
        this.ctx.fill();

        // Gambar Titik Mata Ular
        this.ctx.fillStyle = '#064e3b';
        const eyeSize = 3;
        const dir = this.snake.getDirection();
        let eye1X = px + 5, eye1Y = py + 5;
        let eye2X = px + cellSize - 8, eye2Y = py + 5;

        if (dir === 'DOWN') {
          eye1Y = py + cellSize - 8;
          eye2Y = py + cellSize - 8;
        } else if (dir === 'LEFT') {
          eye1X = px + 5; eye1Y = py + 5;
          eye2X = px + 5; eye2Y = py + cellSize - 8;
        } else if (dir === 'RIGHT') {
          eye1X = px + cellSize - 8; eye1Y = py + 5;
          eye2X = px + cellSize - 8; eye2Y = py + cellSize - 8;
        }

        this.ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
        this.ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
        this.ctx.restore();
      } else {
        // Segmen Tubuh (Gradasi Hijau Meredup)
        const alpha = Math.max(0.4, 1 - index / (body.length + 5));
        this.ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 4);
        this.ctx.fill();
      }
    });

    // 5. Overlay Status Permainan (IDLE, PAUSED, GAME_OVER)
    if (this.status !== 'PLAYING') {
      this.ctx.fillStyle = 'rgba(11, 15, 25, 0.75)';
      this.ctx.fillRect(0, 0, width, height);

      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      if (this.status === 'IDLE') {
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillText('Tekan Mulai atau Spasi', width / 2, height / 2 - 15);
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '14px "JetBrains Mono", monospace';
        this.ctx.fillText('Gunakan Arrow Keys atau WASD untuk bergerak', width / 2, height / 2 + 18);
      } else if (this.status === 'PAUSED') {
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillText('PERMAINAN DIJEDA (PAUSE)', width / 2, height / 2);
      } else if (this.status === 'GAME_OVER') {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillText('GAME OVER!', width / 2, height / 2 - 25);
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.font = '16px "JetBrains Mono", monospace';
        this.ctx.fillText(`Skor Akhir: ${this.score}`, width / 2, height / 2 + 10);
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '13px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillText('Tekan Tombol Ulangi untuk bermain kembali', width / 2, height / 2 + 40);
      }
    }
  }

  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem('snake_high_score');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    } catch {
      this.highScore = 0;
    }
    this.callbacks.onScoreChange(this.score, this.highScore);
  }

  private saveHighScore(): void {
    try {
      localStorage.setItem('snake_high_score', this.highScore.toString());
    } catch {
      // Abaikan jika storage disabled
    }
  }
}
