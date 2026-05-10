import type { CallExecutionState, DeploymentExecutionState, SendDataExecutionState, StaticCallExecutionState } from "../../execution/types/execution-state.js";
import type { Transaction } from "../../execution/types/jsonrpc.js";
export declare function findTransactionBy(executionState: DeploymentExecutionState | CallExecutionState | StaticCallExecutionState | SendDataExecutionState, networkInteractionId: number, hash: string): Transaction;
//# sourceMappingURL=find-transaction-by.d.ts.map