import path from "node:path";
import { wipe } from "@nomicfoundation/ignition-core";
import { HardhatArtifactResolver } from "../../helpers/hardhat-artifact-resolver.js";
const taskWipe = async ({ deploymentId, futureId }, hre) => {
    const deploymentDir = path.join(hre.config.paths.ignition, "deployments", deploymentId);
    await wipe(deploymentDir, new HardhatArtifactResolver(hre.artifacts), futureId);
    console.log(`${futureId} state has been cleared`);
};
export default taskWipe;
//# sourceMappingURL=wipe.js.map