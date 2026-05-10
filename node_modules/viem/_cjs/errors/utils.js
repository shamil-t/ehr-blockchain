"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUrl = exports.getContractAddress = void 0;
const getContractAddress = (address) => address;
exports.getContractAddress = getContractAddress;
const getUrl = (url) => {
    try {
        const parsed = new URL(url);
        if (!parsed.username && !parsed.password)
            return url;
        parsed.username = '';
        parsed.password = '';
        return parsed.toString();
    }
    catch {
        return url;
    }
};
exports.getUrl = getUrl;
//# sourceMappingURL=utils.js.map