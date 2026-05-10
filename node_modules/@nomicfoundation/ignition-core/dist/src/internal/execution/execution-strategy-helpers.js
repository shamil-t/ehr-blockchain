/**
 * This is a file containing the different helpers that an execution strategy
 * implementation can use.
 * @file
 */
import { assertIgnitionInvariant } from "../utils/assertions.js";
import { decodeError } from "./abi.js";
import { EvmExecutionResultTypes } from "./types/evm-execution.js";
import { ExecutionResultType } from "./types/execution-result.js";
import { OnchainInteractionResponseType, SIMULATION_SUCCESS_SIGNAL_TYPE, } from "./types/execution-strategy.js";
/**
 * Returns true if the given response is an onchain interaction response.
 */
export function isOnchainInteractionResponse(response) {
    return ("type" in response &&
        (response.type === OnchainInteractionResponseType.SUCCESSFUL_TRANSACTION ||
            response.type === OnchainInteractionResponseType.SIMULATION_RESULT));
}
/**
 * Executes an onchain interaction request.
 *
 * @param executionStateId The id of the execution state that lead to the request.
 * @param onchainInteractionRequest  The request to execute.
 * @param decodeSuccessfulSimulationResult A function to decode the results of a
 *  simulation. Can be `undefined` if the request is not related to a contract or
 *  if we want to accept any result (e.g. in a deployment).
 * @param decodeCustomError A function to decode custom errors. Can be `undefined`
 *  if the request is not related to a contract whose custom errors we know how to
 *  decode.
 * @returns The successful transaction response or a simulation error.
 */
export async function* executeOnchainInteractionRequest(executionStateId, onchainInteractionRequest, decodeSuccessfulSimulationResult, decodeCustomError) {
    const firstResponse = yield onchainInteractionRequest;
    const assertionPrefix = `[ExecutionState ${executionStateId} - Network Interaction ${onchainInteractionRequest.id}] `;
    assertIgnitionInvariant(isOnchainInteractionResponse(firstResponse), `${assertionPrefix}Expected onchain interaction response and got raw static call result`);
    let onchainInteractionResponse;
    if (firstResponse.type === OnchainInteractionResponseType.SIMULATION_RESULT) {
        if (!firstResponse.result.success) {
            const error = decodeError(firstResponse.result.returnData, firstResponse.result.customErrorReported, decodeCustomError);
            return {
                type: ExecutionResultType.SIMULATION_ERROR,
                error,
            };
        }
        if (decodeSuccessfulSimulationResult !== undefined) {
            const result = decodeSuccessfulSimulationResult(firstResponse.result.returnData);
            if (result.type === EvmExecutionResultTypes.INVALID_RESULT_ERROR) {
                return {
                    type: ExecutionResultType.SIMULATION_ERROR,
                    error: result,
                };
            }
        }
        onchainInteractionResponse = yield {
            type: SIMULATION_SUCCESS_SIGNAL_TYPE,
        };
    }
    else {
        onchainInteractionResponse = firstResponse;
    }
    assertIgnitionInvariant(isOnchainInteractionResponse(onchainInteractionResponse), `${assertionPrefix}Expected onchain interaction response and got raw static call result`);
    assertIgnitionInvariant(onchainInteractionResponse.type ===
        OnchainInteractionResponseType.SUCCESSFUL_TRANSACTION, `${assertionPrefix}Expected confirmed transaction and got simulation result`);
    return onchainInteractionResponse;
}
/**
 * Executes an static call request.
 *
 * @param staticCallRequest  The static call request to execute.
 * @param decodeSuccessfulResult A function to decode the results of a simulation.
 * @param decodeCustomError A function to decode custom errors.
 * @returns The successful evm execution result, or a failed static call result.
 */
export async function* executeStaticCallRequest(staticCallRequest, decodeSuccessfulResult, decodeCustomError) {
    const result = yield staticCallRequest;
    if (!result.success) {
        const error = decodeError(result.returnData, result.customErrorReported, decodeCustomError);
        return {
            type: ExecutionResultType.STATIC_CALL_ERROR,
            error,
        };
    }
    const decodedResult = decodeSuccessfulResult(result.returnData);
    if (decodedResult.type === EvmExecutionResultTypes.INVALID_RESULT_ERROR) {
        return {
            type: ExecutionResultType.STATIC_CALL_ERROR,
            error: decodedResult,
        };
    }
    return decodedResult;
}
/**
 * Returns the right value from the last static call result that should be used
 * as the whole result of the static call execution state.
 *
 * @param _exState The execution state
 * @param lastStaticCallResult The result of the last network interaction.
 * @returns The value that should be used as the result of the static call execution state.
 */
export function getStaticCallExecutionStateResultValue(exState, lastStaticCallResult) {
    return typeof exState.nameOrIndex === "string"
        ? lastStaticCallResult.values.named[exState.nameOrIndex]
        : lastStaticCallResult.values.positional[exState.nameOrIndex];
}
export * from "./abi.js";
//# sourceMappingURL=execution-strategy-helpers.js.map