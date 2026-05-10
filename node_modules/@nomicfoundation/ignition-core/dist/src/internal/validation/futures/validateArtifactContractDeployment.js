import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { isAccountRuntimeValue, isModuleParameterRuntimeValue, } from "../../../type-guards.js";
import { validateContractConstructorArgsLength } from "../../execution/abi.js";
import { validateLibraryNames } from "../../execution/libraries.js";
import { filterToAccountRuntimeValues, resolvePotentialModuleParameterValueFrom, retrieveNestedRuntimeValues, validateAccountRuntimeValue, } from "../utils.js";
export async function validateArtifactContractDeployment(future, _artifactLoader, deploymentParameters, accounts) {
    const errors = [];
    /* stage one */
    const artifact = future.artifact;
    errors.push(...validateLibraryNames(artifact, Object.keys(future.libraries)));
    errors.push(...validateContractConstructorArgsLength(artifact, future.contractName, future.constructorArgs));
    /* stage two */
    const runtimeValues = retrieveNestedRuntimeValues(future.constructorArgs);
    const moduleParams = runtimeValues.filter(isModuleParameterRuntimeValue);
    const accountParams = [
        ...filterToAccountRuntimeValues(runtimeValues),
        ...(isAccountRuntimeValue(future.from) ? [future.from] : []),
    ];
    errors.push(...accountParams.flatMap((arv) => validateAccountRuntimeValue(arv, accounts)));
    const missingParams = moduleParams.filter((param) => resolvePotentialModuleParameterValueFrom(deploymentParameters, param) ===
        undefined);
    if (missingParams.length > 0) {
        errors.push(new HardhatError(HardhatError.ERRORS.IGNITION.VALIDATION.MISSING_MODULE_PARAMETER, {
            name: missingParams[0].name,
        }));
    }
    if (isModuleParameterRuntimeValue(future.value)) {
        const param = resolvePotentialModuleParameterValueFrom(deploymentParameters, future.value);
        if (param === undefined) {
            errors.push(new HardhatError(HardhatError.ERRORS.IGNITION.VALIDATION.MISSING_MODULE_PARAMETER, {
                name: future.value.name,
            }));
        }
        else if (typeof param !== "bigint") {
            errors.push(new HardhatError(HardhatError.ERRORS.IGNITION.VALIDATION.INVALID_MODULE_PARAMETER_TYPE, {
                name: future.value.name,
                expectedType: "bigint",
                actualType: typeof param,
            }));
        }
    }
    return errors.map((e) => e.message);
}
//# sourceMappingURL=validateArtifactContractDeployment.js.map