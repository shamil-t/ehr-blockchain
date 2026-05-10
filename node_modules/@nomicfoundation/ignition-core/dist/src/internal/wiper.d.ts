import type { DeploymentLoader } from "./deployment-loader/types.js";
import type { DeploymentState } from "./execution/types/deployment-state.js";
export declare class Wiper {
    private readonly _deploymentLoader;
    constructor(_deploymentLoader: DeploymentLoader);
    wipe(futureId: string): Promise<DeploymentState>;
}
//# sourceMappingURL=wiper.d.ts.map