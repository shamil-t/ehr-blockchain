import type { ArtifactResolver } from "../../../types/artifact.js";
import type { DeploymentParameters } from "../../../types/deploy.js";
import type { ContractCallFuture } from "../../../types/module.js";
export declare function validateNamedContractCall(future: ContractCallFuture<string, string>, artifactLoader: ArtifactResolver, deploymentParameters: DeploymentParameters, accounts: string[]): Promise<string[]>;
//# sourceMappingURL=validateNamedContractCall.d.ts.map