import { decodeArtifactCustomError, decodeArtifactFunctionCallResult, encodeArtifactDeploymentData, encodeArtifactFunctionCall, executeOnchainInteractionRequest, executeStaticCallRequest, getStaticCallExecutionStateResultValue, } from "../internal/execution/execution-strategy-helpers.js";
import { ExecutionResultType } from "../internal/execution/types/execution-result.js";
import { OnchainInteractionResponseType } from "../internal/execution/types/execution-strategy.js";
import { NetworkInteractionType } from "../internal/execution/types/network-interaction.js";
import { assertIgnitionInvariant } from "../internal/utils/assertions.js";
/**
 * The basic execution strategy, which sends a single transaction
 * for each contract deployment, call, and send data, and a single static call
 * for each static call execution.
 *
 * @private
 */
export class BasicStrategy {
    name = "basic";
    config;
    _deploymentLoader;
    constructor() {
        this.config = {};
    }
    async init(deploymentLoader, _jsonRpcClient) {
        this._deploymentLoader = deploymentLoader;
    }
    async *executeDeployment(executionState) {
        assertIgnitionInvariant(this._deploymentLoader !== undefined, `Strategy ${this.name} not initialized`);
        const artifact = await this._deploymentLoader.loadArtifact(executionState.artifactId);
        const transactionOrResult = yield* executeOnchainInteractionRequest(executionState.id, {
            id: 1,
            type: NetworkInteractionType.ONCHAIN_INTERACTION,
            to: undefined,
            data: encodeArtifactDeploymentData(artifact, executionState.constructorArgs, executionState.libraries),
            value: executionState.value,
        }, undefined, (returnData) => decodeArtifactCustomError(artifact, returnData));
        if (transactionOrResult.type !==
            OnchainInteractionResponseType.SUCCESSFUL_TRANSACTION) {
            return transactionOrResult;
        }
        const tx = transactionOrResult.transaction;
        const contractAddress = tx.receipt.contractAddress;
        if (contractAddress === undefined) {
            return {
                type: ExecutionResultType.STRATEGY_ERROR,
                error: `Transaction ${tx.hash} confirmed but it didn't create a contract`,
            };
        }
        return {
            type: ExecutionResultType.SUCCESS,
            address: contractAddress,
        };
    }
    async *executeCall(executionState) {
        assertIgnitionInvariant(this._deploymentLoader !== undefined, `Strategy ${this.name} not initialized`);
        const artifact = await this._deploymentLoader.loadArtifact(executionState.artifactId);
        const transactionOrResult = yield* executeOnchainInteractionRequest(executionState.id, {
            id: 1,
            type: NetworkInteractionType.ONCHAIN_INTERACTION,
            to: executionState.contractAddress,
            data: encodeArtifactFunctionCall(artifact, executionState.functionName, executionState.args),
            value: executionState.value,
        }, (returnData) => decodeArtifactFunctionCallResult(artifact, executionState.functionName, returnData), (returnData) => decodeArtifactCustomError(artifact, returnData));
        if (transactionOrResult.type !==
            OnchainInteractionResponseType.SUCCESSFUL_TRANSACTION) {
            return transactionOrResult;
        }
        return {
            type: ExecutionResultType.SUCCESS,
        };
    }
    async *executeSendData(executionState) {
        const transactionOrResult = yield* executeOnchainInteractionRequest(executionState.id, {
            id: 1,
            type: NetworkInteractionType.ONCHAIN_INTERACTION,
            to: executionState.to,
            data: executionState.data,
            value: executionState.value,
        });
        if (transactionOrResult.type !==
            OnchainInteractionResponseType.SUCCESSFUL_TRANSACTION) {
            return transactionOrResult;
        }
        return {
            type: ExecutionResultType.SUCCESS,
        };
    }
    async *executeStaticCall(executionState) {
        assertIgnitionInvariant(this._deploymentLoader !== undefined, `Strategy ${this.name} not initialized`);
        const artifact = await this._deploymentLoader.loadArtifact(executionState.artifactId);
        const decodedResultOrError = yield* executeStaticCallRequest({
            id: 1,
            type: NetworkInteractionType.STATIC_CALL,
            to: executionState.contractAddress,
            from: executionState.from,
            data: encodeArtifactFunctionCall(artifact, executionState.functionName, executionState.args),
            value: 0n,
        }, (returnData) => decodeArtifactFunctionCallResult(artifact, executionState.functionName, returnData), (returnData) => decodeArtifactCustomError(artifact, returnData));
        if (decodedResultOrError.type === ExecutionResultType.STATIC_CALL_ERROR) {
            return decodedResultOrError;
        }
        return {
            type: ExecutionResultType.SUCCESS,
            value: getStaticCallExecutionStateResultValue(executionState, decodedResultOrError),
        };
    }
}
//# sourceMappingURL=basic-strategy.js.map