import type { DeploymentParameters } from "../../../../types/deploy.js";
import type { Future } from "../../../../types/module.js";
import type { DeploymentLoader } from "../../../deployment-loader/types.js";
import type { DeploymentState } from "../../types/deployment-state.js";
import type { ExecutionStrategy } from "../../types/execution-strategy.js";
import type { JournalMessage } from "../../types/messages.js";
export declare function buildInitializeMessageFor(future: Future, deploymentState: DeploymentState, strategy: ExecutionStrategy, deploymentParameters: DeploymentParameters, deploymentLoader: DeploymentLoader, accounts: string[], defaultSender: string): Promise<JournalMessage>;
//# sourceMappingURL=build-initialize-message-for.d.ts.map