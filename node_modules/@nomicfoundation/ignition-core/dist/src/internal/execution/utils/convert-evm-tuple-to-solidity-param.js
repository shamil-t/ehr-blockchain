import { isArray } from "lodash-es";
import { assertIgnitionInvariant } from "../../utils/assertions.js";
export function convertEvmValueToSolidityParam(evmValue) {
    if (isArray(evmValue)) {
        return evmValue.map(convertEvmValueToSolidityParam);
    }
    if (typeof evmValue === "object") {
        return evmValue.positional.map(convertEvmValueToSolidityParam);
    }
    return evmValue;
}
export function convertEvmTupleToSolidityParam(evmTuple) {
    const converted = convertEvmValueToSolidityParam(evmTuple);
    assertIgnitionInvariant(Array.isArray(converted), "Failed to convert an EvmTuple to SolidityParameterType[]");
    return converted;
}
//# sourceMappingURL=convert-evm-tuple-to-solidity-param.js.map