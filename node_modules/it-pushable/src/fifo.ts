// ported from https://www.npmjs.com/package/fast-fifo

export interface Next<T> {
  done?: boolean
  error?: Error
  value?: T
}

class FixedFIFO<T> {
  public buffer: Array<Next<T> | undefined>
  private readonly mask: number
  private top: number
  private btm: number
  public next: FixedFIFO<T> | null

  constructor (hwm: number) {
    if (!(hwm > 0) || ((hwm - 1) & hwm) !== 0) {
      throw new Error('Max size for a FixedFIFO should be a power of two')
    }

    this.buffer = new Array(hwm)
    this.mask = hwm - 1
    this.top = 0
    this.btm = 0
    this.next = null
  }

  push (data: Next<T>): boolean {
    if (this.buffer[this.top] !== undefined) {
      return false
    }

    this.buffer[this.top] = data
    this.top = (this.top + 1) & this.mask

    return true
  }

  shift (): Next<T> | undefined {
    const last = this.buffer[this.btm]

    if (last === undefined) {
      return undefined
    }

    this.buffer[this.btm] = undefined
    this.btm = (this.btm + 1) & this.mask
    return last
  }

  isEmpty (): boolean {
    return this.buffer[this.btm] === undefined
  }
}

export interface FIFOOptions {
  /**
   * When the queue reaches this size, it will be split into head/tail parts
   */
  splitLimit?: number
}

export class FIFO<T> {
  public size: number
  private readonly hwm: number
  private head: FixedFIFO<T>
  private tail: FixedFIFO<T>

  constructor (options: FIFOOptions = {}) {
    this.hwm = options.splitLimit ?? 16
    this.head = new FixedFIFO<T>(this.hwm)
    this.tail = this.head
    this.size = 0
  }

  calculateSize (obj: any): number {
    if (obj?.byteLength != null) {
      return obj.byteLength
    }

    return 1
  }

  push (val: Next<T>): void {
    if (val?.value != null) {
      this.size += this.calculateSize(val.value)
    }

    if (!this.head.push(val)) {
      const prev = this.head
      this.head = prev.next = new FixedFIFO<T>(2 * this.head.buffer.length)
      this.head.push(val)
    }
  }

  shift (): Next<T> | undefined {
    let val = this.tail.shift()

    if (val === undefined && (this.tail.next != null)) {
      const next = this.tail.next
      this.tail.next = null
      this.tail = next
      val = this.tail.shift()
    }

    if (val?.value != null) {
      this.size -= this.calculateSize(val.value)
    }

    return val
  }

  isEmpty (): boolean {
    return this.head.isEmpty()
  }
}
