import type { ContractCallFuture, EncodeFunctionCallFuture, StaticCallFuture } from "../../../types/module.js";
import type { CallExecutionState, EncodeFunctionCallExecutionState, StaticCallExecutionState } from "../../execution/types/execution-state.js";
import type { ReconciliationContext, ReconciliationFutureResultFailure } from "../types.js";
export declare function reconcileFunctionName(future: ContractCallFuture<string, string> | StaticCallFuture<string, string> | EncodeFunctionCallFuture<string, string>, exState: CallExecutionState | StaticCallExecutionState | EncodeFunctionCallExecutionState, _context: ReconciliationContext): ReconciliationFutureResultFailure | undefined;
//# sourceMappingURL=reconcile-function-name.d.ts.map