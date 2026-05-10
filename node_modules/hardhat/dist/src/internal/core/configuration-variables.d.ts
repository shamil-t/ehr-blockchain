import type { ConfigurationVariable, ResolvedConfigurationVariable } from "../../types/config.js";
import type { HookManager } from "../../types/hooks.js";
export declare const CONFIGURATION_VARIABLE_MARKER = "{variable}";
export declare function resolveConfigurationVariable(hooks: HookManager, variable: ConfigurationVariable | string): ResolvedConfigurationVariable;
declare abstract class BaseResolvedConfigurationVariable implements ResolvedConfigurationVariable {
    #private;
    readonly format: string;
    _type: "ResolvedConfigurationVariable";
    protected abstract _getRawValue(): Promise<string>;
    constructor(format: string);
    get(): Promise<string>;
    getUrl(): Promise<string>;
    getBigInt(): Promise<bigint>;
    getHexString(): Promise<string>;
}
export declare class LazyResolvedConfigurationVariable extends BaseResolvedConfigurationVariable {
    #private;
    readonly name: string;
    constructor(hooks: HookManager, variable: ConfigurationVariable);
    protected _getRawValue(): Promise<string>;
}
export declare class FixedValueConfigurationVariable extends BaseResolvedConfigurationVariable {
    #private;
    constructor(value: string);
    protected _getRawValue(): Promise<string>;
}
export {};
//# sourceMappingURL=configuration-variables.d.ts.map