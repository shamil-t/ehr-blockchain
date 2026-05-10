import path from "node:path";
import { listDeployments } from "@nomicfoundation/ignition-core";
const taskDeployments = async ({}, hre) => {
    const deploymentDir = path.join(hre.config.paths.ignition, "deployments");
    const deployments = await listDeployments(deploymentDir);
    for (const deploymentId of deployments) {
        console.log(deploymentId);
    }
};
export default taskDeployments;
//# sourceMappingURL=deployments.js.map