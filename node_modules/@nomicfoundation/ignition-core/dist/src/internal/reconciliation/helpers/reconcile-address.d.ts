import type { ContractAtFuture, NamedArtifactContractAtFuture } from "../../../types/module.js";
import type { ContractAtExecutionState } from "../../execution/types/execution-state.js";
import type { ReconciliationContext, ReconciliationFutureResultFailure } from "../types.js";
export declare function reconcileAddress(future: NamedArtifactContractAtFuture<string> | ContractAtFuture, exState: ContractAtExecutionState, context: ReconciliationContext): ReconciliationFutureResultFailure | undefined;
//# sourceMappingURL=reconcile-address.d.ts.map