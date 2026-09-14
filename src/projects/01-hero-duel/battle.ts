import {
  BattleAction,
  BattleTurnResult,
  ElementType,
} from './types';
import { Hero } from './character';

/**
 * =======================================================================
 * MATERI 3: TYPE NARROWING & DISCRIMINATED UNIONS MATCHING
 * =======================================================================
 * Di sini kita memanfaatkan kecerdasan TypeScript:
 * Saat kita memeriksa `switch(action.kind)`, TypeScript secara otomatis
 * mempersempit (narrow down) tipe data `action` di setiap blok `case`!
 */

/**
 * Menghitung efektivitas elemen:
 * FIRE > GRASS > WATER > FIRE
 */
export function calculateElementMultiplier(
  attackerElement: ElementType,
  defenderElement: ElementType
): number {
  if (attackerElement === ElementType.NEUTRAL || defenderElement === ElementType.NEUTRAL) {
    return 1.0;
  }

  if (
    (attackerElement === ElementType.FIRE && defenderElement === ElementType.GRASS) ||
    (attackerElement === ElementType.GRASS && defenderElement === ElementType.WATER) ||
    (attackerElement === ElementType.WATER && defenderElement === ElementType.FIRE)
  ) {
    return 1.5; // Super Efektif!
  }

  if (
    (attackerElement === ElementType.FIRE && defenderElement === ElementType.WATER) ||
    (attackerElement === ElementType.WATER && defenderElement === ElementType.GRASS) ||
    (attackerElement === ElementType.GRASS && defenderElement === ElementType.FIRE)
  ) {
    return 0.75; // Kurang Efektif (Resisted)
  }

  return 1.0; // Netral
}

/**
 * Engine Kalkulasi Turn Pertarungan
 */
export function executeTurn(
  attacker: Hero,
  defender: Hero,
  action: BattleAction
): BattleTurnResult {
  // Setiap awal giliran, reset kondisi bertahan (Defend) milik si penyerang
  attacker.setDefending(false);

  // 1. Pola TYPE NARROWING menggunakan switch(action.kind)
  switch (action.kind) {
    case 'ATTACK': {
      // Basic Attack
      const isCrit = Math.random() < attacker.getCritRate();
      const critMultiplier = isCrit ? 1.5 : 1.0;
      const elemMultiplier = calculateElementMultiplier(attacker.element, defender.element);

      // Rumus Damage RPG Klasik: (Attack * Multipliers) - (Defense * 0.5) + Variasi Random
      const basePower = attacker.getAttack() * critMultiplier * elemMultiplier;
      const mitigatedPower = Math.max(5, basePower - defender.getDefense() * 0.5);
      const variance = 0.9 + Math.random() * 0.2; // +/- 10%
      const finalDamage = Math.round(mitigatedPower * variance);

      const actualDamage = defender.takeDamage(finalDamage);

      let logMsg = `${attacker.name} menyerang biasa ke ${defender.name} menghasilkan ${actualDamage} DMG!`;
      if (isCrit) logMsg += ' 💥 CRITICAL HIT!';
      if (elemMultiplier > 1) logMsg += ' ⚡ SUPER EFEKTIF!';
      if (elemMultiplier < 1) logMsg += ' 🛡️ KURANG EFEKTIF...';

      return {
        actorName: attacker.name,
        targetName: defender.name,
        actionTaken: action,
        damageDealt: actualDamage,
        isCritical: isCrit,
        elementMultiplier: elemMultiplier,
        logMessage: logMsg,
      };
    }

    case 'SKILL': {
      // TypeScript tahu persis bahwa di dalam blok ini, `action` memiliki properti `.skill`!
      const skill = action.skill;
      attacker.useMp(skill.mpCost);

      const isCrit = Math.random() < attacker.getCritRate();
      const critMultiplier = isCrit ? 1.5 : 1.0;
      const elemMultiplier = calculateElementMultiplier(skill.element, defender.element);

      const basePower = (attacker.getAttack() * skill.powerMultiplier) * critMultiplier * elemMultiplier;
      const mitigatedPower = Math.max(10, basePower - defender.getDefense() * 0.4);
      const variance = 0.95 + Math.random() * 0.1;
      const finalDamage = Math.round(mitigatedPower * variance);

      const actualDamage = defender.takeDamage(finalDamage);

      let logMsg = `${attacker.name} merapal skill [${skill.name}] ke ${defender.name} menghasilkan ${actualDamage} DMG!`;
      if (isCrit) logMsg += ' 💥 CRITICAL HIT!';
      if (elemMultiplier > 1) logMsg += ' ⚡ SUPER EFEKTIF!';

      return {
        actorName: attacker.name,
        targetName: defender.name,
        actionTaken: action,
        damageDealt: actualDamage,
        isCritical: isCrit,
        elementMultiplier: elemMultiplier,
        logMessage: logMsg,
      };
    }

    case 'DEFEND': {
      // Menyetel status bertahan untuk mengurangi damage di giliran berikutnya
      attacker.setDefending(true);
      return {
        actorName: attacker.name,
        targetName: attacker.name,
        actionTaken: action,
        damageDealt: 0,
        isCritical: false,
        elementMultiplier: 1.0,
        logMessage: `🛡️ ${attacker.name} mengambil posisi bertahan (DEFENSE berlipat ganda hingga giliran berikutnya)!`,
      };
    }

    case 'HEAL': {
      // TypeScript tahu `action.healAmount` ada di sini
      const healed = attacker.heal(action.healAmount);
      return {
        actorName: attacker.name,
        targetName: attacker.name,
        actionTaken: action,
        damageDealt: 0,
        isCritical: false,
        elementMultiplier: 1.0,
        healedAmount: healed,
        logMessage: `💚 ${attacker.name} memulihkan HP sebesar ${healed} poin!`,
      };
    }
  }
}
