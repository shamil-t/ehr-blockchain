import type { ArtifactResolver } from "../../../types/artifact.js";
import type { DeploymentParameters } from "../../../types/deploy.js";
import type { StaticCallFuture } from "../../../types/module.js";
export declare function validateNamedStaticCall(future: StaticCallFuture<string, string>, artifactLoader: ArtifactResolver, deploymentParameters: DeploymentParameters, accounts: string[]): Promise<string[]>;
//# sourceMappingURL=validateNamedStaticCall.d.ts.map