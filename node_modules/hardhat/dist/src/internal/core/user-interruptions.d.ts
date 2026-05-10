import type { HookManager } from "../../types/hooks.js";
import type { UserInterruptionManager } from "../../types/user-interruptions.js";
export declare class UserInterruptionManagerImplementation implements UserInterruptionManager {
    #private;
    constructor(hooks: HookManager);
    displayMessage(interruptor: string, message: string): Promise<void>;
    requestInput(interruptor: string, inputDescription: string): Promise<string>;
    requestSecretInput(interruptor: string, inputDescription: string): Promise<string>;
    uninterrupted<ReturnT>(f: () => ReturnT): Promise<Awaited<ReturnT>>;
}
//# sourceMappingURL=user-interruptions.d.ts.map