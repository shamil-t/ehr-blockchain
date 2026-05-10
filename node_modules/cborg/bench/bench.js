// can be run in a browser with `polendina --runner=bare-sync --timeout 6000 --cleanup bench.js`
// with additional dependencies for cborg installed here

import assert from 'assert'
import { garbage } from 'ipld-garbage'
import { decode, encode } from '../cborg.js'
import borc from 'borc'

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

function runWith (description, count, targetTime, size, options) {
  let borcDecoder = null
  const borcDecode = (bytes) => {
    if (!borcDecoder) {
      // account for initial allocation & setup time in benchmark
      borcDecoder = new borc.Decoder({ size: 10 * 1024 * 1024 })
    }
    return borcDecoder.decodeAll(bytes)[0]
  }

  const fixtures = []

  console.log(`${description} @ ${count.toLocaleString()}`)
  for (let i = 0; i < count; i++) {
    const obj = garbage(size, options)
    const cbyts = encode(obj)
    /*
    const bbyts = borc.encode(obj)
    if (Buffer.compare(Buffer.from(cbyts), bbyts) !== 0) {
      console.log(`mismatch for obj: ${JSON.stringify(obj)}`)
      console.log('\t', Buffer.from(cbyts).toString('hex'))
      console.log('\t', Buffer.from(bbyts).toString('hex'))
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
      const cobj = decoder(byts)
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
    const borcOps = bench(bofn)
    write(` / borc @ ${borcOps.toLocaleString()} op/s`)
    const percent = Math.round((cborgOps / borcOps) * 1000) / 10
    write(` = ${(percent).toLocaleString()} %\n`)
    return percent
  }

  return [
    cmp('encode', () => enc(encode), () => enc(borc.encode)),
    cmp('decode', () => dec(decode), () => dec(borcDecode))
  ]
}

const targetTime = 1000
const accum = []
accum.push(runWith('rnd-100', 1000, targetTime, 100, { weights: { CID: 0 } }))
accum.push(runWith('rnd-300', 1000, targetTime, 300, { weights: { CID: 0 } }))
accum.push(runWith('rnd-nomap-300', 1000, targetTime, 300, { weights: { CID: 0, map: 0 } }))
accum.push(runWith('rnd-nolist-300', 1000, targetTime, 300, { weights: { CID: 0, list: 0 } }))
accum.push(runWith('rnd-nofloat-300', 1000, targetTime, 300, { weights: { CID: 0, float: 0 } }))
accum.push(runWith('rnd-nomaj7-300', 1000, targetTime, 300, { weights: { CID: 0, float: 0, null: 0, boolean: 0 } }))
accum.push(runWith('rnd-nostr-300', 1000, targetTime, 300, { weights: { CID: 0, string: 0, bytes: 0 } }))
accum.push(runWith('rnd-nostrbyts-300', 1000, targetTime, 300, { weights: { CID: 0, string: 0 } }))
accum.push(runWith('rnd-1000', 1000, targetTime, 1000, { weights: { CID: 0 } }))
accum.push(runWith('rnd-2000', 1000, targetTime, 2000, { weights: { CID: 0 } }))
accum.push(runWith('rnd-fil-100', 1000, targetTime, 100, { weights: { float: 0, map: 0, CID: 0 } }))
accum.push(runWith('rnd-fil-300', 1000, targetTime, 300, { weights: { float: 0, map: 0, CID: 0 } }))
accum.push(runWith('rnd-fil-500', 1000, targetTime, 500, { weights: { float: 0, map: 0, CID: 0 } }))
accum.push(runWith('rnd-fil-1000', 1000, targetTime, 1000, { weights: { float: 0, map: 0, CID: 0 } }))
accum.push(runWith('rnd-fil-2000', 1000, targetTime, 2000, { weights: { float: 0, map: 0, CID: 0 } }))
console.log(`Avg encode: ${Math.round(accum.reduce((p, c) => p + c[0], 0) / accum.length).toLocaleString()} %`)
console.log(`Avg decode: ${Math.round(accum.reduce((p, c) => p + c[1], 0) / accum.length).toLocaleString()} %`)
