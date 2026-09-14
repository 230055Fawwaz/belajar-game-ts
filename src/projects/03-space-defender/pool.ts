import { Poolable } from './types';

/**
 * =======================================================================
 * MATERI GENERICS: OBJECT POOLING REUSABLE
 * =======================================================================
 * Dalam game dev dengan performa tinggi, kita tidak boleh terus-menerus
 * membuat objek baru dengan `new Bullet()` lalu membiarkannya dibuang ke Garbage Collector.
 *
 * Pola `ObjectPool<T extends Poolable>` memungkinkan kita menggunakan kembali
 * objek yang sudah ada dalam memori (Memory Reuse) secara type-safe!
 *
 * Sintaks `<T extends Poolable>` berarti:
 * "Class ini menerima tipe data `T` apapun, asalkan memiliki properti `active` dan method `reset()`."
 */
export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize: number = 30) {
    this.factory = factory;

    // Pra-alokasi sejumlah objek ke dalam memori
    for (let i = 0; i < initialSize; i++) {
      const item = this.factory();
      item.active = false;
      this.pool.push(item);
    }
  }

  /**
   * Mengambil objek yang sedang menganggur (idle) dari pool.
   * Jika semua objek sedang aktif terpakai, pool akan membuat objek baru secara dinamis.
   */
  public obtain(): T {
    let item = this.pool.find((obj) => !obj.active);

    if (!item) {
      // Alokasi ekspansi jika kapasitas penuh
      item = this.factory();
      this.pool.push(item);
    }

    item.active = true;
    item.reset();
    return item;
  }

  /**
   * Mengembalikan objek ke status idle sehingga siap didaur ulang
   */
  public release(item: T): void {
    item.active = false;
  }

  /**
   * Mengambil seluruh objek yang sedang aktif dalam pertempuran
   */
  public getActiveObjects(): ReadonlyArray<T> {
    return this.pool.filter((obj) => obj.active);
  }

  /**
   * Menghitung total objek dalam memori (untuk pemantauan kinerja)
   */
  public getTotalCapacity(): number {
    return this.pool.length;
  }

  public getActiveCount(): number {
    return this.pool.filter((obj) => obj.active).length;
  }

  public releaseAll(): void {
    this.pool.forEach((obj) => {
      obj.active = false;
    });
  }
}
