// can be run in a browser with `polendina --runner=bare-sync --timeout 6000 --cleanup bench.js`
// with additional dependencies for cborg installed here

import assert from 'assert'
import { garbage } from 'ipld-garbage'
import { decode, encode } from '../lib/json/json.js'

let writebuf = ''
const write = process.stdout
  ? process.stdout.write.bind(process.stdout)
  : (str) => {
      writebuf += str
      if (str.endsWith('\n')) {
        console.log(writebuf.replace(/\n$/, ''))
        writebuf = ''
      }
    }

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function jencode (obj) {
  return textEncoder.encode(JSON.stringify(obj))
}

function jdecode (buf) {
  return JSON.parse(textDecoder.decode(buf))
}

function runWith (description, count, targetTime, size, options) {
  const fixtures = []

  console.log(`${description} @ ${count.toLocaleString()}`)
  for (let i = 0; i < count; i++) {
    const obj = garbage(size, options)
    const cbyts = encode(obj)
    /*
    const jbyts = jencode(obj)
    if (Buffer.compare(Buffer.from(cbyts), jbyts) !== 0) {
      console.log(`mismatch for obj: ${JSON.stringify(obj)}`)
      console.log('\tc> ', Buffer.from(cbyts).toString('utf8'))
      console.log('\tj> ', Buffer.from(jbyts).toString('utf8'))
    }
    */
    if (cbyts.length <= size * 2) {
      fixtures.push([obj, cbyts])
    }
  }
  const avgSize = Math.round(fixtures.reduce((p, c) => p + c[1].length, 0) / fixtures.length)

  const enc = (encoder) => {
    for (const [obj, byts] of fixtures) {
      const ebyts = encoder(obj)
      if (byts.length !== ebyts.length) {
        throw new Error('bork')
      }
    }
    return fixtures.length
  }

  const bench = (bfn) => {
    const start = Date.now()
    let opcount = 0
    do {
      opcount += bfn()
    } while (Date.now() - start < targetTime)
    const ops = Math.round(opcount / ((Date.now() - start) / 1000))
    return ops
  }

  const dec = (decoder) => {
    for (const [obj, byts] of fixtures) {
      let cobj
      try {
        cobj = decoder(byts)
      } catch (e) {
        console.log('Failed to decode:', Buffer.from(byts).toString('utf8'))
        throw e
      }
      if (obj != null && typeof obj === 'object') {
        assert.deepStrictEqual(Object.keys(cobj).length, Object.keys(obj).length)
      } else {
        assert.deepStrictEqual(obj, cobj)
      }
    }
    return fixtures.length
  }

  const cmp = (desc, cbfn, bofn) => {
    write(`\t${desc} (avg ${avgSize.toLocaleString()} b):`)
    const cborgOps = bench(cbfn)
    write(` cborg @ ${cborgOps.toLocaleString()} op/s`)
    const jOps = bench(bofn)
    write(` / JSON @ ${jOps.toLocaleString()} op/s`)
    const percent = Math.round((cborgOps / jOps) * 1000) / 10
    write(` = ${(percent).toLocaleString()} %\n`)
    return percent
  }

  return [
    cmp('encode', () => enc(encode), () => enc(jencode)),
    cmp('decode', () => dec(decode), () => dec(jdecode))
  ]
}

const targetTime = 1000
const accum = []
accum.push(runWith('rnd-100', 1000, targetTime, 100, { weights: { CID: 0, bytes: 0 } }))
accum.push(runWith('rnd-300', 1000, targetTime, 300, { weights: { CID: 0, bytes: 0 } }))
accum.push(runWith('rnd-nomap-300', 1000, targetTime, 300, { weights: { CID: 0, bytes: 0, map: 0 } }))
accum.push(runWith('rnd-nolist-300', 1000, targetTime, 300, { weights: { CID: 0, bytes: 0, list: 0 } }))
accum.push(runWith('rnd-nofloat-300', 1000, targetTime, 300, { weights: { CID: 0, bytes: 0, float: 0 } }))
accum.push(runWith('rnd-nomaj7-300', 1000, targetTime, 300, { weights: { CID: 0, bytes: 0, float: 0, null: 0, boolean: 0 } }))
accum.push(runWith('rnd-nostr-300', 1000, targetTime, 300, { weights: { CID: 0, bytes: 0, string: 0 } }))
accum.push(runWith('rnd-nostrbyts-300', 1000, targetTime, 300, { weights: { CID: 0, bytes: 0, string: 0 } }))
accum.push(runWith('rnd-1000', 1000, targetTime, 1000, { weights: { CID: 0, bytes: 0 } }))
accum.push(runWith('rnd-2000', 1000, targetTime, 2000, { weights: { CID: 0, bytes: 0 } }))
accum.push(runWith('rnd-fil-100', 1000, targetTime, 100, { weights: { float: 0, map: 0, CID: 0, bytes: 0 } }))
accum.push(runWith('rnd-fil-300', 1000, targetTime, 300, { weights: { float: 0, map: 0, CID: 0, bytes: 0 } }))
accum.push(runWith('rnd-fil-500', 1000, targetTime, 500, { weights: { float: 0, map: 0, CID: 0, bytes: 0 } }))
accum.push(runWith('rnd-fil-1000', 1000, targetTime, 1000, { weights: { float: 0, map: 0, CID: 0, bytes: 0 } }))
accum.push(runWith('rnd-fil-2000', 1000, targetTime, 2000, { weights: { float: 0, map: 0, CID: 0, bytes: 0 } }))
console.log(`Avg encode: ${Math.round(accum.reduce((p, c) => p + c[0], 0) / accum.length).toLocaleString()} %`)
console.log(`Avg decode: ${Math.round(accum.reduce((p, c) => p + c[1], 0) / accum.length).toLocaleString()} %`)
