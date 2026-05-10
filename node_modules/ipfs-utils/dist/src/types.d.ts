import type { Readable as NodeReadableStream } from 'stream'
import type { MtimeLike } from 'ipfs-unixfs'

interface ProgressStatus {
  total: number
  loaded: number
  lengthComputable: boolean
}

export interface ProgressFn { (status: ProgressStatus): void }

type Override<T, R> = Omit<T, keyof R> & R

export type FetchOptions = Override<RequestInit, {
  /**
   * Extended body with support for node readable stream
   */
  body?: BodyInit | null | NodeReadableStream
  /**
   * Amount of time until request should timeout in ms.
   */
  timeout?: number
  /**
   * URL search param.
   */
  searchParams?: URLSearchParams
  /**
   * Can be passed to track upload progress.
   * Note that if this option in passed underlying request will be performed using `XMLHttpRequest` and response will not be streamed.
   */
  onUploadProgress?: ProgressFn
  /**
   * Can be passed to track download progress.
   */
  onDownloadProgress?: ProgressFn
  overrideMimeType?: string
}>

export interface HTTPOptions extends FetchOptions {
  json?: any
  /**
   * The base URL to use in case url is a relative URL
   */
  base?: string
  /**
   * Throw not ok responses as Errors
   */
  throwHttpErrors?: boolean
  /**
   * Transform search params
   */
  transformSearchParams?: (params: URLSearchParams) => URLSearchParams
  /**
   * When iterating the response body, transform each chunk with this function.
   */
  transform?: (chunk: any) => any
  /**
   * Handle errors
   */
  handleError?: (rsp: Response) => Promise<void>
}

export interface ExtendedResponse extends Response {
  iterator: () => AsyncGenerator<Uint8Array, void, undefined>

  ndjson: () => AsyncGenerator<any, void, undefined>
}

export interface GlobSourceOptions {
  /**
   * Include .dot files in matched paths
   */
  hidden?: boolean

  /**
   * follow symlinks
   */
  followSymlinks?: boolean

  /**
   * Preserve mode
   */
  preserveMode?: boolean

  /**
   * Preserve mtime
   */
  preserveMtime?: boolean

  /**
   * mode to use - if preserveMode is true this will be ignored
   */
  mode?: number

  /**
   * mtime to use - if preserveMtime is true this will be ignored
   */
  mtime?: MtimeLike
}

export interface GlobSourceResult {
  path: string
  content: AsyncIterable<Uint8Array> | undefined
  mode: number | undefined
  mtime: MtimeLike | undefined
}
