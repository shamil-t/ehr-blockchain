import type { ContractCallFuture, ContractDeploymentFuture, NamedArtifactContractDeploymentFuture, SendDataFuture } from "../../../types/module.js";
import type { CallExecutionState, DeploymentExecutionState, SendDataExecutionState } from "../../execution/types/execution-state.js";
import type { ReconciliationContext, ReconciliationFutureResultFailure } from "../types.js";
export declare function reconcileValue(future: NamedArtifactContractDeploymentFuture<string> | ContractDeploymentFuture | ContractCallFuture<string, string> | SendDataFuture, exState: DeploymentExecutionState | CallExecutionState | SendDataExecutionState, context: ReconciliationContext): ReconciliationFutureResultFailure | undefined;
//# sourceMappingURL=reconcile-value.d.ts.map