import path from "node:path";
import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { exists, readdir, readJsonFile, } from "@nomicfoundation/hardhat-utils/fs";
export async function verifyArtifactsVersion(deploymentDir) {
    const artifactsDir = `${deploymentDir}/artifacts`;
    if (deploymentDir === undefined || !(await exists(artifactsDir))) {
        return;
    }
    for (const filename of await readdir(artifactsDir)) {
        if (filename.endsWith(".dbg.json")) {
            continue;
        }
        const artifactPath = path.join(artifactsDir, filename);
        const artifact = await readJsonFile(artifactPath);
        if (artifact._format === "hh-sol-artifact-1") {
            throw new HardhatError(HardhatError.ERRORS.IGNITION.GENERAL.ARTIFACT_MIGRATION_NEEDED, {
                deploymentId: deploymentDir.split(path.sep).pop(),
            });
        }
    }
    const buildInfoDir = `${deploymentDir}/build-info`;
    if (!(await exists(buildInfoDir))) {
        return;
    }
    for (const filename of await readdir(buildInfoDir)) {
        const buildInfoPath = path.join(buildInfoDir, filename);
        const buildInfo = await readJsonFile(buildInfoPath);
        if (buildInfo._format === "hh-sol-build-info-1") {
            throw new HardhatError(HardhatError.ERRORS.IGNITION.GENERAL.ARTIFACT_MIGRATION_NEEDED, {
                deploymentId: deploymentDir.split(path.sep).pop(),
            });
        }
    }
}
//# sourceMappingURL=verifyArtifactsVersion.js.map