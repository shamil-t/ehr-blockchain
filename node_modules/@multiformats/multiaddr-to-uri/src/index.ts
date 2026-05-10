import { multiaddr, protocols } from '@multiformats/multiaddr'
import type { Multiaddr, StringTuple } from '@multiformats/multiaddr'

export interface MultiaddrToUriOpts {
  assumeHttp?: boolean
}

interface Interpreter { (value: string, ma: StringTuple[]): string }

function extractSNI (ma: StringTuple[]): string | null {
  let sniProtoCode: number
  try {
    sniProtoCode = protocols('sni').code
  } catch (e) {
    // No SNI protocol in multiaddr
    return null
  }
  for (const [proto, value] of ma) {
    if (proto === sniProtoCode && value !== undefined) {
      return value
    }
  }
  return null
}

function hasTLS (ma: StringTuple[]): boolean {
  return ma.some(([proto, _]) => proto === protocols('tls').code)
}

function interpretNext (headProtoCode: number, headProtoVal: string, restMa: StringTuple[]): string {
  const interpreter = interpreters[protocols(headProtoCode).name]
  if (interpreter === undefined) {
    throw new Error(`Can't interpret protocol ${protocols(headProtoCode).name}`)
  }
  const restVal = interpreter(headProtoVal, restMa)
  if (headProtoCode === protocols('ip6').code) {
    return `[${restVal}]`
  }
  return restVal
}

const interpreters: Record<string, Interpreter> = {
  ip4: (value: string, restMa: StringTuple[]) => value,
  ip6: (value: string, restMa: StringTuple[]) => {
    if (restMa.length === 0) {
      return value
    }
    return `[${value}]`
  },
  tcp: (value: string, restMa: StringTuple[]) => {
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    return `tcp://${interpretNext(tailProto[0], tailProto[1] ?? '', restMa)}:${value}`
  },
  udp: (value: string, restMa: StringTuple[]) => {
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    return `udp://${interpretNext(tailProto[0], tailProto[1] ?? '', restMa)}:${value}`
  },
  dnsaddr: (value: string, restMa: StringTuple[]) => value,
  dns4: (value: string, restMa: StringTuple[]) => value,
  dns6: (value: string, restMa: StringTuple[]) => value,
  dns: (value: string, restMa: StringTuple[]) => value,
  ipfs: (value: string, restMa: StringTuple[]) => {
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    return `${interpretNext(tailProto[0], tailProto[1] ?? '', restMa)}/ipfs/${value}`
  },
  p2p: (value: string, restMa: StringTuple[]) => {
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    return `${interpretNext(tailProto[0], tailProto[1] ?? '', restMa)}/p2p/${value}`
  },
  http: (value: string, restMa: StringTuple[]) => {
    const maHasTLS = hasTLS(restMa)
    const sni = extractSNI(restMa)
    if (maHasTLS && sni !== null) {
      return `https://${sni}`
    }
    const protocol = maHasTLS ? 'https://' : 'http://'
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    let baseVal = interpretNext(tailProto[0], tailProto[1] ?? '', restMa)
    // We are reinterpreting the base as http, so we need to remove the tcp:// if it's there
    baseVal = baseVal.replace('tcp://', '')
    return `${protocol}${baseVal}`
  },
  tls: (value: string, restMa: StringTuple[]) => {
    // Noop, the parent context knows that it's tls. We don't need to do
    // anything here
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    return interpretNext(tailProto[0], tailProto[1] ?? '', restMa)
  },
  sni: (value: string, restMa: StringTuple[]) => {
    // Noop, the parent context uses the sni information, we don't need to do
    // anything here
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    return interpretNext(tailProto[0], tailProto[1] ?? '', restMa)
  },
  https: (value: string, restMa: StringTuple[]) => {
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    let baseVal = interpretNext(tailProto[0], tailProto[1] ?? '', restMa)
    // We are reinterpreting the base as http, so we need to remove the tcp:// if it's there
    baseVal = baseVal.replace('tcp://', '')
    return `https://${baseVal}`
  },
  ws: (value: string, restMa: StringTuple[]) => {
    const maHasTLS = hasTLS(restMa)
    const sni = extractSNI(restMa)
    if (maHasTLS && sni !== null) {
      return `wss://${sni}`
    }
    const protocol = maHasTLS ? 'wss://' : 'ws://'
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    let baseVal = interpretNext(tailProto[0], tailProto[1] ?? '', restMa)
    // We are reinterpreting the base, so we need to remove the tcp:// if it's there
    baseVal = baseVal.replace('tcp://', '')
    return `${protocol}${baseVal}`
  },
  wss: (value: string, restMa: StringTuple[]) => {
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    let baseVal = interpretNext(tailProto[0], tailProto[1] ?? '', restMa)
    // We are reinterpreting the base as http, so we need to remove the tcp:// if it's there
    baseVal = baseVal.replace('tcp://', '')
    return `wss://${baseVal}`
  },
  'p2p-websocket-star': (value: string, restMa: StringTuple[]) => {
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    return `${interpretNext(tailProto[0], tailProto[1] ?? '', restMa)}/p2p-websocket-star`
  },
  'p2p-webrtc-star': (value: string, restMa: StringTuple[]) => {
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    return `${interpretNext(tailProto[0], tailProto[1] ?? '', restMa)}/p2p-webrtc-star`
  },
  'p2p-webrtc-direct': (value: string, restMa: StringTuple[]) => {
    const tailProto = restMa.pop()
    if (tailProto === undefined) {
      throw new Error('Unexpected end of multiaddr')
    }
    return `${interpretNext(tailProto[0], tailProto[1] ?? '', restMa)}/p2p-webrtc-direct`
  }
}

export function multiaddrToUri (input: Multiaddr | string | Uint8Array, opts?: MultiaddrToUriOpts): string {
  const ma = multiaddr(input)
  const parts = ma.stringTuples()
  const head = parts.pop()
  if (head === undefined) {
    throw new Error('Unexpected end of multiaddr')
  }

  const protocol = protocols(head[0])
  const interpreter = interpreters[protocol.name]

  if (interpreter == null) {
    throw new Error(`No interpreter found for ${protocol.name}`)
  }

  let uri = interpreter(head[1] ?? '', parts)
  if (opts?.assumeHttp !== false && head[0] === protocols('tcp').code) {
    // If rightmost proto is tcp, we assume http here
    uri = uri.replace('tcp://', 'http://')
    if (head[1] === '443' || head[1] === '80') {
      if (head[1] === '443') {
        uri = uri.replace('http://', 'https://')
      }
      // Drop the port
      uri = uri.substring(0, uri.lastIndexOf(':'))
    }
  }

  return uri
}
