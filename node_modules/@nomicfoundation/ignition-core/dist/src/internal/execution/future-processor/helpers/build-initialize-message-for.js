import { FutureType } from "../../../../types/module.js";
import { JournalMessageType } from "../../types/messages.js";
import { resolveAddressForContractFuture, resolveAddressLike, resolveArgs, resolveEncodeFunctionCallResult, resolveFutureData, resolveFutureFrom, resolveLibraries, resolveReadEventArgumentResult, resolveSendToAddress, resolveValue, } from "./future-resolvers.js";
export async function buildInitializeMessageFor(future, deploymentState, strategy, deploymentParameters, deploymentLoader, accounts, defaultSender) {
    switch (future.type) {
        case FutureType.NAMED_ARTIFACT_CONTRACT_DEPLOYMENT:
        case FutureType.CONTRACT_DEPLOYMENT:
            const deploymentExecStateInit = _extendBaseInitWith(JournalMessageType.DEPLOYMENT_EXECUTION_STATE_INITIALIZE, future, strategy.name, strategy.config, {
                futureType: future.type,
                artifactId: future.id,
                contractName: future.contractName,
                constructorArgs: resolveArgs(future.constructorArgs, deploymentState, deploymentParameters, accounts),
                libraries: resolveLibraries(future.libraries, deploymentState),
                value: resolveValue(future.value, deploymentParameters, deploymentState, accounts),
                from: resolveFutureFrom(future.from, accounts, defaultSender),
            });
            return deploymentExecStateInit;
        case FutureType.NAMED_ARTIFACT_LIBRARY_DEPLOYMENT:
        case FutureType.LIBRARY_DEPLOYMENT:
            const libraryDeploymentInit = _extendBaseInitWith(JournalMessageType.DEPLOYMENT_EXECUTION_STATE_INITIALIZE, future, strategy.name, strategy.config, {
                futureType: future.type,
                artifactId: future.id,
                contractName: future.contractName,
                constructorArgs: [],
                libraries: resolveLibraries(future.libraries, deploymentState),
                value: BigInt(0),
                from: resolveFutureFrom(future.from, accounts, defaultSender),
            });
            return libraryDeploymentInit;
        case FutureType.CONTRACT_CALL: {
            const namedContractCallInit = _extendBaseInitWith(JournalMessageType.CALL_EXECUTION_STATE_INITIALIZE, future, strategy.name, strategy.config, {
                args: resolveArgs(future.args, deploymentState, deploymentParameters, accounts),
                functionName: future.functionName,
                contractAddress: resolveAddressForContractFuture(future.contract, deploymentState),
                artifactId: future.contract.id,
                value: resolveValue(future.value, deploymentParameters, deploymentState, accounts),
                from: resolveFutureFrom(future.from, accounts, defaultSender),
            });
            return namedContractCallInit;
        }
        case FutureType.STATIC_CALL: {
            const namedStaticCallInit = _extendBaseInitWith(JournalMessageType.STATIC_CALL_EXECUTION_STATE_INITIALIZE, future, strategy.name, strategy.config, {
                args: resolveArgs(future.args, deploymentState, deploymentParameters, accounts),
                nameOrIndex: future.nameOrIndex,
                functionName: future.functionName,
                contractAddress: resolveAddressForContractFuture(future.contract, deploymentState),
                artifactId: future.contract.id,
                from: resolveFutureFrom(future.from, accounts, defaultSender),
            });
            return namedStaticCallInit;
        }
        case FutureType.ENCODE_FUNCTION_CALL: {
            const args = resolveArgs(future.args, deploymentState, deploymentParameters, accounts);
            const result = await resolveEncodeFunctionCallResult(future.contract.id, future.functionName, args, deploymentLoader);
            const encodeFunctionCallInit = _extendBaseInitWith(JournalMessageType.ENCODE_FUNCTION_CALL_EXECUTION_STATE_INITIALIZE, future, strategy.name, strategy.config, {
                args,
                functionName: future.functionName,
                artifactId: future.contract.id,
                result,
            });
            return encodeFunctionCallInit;
        }
        case FutureType.NAMED_ARTIFACT_CONTRACT_AT:
        case FutureType.CONTRACT_AT: {
            const contractAtInit = _extendBaseInitWith(JournalMessageType.CONTRACT_AT_EXECUTION_STATE_INITIALIZE, future, strategy.name, strategy.config, {
                futureType: future.type,
                contractName: future.contractName,
                contractAddress: resolveAddressLike(future.address, deploymentState, deploymentParameters, accounts),
                artifactId: future.id,
            });
            return contractAtInit;
        }
        case FutureType.READ_EVENT_ARGUMENT: {
            const { txToReadFrom, emitterAddress, result } = await resolveReadEventArgumentResult(future.futureToReadFrom, future.emitter, future.eventName, future.eventIndex, future.nameOrIndex, deploymentState, deploymentLoader);
            const readEventArgInit = _extendBaseInitWith(JournalMessageType.READ_EVENT_ARGUMENT_EXECUTION_STATE_INITIALIZE, future, strategy.name, strategy.config, {
                artifactId: future.emitter.id,
                eventName: future.eventName,
                nameOrIndex: future.nameOrIndex,
                eventIndex: future.eventIndex,
                txToReadFrom,
                emitterAddress,
                result,
            });
            return readEventArgInit;
        }
        case FutureType.SEND_DATA:
            const sendDataInit = _extendBaseInitWith(JournalMessageType.SEND_DATA_EXECUTION_STATE_INITIALIZE, future, strategy.name, strategy.config, {
                to: resolveSendToAddress(future.to, deploymentState, deploymentParameters, accounts),
                value: resolveValue(future.value, deploymentParameters, deploymentState, accounts),
                data: resolveFutureData(future.data, deploymentState),
                from: resolveFutureFrom(future.from, accounts, defaultSender),
            });
            return sendDataInit;
    }
}
function _extendBaseInitWith(messageType, future, strategy, strategyConfig, extension) {
    return {
        type: messageType,
        futureId: future.id,
        strategy,
        strategyConfig,
        dependencies: [...future.dependencies].map((f) => f.id),
        ...extension,
    };
}
//# sourceMappingURL=build-initialize-message-for.js.map