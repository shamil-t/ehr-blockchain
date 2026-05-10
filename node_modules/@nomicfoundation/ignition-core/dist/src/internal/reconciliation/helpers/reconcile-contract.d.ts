import type { ContractCallFuture, StaticCallFuture } from "../../../types/module.js";
import type { CallExecutionState, StaticCallExecutionState } from "../../execution/types/execution-state.js";
import type { ReconciliationContext, ReconciliationFutureResultFailure } from "../types.js";
export declare function reconcileContract(future: ContractCallFuture<string, string> | StaticCallFuture<string, string>, exState: CallExecutionState | StaticCallExecutionState, context: ReconciliationContext): ReconciliationFutureResultFailure | undefined;
//# sourceMappingURL=reconcile-contract.d.ts.map