"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = resolve;
exports.resolveNode = resolveNode;
exports.resolveBrowser = resolveBrowser;
const Errors = require("../../core/Errors.js");
let cachedPool;
const isNode = typeof globalThis.process !== 'undefined' &&
    typeof globalThis.process.versions?.node === 'string';
async function resolve() {
    if (cachedPool)
        return cachedPool;
    cachedPool = isNode ? await resolveNode() : await resolveBrowser();
    return cachedPool;
}
async function resolveNode() {
    const id = 'node:worker_threads';
    const { Worker } = await Promise.resolve(`${id}`).then(s => require(s));
    const { wasmBase64 } = await Promise.resolve().then(() => require('./mine.wasm.js'));
    const workerSource = getNodeWorkerSource();
    return {
        spawn(index, onMessage, onError) {
            const worker = new Worker(workerSource, {
                eval: true,
                workerData: {
                    wasmBase64,
                    workerIndex: index,
                },
            });
            worker.on('message', (msg) => onMessage(msg));
            worker.on('error', (err) => onError(err));
            worker.on('exit', (code) => {
                if (code !== 0)
                    onError(new Errors.BaseError(`A salt mining worker exited with code "${code}".`));
            });
            return {
                postMessage(data) {
                    worker.postMessage(data);
                },
                terminate() {
                    void worker.terminate().catch(() => { });
                },
            };
        },
    };
}
async function resolveBrowser() {
    if (typeof globalThis.Worker === 'undefined')
        return undefined;
    if (typeof globalThis.Blob === 'undefined')
        return undefined;
    const { wasmBase64 } = await Promise.resolve().then(() => require('./mine.wasm.js'));
    const source = getBrowserWorkerSource(wasmBase64);
    const blob = new Blob([source], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    return {
        spawn(_index, onMessage, onError) {
            const worker = new globalThis.Worker(url);
            worker.onmessage = (e) => onMessage(e.data);
            worker.onerror = (e) => onError(e.error);
            return {
                postMessage(data) {
                    worker.postMessage(data);
                },
                terminate() {
                    worker.terminate();
                },
            };
        },
    };
}
function getBrowserWorkerSource(wasmBase64) {
    return `
'use strict'

${getWorkerMineLoop()}

var binary = Uint8Array.from(atob(${JSON.stringify(wasmBase64)}), function(c) { return c.charCodeAt(0) })

WebAssembly.instantiate(binary).then(function(result) {
  var wasm = result.instance.exports
  var mem = new Uint8Array(wasm.memory.buffer)

  self.onmessage = function(e) {
    if (e.data.type !== 'start') return
    mineLoop(e.data, wasm, mem, function(msg) { self.postMessage(msg) })
  }
}).catch(function(error) {
  self.postMessage({ type: 'error', message: error && error.message || String(error) })
})
`;
}
function getNodeWorkerSource() {
    return `
'use strict'
var { parentPort, workerData } = require('node:worker_threads')

${getWorkerMineLoop()}

async function main() {
  var binary = Buffer.from(workerData.wasmBase64, 'base64')
  var { instance } = await WebAssembly.instantiate(binary)
  var wasm = instance.exports
  var mem = new Uint8Array(wasm.memory.buffer)

  parentPort.on('message', function(data) {
    if (data.type !== 'start') return
    mineLoop(data, wasm, mem, function(msg) { parentPort.postMessage(msg) })
  })
}

main().catch(function(error) {
  parentPort.postMessage({ type: 'error', message: error && error.message || String(error) })
})
`;
}
function getWorkerMineLoop() {
    return `
var dataOffset = 1024

function hexToBytes(hex) {
  var h = hex.startsWith('0x') ? hex.slice(2) : hex
  var bytes = new Uint8Array(h.length / 2)
  for (var i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

function bytesToHex(bytes) {
  var hex = '0x'
  for (var i = 0; i < bytes.length; i++)
    hex += bytes[i].toString(16).padStart(2, '0')
  return hex
}

function bigIntToBytes32(value, out, offset) {
  var v = value
  for (var i = 31; i >= 0; i--) {
    out[offset + i] = Number(v & 0xFFn)
    v >>= 8n
  }
}

function mineLoop(data, wasm, mem, postMessage) {
  var addressBytes = hexToBytes(data.address)
  var chunkSize = data.chunkSize
  var count = data.count
  var workerCount = data.workerCount
  var workerIndex = data.workerIndex
  var startBigInt = BigInt(data.start)

  mem.set(addressBytes, dataOffset)

  for (
    var chunkIdx = workerIndex;
    chunkIdx * chunkSize < count;
    chunkIdx += workerCount
  ) {
    var chunkStart = chunkIdx * chunkSize
    var limit = Math.min(chunkSize, count - chunkStart)

    bigIntToBytes32(startBigInt + BigInt(chunkStart), mem, dataOffset + 20)

    var found = wasm.mine(limit)

    if (found) {
      var hashOut = mem.slice(dataOffset + 52, dataOffset + 84)
      var salt = mem.slice(dataOffset + 20, dataOffset + 52)
      postMessage({
        type: 'found',
        result: {
          masterId: bytesToHex(hashOut.subarray(4, 8)),
          registrationHash: bytesToHex(hashOut),
          salt: bytesToHex(salt),
        },
      })
      return
    }

    postMessage({ type: 'progress', attempts: limit })
  }

  postMessage({ type: 'done' })
}
`;
}
//# sourceMappingURL=virtualMasterPool.js.map