import { Direction, GameStatus } from './types';
import { SnakeGameEngine } from './game';

export class SnakeUI {
  private container: HTMLElement;
  private engine: SnakeGameEngine | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="snake-container">
        <!-- Header Proyek -->
        <div class="duel-header">
          <div>
            <h2 class="duel-title">Level 2: Retro 2D Snake</h2>
            <p class="duel-subtitle">Pelajari HTML5 Canvas 2D, 60 FPS Game Loop, Vector Math, & Event Typing</p>
          </div>
          <div class="learning-pills">
            <span class="pill">HTMLCanvasElement</span>
            <span class="pill">CanvasRenderingContext2D</span>
            <span class="pill">type Vector2D</span>
            <span class="pill">requestAnimationFrame</span>
          </div>
        </div>

        <!-- Snake Game Layout -->
        <div class="snake-layout">
          <!-- Game Canvas Area -->
          <div class="canvas-wrapper">
            <canvas id="snake-canvas" class="snake-canvas"></canvas>
          </div>

          <!-- Side Panel: Stats, Controls, Legends -->
          <div class="snake-sidebar">
            <!-- Score Card -->
            <div class="snake-stats-card">
              <div class="score-row">
                <div class="score-block">
                  <span class="score-label">SKOR</span>
                  <span class="score-value" id="current-score">0</span>
                </div>
                <div class="score-block">
                  <span class="score-label">TERTINGGI</span>
                  <span class="score-value high-score" id="high-score">0</span>
                </div>
              </div>
              <div class="speed-indicator">
                <span>⚡ Kecepatan Tick:</span>
                <span id="speed-indicator-val">130 ms</span>
              </div>
            </div>

            <!-- Controls Buttons -->
            <div class="snake-controls-card">
              <button class="btn-action btn-game" id="btn-start-pause">
                <span>▶️ Mulai Permainan</span>
              </button>
              <button class="btn-action btn-game" id="btn-restart">
                <span>🔄 Ulangi (Reset)</span>
              </button>
            </div>

            <!-- Item Legends -->
            <div class="food-legend-card">
              <h4 class="legend-title">🍎 Variasi Makanan (Discriminated Unions)</h4>
              <div class="legend-item">
                <span class="dot dot-normal"></span>
                <span><b>Apel Merah (Normal)</b>: +10 Poin</span>
              </div>
              <div class="legend-item">
                <span class="dot dot-golden"></span>
                <span><b>Golden Apple</b>: +30 Poin & Speed Burst!</span>
              </div>
              <div class="legend-item">
                <span class="dot dot-ice"></span>
                <span><b>Ice Berry</b>: +15 Poin & Perlambat Ular</span>
              </div>
            </div>

            <!-- D-Pad Virtual / Onscreen Controls -->
            <div class="dpad-container">
              <button class="dpad-btn up" id="dpad-up">▲</button>
              <div class="dpad-row">
                <button class="dpad-btn left" id="dpad-left">◀</button>
                <button class="dpad-btn down" id="dpad-down">▼</button>
                <button class="dpad-btn right" id="dpad-right">▶</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Concept Explainer -->
        <div class="concept-card">
          <h4 class="concept-title">💡 Catatan Pembelajaran TypeScript:</h4>
          <p class="concept-body">
            Pada game ini, perhatikan bagaimana TypeScript melakukan <b>Type Guard</b> pada <code>canvas.getContext('2d')</code>.
            Jika context bernilai <code>null</code>, compiler memaksa kita menanganinya sebelum menggunakan properti seperti <code>fillStyle</code> atau <code>fillRect</code>.
            Selain itu, posisi ular dikunci menggunakan <code>ReadonlyArray&lt;Vector2D&gt;</code> sehingga segmen koordinat tidak bisa dimutasi secara ilegal dari luar class!
          </p>
        </div>
      </div>
    `;

    this.initEngine();
    this.attachEvents();
  }

  private initEngine(): void {
    const canvas = document.getElementById('snake-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      console.error('Canvas #snake-canvas tidak ditemukan!');
      return;
    }

    // Grid: 24 kolom x 20 baris, tiap sel 22px
    this.engine = new SnakeGameEngine(
      canvas,
      {
        cols: 24,
        rows: 20,
        cellSize: 22,
      },
      {
        onScoreChange: (score: number, highScore: number) => {
          const scoreEl = document.getElementById('current-score');
          const highEl = document.getElementById('high-score');
          if (scoreEl) scoreEl.innerText = score.toString();
          if (highEl) highEl.innerText = highScore.toString();
        },
        onStatusChange: (status: GameStatus) => {
          this.updateControlButtons(status);
        },
        onSpeedChange: (speedMs: number) => {
          const spEl = document.getElementById('speed-indicator-val');
          if (spEl) spEl.innerText = `${speedMs} ms`;
        },
      }
    );
  }

  private attachEvents(): void {
    if (!this.engine) return;

    const btnStartPause = document.getElementById('btn-start-pause');
    const btnRestart = document.getElementById('btn-restart');

    btnStartPause?.addEventListener('click', () => {
      if (!this.engine) return;
      const status = this.engine.getStatus();
      if (status === 'IDLE' || status === 'GAME_OVER') {
        this.engine.start();
      } else if (status === 'PLAYING') {
        this.engine.pause();
      } else if (status === 'PAUSED') {
        this.engine.resume();
      }
    });

    btnRestart?.addEventListener('click', () => {
      this.engine?.resetGame();
    });

    // On-Screen D-Pad buttons
    const bindDpad = (id: string, dir: Direction) => {
      document.getElementById(id)?.addEventListener('click', () => {
        this.engine?.changeDirection(dir);
      });
    };

    bindDpad('dpad-up', 'UP');
    bindDpad('dpad-down', 'DOWN');
    bindDpad('dpad-left', 'LEFT');
    bindDpad('dpad-right', 'RIGHT');

    // Type-Safe Keyboard Event Listener
    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
    }

    this.keydownListener = (e: KeyboardEvent) => {
      if (!this.engine) return;

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          this.engine.changeDirection('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          this.engine.changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          this.engine.changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          this.engine.changeDirection('RIGHT');
          break;
        case 'Space':
          e.preventDefault();
          const curStatus = this.engine.getStatus();
          if (curStatus === 'PLAYING') {
            this.engine.pause();
          } else if (curStatus === 'PAUSED') {
            this.engine.resume();
          } else if (curStatus === 'IDLE' || curStatus === 'GAME_OVER') {
            this.engine.start();
          }
          break;
      }
    };

    window.addEventListener('keydown', this.keydownListener);
  }

  private updateControlButtons(status: GameStatus): void {
    const btn = document.getElementById('btn-start-pause');
    if (!btn) return;

    if (status === 'PLAYING') {
      btn.innerHTML = '<span>⏸️ Jeda (Pause)</span>';
    } else if (status === 'PAUSED') {
      btn.innerHTML = '<span>▶️ Lanjutkan (Resume)</span>';
    } else if (status === 'GAME_OVER') {
      btn.innerHTML = '<span>🔄 Main Lagi</span>';
    } else {
      btn.innerHTML = '<span>▶️ Mulai Permainan</span>';
    }
  }

  public destroy(): void {
    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
    this.engine?.destroy();
    this.engine = null;
  }
}
