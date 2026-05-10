import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { ArgumentType } from "../../../types/arguments.js";
import { TaskDefinitionType } from "../../../types/tasks.js";
import { formatTaskId } from "./utils.js";
import { validateId, validateOption, validatePositionalArgument, } from "./validations.js";
export class EmptyTaskDefinitionBuilderImplementation {
    #id;
    #description;
    constructor(id, description = "") {
        validateId(id);
        this.#id = Array.isArray(id) ? id : [id];
        this.#description = description;
    }
    build() {
        return {
            type: TaskDefinitionType.EMPTY_TASK,
            id: this.#id,
            description: this.#description,
        };
    }
}
export class NewTaskDefinitionBuilderImplementation {
    #id;
    #usedNames = new Set();
    #options = {};
    #positionalArgs = [];
    #description;
    #action;
    #inlineAction;
    constructor(id, description = "") {
        validateId(id);
        this.#id = Array.isArray(id) ? id : [id];
        this.#description = description;
    }
    setDescription(description) {
        this.#description = description;
        return this;
    }
    setAction(action) {
        this.#ensureNoActionSet();
        this.#action = action;
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- Cast to update the ActionTypeT to the expected type for this scenario. */
        return this;
    }
    setInlineAction(inlineAction) {
        this.#ensureNoActionSet();
        this.#inlineAction = inlineAction;
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- Cast to update the ActionTypeT to the expected type for this scenario. */
        return this;
    }
    addOption({ name, shortName, description = "", type, defaultValue, hidden, }) {
        const argumentType = type ?? ArgumentType.STRING;
        const optionDefinition = {
            name,
            shortName,
            description,
            type: argumentType,
            defaultValue,
            hidden,
        };
        validateOption(optionDefinition, this.#usedNames, this.#id);
        this.#options[name] = optionDefinition;
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- Cast to update the generic argument types. Propagate 'ActionTypeT' to preserve
        the current action state for subsequent method calls. */
        return this;
    }
    addFlag(flagConfig) {
        return this.addOption({
            ...flagConfig,
            type: ArgumentType.FLAG,
            defaultValue: false,
            hidden: flagConfig.hidden,
        });
    }
    addLevel(levelConfig) {
        return this.addOption({
            ...levelConfig,
            type: ArgumentType.LEVEL,
            defaultValue: levelConfig.defaultValue ?? 0,
        });
    }
    addPositionalArgument(argConfig) {
        return this.#addPositionalArgument({
            ...argConfig,
            isVariadic: false,
        });
    }
    addVariadicArgument(argConfig) {
        return this.#addPositionalArgument({
            ...argConfig,
            isVariadic: true,
        });
    }
    build() {
        if (this.#action === undefined && this.#inlineAction === undefined) {
            throw new HardhatError(HardhatError.ERRORS.CORE.TASK_DEFINITIONS.NO_ACTION, {
                task: formatTaskId(this.#id),
            });
        }
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- Cast the return value because TypeScript cannot verify that the object matches
        the conditional type. */
        return {
            type: TaskDefinitionType.NEW_TASK,
            id: this.#id,
            description: this.#description,
            /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            -- The type of the action is narrowed in the setAction function or setInlineAction to
            improve the argument types. Once the task is built, we use the more
            general type to avoid having to parameterize the NewTaskDefinition */
            ...(this.#action !== undefined
                ? { action: this.#action }
                : { inlineAction: this.#inlineAction }),
            options: this.#options,
            positionalArguments: this.#positionalArgs,
        };
    }
    #addPositionalArgument({ name, description = "", type, defaultValue, isVariadic, }) {
        const argumentType = type ?? ArgumentType.STRING;
        const positionalArgDef = {
            name,
            description,
            type: argumentType,
            defaultValue,
            isVariadic,
        };
        const lastArg = this.#positionalArgs.at(-1);
        validatePositionalArgument(positionalArgDef, this.#usedNames, this.#id, lastArg);
        this.#positionalArgs.push(positionalArgDef);
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- Cast to update the generic argument types. Propagate 'ActionTypeT' to preserve
        the current action state for subsequent method calls. */
        return this;
    }
    #ensureNoActionSet() {
        if (this.#action !== undefined || this.#inlineAction !== undefined) {
            throw new HardhatError(HardhatError.ERRORS.CORE.TASK_DEFINITIONS.ACTION_ALREADY_SET, {
                task: formatTaskId(this.#id),
            });
        }
    }
}
export class TaskOverrideDefinitionBuilderImplementation {
    #id;
    #options = {};
    #description;
    #action;
    #inlineAction;
    constructor(id) {
        validateId(id);
        this.#id = Array.isArray(id) ? id : [id];
    }
    setDescription(description) {
        this.#description = description;
        return this;
    }
    setAction(action) {
        this.#ensureNoActionSet();
        this.#action = action;
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- Cast to update the ActionTypeT to the expected type for this scenario. */
        return this;
    }
    setInlineAction(inlineAction) {
        this.#ensureNoActionSet();
        this.#inlineAction = inlineAction;
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- Cast to update the ActionTypeT to the expected type for this scenario. */
        return this;
    }
    addOption({ name, shortName, description = "", type, defaultValue, hidden, }) {
        const argumentType = type ?? ArgumentType.STRING;
        const optionDefinition = {
            name,
            shortName,
            description,
            type: argumentType,
            defaultValue,
            hidden,
        };
        const usedNames = new Set();
        for (const option of Object.values(this.#options)) {
            usedNames.add(option.name);
            if (option.shortName !== undefined) {
                usedNames.add(option.shortName);
            }
        }
        validateOption(optionDefinition, usedNames, this.#id);
        this.#options[name] = optionDefinition;
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- Cast to update the generic argument types. Propagate 'ActionTypeT' to preserve
        the current action state for subsequent method calls. */
        return this;
    }
    addFlag(flagConfig) {
        return this.addOption({
            ...flagConfig,
            type: ArgumentType.FLAG,
            defaultValue: false,
            hidden: flagConfig.hidden,
        });
    }
    addLevel(levelConfig) {
        return this.addOption({
            ...levelConfig,
            type: ArgumentType.LEVEL,
            defaultValue: levelConfig.defaultValue ?? 0,
        });
    }
    build() {
        if (this.#action === undefined && this.#inlineAction === undefined) {
            throw new HardhatError(HardhatError.ERRORS.CORE.TASK_DEFINITIONS.NO_ACTION, {
                task: formatTaskId(this.#id),
            });
        }
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        -- Cast the return value because TypeScript cannot verify that the object matches
        the conditional type. */
        return {
            type: TaskDefinitionType.TASK_OVERRIDE,
            id: this.#id,
            description: this.#description,
            /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            -- The type of the action is narrowed in the setAction function or setInlineAction to
            improve the argument types. Once the task is built, we use the more
            general type to avoid having to parameterize the TaskOverrideDefinition */
            ...(this.#action !== undefined
                ? {
                    action: this.#action,
                }
                : {
                    inlineAction: this.#inlineAction,
                }),
            options: this.#options,
        };
    }
    #ensureNoActionSet() {
        if (this.#action !== undefined || this.#inlineAction !== undefined) {
            throw new HardhatError(HardhatError.ERRORS.CORE.TASK_DEFINITIONS.ACTION_ALREADY_SET, {
                task: formatTaskId(this.#id),
            });
        }
    }
}
//# sourceMappingURL=builders.js.map