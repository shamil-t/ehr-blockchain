import type { NewTaskActionFunction } from "hardhat/types/tasks";
interface TrackTxArguments {
    txHash: string;
    deploymentId: string;
}
declare const taskTransactions: NewTaskActionFunction<TrackTxArguments>;
export default taskTransactions;
//# sourceMappingURL=track-tx.d.ts.map