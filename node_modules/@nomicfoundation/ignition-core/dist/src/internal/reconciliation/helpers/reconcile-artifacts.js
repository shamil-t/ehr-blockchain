import { ExecutionStatus, } from "../../execution/types/execution-state.js";
import { fail, getBytecodeWithoutMetadata } from "../utils.js";
export async function reconcileArtifacts(future, exState, context) {
    if (exState.status === ExecutionStatus.SUCCESS) {
        return;
    }
    const moduleArtifact = "artifact" in future
        ? future.artifact
        : await context.artifactResolver.loadArtifact(future.contractName);
    const storedArtifact = await context.deploymentLoader.loadArtifact(exState.artifactId);
    const moduleArtifactBytecode = getBytecodeWithoutMetadata(moduleArtifact.bytecode);
    const storedArtifactBytecode = getBytecodeWithoutMetadata(storedArtifact.bytecode);
    if (moduleArtifactBytecode !== storedArtifactBytecode) {
        return fail(future, "Artifact bytecodes have been changed");
    }
}
//# sourceMappingURL=reconcile-artifacts.js.map