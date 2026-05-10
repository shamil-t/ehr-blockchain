import { fileURLToPath } from "node:url";
export function getFilePath(filePathOrUrl) {
    if (filePathOrUrl.startsWith("file://")) {
        try {
            // This can throw on Windows if the url is malformed,
            // so we catch it and return undefined
            return fileURLToPath(filePathOrUrl);
        }
        catch (_) {
            return undefined;
        }
    }
    return filePathOrUrl;
}
//# sourceMappingURL=package.js.map