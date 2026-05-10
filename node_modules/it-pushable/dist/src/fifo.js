// ported from https://www.npmjs.com/package/fast-fifo
class FixedFIFO {
    buffer;
    mask;
    top;
    btm;
    next;
    constructor(hwm) {
        if (!(hwm > 0) || ((hwm - 1) & hwm) !== 0) {
            throw new Error('Max size for a FixedFIFO should be a power of two');
        }
        this.buffer = new Array(hwm);
        this.mask = hwm - 1;
        this.top = 0;
        this.btm = 0;
        this.next = null;
    }
    push(data) {
        if (this.buffer[this.top] !== undefined) {
            return false;
        }
        this.buffer[this.top] = data;
        this.top = (this.top + 1) & this.mask;
        return true;
    }
    shift() {
        const last = this.buffer[this.btm];
        if (last === undefined) {
            return undefined;
        }
        this.buffer[this.btm] = undefined;
        this.btm = (this.btm + 1) & this.mask;
        return last;
    }
    isEmpty() {
        return this.buffer[this.btm] === undefined;
    }
}
export class FIFO {
    size;
    hwm;
    head;
    tail;
    constructor(options = {}) {
        this.hwm = options.splitLimit ?? 16;
        this.head = new FixedFIFO(this.hwm);
        this.tail = this.head;
        this.size = 0;
    }
    calculateSize(obj) {
        if (obj?.byteLength != null) {
            return obj.byteLength;
        }
        return 1;
    }
    push(val) {
        if (val?.value != null) {
            this.size += this.calculateSize(val.value);
        }
        if (!this.head.push(val)) {
            const prev = this.head;
            this.head = prev.next = new FixedFIFO(2 * this.head.buffer.length);
            this.head.push(val);
        }
    }
    shift() {
        let val = this.tail.shift();
        if (val === undefined && (this.tail.next != null)) {
            const next = this.tail.next;
            this.tail.next = null;
            this.tail = next;
            val = this.tail.shift();
        }
        if (val?.value != null) {
            this.size -= this.calculateSize(val.value);
        }
        return val;
    }
    isEmpty() {
        return this.head.isEmpty();
    }
}
//# sourceMappingURL=fifo.js.map