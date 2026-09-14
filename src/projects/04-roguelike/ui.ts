import { RoguelikeEngine } from './game';

export class RoguelikeUI {
  private container: HTMLElement;
  private engine: RoguelikeEngine;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private cellSize: number = 24;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.engine = new RoguelikeEngine({
      onStateChange: () => this.updateUI(),
      onLog: (msg, isImp) => this.addLog(msg, isImp),
    });
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="rogue-container">
        <!-- Header Proyek -->
        <div class="duel-header">
          <div>
            <h2 class="duel-title">Level 4: Mini Roguelike Dungeon</h2>
            <p class="duel-subtitle">FSM dengan assertNever, Type Predicates (is), Matriks 2D, & Save/Load System</p>
          </div>
          <div class="learning-pills">
            <span class="pill">assertNever(never)</span>
            <span class="pill">data is SavedGameState</span>
            <span class="pill">TileType[][]</span>
            <span class="pill">Discriminated Items</span>
          </div>
        </div>

        <!-- Dungeon Layout Grid -->
        <div class="rogue-layout">
          <!-- Canvas Dungeon Stage -->
          <div class="dungeon-canvas-wrapper">
            <canvas id="dungeon-canvas" class="dungeon-canvas"></canvas>
          </div>

          <!-- Sidebar & HUD -->
          <div class="rogue-sidebar">
            <!-- Hero Stats & Floor Info -->
            <div class="space-card rogue-hud-card">
              <div class="floor-badge-row">
                <span class="floor-tag" id="rogue-floor-text">Lantai 1 / 3</span>
                <span class="status-tag" id="rogue-status-text">EXPLORING</span>
              </div>

              <!-- HP Bar -->
              <div class="stat-bar-group" style="margin: 0.75rem 0;">
                <div class="bar-label">
                  <span>HP PEMAIN</span>
                  <span id="player-hp-text">100 / 100</span>
                </div>
                <div class="bar-container">
                  <div class="bar-fill bar-hp" id="player-hp-bar" style="width: 100%"></div>
                </div>
              </div>

              <!-- XP & Stats Mini -->
              <div class="rogue-stats-grid">
                <div class="rogue-stat-item">
                  <span class="r-label">LEVEL</span>
                  <b class="r-val" id="player-lvl">1</b>
                </div>
                <div class="rogue-stat-item">
                  <span class="r-label">ATK TOTAL</span>
                  <b class="r-val" id="player-atk">16</b>
                </div>
                <div class="rogue-stat-item">
                  <span class="r-label">DEFENSE</span>
                  <b class="r-val" id="player-def">8</b>
                </div>
                <div class="rogue-stat-item">
                  <span class="r-label">CRIT</span>
                  <b class="r-val" id="player-crit">12%</b>
                </div>
              </div>

              <div class="weapon-slot">
                <span>🗡️ Senjata:</span>
                <b id="player-weapon-name">Tangan Kosong</b>
              </div>
            </div>

            <!-- Action & Tool Buttons -->
            <div class="space-card rogue-actions-card">
              <div class="action-btn-row">
                <button class="btn-action" id="btn-toggle-inv">
                  <span>🎒 Buka Tas (I)</span>
                </button>
                <button class="btn-action" id="btn-save-game">
                  <span>💾 Simpan</span>
                </button>
                <button class="btn-action" id="btn-load-game">
                  <span>📂 Muat</span>
                </button>
              </div>

              <!-- Virtual D-Pad -->
              <div class="dpad-container" style="margin-top: 0.5rem;">
                <button class="dpad-btn up" id="r-up">▲</button>
                <div class="dpad-row">
                  <button class="dpad-btn left" id="r-left">◀</button>
                  <button class="dpad-btn down" id="r-down">▼</button>
                  <button class="dpad-btn right" id="r-right">▶</button>
                </div>
              </div>
            </div>

            <!-- Inventory Drawer Modal -->
            <div class="inventory-drawer" id="inv-drawer" style="display: none;">
              <div class="inv-header">
                <h4>🎒 Ransel Petualang</h4>
                <button class="btn-close-inv" id="btn-close-inv">✖</button>
              </div>
              <div class="inv-item-list" id="inv-item-list">
                <!-- Item di-generate secara dinamis -->
              </div>
            </div>

            <!-- Dungeon Log Panel -->
            <div class="log-panel" id="rogue-log" style="max-height: 140px;">
              <div class="log-entry">Kamu memasuki kedalaman labirin gelap. Cari tangga turun ke lantai berikutnya!</div>
            </div>
          </div>
        </div>

