import { emptyDir, remove } from "@nomicfoundation/hardhat-utils/fs";
import { getCacheDir } from "@nomicfoundation/hardhat-utils/global-dir";
const cleanAction = async ({ global }, { config, hooks }) => {
    if (global) {
        const globalCacheDir = await getCacheDir();
        await emptyDir(globalCacheDir);
    }
    await emptyDir(config.paths.cache);
    await remove(config.paths.artifacts);
    await hooks.runParallelHandlers("clean", "onClean", []);
};
export default cleanAction;
//# sourceMappingURL=task-action.js.map