/**
 * Build fetch resource for request
 */
export function buildResource (serverResolver: string, hostname: string, recordType: string): string {
  return `${serverResolver}?name=${hostname}&type=${recordType}`
}

export interface DNSJSON {
  Question: Question[]
  Answer: Answer[]
}

interface Question {
  name: string
  type: number
}

interface Answer {
  name: string
  type: number
  data: string
  TTL: number
}

/**
 * Use fetch to find the record
 */
export async function request (resource: string, signal: AbortSignal): Promise<DNSJSON> {
  const req = await fetch(resource, {
    headers: new Headers({
      accept: 'application/dns-json'
    }),
    signal
  })
  const res = await req.json()

  return res as DNSJSON
}

/**
 * Creates cache key composed by recordType and hostname
 *
 * @param {string} hostname
 * @param {string} recordType
 */
export function getCacheKey (hostname: string, recordType: string): string {
  return `${recordType}_${hostname}`
}
