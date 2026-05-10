import type { DeploymentState } from "../execution/types/deployment-state.js";
import type { Transaction, TransactionReceipt } from "../execution/types/jsonrpc.js";
export declare function findConfirmedTransactionByFutureId(deploymentState: DeploymentState, futureId: string): Omit<Transaction, "receipt"> & {
    receipt: TransactionReceipt;
};
//# sourceMappingURL=find-confirmed-transaction-by-future-id.d.ts.map