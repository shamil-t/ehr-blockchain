import type { ArtifactResolver } from "../../../types/artifact.js";
import type { DeploymentParameters } from "../../../types/deploy.js";
import type { Future } from "../../../types/module.js";
import type { DeploymentLoader } from "../../deployment-loader/types.js";
import type { JsonRpcClient } from "../jsonrpc-client.js";
import type { NonceManager } from "../nonce-management/json-rpc-nonce-manager.js";
import type { TransactionTrackingTimer } from "../transaction-tracking-timer.js";
import type { DeploymentState } from "../types/deployment-state.js";
import type { ExecutionStrategy } from "../types/execution-strategy.js";
/**
 * This class is used to process a future, executing as much as possible, and
 * returning the new deployment state and a boolean indicating if the future
 * was completed.
 */
export declare class FutureProcessor {
    private readonly _deploymentLoader;
    private readonly _artifactResolver;
    private readonly _executionStrategy;
    private readonly _jsonRpcClient;
    private readonly _transactionTrackingTimer;
    private readonly _nonceManager;
    private readonly _requiredConfirmations;
    private readonly _millisecondBeforeBumpingFees;
    private readonly _maxFeeBumps;
    private readonly _accounts;
    private readonly _deploymentParameters;
    private readonly _defaultSender;
    private readonly _disableFeeBumping;
    private readonly _maxRetries;
    private readonly _retryInterval;
    constructor(_deploymentLoader: DeploymentLoader, _artifactResolver: ArtifactResolver, _executionStrategy: ExecutionStrategy, _jsonRpcClient: JsonRpcClient, _transactionTrackingTimer: TransactionTrackingTimer, _nonceManager: NonceManager, _requiredConfirmations: number, _millisecondBeforeBumpingFees: number, _maxFeeBumps: number, _accounts: string[], _deploymentParameters: DeploymentParameters, _defaultSender: string, _disableFeeBumping: boolean, _maxRetries: number, _retryInterval: number);
    /**
     * Process a future, executing as much as possible, and returning the new
     * deployment state and a boolean indicating if the future was completed.
     *
     * @param future The future to process.
     * @returns An object with the new state and a boolean indicating if the future
     *  was completed. If it wasn't completed, it should be processed again later,
     *  as there's a transactions awaiting to be confirmed.
     */
    processFuture(future: Future, deploymentState: DeploymentState): Promise<{
        newState: DeploymentState;
    }>;
    /**
     * Records a deployed address if the last applied message was a
     * successful completion of a deployment.
     *
     * @param lastAppliedMessage The last message that was applied to the deployment state.
     */
    private _recordDeployedAddressIfNeeded;
    /**
     * Executes the next action for the execution state, and returns a message to
     * be applied as a result of the execution, or undefined if no progress can be made
     * yet and execution should be resumed later.
     */
    private _nextActionDispatch;
}
//# sourceMappingURL=future-processor.d.ts.map