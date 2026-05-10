import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { isArtifactType } from "../../../type-guards.js";
import { validateArtifactEventArgumentParams } from "../../execution/abi.js";
export async function validateReadEventArgument(future, artifactLoader, _deploymentParameters, _accounts) {
    const errors = [];
    /* stage one */
    const artifact = "artifact" in future.emitter
        ? future.emitter.artifact
        : await artifactLoader.loadArtifact(future.emitter.contractName);
    if (!isArtifactType(artifact)) {
        errors.push(new HardhatError(HardhatError.ERRORS.IGNITION.VALIDATION.INVALID_ARTIFACT, {
            contractName: future.emitter.contractName,
        }));
    }
    else {
        errors.push(...validateArtifactEventArgumentParams(artifact, future.eventName, future.nameOrIndex));
    }
    return errors.map((e) => e.message);
}
//# sourceMappingURL=validateReadEventArgument.js.map