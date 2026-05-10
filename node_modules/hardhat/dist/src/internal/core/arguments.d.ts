import type { ArgumentValue } from "../../types/arguments.js";
import { ArgumentType } from "../../types/arguments.js";
/**
 * Names that cannot be used for global or task arguments.
 * Reserved for future use.
 */
export declare const RESERVED_ARGUMENT_NAMES: Set<string>;
/**
 * Names that cannot be used for global or task arguments.
 * Reserved for future use.
 */
export declare const RESERVED_ARGUMENT_SHORT_NAMES: Set<string>;
/**
 * Validates an argument name, throwing an error if it is invalid.
 *
 * @param name The name of the argument.
 * @throws {HardhatError} with descriptor:
 * - {@link HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_NAME} if the name is invalid.
 * A valid name must start with a lowercase letter and contain only
 * alphanumeric characters.
 * - {@link HardhatError.ERRORS.CORE.ARGUMENTS.RESERVED_NAME} if the name is
 * reserved. See {@link RESERVED_ARGUMENT_NAMES}.
 */
export declare function validateArgumentName(name: string): void;
/**
 * Returns true if the given name is a valid argument name.
 */
export declare function isArgumentNameValid(name: string): boolean;
/**
 * Validates an argument short name, throwing an error if it is invalid.
 *
 * @param name The short name of the argument.
 * @throws {HardhatError} with descriptor:
 * - {@link HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_SHORT_NAME} if the name is invalid.
 * A valid short name must be a lowercase letter.
 * - {@link HardhatError.ERRORS.CORE.ARGUMENTS.RESERVED_NAME} if the short name is
 * reserved. See {@link RESERVED_ARGUMENT_SHORT_NAMES}.
 */
export declare function validateArgumentShortName(name: string): void;
/**
 * Returns true if the given name is a valid argument name.
 */
export declare function isArgumentShortNameValid(name: string): boolean;
/**
 * Validates an argument value, throwing an error if it is invalid.
 *
 * @param name The name of the argument.
 * @param expectedType The expected type of the argument. One of {@link ArgumentType}.
 * @param value The value of the argument.
 * @param isVariadic Whether the argument is variadic.
 * @throws {HardhatError} with descriptor {@link HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_VALUE_FOR_TYPE}
 * if the value is invalid for the expected type.
 */
export declare function validateArgumentValue(name: string, expectedType: ArgumentType, value: ArgumentValue | ArgumentValue[], isVariadic?: boolean): void;
/**
 * Checks if an argument value is valid for a given argument type.
 *
 * This function uses a map of validators, where each validator is a function
 * that checks if a value is valid for a specific argument type.
 * If the argument type is variadic, the value is considered valid if it is an
 * array and all its elements are valid for the argument type. An empty array
 * is considered invalid.
 */
export declare function isArgumentValueValid(type: ArgumentType, value: unknown, isVariadic?: boolean): boolean;
/**
 * Parses an argument value from a string to the corresponding type.
 *
 * @param value - The string value to parse.
 * @param type - The type of the argument.
 * @param name - The name of the argument.
 */
export declare function parseArgumentValue(value: string, type: ArgumentType, name: string): ArgumentValue;
//# sourceMappingURL=arguments.d.ts.map