        <!-- Concept Explainer -->
        <div class="concept-card">
          <h4 class="concept-title">💡 Catatan Pembelajaran TypeScript:</h4>
          <p class="concept-body">
            Pada Level 4 ini, sistem penyimpanan mengadopsi <b>Type Predicates</b>:
            <code>function isSavedGameState(data: unknown): data is SavedGameState</code>.
            Fungsi ini memvalidasi data string JSON dari <code>localStorage</code> dan memberikan jaminan tipe pada compiler bahwa data aman tanpa resiko runtime crash!
            Selain itu, FSM menggunakan <b>Exhaustive Checking dengan tipe never</b> untuk memastikan tidak ada state permainan yang terlewat.
          </p>
        </div>
      </div>
    `;

    this.initCanvas();
    this.attachEvents();
    this.updateUI();
  }

  private initCanvas(): void {
    const canvas = document.getElementById('dungeon-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    this.canvas = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context tidak ditemukan!');
    this.ctx = ctx;

    this.canvas.width = this.engine.map.cols * this.cellSize;
    this.canvas.height = this.engine.map.rows * this.cellSize;
  }

  private attachEvents(): void {
    // Keyboard Controls
    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
    }

    this.keydownListener = (e: KeyboardEvent) => {
      // Toggle Inventory dengan tombol 'I'
      if (e.code === 'KeyI') {
        e.preventDefault();
        this.toggleInventory();
        return;
      }

      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        this.engine.movePlayer(0, -1);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        this.engine.movePlayer(0, 1);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        this.engine.movePlayer(-1, 0);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        this.engine.movePlayer(1, 0);
      }
    };

    window.addEventListener('keydown', this.keydownListener);

    // Virtual D-pad
    document.getElementById('r-up')?.addEventListener('click', () => this.engine.movePlayer(0, -1));
    document.getElementById('r-down')?.addEventListener('click', () => this.engine.movePlayer(0, 1));
    document.getElementById('r-left')?.addEventListener('click', () => this.engine.movePlayer(-1, 0));
    document.getElementById('r-right')?.addEventListener('click', () => this.engine.movePlayer(1, 0));

    // Inventory Button
    document.getElementById('btn-toggle-inv')?.addEventListener('click', () => this.toggleInventory());
    document.getElementById('btn-close-inv')?.addEventListener('click', () => this.toggleInventory());

    // Save & Load Buttons
    document.getElementById('btn-save-game')?.addEventListener('click', () => this.engine.saveGame());
    document.getElementById('btn-load-game')?.addEventListener('click', () => this.engine.loadGame());
  }

  private toggleInventory(): void {
    const drawer = document.getElementById('inv-drawer');
    if (!drawer) return;

    if (drawer.style.display === 'none') {
      drawer.style.display = 'flex';
      this.renderInventoryItems();
    } else {
      drawer.style.display = 'none';
    }
  }

  private renderInventoryItems(): void {
    const list = document.getElementById('inv-item-list');
    if (!list) return;

    const items = this.engine.player.inventory.getItems();
    const equipped = this.engine.player.inventory.getEquippedWeapon();

    if (items.length === 0) {
      list.innerHTML = '<div class="inv-empty">Tas kamu kosong. Cari item drop di lantai dungeon!</div>';
      return;
    }

    list.innerHTML = items
      .map((item) => {
        const isEquipped = equipped && equipped.id === item.id;
        let actionLabel = 'Pakai';
        if (item.kind === 'WEAPON') {
          actionLabel = isEquipped ? 'Terpasang' : 'Pasang';
        } else if (item.kind === 'POTION') {
          actionLabel = 'Minum';
        } else if (item.kind === 'SCROLL') {
          actionLabel = 'Rapal';
        }

        return `
          <div class="inv-row ${isEquipped ? 'equipped' : ''}">
            <span class="inv-icon">${item.icon}</span>
            <div class="inv-info">
              <b class="inv-name">${item.name}</b>
              <span class="inv-desc">${item.description}</span>
            </div>
            <button class="btn-use-item" data-id="${item.id}" ${isEquipped ? 'disabled' : ''}>
              ${actionLabel}
            </button>
          </div>
        `;
      })
      .join('');

    // Attach click listener ke tombol item
    list.querySelectorAll<HTMLButtonElement>('.btn-use-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (id) {
          this.engine.useItem(id);
          this.renderInventoryItems();
        }
      });
    });
  }

  private updateUI(): void {
    // 1. Update HUD Stats
    const p = this.engine.player;
    const hpText = document.getElementById('player-hp-text');
    const hpBar = document.getElementById('player-hp-bar');
    const lvlText = document.getElementById('player-lvl');
    const atkText = document.getElementById('player-atk');
    const defText = document.getElementById('player-def');
    const critText = document.getElementById('player-crit');
    const floorText = document.getElementById('rogue-floor-text');
    const statusText = document.getElementById('rogue-status-text');
    const weaponText = document.getElementById('player-weapon-name');

    if (hpText) hpText.innerText = `${p.stats.currentHp} / ${p.stats.maxHp}`;
    if (hpBar) hpBar.style.width = `${Math.max(0, (p.stats.currentHp / p.stats.maxHp) * 100)}%`;
    if (lvlText) lvlText.innerText = p.level.toString();
    if (atkText) atkText.innerText = p.getTotalAttack().toString();
    if (defText) defText.innerText = p.stats.defense.toString();
    if (critText) critText.innerText = `${Math.round(p.getTotalCritRate() * 100)}%`;
    if (floorText) floorText.innerText = `Lantai ${this.engine.floor} / ${this.engine.maxFloors}`;
    if (statusText) statusText.innerText = this.engine.fsm.getState();

    const weapon = p.inventory.getEquippedWeapon();
    if (weaponText) weaponText.innerText = weapon ? `${weapon.name} (+${weapon.attackBonus})` : 'Tangan Kosong';

    // 2. Render Canvas Map
    this.renderCanvas();
  }

  private renderCanvas(): void {
    if (!this.ctx || !this.canvas) return;
    const { cols, rows } = this.engine.map;
    const cs = this.cellSize;

    // Bersihkan
    this.ctx.fillStyle = '#060813';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Gambar Petak Tilemap
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isRevealed = this.engine.map.isRevealed(x, y);
        const px = x * cs;
        const py = y * cs;

        if (!isRevealed) {
          // Kabut Perang (Fog of War) Hitam Gelap
          this.ctx.fillStyle = '#04050a';
          this.ctx.fillRect(px, py, cs, cs);
          continue;
        }

        const tile = this.engine.map.getTile(x, y);

        switch (tile) {
          case 'WALL':
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(px, py, cs, cs);
            this.ctx.strokeStyle = '#0f172a';
            this.ctx.strokeRect(px, py, cs, cs);
            break;

          case 'FLOOR':
            this.ctx.fillStyle = '#0f172a';
            this.ctx.fillRect(px, py, cs, cs);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            this.ctx.strokeRect(px, py, cs, cs);
            break;

          case 'DOOR_CLOSED':
            this.ctx.fillStyle = '#854d0e';
            this.ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4);
            break;

          case 'DOOR_OPEN':
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(px, py, cs, cs);
            this.ctx.fillStyle = '#a16207';
            this.ctx.fillRect(px + 1, py + 1, 4, cs - 2);
            break;

          case 'STAIRS_DOWN':
            this.ctx.fillStyle = '#f59e0b';
            this.ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4);
            this.ctx.fillStyle = '#000';
            this.ctx.font = '14px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🪜', px + cs / 2, py + cs / 2);
            break;
        }
      }
    }

    // 2. Gambar Item di Lantai
    this.engine.groundItems.forEach((drop) => {
      if (this.engine.map.isRevealed(drop.pos.x, drop.pos.y)) {
        const px = drop.pos.x * cs;
        const py = drop.pos.y * cs;
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(drop.item.icon, px + cs / 2, py + cs / 2);
      }
    });

    // 3. Gambar Monster
    this.engine.monsters.forEach((m) => {
      if (m.isAlive() && this.engine.map.isRevealed(m.pos.x, m.pos.y)) {
        const px = m.pos.x * cs;
        const py = m.pos.y * cs;

        this.ctx.font = '16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(m.blueprint.icon, px + cs / 2, py + cs / 2);

        // Mini HP bar monster
        const hpPct = m.currentHp / m.blueprint.maxHp;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(px + 2, py - 2, cs - 4, 3);
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(px + 2, py - 2, (cs - 4) * hpPct, 3);
      }
    });

    // 4. Gambar Karakter Pemain (Hero Wizard/Warrior)
    const pPos = this.engine.player.pos;
    const px = pPos.x * cs;
    const py = pPos.y * cs;

    this.ctx.save();
    this.ctx.shadowColor = '#06b6d4';
    this.ctx.shadowBlur = 10;
    this.ctx.font = '18px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🧙‍♂️', px + cs / 2, py + cs / 2);
    this.ctx.restore();

    // 5. Game Over / Victory Screen Overlay
    const state = this.engine.fsm.getState();
    if (state === 'GAME_OVER' || state === 'VICTORY') {
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.ctx.fillStyle = 'rgba(5, 7, 17, 0.85)';
      this.ctx.fillRect(0, 0, w, h);

      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      if (state === 'GAME_OVER') {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillText('KAMU GUGUR!', w / 2, h / 2 - 20);
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '14px "JetBrains Mono", monospace';
        this.ctx.fillText('Gunakan tombol Muat untuk memulihkan checkpoint petualanganmu.', w / 2, h / 2 + 15);
      } else if (state === 'VICTORY') {
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillText('DUNGEON DITAKLUKKAN! 🏆', w / 2, h / 2 - 20);
        this.ctx.fillStyle = '#4ade80';
        this.ctx.font = '16px "JetBrains Mono", monospace';
        this.ctx.fillText(`Skor Akhirmu: ${this.engine.score}`, w / 2, h / 2 + 15);
      }
    }
  }

  private addLog(message: string, isImportant: boolean = false): void {
    const logBox = document.getElementById('rogue-log');
    if (!logBox) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    if (isImportant) entry.classList.add('effective');
    entry.innerText = `[L${this.engine.floor}] ${message}`;
    logBox.prepend(entry);
  }

  public destroy(): void {
    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
  }
}
