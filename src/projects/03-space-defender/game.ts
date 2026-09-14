import {
  SpaceGameStatus,
  EnemyConfig,
  EnemyRank,
} from './types';
import { ObjectPool } from './pool';
import {
  Laser,
  Particle,
  PlayerShip,
  EnemyShip,
  checkAABB,
} from './entities';

export interface SpaceDefenderCallbacks {
  onScoreChange: (score: number, wave: number) => void;
  onShieldChange: (shield: number, maxShield: number) => void;
  onStatusChange: (status: SpaceGameStatus) => void;
  onPoolStats: (laserPool: number, particlePool: number, enemyPool: number) => void;
}

// Konfigurasi Jenis Musuh
const ENEMY_CONFIGS: Record<EnemyRank, EnemyConfig> = {
  SCOUT: {
    rank: 'SCOUT',
    maxHp: 20,
    speed: 180,
    scoreValue: 50,
    color: '#34d399',
    width: 26,
    height: 24,
    shootIntervalSec: 2.2,
  },
  FIGHTER: {
    rank: 'FIGHTER',
    maxHp: 45,
    speed: 130,
    scoreValue: 120,
    color: '#f59e0b',
    width: 34,
    height: 30,
    shootIntervalSec: 1.5,
  },
  BOMBER: {
    rank: 'BOMBER',
    maxHp: 90,
    speed: 80,
    scoreValue: 250,
    color: '#ef4444',
    width: 44,
    height: 38,
    shootIntervalSec: 1.0,
  },
};

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export class SpaceDefenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: SpaceDefenderCallbacks;

  // Objek Game
  private player: PlayerShip;
  private laserPool: ObjectPool<Laser>;
  private particlePool: ObjectPool<Particle>;
  private enemyPool: ObjectPool<EnemyShip>;

  // Starfield Parallax
  private stars: Star[] = [];

  // Status & Siklus Game
  private status: SpaceGameStatus = 'READY';
  private score: number = 0;
  private wave: number = 1;
  private waveTimer: number = 0;
  private enemySpawnTimer: number = 0;

  // Input State
  private keys: { [key: string]: boolean } = {};

  // Timing
  private lastTimestamp: number = 0;
  private animationFrameId: number | null = null;

  // Web Audio Context untuk Efek Suara Retro
  private audioCtx: AudioContext | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: SpaceDefenderCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Gagal mendapatkan CanvasRenderingContext2D!');
    this.ctx = ctx;

    this.canvas.width = 440;
    this.canvas.height = 600;

    // Inisialisasi Pesawat Pemain di bagian tengah bawah
    this.player = new PlayerShip(this.canvas.width / 2 - 18, this.canvas.height - 70);

    // Inisialisasi Generic Object Pools
    this.laserPool = new ObjectPool<Laser>(() => new Laser(), 35);
    this.particlePool = new ObjectPool<Particle>(() => new Particle(), 120);
    this.enemyPool = new ObjectPool<EnemyShip>(() => new EnemyShip(), 20);

    // Buat latar belakang bintang (Parallax Starfield)
    this.createStarfield(60);

    this.render();
  }

  public getStatus(): SpaceGameStatus {
    return this.status;
  }

  public start(): void {
    if (this.status === 'PLAYING') return;

    this.initAudio();
    this.resetState();
    this.status = 'PLAYING';
    this.callbacks.onStatusChange(this.status);
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  public restart(): void {
    this.start();
  }

  public setKeyState(key: string, isPressed: boolean): void {
    this.keys[key] = isPressed;
  }

  public triggerPlayerShoot(): void {
    if (this.status !== 'PLAYING' || !this.player.canShoot()) return;

    // Ambil Laser dari ObjectPool (Daur Ulang Memori!)
    const laser = this.laserPool.obtain();
    laser.spawn(
      this.player.x + this.player.width / 2,
      this.player.y - 4,
      -this.player.weapon.projectileSpeed,
      this.player.weapon.damage,
      this.player.weapon.color,
      false
    );

    this.player.triggerShotCooldown();
    this.playSynthSound(580, 0.08, 'triangle');
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // --- CORE LOOP BERBASIS DELTA TIME (dt) ---
  private loop = (timestamp: number): void => {
    if (this.status !== 'PLAYING') return;

    // Hitung delta time dalam satuan detik
    const dt = Math.min(0.1, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.render();

    // Callback pemantauan pool memori
    this.callbacks.onPoolStats(
      this.laserPool.getActiveCount(),
      this.particlePool.getActiveCount(),
      this.enemyPool.getActiveCount()
    );

    if (this.status === 'PLAYING') {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  };

  private update(dt: number): void {
    // 1. Update Starfield
    this.stars.forEach((star) => {
      star.y += star.speed * dt;
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }
    });

    // 2. Kontrol Gerak Pesawat Pemain (Frame-Rate Independent dengan dt)
    let moveX = 0;
    let moveY = 0;

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveX -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) moveX += 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) moveY -= 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) moveY += 1;

    // Normalisasi diagonal
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }

    this.player.x += moveX * this.player.speed * dt;
    this.player.y += moveY * this.player.speed * dt;

    // Batasi dalam batas canvas
    this.player.x = Math.max(8, Math.min(this.canvas.width - this.player.width - 8, this.player.x));
    this.player.y = Math.max(20, Math.min(this.canvas.height - this.player.height - 12, this.player.y));
    this.player.update(dt);

    // Auto-fire jika tombol Spasi ditekan terus
    if (this.keys['Space']) {
      this.triggerPlayerShoot();
    }

    // 3. Update Lasers & Particles
    this.laserPool.getActiveObjects().forEach((laser) => laser.update(dt));
    this.particlePool.getActiveObjects().forEach((particle) => particle.update(dt));

    // 4. Update Spawning Musuh
    this.enemySpawnTimer += dt;
    const spawnRate = Math.max(0.6, 2.2 - this.wave * 0.25);
    if (this.enemySpawnTimer >= spawnRate) {
      this.enemySpawnTimer = 0;
      this.spawnRandomEnemy();
    }

    // 5. Update Musuh & Tembakan Musuh
    const enemies = this.enemyPool.getActiveObjects();
    enemies.forEach((enemy) => {
      enemy.update(dt);

      if (enemy.tickShooting(dt)) {
        // Musuh menembakkan laser
        const eLaser = this.laserPool.obtain();
        eLaser.spawn(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height + 2,
          240,
          15,
          '#f87171',
          true
        );
      }
    });

    // 6. DETEKSI TABRAKAN (AABB Collision)
    this.handleCollisions();

    // 7. Wave Progression
    this.waveTimer += dt;
    if (this.waveTimer >= 25) {
      this.waveTimer = 0;
      this.wave++;
      this.callbacks.onScoreChange(this.score, this.wave);
    }
  }

  private handleCollisions(): void {
    const activeLasers = this.laserPool.getActiveObjects();
    const activeEnemies = this.enemyPool.getActiveObjects();

    // A. Laser Pemain vs Pesawat Musuh
    activeLasers.forEach((laser) => {
      if (!laser.active || laser.isEnemyLaser) return;

      activeEnemies.forEach((enemy) => {
        if (!enemy.active) return;

        if (checkAABB(laser, enemy)) {
          laser.active = false; // Kembalikan ke pool
          const isKilled = enemy.takeDamage(laser.damage);
          this.createExplosion(laser.x, laser.y, enemy.config.color, 6);

          if (isKilled) {
            this.score += enemy.config.scoreValue;
            this.callbacks.onScoreChange(this.score, this.wave);
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.config.color, 24);
            this.playSynthSound(220, 0.18, 'sawtooth');
          } else {
            this.playSynthSound(440, 0.05, 'sine');
          }
        }
      });
    });

    // B. Laser Musuh vs Pesawat Pemain
    activeLasers.forEach((laser) => {
      if (!laser.active || !laser.isEnemyLaser) return;

      if (checkAABB(laser, this.player)) {
        laser.active = false;
        this.player.takeDamage(laser.damage);
        this.createExplosion(laser.x, laser.y, '#f87171', 8);
        this.callbacks.onShieldChange(this.player.shield, this.player.maxShield);
        this.playSynthSound(160, 0.15, 'sawtooth');

        if (!this.player.isAlive()) {
          this.triggerGameOver();
        }
      }
    });

    // C. Tabrakan Fisik Pesawat Musuh vs Pesawat Pemain
    activeEnemies.forEach((enemy) => {
      if (!enemy.active) return;

      if (checkAABB(enemy, this.player)) {
        enemy.active = false;
        this.player.takeDamage(35);
        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ef4444', 30);
        this.callbacks.onShieldChange(this.player.shield, this.player.maxShield);
        this.playSynthSound(120, 0.25, 'sawtooth');

        if (!this.player.isAlive()) {
          this.triggerGameOver();
        }
      }
    });
  }

  private spawnRandomEnemy(): void {
    const enemy = this.enemyPool.obtain();
    const roll = Math.random();

    let rank: EnemyRank = 'SCOUT';
    if (this.wave >= 2 && roll < 0.35) {
      rank = 'FIGHTER';
    } else if (this.wave >= 3 && roll < 0.18) {
      rank = 'BOMBER';
    }

    const config = ENEMY_CONFIGS[rank];
    const spawnX = Math.random() * (this.canvas.width - config.width - 20) + 10;
    enemy.spawn(spawnX, -config.height - 10, config);
  }

  private createExplosion(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const particle = this.particlePool.obtain();
      particle.spawn(x, y, color);
    }
  }

  private triggerGameOver(): void {
    this.status = 'GAME_OVER';
    this.callbacks.onStatusChange(this.status);
    this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#06b6d4', 45);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.render();
  }

  private resetState(): void {
    this.score = 0;
    this.wave = 1;
    this.waveTimer = 0;
    this.enemySpawnTimer = 0;
    this.player.reset(this.canvas.width / 2 - 18, this.canvas.height - 70);
    this.laserPool.releaseAll();
    this.particlePool.releaseAll();
    this.enemyPool.releaseAll();
    this.callbacks.onScoreChange(this.score, this.wave);
    this.callbacks.onShieldChange(this.player.shield, this.player.maxShield);
  }

  private createStarfield(count: number): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 80 + 30, // Kecepatan parallax
      });
    }
  }

  private initAudio(): void {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private playSynthSound(freq: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, this.audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Audio mungkin diblokir browser sebelum user berinteraksi
    }
  }

  // --- RENDERING CANVAS ---
  private render(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background Gelap Luar Angkasa
    this.ctx.fillStyle = '#050711';
    this.ctx.fillRect(0, 0, w, h);

    // Gambar Bintang Parallax
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.stars.forEach((s) => {
      this.ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Gambar Entitas
    this.laserPool.getActiveObjects().forEach((l) => l.draw(this.ctx));
    this.enemyPool.getActiveObjects().forEach((e) => e.draw(this.ctx));
    this.particlePool.getActiveObjects().forEach((p) => p.draw(this.ctx));

    if (this.player.isAlive()) {
      this.player.draw(this.ctx);
    }

    // Overlay Status
    if (this.status !== 'PLAYING') {
      this.ctx.fillStyle = 'rgba(5, 7, 17, 0.8)';
      this.ctx.fillRect(0, 0, w, h);

      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      if (this.status === 'READY') {
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillText('SPACE DEFENDER', w / 2, h / 2 - 25);
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.font = '14px "JetBrains Mono", monospace';
        this.ctx.fillText('Tekan Mulai untuk Meluncur', w / 2, h / 2 + 10);
      } else if (this.status === 'GAME_OVER') {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillText('ARMADA GUGUR!', w / 2, h / 2 - 25);
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.font = '16px "JetBrains Mono", monospace';
        this.ctx.fillText(`Skor Akhir: ${this.score}`, w / 2, h / 2 + 10);
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '13px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillText('Klik Luncurkan Ulang untuk mencoba lagi', w / 2, h / 2 + 40);
      }
    }
  }
}
