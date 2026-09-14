import { SpaceGameStatus } from './types';
import { SpaceDefenderEngine } from './game';

export class SpaceDefenderUI {
  private container: HTMLElement;
  private engine: SpaceDefenderEngine | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="space-container">
        <!-- Header Proyek -->
        <div class="duel-header">
          <div>
            <h2 class="duel-title">Level 3: Space Defender Arcade</h2>
            <p class="duel-subtitle">Pelajari Generics &lt;T&gt;, Abstract Classes, Object Pooling, & Delta Time ($dt$)</p>
          </div>
          <div class="learning-pills">
            <span class="pill">ObjectPool&lt;T&gt;</span>
            <span class="pill">abstract class Entity</span>
            <span class="pill">Delta Time (dt)</span>
            <span class="pill">AABB Collision</span>
          </div>
        </div>

        <!-- Arcade Layout Grid -->
        <div class="space-layout">
          <!-- Canvas Game Stage -->
          <div class="space-canvas-wrapper">
            <canvas id="space-canvas" class="space-canvas"></canvas>
          </div>

          <!-- Sidebar Controls & Telemetry -->
          <div class="space-sidebar">
            <!-- HUD Telemetry -->
            <div class="space-card">
              <div class="hud-stat-row">
                <div class="hud-item">
                  <span class="hud-label">SKOR</span>
                  <span class="hud-val" id="space-score">0</span>
                </div>
                <div class="hud-item">
                  <span class="hud-label">GELOMBANG (WAVE)</span>
                  <span class="hud-val wave-val" id="space-wave">1</span>
                </div>
              </div>

              <!-- Shield Bar -->
              <div class="shield-section">
                <div class="shield-label">
                  <span>ENERGY SHIELD</span>
                  <span id="shield-text">100 / 100</span>
                </div>
                <div class="bar-container">
                  <div class="bar-fill shield-fill" id="shield-bar" style="width: 100%"></div>
                </div>
              </div>
            </div>

            <!-- Action Controls -->
            <div class="space-card space-controls">
              <button class="btn-action btn-game" id="btn-space-start">
                <span>🚀 Luncurkan Armada</span>
              </button>
            </div>

            <!-- Real-time Memory & Object Pool Telemetry -->
            <div class="space-card pool-telemetry-card">
              <h4 class="telemetry-title">⚡ Live Memory Pool (Generics &lt;T&gt;)</h4>
              <p class="telemetry-desc">Pantau objek aktif yang didaur ulang secara instan tanpa Garbage Collection lag:</p>
              <div class="telemetry-stats">
                <div class="pool-stat-badge">
                  <span>Lasers:</span>
                  <b id="stat-laser-pool">0 aktif</b>
                </div>
                <div class="pool-stat-badge">
                  <span>Particles:</span>
                  <b id="stat-particle-pool">0 aktif</b>
                </div>
                <div class="pool-stat-badge">
                  <span>Enemies:</span>
                  <b id="stat-enemy-pool">0 aktif</b>
                </div>
              </div>
            </div>

            <!-- Mobile / Virtual Controls -->
            <div class="arcade-controls">
              <div class="control-help">
                <span>⌨️ Kontrol: <b>Arrow / WASD</b> bergerak, <b>Spasi</b> menembak</span>
              </div>
              <div class="mobile-actions">
                <button class="btn-action btn-shoot" id="btn-virtual-shoot">
                  <span>🔥 TEMBAK LASER</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Concept Explainer -->
        <div class="concept-card">
          <h4 class="concept-title">💡 Catatan Pembelajaran TypeScript:</h4>
          <p class="concept-body">
            Pada game arcade ini, puluhan laser dan partikel lahir dan musnah setiap detik.
            Alih-alih memanggil <code>new Laser()</code> ribuan kali, kita menggunakan class buatan kita: <code>ObjectPool&lt;T extends Poolable&gt;</code>.
            TypeScript memastikan tipe objek di dalam pool selalu konsisten, dan memori browser tetap bersih serta stabil pada performa puncak!
          </p>
        </div>
      </div>
    `;

    this.initEngine();
    this.attachEvents();
  }

  private initEngine(): void {
    const canvas = document.getElementById('space-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    this.engine = new SpaceDefenderEngine(canvas, {
      onScoreChange: (score: number, wave: number) => {
        const scoreEl = document.getElementById('space-score');
        const waveEl = document.getElementById('space-wave');
        if (scoreEl) scoreEl.innerText = score.toString();
        if (waveEl) waveEl.innerText = wave.toString();
      },
      onShieldChange: (shield: number, maxShield: number) => {
        const barEl = document.getElementById('shield-bar');
        const textEl = document.getElementById('shield-text');
        const percent = Math.max(0, (shield / maxShield) * 100);
        if (barEl) barEl.style.width = `${percent}%`;
        if (textEl) textEl.innerText = `${Math.round(shield)} / ${maxShield}`;
      },
      onStatusChange: (status: SpaceGameStatus) => {
        const btn = document.getElementById('btn-space-start');
        if (!btn) return;
        if (status === 'PLAYING') {
          btn.innerHTML = '<span>⚡ Armada Sedang Tempur</span>';
          btn.setAttribute('disabled', 'true');
        } else {
          btn.innerHTML = '<span>🚀 Luncurkan Ulang</span>';
          btn.removeAttribute('disabled');
        }
      },
      onPoolStats: (lasers: number, particles: number, enemies: number) => {
        const lEl = document.getElementById('stat-laser-pool');
        const pEl = document.getElementById('stat-particle-pool');
        const eEl = document.getElementById('stat-enemy-pool');
        if (lEl) lEl.innerText = `${lasers} aktif`;
        if (pEl) pEl.innerText = `${particles} aktif`;
        if (eEl) eEl.innerText = `${enemies} aktif`;
      },
    });
  }

  private attachEvents(): void {
    if (!this.engine) return;

    const btnStart = document.getElementById('btn-space-start');
    btnStart?.addEventListener('click', () => {
      this.engine?.start();
    });

    const btnShoot = document.getElementById('btn-virtual-shoot');
    btnShoot?.addEventListener('mousedown', () => {
      this.engine?.triggerPlayerShoot();
    });
    btnShoot?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.engine?.triggerPlayerShoot();
    });

    this.keydownHandler = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      this.engine?.setKeyState(e.code, true);
    };

    this.keyupHandler = (e: KeyboardEvent) => {
      this.engine?.setKeyState(e.code, false);
    };

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
  }

  public destroy(): void {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.keyupHandler) {
      window.removeEventListener('keyup', this.keyupHandler);
      this.keyupHandler = null;
    }
    this.engine?.destroy();
    this.engine = null;
  }
}
