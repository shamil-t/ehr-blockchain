import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { isArtifactType, isModuleParameterRuntimeValue, } from "../../../type-guards.js";
import { validateArtifactFunction } from "../../execution/abi.js";
import { filterToAccountRuntimeValues, resolvePotentialModuleParameterValueFrom, retrieveNestedRuntimeValues, validateAccountRuntimeValue, } from "../utils.js";
export async function validateNamedEncodeFunctionCall(future, artifactLoader, deploymentParameters, accounts) {
    const errors = [];
    /* stage one */
    const artifact = "artifact" in future.contract
        ? future.contract.artifact
        : await artifactLoader.loadArtifact(future.contract.contractName);
    if (!isArtifactType(artifact)) {
        errors.push(new HardhatError(HardhatError.ERRORS.IGNITION.VALIDATION.INVALID_ARTIFACT, {
            contractName: future.contract.contractName,
        }));
    }
    else {
        errors.push(...validateArtifactFunction(artifact, future.contract.contractName, future.functionName, future.args, false));
    }
    /* stage two */
    const runtimeValues = retrieveNestedRuntimeValues(future.args);
    const moduleParams = runtimeValues.filter(isModuleParameterRuntimeValue);
    const accountParams = [...filterToAccountRuntimeValues(runtimeValues)];
    errors.push(...accountParams.flatMap((arv) => validateAccountRuntimeValue(arv, accounts)));
    const missingParams = moduleParams.filter((param) => resolvePotentialModuleParameterValueFrom(deploymentParameters, param) ===
        undefined);
    if (missingParams.length > 0) {
        errors.push(new HardhatError(HardhatError.ERRORS.IGNITION.VALIDATION.MISSING_MODULE_PARAMETER, {
            name: missingParams[0].name,
        }));
    }
    return errors.map((e) => e.message);
}
//# sourceMappingURL=validateNamedEncodeFunctionCall.js.map