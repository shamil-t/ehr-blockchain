import type { ArtifactResolver } from "../../types/artifact.js";
import type { DeploymentParameters, ValidationErrorDeploymentResult } from "../../types/deploy.js";
import type { IgnitionModule } from "../../types/module.js";
export declare function validate(module: IgnitionModule, artifactLoader: ArtifactResolver, deploymentParameters: DeploymentParameters, accounts: string[]): Promise<ValidationErrorDeploymentResult | null>;
//# sourceMappingURL=validate.d.ts.map