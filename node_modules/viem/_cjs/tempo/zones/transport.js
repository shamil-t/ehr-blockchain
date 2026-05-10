"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.http = http;
const http_js_1 = require("../../clients/transports/http.js");
const Storage_ = require("../Storage.js");
function http(url, config = {}) {
    const { storage: storage_, onFetchRequest, ...rest } = config;
    const storage = storage_ ?? Storage_.defaultStorage();
    return (config) => (0, http_js_1.http)(url, {
        ...rest,
        async onFetchRequest(request, init) {
            const next = (await onFetchRequest?.(request, init)) ?? init;
            const headers = new Headers(next.headers);
            const chainId = config.chain?.id;
            if (chainId) {
                const token = (await storage.getItem(`auth:token:${chainId}`)) ?? null;
                if (token)
                    headers.set('X-Authorization-Token', token);
            }
            return { ...next, headers };
        },
    })(config);
}
//# sourceMappingURL=transport.js.map