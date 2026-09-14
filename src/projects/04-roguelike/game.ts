import { GridPoint, SavedGameState, DungeonItem } from './types';
import { DungeonMap } from './dungeon';
import { DungeonStateMachine } from './fsm';
import { PlayerEntity, MonsterEntity, MONSTER_BLUEPRINTS, MonsterKind } from './entities';
import { ITEM_DATABASE } from './inventory';

/**
 * =======================================================================
 * MATERI TYPE PREDICATES: `data is SavedGameState`
 * =======================================================================
 * Saat membaca data mentah dari `JSON.parse(localStorage.getItem(...))`,
 * tipe datanya adalah `unknown` atau `any`.
 *
 * Dengan fungsi Type Predicate ini, TypeScript memeriksa struktur objek
 * secara runtime dan menjamin compiler menganggapnya sebagai `SavedGameState`!
 */
export function isSavedGameState(data: unknown): data is SavedGameState {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    d['version'] === 1 &&
    typeof d['floor'] === 'number' &&
    typeof d['score'] === 'number' &&
    typeof d['playerStats'] === 'object' &&
    typeof d['playerPos'] === 'object' &&
    Array.isArray(d['inventoryItemIds'])
  );
}

export interface RoguelikeCallbacks {
  onStateChange: () => void;
  onLog: (msg: string, isImportant?: boolean) => void;
}

export class RoguelikeEngine {
  public map: DungeonMap;
  public fsm: DungeonStateMachine;
  public player: PlayerEntity;
  public monsters: MonsterEntity[] = [];
  public groundItems: { pos: GridPoint; item: DungeonItem }[] = [];

  public floor: number = 1;
  public maxFloors: number = 3;
  public score: number = 0;
  private callbacks: RoguelikeCallbacks;

  constructor(callbacks: RoguelikeCallbacks) {
    this.callbacks = callbacks;
    this.fsm = new DungeonStateMachine('EXPLORING');
    this.map = new DungeonMap(24, 18);
    this.player = new PlayerEntity(this.map.getPlayerSpawn());

    this.spawnFloorEntities();
  }

  public movePlayer(dx: number, dy: number): void {
    if (this.fsm.getState() !== 'EXPLORING') return;

    const targetX = this.player.pos.x + dx;
    const targetY = this.player.pos.y + dy;

    // 1. Cek apakah ada Pintu Tertutup
    if (this.map.getTile(targetX, targetY) === 'DOOR_CLOSED') {
      this.map.openDoor(targetX, targetY);
      this.callbacks.onLog('🚪 Kamu membuka pintu dungeon.');
      this.map.revealRadius(targetX, targetY, 4);
      this.endTurn();
      return;
    }

    // 2. Cek apakah ada Monster di petak target (BUMP TO ATTACK)
    const monster = this.monsters.find(
      (m) => m.pos.x === targetX && m.pos.y === targetY && m.isAlive()
    );

    if (monster) {
      this.playerAttack(monster);
      this.endTurn();
      return;
    }

    // 3. Cek apakah petak bisa dilewati
    if (!this.map.isWalkable(targetX, targetY)) {
      return; // Menabrak dinding
    }

    // Gerakkan pemain
    this.player.pos = { x: targetX, y: targetY };
    this.map.revealRadius(targetX, targetY, 4);

    // Cek apakah berdiri di atas Item
    const itemIdx = this.groundItems.findIndex(
      (i) => i.pos.x === targetX && i.pos.y === targetY
    );
    if (itemIdx >= 0) {
      const drop = this.groundItems[itemIdx];
      if (drop && this.player.inventory.addItem(drop.item)) {
        this.callbacks.onLog(`🎁 Menemukan dan mengambil ${drop.item.name}!`, true);
        this.groundItems.splice(itemIdx, 1);
      } else {
        this.callbacks.onLog('🎒 Tas kamu penuh, tidak bisa mengambil item ini!');
      }
    }

    // Cek apakah berdiri di Tangga Turun (STAIRS_DOWN)
    if (this.map.getTile(targetX, targetY) === 'STAIRS_DOWN') {
      this.handleDescendStairs();
      return;
    }

    this.endTurn();
  }

  public useItem(itemId: string): boolean {
    const item = ITEM_DATABASE[itemId];
    if (!item) return false;

    // Discriminated Union pattern matching
    switch (item.kind) {
      case 'POTION': {
        const healed = this.player.heal(item.healAmount);
        this.callbacks.onLog(`🧪 Meminum ${item.name}, memulihkan ${healed} HP!`, true);
        this.player.inventory.removeItem(itemId);
        this.endTurn();
        return true;
      }
      case 'WEAPON': {
        this.player.inventory.equipWeapon(item);
        this.callbacks.onLog(`🗡️ Memasang senjata: ${item.name} (+${item.attackBonus} ATK)!`, true);
        this.callbacks.onStateChange();
        return true;
      }
      case 'SCROLL': {
        this.map.revealRadius(this.player.pos.x, this.player.pos.y, item.mapRevealRadius);
        this.callbacks.onLog(`📜 Merapal ${item.name}! Area sekitar tersibak dari kegelapan!`, true);
        this.player.inventory.removeItem(itemId);
        this.endTurn();
        return true;
      }
    }
  }

  // --- SAVE & LOAD DENGAN TYPE PREDICATES ---
  public saveGame(): boolean {
    try {
      const saveData: SavedGameState = {
        version: 1,
        floor: this.floor,
        score: this.score,
        playerStats: { ...this.player.stats },
        playerPos: { ...this.player.pos },
        inventoryItemIds: this.player.inventory.getItemIds(),
        equippedWeaponId: this.player.inventory.getEquippedWeapon()?.id || null,
      };
      localStorage.setItem('roguelike_save_data', JSON.stringify(saveData));
      this.callbacks.onLog('💾 Permainan berhasil disimpan ke LocalStorage!', true);
      return true;
    } catch {
      this.callbacks.onLog('❌ Gagal menyimpan data permainan.');
      return false;
    }
  }

