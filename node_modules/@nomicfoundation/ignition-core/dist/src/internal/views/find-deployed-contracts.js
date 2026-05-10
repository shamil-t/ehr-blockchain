import { ExecutionResultType } from "../execution/types/execution-result.js";
import { ExecutionSateType, ExecutionStatus, } from "../execution/types/execution-state.js";
import { assertIgnitionInvariant } from "../utils/assertions.js";
export function findDeployedContracts(deploymentState) {
    return Object.values(deploymentState.executionStates)
        .filter((exState) => exState.type === ExecutionSateType.DEPLOYMENT_EXECUTION_STATE ||
        exState.type === ExecutionSateType.CONTRACT_AT_EXECUTION_STATE)
        .filter((des) => des.status === ExecutionStatus.SUCCESS)
        .map(_toDeployedContract)
        .reduce((acc, contract) => {
        acc[contract.id] = contract;
        return acc;
    }, {});
}
function _toDeployedContract(des) {
    switch (des.type) {
        case ExecutionSateType.DEPLOYMENT_EXECUTION_STATE: {
            assertIgnitionInvariant(des.result !== undefined &&
                des.result.type === ExecutionResultType.SUCCESS, `Deployment execution state ${des.id} should have a successful result to retrieve address`);
            return {
                id: des.id,
                contractName: des.contractName,
                address: des.result.address,
            };
        }
        case ExecutionSateType.CONTRACT_AT_EXECUTION_STATE: {
            return {
                id: des.id,
                contractName: des.contractName,
                address: des.contractAddress,
            };
        }
    }
}
//# sourceMappingURL=find-deployed-contracts.js.map