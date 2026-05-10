'use strict'

const fsp = require('fs').promises
const fs = require('fs')
const glob = require('it-glob')
const Path = require('path')
const errCode = require('err-code')

/**
 * Create an async iterator that yields paths that match requested glob pattern
 *
 * @param {string} cwd - The directory to start matching the pattern in
 * @param {string} pattern - Glob pattern to match
 * @param {import('../types').GlobSourceOptions} [options] - Optional options
 * @returns {AsyncGenerator<import('../types').GlobSourceResult, void, unknown>} File objects that match glob
 */
module.exports = async function * globSource (cwd, pattern, options) {
  options = options || {}

  if (typeof pattern !== 'string') {
    throw errCode(
      new Error('Pattern must be a string'),
      'ERR_INVALID_PATH',
      { pattern }
    )
  }

  if (!Path.isAbsolute(cwd)) {
    cwd = Path.resolve(process.cwd(), cwd)
  }

  const globOptions = Object.assign({}, {
    nodir: false,
    realpath: false,
    absolute: true,
    dot: Boolean(options.hidden),
    follow: options.followSymlinks != null ? options.followSymlinks : true
  })

  for await (const p of glob(cwd, pattern, globOptions)) {
    const stat = await fsp.stat(p)

    let mode = options.mode

    if (options.preserveMode) {
      mode = stat.mode
    }

    let mtime = options.mtime

    if (options.preserveMtime) {
      mtime = stat.mtime
    }

    yield {
      path: toPosix(p.replace(cwd, '')),
      content: stat.isFile() ? fs.createReadStream(p) : undefined,
      mode,
      mtime
    }
  }
}

/**
 * @param {string} path
 */
const toPosix = path => path.replace(/\\/g, '/')
