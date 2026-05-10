import type { IgnitionModuleBuilder } from "../types/module-builder.js";
import type { IgnitionModule, IgnitionModuleResult, ModuleParameters } from "../types/module.js";
/**
 * This class is in charge of turning `IgnitionModuleDefinition`s into
 * `IgnitionModule`s.
 *
 * Part of this class' responsibility is handling any concrete
 * value that's only present during deployment (e.g. chain id, accounts, and
 * module params).
 *
 * TODO: Add support for concrete values.
 */
export declare class ModuleConstructor {
    readonly parameters: {
        [moduleId: string]: ModuleParameters;
    };
    private readonly _modules;
    constructor(parameters?: {
        [moduleId: string]: ModuleParameters;
    });
    construct<ModuleIdT extends string, ContractNameT extends string, IgnitionModuleResultsT extends IgnitionModuleResult<ContractNameT>>(moduleDefinition: {
        id: ModuleIdT;
        moduleDefinitionFunction: (m: IgnitionModuleBuilder) => IgnitionModuleResultsT;
    }): IgnitionModule<ModuleIdT, ContractNameT, IgnitionModuleResultsT>;
}
//# sourceMappingURL=module-builder.d.ts.map