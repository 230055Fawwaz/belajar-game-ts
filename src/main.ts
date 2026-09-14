import './style.css';
import { HeroDuelUI } from './projects/01-hero-duel/ui';
import { SnakeUI } from './projects/02-snake/ui';
import { SpaceDefenderUI } from './projects/03-space-defender/ui';

type ProjectId = '01-hero-duel' | '02-snake' | '03-space-defender';

function initializeApp(): void {
  const stage = document.getElementById('game-stage');
  if (!stage) {
    console.error('Elemen #game-stage tidak ditemukan dalam DOM!');
    return;
  }

  let currentSnakeUI: SnakeUI | null = null;
  let currentSpaceUI: SpaceDefenderUI | null = null;

  const loadProject = (projectId: ProjectId): void => {
    // Bersihkan instance game aktif sebelumnya
    if (currentSnakeUI) {
      currentSnakeUI.destroy();
      currentSnakeUI = null;
    }
    if (currentSpaceUI) {
      currentSpaceUI.destroy();
      currentSpaceUI = null;
    }

    if (projectId === '01-hero-duel') {
      const heroDuel = new HeroDuelUI(stage);
      heroDuel.render();
    } else if (projectId === '02-snake') {
      currentSnakeUI = new SnakeUI(stage);
      currentSnakeUI.render();
    } else if (projectId === '03-space-defender') {
      currentSpaceUI = new SpaceDefenderUI(stage);
      currentSpaceUI.render();
    }
  };

  // Muat Proyek 1 secara default
  loadProject('01-hero-duel');

  // Navigation listener
  const navButtons = document.querySelectorAll<HTMLButtonElement>('.nav-btn');
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const project = btn.dataset.project as ProjectId | undefined;
      if (btn.classList.contains('locked')) {
        alert('Proyek ini terkunci. Selesaikan materi level sebelumnya terlebih dahulu!');
        return;
      }

      if (!project) return;

      navButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      loadProject(project);
    });
  });
}

// Inisialisasi saat DOM siap
window.addEventListener('DOMContentLoaded', initializeApp);