  public loadGame(): boolean {
    try {
      const raw = localStorage.getItem('roguelike_save_data');
      if (!raw) {
        this.callbacks.onLog('⚠️ Tidak ada data penyimpanan yang ditemukan.');
        return false;
      }

      const parsed: unknown = JSON.parse(raw);

      // Verifikasi keamanan dengan Type Predicate
      if (!isSavedGameState(parsed)) {
        this.callbacks.onLog('❌ Data penyimpanan rusak atau format tidak cocok!');
        return false;
      }

      // TypeScript kini tahu 100% aman membaca properti parsed
      this.floor = parsed.floor;
      this.score = parsed.score;
      this.map = new DungeonMap(24, 18);
      this.player.stats = { ...parsed.playerStats };
      this.player.pos = { ...parsed.playerPos };
      this.player.inventory.restoreFromIds(parsed.inventoryItemIds, parsed.equippedWeaponId);

      this.map.revealRadius(this.player.pos.x, this.player.pos.y, 4);
      this.monsters = [];
      this.groundItems = [];
      this.spawnFloorEntities();

      this.fsm.transitionTo('EXPLORING');
      this.callbacks.onLog('📂 Berhasil memuat data petualangan!', true);
      this.callbacks.onStateChange();
      return true;
    } catch {
      this.callbacks.onLog('❌ Terjadi kesalahan saat membaca berkas simpanan.');
      return false;
    }
  }

  // --- COMBAT & TURN LOGIC ---
  private playerAttack(monster: MonsterEntity): void {
    const isCrit = Math.random() < this.player.getTotalCritRate();
    const damage = Math.round(this.player.getTotalAttack() * (isCrit ? 1.6 : 1.0));
    const dealt = monster.takeDamage(damage);

    let msg = `🗡️ Kamu menyerang ${monster.blueprint.name} sebesar ${dealt} DMG!`;
    if (isCrit) msg += ' 💥 CRITICAL!';
    this.callbacks.onLog(msg);

    if (!monster.isAlive()) {
      this.callbacks.onLog(`💀 ${monster.blueprint.name} tumbang! (+${monster.blueprint.xpReward} XP)`);
      this.score += monster.blueprint.xpReward;
      const leveledUp = this.player.addXp(monster.blueprint.xpReward);
      if (leveledUp) {
        this.callbacks.onLog(`⭐ LEVEL UP! Kamu naik ke Level ${this.player.level}!`, true);
      }
    }
  }

  private endTurn(): void {
    // Jalankan giliran monster
    const isWalkable = (x: number, y: number) => this.map.isWalkable(x, y);
    const isOccupied = (x: number, y: number) =>
      this.monsters.some((m) => m.pos.x === x && m.pos.y === y && m.isAlive()) ||
      (this.player.pos.x === x && this.player.pos.y === y);

    this.monsters.forEach((monster) => {
      if (!monster.isAlive()) return;

      const action = monster.calculateTurnAction(this.player.pos, isWalkable, isOccupied);

      if (action.type === 'ATTACK') {
        const damage = monster.blueprint.attack;
        const dealt = this.player.takeDamage(damage);
        this.callbacks.onLog(`💥 ${monster.blueprint.name} mencakar kamu sebesar ${dealt} DMG!`);

        if (!this.player.isAlive()) {
          this.fsm.transitionTo('GAME_OVER');
          this.callbacks.onLog('☠️ Kamu tewas di dalam labirin dungeon...', true);
        }
      } else if (action.type === 'MOVE') {
        monster.pos = action.nextPos;
      }
    });

    this.callbacks.onStateChange();
  }

  private handleDescendStairs(): void {
    if (this.floor >= this.maxFloors) {
      this.fsm.transitionTo('VICTORY');
      this.callbacks.onLog('🏆 LUAR BIASA! Kamu telah menaklukkan seluruh lantai labirin!', true);
    } else {
      this.floor++;
      this.map = new DungeonMap(24, 18);
      this.player.pos = this.map.getPlayerSpawn();
      this.spawnFloorEntities();
      this.callbacks.onLog(`🪜 Kamu menuruni tangga ke Lantai ${this.floor}...`, true);
    }
    this.callbacks.onStateChange();
  }

  private spawnFloorEntities(): void {
    this.monsters = [];
    this.groundItems = [];

    const excluded: GridPoint[] = [this.player.pos, this.map.getStairsPos()];

    // Spawn 4 - 6 monster
    const monsterCount = 4 + this.floor;
    for (let i = 0; i < monsterCount; i++) {
      const pos = this.map.getRandomFloorPosition(excluded);
      excluded.push(pos);

      let kind: MonsterKind = 'GOBLIN';
      if (this.floor === 2 && Math.random() < 0.5) kind = 'SKELETON';
      if (this.floor === 3) kind = Math.random() < 0.5 ? 'ORC' : 'SKELETON';

      const bp = MONSTER_BLUEPRINTS[kind];
      this.monsters.push(new MonsterEntity(`m_${i}`, pos, bp));
    }

    // Spawn 2 item drop di lantai
    for (let i = 0; i < 2; i++) {
      const pos = this.map.getRandomFloorPosition(excluded);
      excluded.push(pos);
      const itemKeys = Object.keys(ITEM_DATABASE);
      const chosenKey = itemKeys[Math.floor(Math.random() * itemKeys.length)] || 'health_potion';
      const item = ITEM_DATABASE[chosenKey];
      if (item) {
        this.groundItems.push({ pos, item });
      }
    }
  }
}
