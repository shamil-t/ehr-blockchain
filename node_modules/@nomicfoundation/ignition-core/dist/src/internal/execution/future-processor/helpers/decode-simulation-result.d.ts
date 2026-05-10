import type { SimulationErrorExecutionResult, StrategySimulationErrorExecutionResult } from "../../types/execution-result.js";
import type { CallExecutionState, DeploymentExecutionState, SendDataExecutionState } from "../../types/execution-state.js";
import type { CallStrategyGenerator, DeploymentStrategyGenerator } from "../../types/execution-strategy.js";
import type { RawStaticCallResult } from "../../types/jsonrpc.js";
export declare function decodeSimulationResult(strategyGenerator: DeploymentStrategyGenerator | CallStrategyGenerator, exState: DeploymentExecutionState | CallExecutionState | SendDataExecutionState): (simulationResult: RawStaticCallResult) => Promise<SimulationErrorExecutionResult | StrategySimulationErrorExecutionResult | undefined>;
//# sourceMappingURL=decode-simulation-result.d.ts.map