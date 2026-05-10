import { convertToBytes, convertToString } from './convert.js'
import { getProtocol } from './protocols-table.js'
import varint from 'varint'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import type { StringTuple, Tuple, Protocol } from './index.js'

/**
 * string -> [[str name, str addr]... ]
 */
export function stringToStringTuples (str: string): string[][] {
  const tuples = []
  const parts = str.split('/').slice(1) // skip first empty elem
  if (parts.length === 1 && parts[0] === '') {
    return []
  }

  for (let p = 0; p < parts.length; p++) {
    const part = parts[p]
    const proto = getProtocol(part)

    if (proto.size === 0) {
      tuples.push([part])
      // eslint-disable-next-line no-continue
      continue
    }

    p++ // advance addr part
    if (p >= parts.length) {
      throw ParseError('invalid address: ' + str)
    }

    // if it's a path proto, take the rest
    if (proto.path === true) {
      tuples.push([
        part,
        // should we need to check each path part to see if it's a proto?
        // This would allow for other protocols to be added after a unix path,
        // however it would have issues if the path had a protocol name in the path
        cleanPath(parts.slice(p).join('/'))
      ])
      break
    }

    tuples.push([part, parts[p]])
  }

  return tuples
}

/**
 * [[str name, str addr]... ] -> string
 */
export function stringTuplesToString (tuples: StringTuple[]): string {
  const parts: string[] = []
  tuples.map((tup) => {
    const proto = protoFromTuple(tup)
    parts.push(proto.name)
    if (tup.length > 1 && tup[1] != null) {
      parts.push(tup[1])
    }
    return null
  })

  return cleanPath(parts.join('/'))
}

/**
 * [[str name, str addr]... ] -> [[int code, Uint8Array]... ]
 */
export function stringTuplesToTuples (tuples: Array<string[] | string>): Tuple[] {
  return tuples.map((tup) => {
    if (!Array.isArray(tup)) {
      tup = [tup]
    }
    const proto = protoFromTuple(tup)
    if (tup.length > 1) {
      return [proto.code, convertToBytes(proto.code, tup[1])]
    }
    return [proto.code]
  })
}

/**
 * Convert tuples to string tuples
 *
 * [[int code, Uint8Array]... ] -> [[int code, str addr]... ]
 */
export function tuplesToStringTuples (tuples: Tuple[]): StringTuple[] {
  return tuples.map(tup => {
    const proto = protoFromTuple(tup)
    if (tup[1] != null) {
      return [proto.code, convertToString(proto.code, tup[1])]
    }
    return [proto.code]
  })
}

/**
 * [[int code, Uint8Array ]... ] -> Uint8Array
 */
export function tuplesToBytes (tuples: Tuple[]): Uint8Array {
  return fromBytes(uint8ArrayConcat(tuples.map((tup) => {
    const proto = protoFromTuple(tup)
    let buf = Uint8Array.from(varint.encode(proto.code))

    if (tup.length > 1 && tup[1] != null) {
      buf = uint8ArrayConcat([buf, tup[1]]) // add address buffer
    }

    return buf
  })))
}

/**
 * For the passed address, return the serialized size
 */
export function sizeForAddr (p: Protocol, addr: Uint8Array | number[]): number {
  if (p.size > 0) {
    return p.size / 8
  } else if (p.size === 0) {
    return 0
  } else {
    const size = varint.decode(addr)
    return size + (varint.decode.bytes ?? 0)
  }
}

export function bytesToTuples (buf: Uint8Array): Tuple[] {
  const tuples: Array<[number, Uint8Array?]> = []
  let i = 0
  while (i < buf.length) {
    const code = varint.decode(buf, i)
    const n = varint.decode.bytes ?? 0

    const p = getProtocol(code)

    const size = sizeForAddr(p, buf.slice(i + n))

    if (size === 0) {
      tuples.push([code])
      i += n
      // eslint-disable-next-line no-continue
      continue
    }

    const addr = buf.slice(i + n, i + n + size)

    i += (size + n)

    if (i > buf.length) { // did not end _exactly_ at buffer.length
      throw ParseError('Invalid address Uint8Array: ' + uint8ArrayToString(buf, 'base16'))
    }

    // ok, tuple seems good.
    tuples.push([code, addr])
  }

  return tuples
}

/**
 * Uint8Array -> String
 */
export function bytesToString (buf: Uint8Array): string {
  const a = bytesToTuples(buf)
  const b = tuplesToStringTuples(a)
  return stringTuplesToString(b)
}

/**
 * String -> Uint8Array
 */
export function stringToBytes (str: string): Uint8Array {
  str = cleanPath(str)
  const a = stringToStringTuples(str)
  const b = stringTuplesToTuples(a)

  return tuplesToBytes(b)
}

/**
 * String -> Uint8Array
 */
export function fromString (str: string): Uint8Array {
  return stringToBytes(str)
}

/**
 * Uint8Array -> Uint8Array
 */
export function fromBytes (buf: Uint8Array): Uint8Array {
  const err = validateBytes(buf)
  if (err != null) {
    throw err
  }
  return Uint8Array.from(buf) // copy
}

export function validateBytes (buf: Uint8Array): Error | undefined {
  try {
    bytesToTuples(buf) // try to parse. will throw if breaks
  } catch (err: any) {
    return err
  }
}

export function isValidBytes (buf: Uint8Array): boolean {
  return validateBytes(buf) === undefined
}

export function cleanPath (str: string): string {
  return '/' + str.trim().split('/').filter((a) => a).join('/')
}

export function ParseError (str: string): Error {
  return new Error('Error parsing address: ' + str)
}

export function protoFromTuple (tup: any[]): Protocol {
  const proto = getProtocol(tup[0])
  return proto
}
