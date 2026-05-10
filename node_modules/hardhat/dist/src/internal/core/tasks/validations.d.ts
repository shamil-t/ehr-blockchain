import type { ArgumentType, ArgumentValue, OptionDefinition, PositionalArgumentDefinition } from "../../../types/arguments.js";
import type { LazyActionObject, NewTaskActionFunction, TaskArguments, TaskOverrideActionFunction } from "../../../types/tasks.js";
export declare function validateId(id: string | string[]): void;
export declare function validateAction(action: LazyActionObject<NewTaskActionFunction<TaskArguments>> | LazyActionObject<TaskOverrideActionFunction<TaskArguments>> | undefined, inlineAction: NewTaskActionFunction<TaskArguments> | TaskOverrideActionFunction<TaskArguments> | undefined, taskId: string[], isPlugin: boolean): void;
export declare function validateOption({ name, shortName, type, defaultValue }: OptionDefinition, usedNames: Set<string>, taskId: string | string[]): void;
export declare function validatePositionalArgument({ name, type, defaultValue, isVariadic }: PositionalArgumentDefinition, usedNames: Set<string>, taskId: string | string[], lastArg?: PositionalArgumentDefinition): void;
export declare function validateTaskArgumentValue(name: string, expectedType: ArgumentType, value: ArgumentValue | ArgumentValue[], isVariadic: boolean, taskId: string | string[]): void;
//# sourceMappingURL=validations.d.ts.map