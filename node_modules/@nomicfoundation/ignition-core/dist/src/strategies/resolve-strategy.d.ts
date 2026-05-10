import type { ExecutionStrategy } from "../internal/execution/types/execution-strategy.js";
import type { StrategyConfig } from "../types/deploy.js";
export declare function resolveStrategy<StrategyT extends keyof StrategyConfig>(strategyName: StrategyT | undefined, strategyConfig: StrategyConfig[StrategyT] | undefined): ExecutionStrategy;
//# sourceMappingURL=resolve-strategy.d.ts.map