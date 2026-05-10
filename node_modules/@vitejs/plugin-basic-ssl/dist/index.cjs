'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const path = require('node:path');
const node_fs = require('node:fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e["default"] : e; }

const path__default = /*#__PURE__*/_interopDefaultLegacy(path);

const defaultCacheDir = "node_modules/.vite";
function viteBasicSslPlugin() {
  return {
    name: "vite:basic-ssl",
    async configResolved(config) {
      const certificate = await getCertificate((config.cacheDir ?? defaultCacheDir) + "/basic-ssl");
      const https = () => ({ cert: certificate, key: certificate });
      config.server.https = Object.assign({}, config.server.https, https());
      config.preview.https = Object.assign({}, config.preview.https, https());
    }
  };
}
async function getCertificate(cacheDir) {
  const cachePath = path__default.join(cacheDir, "_cert.pem");
  try {
    const [stat, content] = await Promise.all([
      node_fs.promises.stat(cachePath),
      node_fs.promises.readFile(cachePath, "utf8")
    ]);
    if (Date.now() - stat.ctime.valueOf() > 30 * 24 * 60 * 60 * 1e3) {
      throw new Error("cache is outdated.");
    }
    return content;
  } catch {
    const content = (await import('./chunks/certificate.cjs')).createCertificate();
    node_fs.promises.mkdir(cacheDir, { recursive: true }).then(() => node_fs.promises.writeFile(cachePath, content)).catch(() => {
    });
    return content;
  }
}

module.exports = viteBasicSslPlugin;
module.exports["default"] = viteBasicSslPlugin;
module.exports.getCertificate = getCertificate;