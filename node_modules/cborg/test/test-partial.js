/* eslint-env mocha */

import chai from 'chai'
import { garbage } from 'ipld-garbage'
import { uintBoundaries } from '../lib/0uint.js'
import { encode, decodeFirst } from '../cborg.js'
import { dateDecoder, dateEncoder } from './common.js'

const { assert } = chai

function verifyPartial (objects, options) {
  const encoded = []
  const lengths = []
  let length = 0
  for (const object of Array.isArray(objects) ? objects : [objects]) {
    encoded.push(encode(object, options))
    const l = encoded[encoded.length - 1].length
    length += l
    lengths.push(l)
  }
  const buf = new Uint8Array(length)
  let offset = 0
  for (const enc of encoded) {
    buf.set(enc, offset)
    offset += enc.length
  }
  let partial = buf
  for (let ii = 0; ii < encoded.length; ii++) {
    const [decoded, remainder] = decodeFirst(partial, options)
    assert.deepEqual(decoded, objects[ii])
    assert.equal(remainder.length, partial.length - lengths[ii])
    partial = remainder
  }
  assert.equal(partial.length, 0) // just to be sure
}

describe('decodePartial', () => {
  describe('multiple', () => {
    it('simple', () => {
      verifyPartial([1, 2, 3])
      verifyPartial([8.940696716308594e-08, 1])
      verifyPartial([
        [],
        [1, 2, { obj: 1.5 }, null, new Uint8Array([1, 2, 3])],
        { boop: true, bop: 1 },
        'nope',
        { o: 'nope' },
        new Uint8Array([1, 2, 3]),
        true,
        null
      ])
    })

    it('options', () => {
      const m = new Map()
      m.set('a', 1)
      m.set('b', null)
      m.set('c', 'grok')
      m.set('date', new Date('2013-03-21T20:04:00Z'))
      verifyPartial(
        [8.940696716308594e-08, 1, null, 'grok', new Date('2013-03-21T20:04:00Z'),
          [8.940696716308594e-08, 1, null, 'grok', new Date('2013-03-21T20:04:00Z')],
          m
        ],
        { typeEncoders: { Date: dateEncoder }, useMaps: true, tags: { 0: dateDecoder } })
    })

    it('garbage', function () {
      this.timeout(10000)
      for (let ii = 0; ii < 10; ii++) {
        const gbg = []
        for (let ii = 0; ii < 100; ii++) {
          gbg.push(garbage(1 << 6, { weights: { CID: 0 } }))
        }
        verifyPartial(gbg)
      }
    })
  })

  it('singular', () => {
    it('int boundaries', () => {
      for (let ii = 0; ii < 4; ii++) {
        verifyPartial(uintBoundaries[ii])
        verifyPartial(uintBoundaries[ii] - 1)
        verifyPartial(uintBoundaries[ii] + 1)
        verifyPartial(-1 * uintBoundaries[ii])
        verifyPartial(-1 * uintBoundaries[ii] - 1)
        verifyPartial(-1 * uintBoundaries[ii] + 1)
      }
    })

    it('tags', () => {
      verifyPartial({ date: new Date('2013-03-21T20:04:00Z') }, { typeEncoders: { Date: dateEncoder } })
    })

    it('floats', () => {
      verifyPartial(0.5)
      verifyPartial(0.5, { float64: true })
      verifyPartial(8.940696716308594e-08)
      verifyPartial(8.940696716308594e-08, { float64: true })
    })

    it('small garbage', function () {
      this.timeout(10000)
      for (let ii = 0; ii < 1000; ii++) {
        const gbg = garbage(1 << 6, { weights: { CID: 0 } })
        verifyPartial(gbg)
      }
    })
  })
})
