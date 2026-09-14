import { Hero } from './character';
import { ElementType, BattleAction, Skill } from './types';
import { executeTurn } from './battle';

export class HeroDuelUI {
  private container: HTMLElement;
  private player: Hero;
  private enemy: Hero;
  private isPlayerTurn: boolean = true;
  private isGameOver: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;

    // Inisialisasi Hero Pemain (Fire Warrior)
    this.player = new Hero(
      'p1',
      'Ignis the Blade',
      'WARRIOR',
      ElementType.FIRE,
      '⚔️',
      {
        maxHp: 120,
        currentHp: 120,
        maxMp: 50,
        currentMp: 50,
        attack: 28,
        defense: 14,
        critRate: 0.25,
        speed: 15,
      },
      [
        {
          id: 's_flame_slash',
          name: 'Flame Slash',
          mpCost: 15,
          powerMultiplier: 1.6,
          element: ElementType.FIRE,
          description: 'Tebasan pedang berapi berdaya rusak tinggi.',
        },
      ]
    );

    // Inisialisasi Musuh AI (Grass Forest Golem)
    this.enemy = new Hero(
      'e1',
      'Verdant Golem',
      'PALADIN',
      ElementType.GRASS,
      '🗿',
      {
        maxHp: 150,
        currentHp: 150,
        maxMp: 30,
        currentMp: 30,
        attack: 22,
        defense: 18,
        critRate: 0.1,
        speed: 10,
      },
      [
        {
          id: 's_vine_strike',
          name: 'Vine Strike',
          mpCost: 10,
          powerMultiplier: 1.4,
          element: ElementType.GRASS,
          description: 'Hantaman cambuk akar berduri.',
        },
      ]
    );
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="duel-container">
        <!-- Header Proyek -->
        <div class="duel-header">
          <div>
            <h2 class="duel-title">Level 1: Hero Duel Arena</h2>
            <p class="duel-subtitle">Pelajari Type Aliases, Interfaces, Enums, dan Discriminated Unions</p>
          </div>
          <div class="learning-pills">
            <span class="pill">interface CharacterStats</span>
            <span class="pill">enum ElementType</span>
            <span class="pill">type BattleAction</span>
            <span class="pill">switch(action.kind)</span>
          </div>
        </div>

        <!-- Battle Arena -->
        <div class="arena-grid">
          <!-- Player Card -->
          <div class="hero-card player-card" id="card-player">
            ${this.renderHeroCardContent(this.player, true)}
          </div>

          <!-- VS Center Indicator -->
          <div class="vs-divider">
            <div class="vs-badge">VS</div>
            <div class="turn-indicator" id="turn-indicator">Giliran: Pemain</div>
          </div>

          <!-- Enemy Card -->
          <div class="hero-card enemy-card" id="card-enemy">
            ${this.renderHeroCardContent(this.enemy, false)}
          </div>
        </div>

        <!-- Action Panel -->
        <div class="action-panel">
          <div class="panel-title">
            <span>⚡ Pilih Aksi Pemain</span>
          </div>
          <div class="action-buttons" id="action-buttons">
            <button class="btn-action" id="btn-attack">
              <span>🗡️ Serang Biasa</span>
            </button>
            <button class="btn-action" id="btn-skill">
              <span>🔥 Flame Slash</span>
              <span class="cost">15 MP</span>
            </button>
            <button class="btn-action" id="btn-defend">
              <span>🛡️ Bertahan (Defend)</span>
            </button>
            <button class="btn-action" id="btn-heal">
              <span>🧪 Minum Potion (+35 HP)</span>
            </button>
          </div>
        </div>

        <!-- Battle Log -->
        <div class="log-panel" id="battle-log">
          <div class="log-entry">Pertarungan dimulai! Ignis (Elemen FIRE) melawan Verdant Golem (Elemen GRASS).</div>
        </div>

