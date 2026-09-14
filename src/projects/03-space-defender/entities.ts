import { BoundingBox, Poolable, EnemyConfig, WeaponConfig } from './types';

/**
 * Fungsi pembantu deteksi tabrakan Axis-Aligned Bounding Box (AABB)
 * Menguji apakah dua kotak saling bertumpukan
 */
export function checkAABB(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * =======================================================================
 * MATERI ABSTRACT CLASS & POLYMORPHISM
 * =======================================================================
 * `abstract class Entity` adalah kerangka yang tidak bisa di-instansiasi langsung (`new Entity()` akan error).
 * Class ini mewajibkan setiap subclass mengimplementasikan method `update(dt)` dan `draw(ctx)`.
 */
export abstract class Entity implements BoundingBox {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  // Method abstrak: Wajib dibuat isinya oleh setiap class turunan
  public abstract update(dt: number): void;
  public abstract draw(ctx: CanvasRenderingContext2D): void;
}

// -----------------------------------------------------------------------
// 1. LASER PROJECTILE (Mendukung Object Pooling)
// -----------------------------------------------------------------------
export class Laser extends Entity implements Poolable {
  public active: boolean = false;
  public vy: number = -600; // Pixel per detik (ke atas)
  public damage: number = 25;
  public color: string = '#38bdf8';
  public isEnemyLaser: boolean = false;

  constructor() {
    super(0, 0, 4, 14);
  }

  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.vy = -600;
    this.damage = 25;
    this.color = '#38bdf8';
    this.isEnemyLaser = false;
  }

  public spawn(x: number, y: number, vy: number, damage: number, color: string, isEnemy: boolean = false): void {
    this.x = x - this.width / 2;
    this.y = y;
    this.vy = vy;
    this.damage = damage;
    this.color = color;
    this.isEnemyLaser = isEnemy;
    this.active = true;
  }

  public override update(dt: number): void {
    if (!this.active) return;
    this.y += this.vy * dt;

    // Nonaktifkan jika sudah keluar layar
    if (this.y < -30 || this.y > 750) {
      this.active = false;
    }
  }

  public override draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
}

// -----------------------------------------------------------------------
// 2. EXPLOSION PARTICLE (Mendukung Object Pooling)
// -----------------------------------------------------------------------
export class Particle extends Entity implements Poolable {
  public active: boolean = false;
  public vx: number = 0;
  public vy: number = 0;
  public life: number = 1.0;     // 1.0 -> 0.0
  public decayRate: number = 2.5; // per detik
  public color: string = '#f59e0b';
  public size: number = 3;

  constructor() {
    super(0, 0, 3, 3);
  }

  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 1.0;
    this.active = false;
  }

  public spawn(x: number, y: number, color: string): void {
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 1.0;
    this.active = true;

    // Kecepatan dan arah acak
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 160;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = 2 + Math.random() * 3;
    this.decayRate = 1.8 + Math.random() * 2.0;
  }

  public override update(dt: number): void {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= this.decayRate * dt;

    if (this.life <= 0) {
      this.active = false;
    }
  }

  public override draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}

// -----------------------------------------------------------------------
// 3. PESAWAT PEMAIN (PlayerShip)
// -----------------------------------------------------------------------
export class PlayerShip extends Entity {
  public maxShield: number = 100;
  public shield: number = 100;
  public speed: number = 320; // Pixel per detik
  public weapon: WeaponConfig;
  public shootCooldown: number = 0;

  constructor(x: number, y: number) {
    super(x, y, 36, 32);
    this.weapon = {
      damage: 30,
      fireRateSec: 0.16, // Sekitar 6 tembakan per detik
      projectileSpeed: 650,
      color: '#06b6d4',
    };
  }

  public override update(dt: number): void {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }
  }

  public canShoot(): boolean {
    return this.shootCooldown <= 0;
  }

  public triggerShotCooldown(): void {
    this.shootCooldown = this.weapon.fireRateSec;
  }

  public takeDamage(amount: number): void {
    this.shield = Math.max(0, this.shield - amount);
  }

  public isAlive(): boolean {
    return this.shield > 0;
  }

  public reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.shield = this.maxShield;
    this.shootCooldown = 0;
  }

  public override draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Gambar Pesawat Player (Segitiga Futuristik Neon)
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#06b6d4';

    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y); // Hidung pesawat
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.lineTo(this.x + this.width / 2, this.y + this.height - 8);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.closePath();
    ctx.fill();

    // Gambar Kokpit
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// -----------------------------------------------------------------------
// 4. PESAWAT MUSUH (EnemyShip - Mendukung Object Pooling)
// -----------------------------------------------------------------------
export class EnemyShip extends Entity implements Poolable {
  public active: boolean = false;
  public config!: EnemyConfig;
  public currentHp: number = 30;
  private shootTimer: number = 0;

  constructor() {
    super(0, 0, 32, 28);
  }

  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.active = false;
  }

  public spawn(x: number, y: number, config: EnemyConfig): void {
    this.x = x;
    this.y = y;
    this.config = config;
    this.width = config.width;
    this.height = config.height;
    this.currentHp = config.maxHp;
    this.shootTimer = Math.random() * config.shootIntervalSec;
    this.active = true;
  }

  public override update(dt: number): void {
    if (!this.active) return;
    this.y += this.config.speed * dt;

    if (this.y > 720) {
      this.active = false; // Lolos dari batas bawah layar
    }
  }

  public tickShooting(dt: number): boolean {
    if (!this.active || this.config.shootIntervalSec <= 0) return false;
    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = this.config.shootIntervalSec;
      return true;
    }
    return false;
  }

  public takeDamage(amount: number): boolean {
    this.currentHp -= amount;
    if (this.currentHp <= 0) {
      this.active = false;
      return true; // Mati
    }
    return false;
  }

  public override draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    ctx.save();
    ctx.shadowColor = this.config.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.config.color;

    // Bentuk Pesawat Musuh Mengarah ke Bawah
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y + this.height); // Ujung moncong ke bawah
    ctx.lineTo(this.x + this.width, this.y);
    ctx.lineTo(this.x + this.width / 2, this.y + 6);
    ctx.lineTo(this.x, this.y);
    ctx.closePath();
    ctx.fill();

    // Mini Health Bar di atas musuh
    const hpPercent = this.currentHp / this.config.maxHp;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(this.x, this.y - 6, this.width, 3);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x, this.y - 6, this.width * hpPercent, 3);
    ctx.restore();
  }
}
