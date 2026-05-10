/**
 * Can be used with Array.sort to sort and array with Uint8Array entries
 */
export function compare (a: Uint8Array, b: Uint8Array): number {
  if (globalThis.Buffer != null) {
    return globalThis.Buffer.compare(a, b)
  }

  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] < b[i]) {
      return -1
    }

    if (a[i] > b[i]) {
      return 1
    }
  }

  if (a.byteLength > b.byteLength) {
    return 1
  }

  if (a.byteLength < b.byteLength) {
    return -1
  }

  return 0
}
