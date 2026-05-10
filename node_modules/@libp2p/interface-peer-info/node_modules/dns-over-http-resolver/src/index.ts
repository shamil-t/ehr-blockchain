import debug from 'debug'
import Receptacle from 'receptacle'
import * as utils from './utils.js'
import type { DNSJSON } from './utils'

const log = Object.assign(debug('dns-over-http-resolver'), {
  error: debug('dns-over-http-resolver:error')
})

export interface Request { (resource: string, signal: AbortSignal): Promise<DNSJSON> }

interface ResolverOptions {
  maxCache?: number
  request?: Request
}

/**
 * DNS over HTTP resolver.
 * Uses a list of servers to resolve DNS records with HTTP requests.
 */
class Resolver {
  private readonly _cache: Receptacle<string[]>
  private readonly _TXTcache: Receptacle<string[][]>
  private _servers: string[]
  private readonly _request: Request
  private _abortControllers: AbortController[]

  /**
   * @class
   * @param {object} [options]
   * @param {number} [options.maxCache = 100] - maximum number of cached dns records
   * @param {Request} [options.request] - function to return DNSJSON
   */
  constructor (options: ResolverOptions = {}) {
    this._cache = new Receptacle({ max: options?.maxCache ?? 100 })
    this._TXTcache = new Receptacle({ max: options?.maxCache ?? 100 })
    this._servers = [
      'https://cloudflare-dns.com/dns-query',
      'https://dns.google/resolve'
    ]
    this._request = options.request ?? utils.request
    this._abortControllers = []
  }

  /**
   * Cancel all outstanding DNS queries made by this resolver. Any outstanding
   * requests will be aborted and promises rejected.
   */
  cancel (): void {
    this._abortControllers.forEach(controller => { controller.abort() })
  }

  /**
   * Get an array of the IP addresses currently configured for DNS resolution.
   * These addresses are formatted according to RFC 5952. It can include a custom port.
   */
  getServers (): string[] {
    return this._servers
  }

  /**
   * Get a shuffled array of the IP addresses currently configured for DNS resolution.
   * These addresses are formatted according to RFC 5952. It can include a custom port.
   */
  _getShuffledServers (): string[] {
    const newServers = [...this._servers]

    for (let i = newServers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i)
      const temp = newServers[i]
      newServers[i] = newServers[j]
      newServers[j] = temp
    }

    return newServers
  }

  /**
   * Sets the IP address and port of servers to be used when performing DNS resolution.
   *
   * @param {string[]} servers - array of RFC 5952 formatted addresses.
   */
  setServers (servers: string[]): void {
    this._servers = servers
  }

  /**
   * Uses the DNS protocol to resolve the given host name into the appropriate DNS record
   *
   * @param {string} hostname - host name to resolve
   * @param {string} [rrType = 'A'] - resource record type
   */
  async resolve (hostname: string, rrType: 'TXT'): Promise<string[][]>
  async resolve (hostname: string, rrType: 'A' | 'AAAA'): Promise<string[]>
  async resolve (hostname: string): Promise<string[]>
  async resolve (hostname: string, rrType: string = 'A'): Promise<string[] | string[][]> {
    switch (rrType) {
      case 'A':
        return this.resolve4(hostname)
      case 'AAAA':
        return this.resolve6(hostname)
      case 'TXT':
        return this.resolveTxt(hostname)
      default:
        throw new Error(`${rrType} is not supported`)
    }
  }

  /**
   * Uses the DNS protocol to resolve the given host name into IPv4 addresses
   *
   * @param {string} hostname - host name to resolve
   */
  async resolve4 (hostname: string): Promise<string[]> {
    const recordType = 'A'
    const cached = this._cache.get(utils.getCacheKey(hostname, recordType))
    if (cached != null) {
      return cached
    }
    let aborted = false

    for (const server of this._getShuffledServers()) {
      const controller = new AbortController()
      this._abortControllers.push(controller)

      try {
        const response = await this._request(utils.buildResource(
          server,
          hostname,
          recordType
        ), controller.signal)

        const data = response.Answer.map(a => a.data)
        const ttl = Math.min(...response.Answer.map(a => a.TTL))

        this._cache.set(utils.getCacheKey(hostname, recordType), data, { ttl })

        return data
      } catch (err) {
        if (controller.signal.aborted) {
          aborted = true
        }

        log.error(`${server} could not resolve ${hostname} record ${recordType}`)
      } finally {
        this._abortControllers = this._abortControllers.filter(c => c !== controller)
      }
    }

    if (aborted) {
      throw Object.assign(new Error('queryA ECANCELLED'), {
        code: 'ECANCELLED'
      })
    }

    throw new Error(`Could not resolve ${hostname} record ${recordType}`)
  }

  /**
   * Uses the DNS protocol to resolve the given host name into IPv6 addresses
   *
   * @param {string} hostname - host name to resolve
   */
  async resolve6 (hostname: string): Promise<string[]> {
    const recordType = 'AAAA'
    const cached = this._cache.get(utils.getCacheKey(hostname, recordType))
    if (cached != null) {
      return cached
    }
    let aborted = false

    for (const server of this._getShuffledServers()) {
      const controller = new AbortController()
      this._abortControllers.push(controller)

      try {
        const response = await this._request(utils.buildResource(
          server,
          hostname,
          recordType
        ), controller.signal)

        const data = response.Answer.map(a => a.data)
        const ttl = Math.min(...response.Answer.map(a => a.TTL))

        this._cache.set(utils.getCacheKey(hostname, recordType), data, { ttl })

        return data
      } catch (err) {
        if (controller.signal.aborted) {
          aborted = true
        }

        log.error(`${server} could not resolve ${hostname} record ${recordType}`)
      } finally {
        this._abortControllers = this._abortControllers.filter(c => c !== controller)
      }
    }

    if (aborted) {
      throw Object.assign(new Error('queryAaaa ECANCELLED'), {
        code: 'ECANCELLED'
      })
    }

    throw new Error(`Could not resolve ${hostname} record ${recordType}`)
  }

  /**
   * Uses the DNS protocol to resolve the given host name into a Text record
   *
   * @param {string} hostname - host name to resolve
   */
  async resolveTxt (hostname: string): Promise<string[][]> {
    const recordType = 'TXT'
    const cached = this._TXTcache.get(utils.getCacheKey(hostname, recordType))
    if (cached != null) {
      return cached
    }
    let aborted = false

    for (const server of this._getShuffledServers()) {
      const controller = new AbortController()
      this._abortControllers.push(controller)

      try {
        const response = await this._request(utils.buildResource(
          server,
          hostname,
          recordType
        ), controller.signal)

        const data = response.Answer.map(a => [a.data.replace(/['"]+/g, '')])
        const ttl = Math.min(...response.Answer.map(a => a.TTL))

        this._TXTcache.set(utils.getCacheKey(hostname, recordType), data, { ttl })

        return data
      } catch (err) {
        if (controller.signal.aborted) {
          aborted = true
        }

        log.error(`${server} could not resolve ${hostname} record ${recordType}`)
      } finally {
        this._abortControllers = this._abortControllers.filter(c => c !== controller)
      }
    }

    if (aborted) {
      throw Object.assign(new Error('queryTxt ECANCELLED'), {
        code: 'ECANCELLED'
      })
    }

    throw new Error(`Could not resolve ${hostname} record ${recordType}`)
  }

  clearCache (): void {
    this._cache.clear()
    this._TXTcache.clear()
  }
}

export default Resolver
