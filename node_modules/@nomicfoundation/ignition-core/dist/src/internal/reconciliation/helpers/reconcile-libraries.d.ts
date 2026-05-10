import type { ContractDeploymentFuture, LibraryDeploymentFuture, NamedArtifactContractDeploymentFuture, NamedArtifactLibraryDeploymentFuture } from "../../../types/module.js";
import type { DeploymentExecutionState } from "../../execution/types/execution-state.js";
import type { ReconciliationContext, ReconciliationFutureResultFailure } from "../types.js";
export declare function reconcileLibraries(future: NamedArtifactContractDeploymentFuture<string> | ContractDeploymentFuture | NamedArtifactLibraryDeploymentFuture<string> | LibraryDeploymentFuture, exState: DeploymentExecutionState, context: ReconciliationContext): ReconciliationFutureResultFailure | undefined;
//# sourceMappingURL=reconcile-libraries.d.ts.map