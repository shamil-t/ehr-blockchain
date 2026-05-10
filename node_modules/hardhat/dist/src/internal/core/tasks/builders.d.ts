import type { ArgumentTypeToValueType } from "../../../types/arguments.js";
import type { NewTaskActionFunction, NewTaskDefinitionBuilder, NewTaskDefinition, TaskOverrideActionFunction, TaskOverrideDefinitionBuilder, TaskOverrideDefinition, EmptyTaskDefinitionBuilder, EmptyTaskDefinition, ExtendTaskArguments, TaskArguments, LazyActionObject } from "../../../types/tasks.js";
import { ArgumentType } from "../../../types/arguments.js";
export declare class EmptyTaskDefinitionBuilderImplementation implements EmptyTaskDefinitionBuilder {
    #private;
    constructor(id: string | string[], description?: string);
    build(): EmptyTaskDefinition;
}
export declare class NewTaskDefinitionBuilderImplementation<TaskArgumentsT extends TaskArguments = TaskArguments, ActionTypeT extends "LAZY_ACTION" | "INLINE_ACTION" | "MISSING_ACTION" = "MISSING_ACTION"> implements NewTaskDefinitionBuilder<TaskArgumentsT, ActionTypeT> {
    #private;
    constructor(id: string | string[], description?: string);
    setDescription(description: string): this;
    setAction(action: LazyActionObject<NewTaskActionFunction<TaskArgumentsT>>): NewTaskDefinitionBuilder<TaskArgumentsT, "LAZY_ACTION">;
    setInlineAction(inlineAction: NewTaskActionFunction<TaskArgumentsT>): NewTaskDefinitionBuilder<TaskArgumentsT, "INLINE_ACTION">;
    addOption<NameT extends string, TypeT extends ArgumentType = ArgumentType.STRING>({ name, shortName, description, type, defaultValue, hidden, }: {
        name: NameT;
        shortName?: string;
        description?: string;
        type?: TypeT;
        defaultValue: ArgumentTypeToValueType<TypeT>;
        hidden?: boolean;
    }): NewTaskDefinitionBuilder<ExtendTaskArguments<NameT, TypeT, TaskArgumentsT>, ActionTypeT>;
    addFlag<NameT extends string>(flagConfig: {
        name: NameT;
        shortName?: string;
        description?: string;
        hidden?: boolean;
    }): NewTaskDefinitionBuilder<ExtendTaskArguments<NameT, ArgumentType.FLAG, TaskArgumentsT>, ActionTypeT>;
    addLevel<NameT extends string>(levelConfig: {
        name: NameT;
        shortName?: string;
        description?: string;
        defaultValue?: number;
    }): NewTaskDefinitionBuilder<ExtendTaskArguments<NameT, ArgumentType.LEVEL, TaskArgumentsT>, ActionTypeT>;
    addPositionalArgument<NameT extends string, TypeT extends ArgumentType = ArgumentType.STRING>(argConfig: {
        name: NameT;
        description?: string;
        type?: TypeT;
        defaultValue?: ArgumentTypeToValueType<TypeT>;
    }): NewTaskDefinitionBuilder<ExtendTaskArguments<NameT, TypeT, TaskArgumentsT>, ActionTypeT>;
    addVariadicArgument<NameT extends string, TypeT extends ArgumentType = ArgumentType.STRING>(argConfig: {
        name: NameT;
        description?: string;
        type?: TypeT;
        defaultValue?: Array<ArgumentTypeToValueType<TypeT>>;
    }): NewTaskDefinitionBuilder<ExtendTaskArguments<NameT, TypeT[], TaskArgumentsT>, ActionTypeT>;
    build(): ActionTypeT extends "LAZY_ACTION" ? Extract<NewTaskDefinition, {
        action: LazyActionObject<NewTaskActionFunction>;
    }> : ActionTypeT extends "INLINE_ACTION" ? Extract<NewTaskDefinition, {
        inlineAction: NewTaskActionFunction;
    }> : never;
}
export declare class TaskOverrideDefinitionBuilderImplementation<TaskArgumentsT extends TaskArguments = TaskArguments, ActionTypeT extends "LAZY_ACTION" | "INLINE_ACTION" | "MISSING_ACTION" = "MISSING_ACTION"> implements TaskOverrideDefinitionBuilder<TaskArgumentsT, ActionTypeT> {
    #private;
    constructor(id: string | string[]);
    setDescription(description: string): this;
    setAction(action: LazyActionObject<TaskOverrideActionFunction<TaskArgumentsT>>): TaskOverrideDefinitionBuilder<TaskArgumentsT, "LAZY_ACTION">;
    setInlineAction(inlineAction: TaskOverrideActionFunction<TaskArgumentsT>): TaskOverrideDefinitionBuilder<TaskArgumentsT, "INLINE_ACTION">;
    addOption<NameT extends string, TypeT extends ArgumentType = ArgumentType.STRING>({ name, shortName, description, type, defaultValue, hidden, }: {
        name: NameT;
        shortName?: string;
        description?: string;
        type?: TypeT;
        defaultValue: ArgumentTypeToValueType<TypeT>;
        hidden?: boolean;
    }): TaskOverrideDefinitionBuilder<ExtendTaskArguments<NameT, TypeT, TaskArgumentsT>, ActionTypeT>;
    addFlag<NameT extends string>(flagConfig: {
        name: NameT;
        shortName?: string;
        description?: string;
        hidden?: boolean;
    }): TaskOverrideDefinitionBuilder<ExtendTaskArguments<NameT, ArgumentType.FLAG, TaskArgumentsT>, ActionTypeT>;
    addLevel<NameT extends string>(levelConfig: {
        name: NameT;
        shortName?: string;
        description?: string;
        defaultValue?: number;
    }): TaskOverrideDefinitionBuilder<ExtendTaskArguments<NameT, ArgumentType.LEVEL, TaskArgumentsT>, ActionTypeT>;
    build(): ActionTypeT extends "LAZY_ACTION" ? Extract<TaskOverrideDefinition, {
        action: LazyActionObject<TaskOverrideActionFunction>;
    }> : ActionTypeT extends "INLINE_ACTION" ? Extract<TaskOverrideDefinition, {
        inlineAction: TaskOverrideActionFunction;
    }> : never;
}
//# sourceMappingURL=builders.d.ts.map