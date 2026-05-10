/**
 * The different types of response that the execution engine can give when
 * asked to perform an onchain interaction.
 */
export var OnchainInteractionResponseType;
(function (OnchainInteractionResponseType) {
    OnchainInteractionResponseType["SUCCESSFUL_TRANSACTION"] = "SUCCESSFUL_TRANSACTION";
    OnchainInteractionResponseType["SIMULATION_RESULT"] = "SIMULATION_RESULT";
})(OnchainInteractionResponseType || (OnchainInteractionResponseType = {}));
/**
 * The type of a SimulationSuccessSignal
 */
export const SIMULATION_SUCCESS_SIGNAL_TYPE = "SIMULATION_SUCCESS_SIGNAL";
//# sourceMappingURL=execution-strategy.js.map