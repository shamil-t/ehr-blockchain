import path from "node:path";
import process from "node:process";
export function pathFromCwd(thePath) {
    const cwd = process.cwd();
    if (thePath.startsWith(cwd)) {
        return `.${path.sep}${path.relative(process.cwd(), thePath)}`;
    }
    return thePath;
}
//# sourceMappingURL=cwd-relative-path.js.map