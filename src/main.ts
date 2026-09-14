import './style.css';
import { HeroDuelUI } from './projects/01-hero-duel/ui';

function initializeApp(): void {
  const stage = document.getElementById('game-stage');
  if (!stage) {
    console.error('Elemen #game-stage tidak ditemukan dalam DOM!');
    return;
  }

  // Load Proyek 1 secara default
  const heroDuel = new HeroDuelUI(stage);
  heroDuel.render();

  // Navigation listener untuk project berikutnya (Level 2, 3, 4)
  const navButtons = document.querySelectorAll<HTMLButtonElement>('.nav-btn');
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const project = btn.dataset.project;
      if (btn.classList.contains('locked')) {
        alert('Proyek ini terkunci. Selesaikan materi Proyek 1 terlebih dahulu!');
        return;
      }

      navButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (project === '01-hero-duel') {
        heroDuel.render();
      }
    });
  });
}

// Inisialisasi saat DOM siap
window.addEventListener('DOMContentLoaded', initializeApp);
