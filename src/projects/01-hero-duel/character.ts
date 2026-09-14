import {
  ElementType,
  HeroRole,
  CharacterStats,
  Skill,
} from './types';

/**
 * =======================================================================
 * MATERI 2: CLASS & ENKAPSULASI OOP DALAM TYPESCRIPT
 * =======================================================================
 * Menggunakan access modifiers:
 * - `public`: bisa diakses dari mana saja (default).
 * - `private`: hanya bisa diakses di dalam class Hero ini sendiri.
 * - `readonly`: nilainya permanen sejak di-instansiasi di constructor.
 */
export class Hero {
  public readonly id: string;
  public readonly name: string;
  public readonly role: HeroRole;
  public readonly element: ElementType;
  public readonly avatar: string;

  // Properti internal yang kita enkapsulasi (dilindungi)
  private stats: CharacterStats;
  private skills: Skill[] = [];
  private isDefending: boolean = false;

  constructor(
    id: string,
    name: string,
    role: HeroRole,
    element: ElementType,
    avatar: string,
    initialStats: CharacterStats,
    skills: Skill[] = []
  ) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.element = element;
    this.avatar = avatar;
    // Copy stats agar tidak termutasi dari luar (Data Immortality)
    this.stats = { ...initialStats };
    this.skills = [...skills];
  }

  // --- GETTER METHODS (Read-Only Access) ---
  public getHp(): number {
    return this.stats.currentHp;
  }

  public getMaxHp(): number {
    return this.stats.maxHp;
  }

  public getMp(): number {
    return this.stats.currentMp;
  }

  public getMaxMp(): number {
    return this.stats.maxMp;
  }

  public getAttack(): number {
    return this.stats.attack;
  }

  public getDefense(): number {
    // Jika sedang dalam kondisi bertahan (Defend), defense digandakan
    return this.isDefending ? this.stats.defense * 2 : this.stats.defense;
  }

  public getCritRate(): number {
    return this.stats.critRate;
  }

  public getSpeed(): number {
    return this.stats.speed;
  }

  public getSkills(): ReadonlyArray<Skill> {
    return this.skills;
  }

  public isAlive(): boolean {
    return this.stats.currentHp > 0;
  }

  public getDefendingState(): boolean {
    return this.isDefending;
  }

  // --- STATE MUTATION METHODS (Method Enkapsulasi Aman) ---

  public setDefending(defending: boolean): void {
    this.isDefending = defending;
  }

  public takeDamage(damage: number): number {
    // Math.max mencegah HP menjadi negatif di bawah 0
    const actualDamage = Math.max(1, Math.round(damage));
    this.stats.currentHp = Math.max(0, this.stats.currentHp - actualDamage);
    return actualDamage;
  }

  public heal(amount: number): number {
    if (!this.isAlive()) return 0;
    const previousHp = this.stats.currentHp;
    this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + amount);
    return this.stats.currentHp - previousHp;
  }

  public useMp(amount: number): boolean {
    if (this.stats.currentMp >= amount) {
      this.stats.currentMp -= amount;
      return true;
    }
    return false;
  }

  public restoreMp(amount: number): void {
    this.stats.currentMp = Math.min(this.stats.maxMp, this.stats.currentMp + amount);
  }

  public resetState(initialStats: CharacterStats): void {
    this.stats = { ...initialStats };
    this.isDefending = false;
  }
}
