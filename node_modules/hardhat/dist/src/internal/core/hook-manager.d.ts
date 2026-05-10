import type { ChainedHook, HookContext, HookManager, InitialHookParams as InitialHookParams, InitialChainedHookParams, HardhatHooks } from "../../types/hooks.js";
import type { HardhatPlugin } from "../../types/plugins.js";
import type { LastParameter, Return } from "../../types/utils.js";
export declare class HookManagerImplementation implements HookManager {
    #private;
    constructor(projectRoot: string, plugins: HardhatPlugin[]);
    setContext(context: HookContext): void;
    registerHandlers<HookCategoryNameT extends keyof HardhatHooks>(hookCategoryName: HookCategoryNameT, hookHandlerCategory: Partial<HardhatHooks[HookCategoryNameT]>): void;
    unregisterHandlers<HookCategoryNameT extends keyof HardhatHooks>(hookCategoryName: HookCategoryNameT, hookHandlerCategory: Partial<HardhatHooks[HookCategoryNameT]>): void;
    runHandlerChain<HookCategoryNameT extends keyof HardhatHooks, HookNameT extends keyof HardhatHooks[HookCategoryNameT], HookT extends ChainedHook<HardhatHooks[HookCategoryNameT][HookNameT]>>(hookCategoryName: HookCategoryNameT, hookName: HookNameT, params: InitialChainedHookParams<HookCategoryNameT, HookT>, defaultImplementation: LastParameter<HookT>): Promise<Awaited<Return<HardhatHooks[HookCategoryNameT][HookNameT]>>>;
    runSequentialHandlers<HookCategoryNameT extends keyof HardhatHooks, HookNameT extends keyof HardhatHooks[HookCategoryNameT], HookT extends HardhatHooks[HookCategoryNameT][HookNameT]>(hookCategoryName: HookCategoryNameT, hookName: HookNameT, params: InitialHookParams<HookCategoryNameT, HookT>): Promise<Array<Awaited<Return<HardhatHooks[HookCategoryNameT][HookNameT]>>>>;
    runParallelHandlers<HookCategoryNameT extends keyof HardhatHooks, HookNameT extends keyof HardhatHooks[HookCategoryNameT], HookT extends HardhatHooks[HookCategoryNameT][HookNameT]>(hookCategoryName: HookCategoryNameT, hookName: HookNameT, params: InitialHookParams<HookCategoryNameT, HookT>): Promise<Array<Awaited<Return<HardhatHooks[HookCategoryNameT][HookNameT]>>>>;
    hasHandlers<HookCategoryNameT extends keyof HardhatHooks, HookNameT extends keyof HardhatHooks[HookCategoryNameT]>(hookCategoryName: HookCategoryNameT, hookName: HookNameT): Promise<boolean>;
}
//# sourceMappingURL=hook-manager.d.ts.map