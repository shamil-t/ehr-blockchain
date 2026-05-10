import { isAccountRuntimeValue } from "../../../type-guards.js";
import { validateLibraryNames } from "../../execution/libraries.js";
import { validateAccountRuntimeValue } from "../utils.js";
export async function validateArtifactLibraryDeployment(future, _artifactLoader, _deploymentParameters, accounts) {
    const errors = [];
    /* stage two */
    if (isAccountRuntimeValue(future.from)) {
        errors.push(...validateAccountRuntimeValue(future.from, accounts));
    }
    errors.push(...validateLibraryNames(future.artifact, Object.keys(future.libraries)));
    return errors.map((e) => e.message);
}
//# sourceMappingURL=validateArtifactLibraryDeployment.js.map