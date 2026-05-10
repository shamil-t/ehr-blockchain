import type { DeploymentParameters } from "../../types/deploy.js";
import type { ModuleParameterRuntimeValue, ModuleParameterType, SolidityParameterType } from "../../types/module.js";
export declare function resolveModuleParameter(moduleParamRuntimeValue: ModuleParameterRuntimeValue<ModuleParameterType>, context: {
    deploymentParameters: DeploymentParameters;
    accounts: string[];
}): SolidityParameterType;
//# sourceMappingURL=resolve-module-parameter.d.ts.map