        <!-- Penjelasan Konsep Kode untuk User -->
        <div class="concept-card">
          <h4 class="concept-title">💡 Catatan Pembelajaran TypeScript:</h4>
          <p class="concept-body">
            Setiap tombol aksi di atas memicu objek <code>BattleAction</code> bertipe <b>Discriminated Union</b> (contoh: <code>{ kind: 'ATTACK' }</code> atau <code>{ kind: 'SKILL', skill }</code>).
            Compiler TypeScript memastikan kamu tidak bisa salah memanggil properti yang tidak ada pada jenis aksi tersebut!
          </p>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.updateUI();
  }

  private renderHeroCardContent(hero: Hero, isPlayer: boolean): string {
    const hpPercent = (hero.getHp() / hero.getMaxHp()) * 100;
    const mpPercent = (hero.getMp() / hero.getMaxMp()) * 100;
    const elementClass = `element-${hero.element.toLowerCase()}`;

    return `
      <div class="card-top">
        <div class="hero-identity">
          <div class="hero-avatar">${hero.avatar}</div>
          <div>
            <div class="hero-name">${hero.name}</div>
            <div class="hero-role">
              ${isPlayer ? '👤 HERO' : '👹 MUSUH'} • ${hero.role}
            </div>
          </div>
        </div>
        <span class="element-tag ${elementClass}">${hero.element}</span>
      </div>

      <div class="stat-bar-group">
        <div class="bar-label">
          <span>HP</span>
          <span id="${hero.id}-hp-text">${hero.getHp()} / ${hero.getMaxHp()}</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill bar-hp" id="${hero.id}-hp-bar" style="width: ${hpPercent}%"></div>
        </div>

        <div class="bar-label">
          <span>MP</span>
          <span id="${hero.id}-mp-text">${hero.getMp()} / ${hero.getMaxMp()}</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill bar-mp" id="${hero.id}-mp-bar" style="width: ${mpPercent}%"></div>
        </div>
      </div>

      <div class="mini-stats">
        <div class="mini-stat-item">
          <span class="mini-stat-title">ATK</span>
          <span class="mini-stat-val">${hero.getAttack()}</span>
        </div>
        <div class="mini-stat-item">
          <span class="mini-stat-title">DEF</span>
          <span class="mini-stat-val">${hero.getDefense()}</span>
        </div>
        <div class="mini-stat-item">
          <span class="mini-stat-title">CRIT</span>
          <span class="mini-stat-val">${Math.round(hero.getCritRate() * 100)}%</span>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const btnAttack = document.getElementById('btn-attack');
    const btnSkill = document.getElementById('btn-skill');
    const btnDefend = document.getElementById('btn-defend');
    const btnHeal = document.getElementById('btn-heal');

    btnAttack?.addEventListener('click', () => {
      this.handlePlayerAction({ kind: 'ATTACK' });
    });

    btnSkill?.addEventListener('click', () => {
      const skills = this.player.getSkills();
      const firstSkill: Skill | undefined = skills[0];
      if (firstSkill && this.player.getMp() >= firstSkill.mpCost) {
        this.handlePlayerAction({ kind: 'SKILL', skill: firstSkill });
      }
    });

    btnDefend?.addEventListener('click', () => {
      this.handlePlayerAction({ kind: 'DEFEND' });
    });

    btnHeal?.addEventListener('click', () => {
      this.handlePlayerAction({ kind: 'HEAL', healAmount: 35 });
    });
  }

  private handlePlayerAction(action: BattleAction): void {
    if (!this.isPlayerTurn || this.isGameOver) return;

    // Jalankan giliran pemain
    const result = executeTurn(this.player, this.enemy, action);
    this.addLog(result.logMessage, result.isCritical, result.elementMultiplier > 1);
    this.updateUI();

    // Cek kemenangan
    if (!this.enemy.isAlive()) {
      this.isGameOver = true;
      this.addLog(`🏆 Selamat! ${this.player.name} telah mengalahkan ${this.enemy.name}!`);
      this.updateUI();
      return;
    }

    // Giliran Musuh (AI) setelah jeda singkat
    this.isPlayerTurn = false;
    this.setControlsDisabled(true);
    this.updateTurnIndicator('Giliran: Musuh berpikir...');

    setTimeout(() => {
      this.executeEnemyAITurn();
    }, 900);
  }

  private executeEnemyAITurn(): void {
    if (this.isGameOver) return;

    // Logika AI sederhana
    let enemyAction: BattleAction = { kind: 'ATTACK' };
    const enemySkills = this.enemy.getSkills();
    const vineStrike = enemySkills[0];

    // Jika MP cukup dan random, gunakan skill
    if (vineStrike && this.enemy.getMp() >= vineStrike.mpCost && Math.random() < 0.6) {
      enemyAction = { kind: 'SKILL', skill: vineStrike };
    } else if (this.enemy.getHp() < 40 && Math.random() < 0.4) {
      enemyAction = { kind: 'DEFEND' };
    }

    const result = executeTurn(this.enemy, this.player, enemyAction);
    this.addLog(result.logMessage, result.isCritical, result.elementMultiplier > 1);
    this.updateUI();

    // Cek kekalahan
    if (!this.player.isAlive()) {
      this.isGameOver = true;
      this.addLog(`💀 Anda gugur dalam pertempuran... Klik Mulai Ulang untuk mencoba lagi!`);
      this.updateUI();
      return;
    }

    // Kembalikan giliran ke pemain
    this.isPlayerTurn = true;
    this.setControlsDisabled(false);
    this.updateTurnIndicator('Giliran: Pemain');
  }

  private updateUI(): void {
    // Update Bar Player
    const playerHpPercent = (this.player.getHp() / this.player.getMaxHp()) * 100;
    const playerMpPercent = (this.player.getMp() / this.player.getMaxMp()) * 100;
    const pBar = document.getElementById(`${this.player.id}-hp-bar`);
    const pText = document.getElementById(`${this.player.id}-hp-text`);
    const pMpBar = document.getElementById(`${this.player.id}-mp-bar`);
    const pMpText = document.getElementById(`${this.player.id}-mp-text`);

    if (pBar) pBar.style.width = `${Math.max(0, playerHpPercent)}%`;
    if (pText) pText.innerText = `${this.player.getHp()} / ${this.player.getMaxHp()}`;
    if (pMpBar) pMpBar.style.width = `${Math.max(0, playerMpPercent)}%`;
    if (pMpText) pMpText.innerText = `${this.player.getMp()} / ${this.player.getMaxMp()}`;

    // Update Bar Enemy
    const enemyHpPercent = (this.enemy.getHp() / this.enemy.getMaxHp()) * 100;
    const enemyMpPercent = (this.enemy.getMp() / this.enemy.getMaxMp()) * 100;
    const eBar = document.getElementById(`${this.enemy.id}-hp-bar`);
    const eText = document.getElementById(`${this.enemy.id}-hp-text`);
    const eMpBar = document.getElementById(`${this.enemy.id}-mp-bar`);
    const eMpText = document.getElementById(`${this.enemy.id}-mp-text`);

    if (eBar) eBar.style.width = `${Math.max(0, enemyHpPercent)}%`;
    if (eText) eText.innerText = `${this.enemy.getHp()} / ${this.enemy.getMaxHp()}`;
    if (eMpBar) eMpBar.style.width = `${Math.max(0, enemyMpPercent)}%`;
    if (eMpText) eMpText.innerText = `${this.enemy.getMp()} / ${this.enemy.getMaxMp()}`;

    // Update Tombol Skill jika MP tidak cukup
    const btnSkill = document.getElementById('btn-skill') as HTMLButtonElement | null;
    const skills = this.player.getSkills();
    const firstSkill = skills[0];
    if (btnSkill && firstSkill) {
      btnSkill.disabled = this.player.getMp() < firstSkill.mpCost || !this.isPlayerTurn || this.isGameOver;
    }
  }

  private setControlsDisabled(disabled: boolean): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.action-buttons .btn-action');
    buttons.forEach((btn) => {
      btn.disabled = disabled;
    });
  }

  private updateTurnIndicator(text: string): void {
    const el = document.getElementById('turn-indicator');
    if (el) el.innerText = text;
  }

  private addLog(message: string, isCrit: boolean = false, isEffective: boolean = false): void {
    const logBox = document.getElementById('battle-log');
    if (!logBox) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    if (isCrit) entry.classList.add('crit');
    if (isEffective) entry.classList.add('effective');

    entry.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;
    logBox.prepend(entry);
  }
}
