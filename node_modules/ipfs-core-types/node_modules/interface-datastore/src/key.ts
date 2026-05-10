
import { nanoid } from 'nanoid'
import { SupportedEncodings, toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'

const pathSepS = '/'
const pathSepB = new TextEncoder().encode(pathSepS)
const pathSep = pathSepB[0]

/**
 * A Key represents the unique identifier of an object.
 * Our Key scheme is inspired by file systems and Google App Engine key model.
 * Keys are meant to be unique across a system. Keys are hierarchical,
 * incorporating more and more specific namespaces. Thus keys can be deemed
 * 'children' or 'ancestors' of other keys:
 * - `new Key('/Comedy')`
 * - `new Key('/Comedy/MontyPython')`
 * Also, every namespace can be parametrized to embed relevant object
 * information. For example, the Key `name` (most specific namespace) could
 * include the object type:
 * - `new Key('/Comedy/MontyPython/Actor:JohnCleese')`
 * - `new Key('/Comedy/MontyPython/Sketch:CheeseShop')`
 * - `new Key('/Comedy/MontyPython/Sketch:CheeseShop/Character:Mousebender')`
 *
 */
export class Key {
  private _buf: Uint8Array

  /**
   * @param {string | Uint8Array} s
   * @param {boolean} [clean]
   */
  constructor (s: string | Uint8Array, clean?: boolean) {
    if (typeof s === 'string') {
      this._buf = uint8ArrayFromString(s)
    } else if (s instanceof Uint8Array) {
      this._buf = s
    } else {
      throw new Error('Invalid key, should be String of Uint8Array')
    }

    if (clean == null) {
      clean = true
    }

    if (clean) {
      this.clean()
    }

    if (this._buf.byteLength === 0 || this._buf[0] !== pathSep) {
      throw new Error('Invalid key')
    }
  }

  /**
   * Convert to the string representation
   *
   * @param {import('uint8arrays/to-string').SupportedEncodings} [encoding='utf8'] - The encoding to use.
   * @returns {string}
   */
  toString (encoding: SupportedEncodings = 'utf8'): string {
    return uint8ArrayToString(this._buf, encoding)
  }

  /**
   * Return the Uint8Array representation of the key
   *
   * @returns {Uint8Array}
   */
  uint8Array (): Uint8Array {
    return this._buf
  }

  /**
   * Return string representation of the key
   *
   * @returns {string}
   */
  get [Symbol.toStringTag] (): string {
    return `Key(${this.toString()})`
  }

  /**
   * Constructs a key out of a namespace array.
   *
   * @param {Array<string>} list - The array of namespaces
   * @returns {Key}
   *
   * @example
   * ```js
   * Key.withNamespaces(['one', 'two'])
   * // => Key('/one/two')
   * ```
   */
  static withNamespaces (list: string[]): Key {
    return new Key(list.join(pathSepS))
  }

  /**
   * Returns a randomly (uuid) generated key.
   *
   * @returns {Key}
   *
   * @example
   * ```js
   * Key.random()
   * // => Key('/f98719ea086343f7b71f32ea9d9d521d')
   * ```
   */
  static random (): Key {
    return new Key(nanoid().replace(/-/g, ''))
  }

  /**
   * @param {*} other
   */
  static asKey (other: any): Key | null {
    if (other instanceof Uint8Array || typeof other === 'string') {
      // we can create a key from this
      return new Key(other)
    }

    if (typeof other.uint8Array === 'function') {
      // this is an older version or may have crossed the esm/cjs boundary
      return new Key(other.uint8Array())
    }

    return null
  }

  /**
   * Cleanup the current key
   *
   * @returns {void}
   */
  clean (): void {
    if (this._buf == null || this._buf.byteLength === 0) {
      this._buf = pathSepB
    }

    if (this._buf[0] !== pathSep) {
      const bytes = new Uint8Array(this._buf.byteLength + 1)
      bytes.fill(pathSep, 0, 1)
      bytes.set(this._buf, 1)
      this._buf = bytes
    }

    // normalize does not remove trailing slashes
    while (this._buf.byteLength > 1 && this._buf[this._buf.byteLength - 1] === pathSep) {
      this._buf = this._buf.subarray(0, -1)
    }
  }

  /**
   * Check if the given key is sorted lower than ourself.
   *
   * @param {Key} key - The other Key to check against
   * @returns {boolean}
   */
  less (key: Key): boolean {
    const list1 = this.list()
    const list2 = key.list()

    for (let i = 0; i < list1.length; i++) {
      if (list2.length < i + 1) {
        return false
      }

      const c1 = list1[i]
      const c2 = list2[i]

      if (c1 < c2) {
        return true
      } else if (c1 > c2) {
        return false
      }
    }

    return list1.length < list2.length
  }

  /**
   * Returns the key with all parts in reversed order.
   *
   * @returns {Key}
   *
   * @example
   * ```js
   * new Key('/Comedy/MontyPython/Actor:JohnCleese').reverse()
   * // => Key('/Actor:JohnCleese/MontyPython/Comedy')
   * ```
   */
  reverse (): Key {
    return Key.withNamespaces(this.list().slice().reverse())
  }

  /**
   * Returns the `namespaces` making up this Key.
   *
   * @returns {Array<string>}
   */
  namespaces (): string[] {
    return this.list()
  }

  /** Returns the "base" namespace of this key.
   *
   * @returns {string}
   *
   * @example
   * ```js
   * new Key('/Comedy/MontyPython/Actor:JohnCleese').baseNamespace()
   * // => 'Actor:JohnCleese'
   * ```
   */
  baseNamespace (): string {
    const ns = this.namespaces()
    return ns[ns.length - 1]
  }

  /**
   * Returns the `list` representation of this key.
   *
   * @returns {Array<string>}
   *
   * @example
   * ```js
   * new Key('/Comedy/MontyPython/Actor:JohnCleese').list()
   * // => ['Comedy', 'MontyPythong', 'Actor:JohnCleese']
   * ```
   */
  list (): string[] {
    return this.toString().split(pathSepS).slice(1)
  }

  /**
   * Returns the "type" of this key (value of last namespace).
   *
   * @returns {string}
   *
   * @example
   * ```js
   * new Key('/Comedy/MontyPython/Actor:JohnCleese').type()
   * // => 'Actor'
   * ```
   */
  type (): string {
    return namespaceType(this.baseNamespace())
  }

  /**
   * Returns the "name" of this key (field of last namespace).
   *
   * @returns {string}
   *
   * @example
   * ```js
   * new Key('/Comedy/MontyPython/Actor:JohnCleese').name()
   * // => 'JohnCleese'
   * ```
   */
  name (): string {
    return namespaceValue(this.baseNamespace())
  }

  /**
   * Returns an "instance" of this type key (appends value to namespace).
   *
   * @param {string} s - The string to append.
   * @returns {Key}
   *
   * @example
   * ```js
   * new Key('/Comedy/MontyPython/Actor').instance('JohnClesse')
   * // => Key('/Comedy/MontyPython/Actor:JohnCleese')
   * ```
   */
  instance (s: string): Key {
    return new Key(this.toString() + ':' + s)
  }

  /**
   * Returns the "path" of this key (parent + type).
   *
   * @returns {Key}
   *
   * @example
   * ```js
   * new Key('/Comedy/MontyPython/Actor:JohnCleese').path()
   * // => Key('/Comedy/MontyPython/Actor')
   * ```
   */
  path (): Key {
    let p = this.parent().toString()
    if (!p.endsWith(pathSepS)) {
      p += pathSepS
    }
    p += this.type()
    return new Key(p)
  }

  /**
   * Returns the `parent` Key of this Key.
   *
   * @returns {Key}
   *
   * @example
   * ```js
   * new Key("/Comedy/MontyPython/Actor:JohnCleese").parent()
   * // => Key("/Comedy/MontyPython")
   * ```
   */
  parent (): Key {
    const list = this.list()
    if (list.length === 1) {
      return new Key(pathSepS)
    }

    return new Key(list.slice(0, -1).join(pathSepS))
  }

  /**
   * Returns the `child` Key of this Key.
   *
   * @param {Key} key - The child Key to add
   * @returns {Key}
   *
   * @example
   * ```js
   * new Key('/Comedy/MontyPython').child(new Key('Actor:JohnCleese'))
   * // => Key('/Comedy/MontyPython/Actor:JohnCleese')
   * ```
   */
  child (key: Key): Key {
    if (this.toString() === pathSepS) {
      return key
    } else if (key.toString() === pathSepS) {
      return this
    }

    return new Key(this.toString() + key.toString(), false)
  }

  /**
   * Returns whether this key is a prefix of `other`
   *
   * @param {Key} other - The other key to test against
   * @returns {boolean}
   *
   * @example
   * ```js
   * new Key('/Comedy').isAncestorOf('/Comedy/MontyPython')
   * // => true
   * ```
   */
  isAncestorOf (other: Key): boolean {
    if (other.toString() === this.toString()) {
      return false
    }

    return other.toString().startsWith(this.toString())
  }

  /**
   * Returns whether this key is a contains another as prefix.
   *
   * @param {Key} other - The other Key to test against
   * @returns {boolean}
   *
   * @example
   * ```js
   * new Key('/Comedy/MontyPython').isDecendantOf('/Comedy')
   * // => true
   * ```
   */
  isDecendantOf (other: Key): boolean {
    if (other.toString() === this.toString()) {
      return false
    }

    return this.toString().startsWith(other.toString())
  }

  /**
   * Checks if this key has only one namespace.
   *
   * @returns {boolean}
   *
   */
  isTopLevel (): boolean {
    return this.list().length === 1
  }

  /**
   * Concats one or more Keys into one new Key.
   *
   * @param {Array<Key>} keys - The array of keys to concatenate
   * @returns {Key}
   */
  concat (...keys: Key[]): Key {
    return Key.withNamespaces([...this.namespaces(), ...flatten(keys.map(key => key.namespaces()))])
  }
}

/**
 * The first component of a namespace. `foo` in `foo:bar`
 *
 * @param {string} ns
 * @returns {string}
 */
function namespaceType (ns: string): string {
  const parts = ns.split(':')
  if (parts.length < 2) {
    return ''
  }
  return parts.slice(0, -1).join(':')
}

/**
 * The last component of a namespace, `baz` in `foo:bar:baz`.
 *
 * @param {string} ns
 * @returns {string}
 */
function namespaceValue (ns: string): string {
  const parts = ns.split(':')
  return parts[parts.length - 1]
}

/**
 * Flatten array of arrays (only one level)
 *
 * @template T
 * @param {Array<any>} arr
 * @returns {T[]}
 */
function flatten (arr: any[]): string[] {
  return ([]).concat(...arr)
}
