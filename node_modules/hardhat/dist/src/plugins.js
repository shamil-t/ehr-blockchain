export { HardhatPluginError } from "@nomicfoundation/hardhat-errors";
import { throwUsingHardhat2PluginError } from "./internal/using-hardhat2-plugin-errors.js";
/**
 * @deprecated This function is part of the Hardhat 2 plugin API.
 */
export function lazyFunction(..._args) {
    throwUsingHardhat2PluginError();
}
/**
 * @deprecated This function is part of the Hardhat 2 plugin API.
 */
export function lazyObject(..._args) {
    throwUsingHardhat2PluginError();
}
//# sourceMappingURL=plugins.js.map