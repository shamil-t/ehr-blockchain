import type { CallExecutionState, DeploymentExecutionState, SendDataExecutionState, StaticCallExecutionState } from "../../execution/types/execution-state.js";
import type { OnchainInteraction } from "../../execution/types/network-interaction.js";
export declare function findOnchainInteractionBy(executionState: DeploymentExecutionState | CallExecutionState | StaticCallExecutionState | SendDataExecutionState, networkInteractionId: number): OnchainInteraction;
//# sourceMappingURL=find-onchain-interaction-by.d.ts.map