import { compare } from "./compare.js";
export function reconcileContractName(future, exState, _context) {
    return compare(future, "Contract name", exState.contractName, future.contractName);
}
//# sourceMappingURL=reconcile-contract-name.js.map