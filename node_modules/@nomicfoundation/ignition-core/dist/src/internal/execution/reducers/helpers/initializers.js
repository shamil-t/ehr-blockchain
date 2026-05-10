import { FutureType } from "../../../../types/module.js";
import { ExecutionSateType, ExecutionStatus, } from "../../types/execution-state.js";
export function initialiseDeploymentExecutionStateFrom(action) {
    const deploymentExecutionInitialState = {
        id: action.futureId,
        type: ExecutionSateType.DEPLOYMENT_EXECUTION_STATE,
        futureType: action.futureType,
        strategy: action.strategy,
        strategyConfig: action.strategyConfig,
        status: ExecutionStatus.STARTED,
        dependencies: new Set(action.dependencies),
        artifactId: action.artifactId,
        contractName: action.contractName,
        constructorArgs: action.constructorArgs,
        libraries: action.libraries,
        value: action.value,
        from: action.from,
        networkInteractions: [],
    };
    return deploymentExecutionInitialState;
}
export function initialiseStaticCallExecutionStateFrom(action) {
    const callExecutionInitialState = {
        id: action.futureId,
        type: ExecutionSateType.STATIC_CALL_EXECUTION_STATE,
        futureType: FutureType.STATIC_CALL,
        strategy: action.strategy,
        strategyConfig: action.strategyConfig,
        status: ExecutionStatus.STARTED,
        dependencies: new Set(action.dependencies),
        artifactId: action.artifactId,
        contractAddress: action.contractAddress,
        functionName: action.functionName,
        args: action.args,
        nameOrIndex: action.nameOrIndex,
        from: action.from,
        networkInteractions: [],
    };
    return callExecutionInitialState;
}
export function initialiseSendDataExecutionStateFrom(action) {
    const callExecutionInitialState = {
        id: action.futureId,
        type: ExecutionSateType.SEND_DATA_EXECUTION_STATE,
        futureType: FutureType.SEND_DATA,
        strategy: action.strategy,
        strategyConfig: action.strategyConfig,
        status: ExecutionStatus.STARTED,
        dependencies: new Set(action.dependencies),
        to: action.to,
        data: action.data,
        value: action.value,
        from: action.from,
        networkInteractions: [],
    };
    return callExecutionInitialState;
}
export function initialiseReadEventArgumentExecutionStateFrom(action) {
    const readEventArgumentExecutionInitialState = {
        id: action.futureId,
        type: ExecutionSateType.READ_EVENT_ARGUMENT_EXECUTION_STATE,
        futureType: FutureType.READ_EVENT_ARGUMENT,
        strategy: action.strategy,
        strategyConfig: action.strategyConfig,
        status: ExecutionStatus.SUCCESS,
        dependencies: new Set(action.dependencies),
        artifactId: action.artifactId,
        eventName: action.eventName,
        nameOrIndex: action.nameOrIndex,
        txToReadFrom: action.txToReadFrom,
        emitterAddress: action.emitterAddress,
        eventIndex: action.eventIndex,
        result: action.result,
    };
    return readEventArgumentExecutionInitialState;
}
export function initialiseContractAtExecutionStateFrom(action) {
    const contractAtExecutionInitialState = {
        id: action.futureId,
        type: ExecutionSateType.CONTRACT_AT_EXECUTION_STATE,
        futureType: action.futureType,
        strategy: action.strategy,
        strategyConfig: action.strategyConfig,
        status: ExecutionStatus.SUCCESS,
        dependencies: new Set(action.dependencies),
        artifactId: action.artifactId,
        contractName: action.contractName,
        contractAddress: action.contractAddress,
    };
    return contractAtExecutionInitialState;
}
export function initialiseEncodeFunctionCallExecutionStateFrom(action) {
    const encodeFunctionCallExecutionInitialState = {
        id: action.futureId,
        type: ExecutionSateType.ENCODE_FUNCTION_CALL_EXECUTION_STATE,
        futureType: FutureType.ENCODE_FUNCTION_CALL,
        strategy: action.strategy,
        strategyConfig: action.strategyConfig,
        status: ExecutionStatus.SUCCESS,
        dependencies: new Set(action.dependencies),
        artifactId: action.artifactId,
        functionName: action.functionName,
        args: action.args,
        result: action.result,
    };
    return encodeFunctionCallExecutionInitialState;
}
export function initialiseCallExecutionStateFrom(action) {
    const callExecutionInitialState = {
        id: action.futureId,
        type: ExecutionSateType.CALL_EXECUTION_STATE,
        futureType: FutureType.CONTRACT_CALL,
        strategy: action.strategy,
        strategyConfig: action.strategyConfig,
        status: ExecutionStatus.STARTED,
        dependencies: new Set(action.dependencies),
        artifactId: action.artifactId,
        contractAddress: action.contractAddress,
        functionName: action.functionName,
        args: action.args,
        value: action.value,
        from: action.from,
        networkInteractions: [],
    };
    return callExecutionInitialState;
}
//# sourceMappingURL=initializers.js.map