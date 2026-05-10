import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { isAccountRuntimeValue, isArtifactType } from "../../../type-guards.js";
import { validateLibraryNames } from "../../execution/libraries.js";
import { validateAccountRuntimeValue } from "../utils.js";
export async function validateNamedLibraryDeployment(future, artifactLoader, _deploymentParameters, accounts) {
    const errors = [];
    /* stage one */
    const artifact = await artifactLoader.loadArtifact(future.contractName);
    if (!isArtifactType(artifact)) {
        errors.push(new HardhatError(HardhatError.ERRORS.IGNITION.VALIDATION.INVALID_ARTIFACT, {
            contractName: future.contractName,
        }));
    }
    else {
        errors.push(...validateLibraryNames(artifact, Object.keys(future.libraries)));
    }
    /* stage two */
    if (isAccountRuntimeValue(future.from)) {
        errors.push(...validateAccountRuntimeValue(future.from, accounts));
    }
    return errors.map((e) => e.message);
}
//# sourceMappingURL=validateNamedLibraryDeployment.js.map