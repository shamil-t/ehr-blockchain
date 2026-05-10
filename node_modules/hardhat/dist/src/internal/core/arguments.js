import { HardhatError } from "@nomicfoundation/hardhat-errors";
import { ArgumentType } from "../../types/arguments.js";
/**
 * Names that cannot be used for global or task arguments.
 * Reserved for future use.
 */
export const RESERVED_ARGUMENT_NAMES = new Set([]);
/**
 * Names that cannot be used for global or task arguments.
 * Reserved for future use.
 */
export const RESERVED_ARGUMENT_SHORT_NAMES = new Set([]);
const VALID_ARGUMENT_NAME_PATTERN = /^[a-z][a-zA-Z0-9]*$/;
const VALID_ARGUMENT_SHORT_NAME_PATTERN = /^[a-zA-Z]$/;
const VALID_HEX_PATTERN = /^0[xX][\dA-Fa-f]+$/;
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
export function validateArgumentName(name) {
    if (!isArgumentNameValid(name)) {
        throw new HardhatError(HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_NAME, {
            name,
        });
    }
    if (RESERVED_ARGUMENT_NAMES.has(name)) {
        throw new HardhatError(HardhatError.ERRORS.CORE.ARGUMENTS.RESERVED_NAME, {
            name,
        });
    }
}
/**
 * Returns true if the given name is a valid argument name.
 */
export function isArgumentNameValid(name) {
    return VALID_ARGUMENT_NAME_PATTERN.test(name);
}
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
export function validateArgumentShortName(name) {
    if (!isArgumentShortNameValid(name)) {
        throw new HardhatError(HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_SHORT_NAME, {
            name,
        });
    }
    if (RESERVED_ARGUMENT_SHORT_NAMES.has(name)) {
        throw new HardhatError(HardhatError.ERRORS.CORE.ARGUMENTS.RESERVED_NAME, {
            name,
        });
    }
}
/**
 * Returns true if the given name is a valid argument name.
 */
export function isArgumentShortNameValid(name) {
    return VALID_ARGUMENT_SHORT_NAME_PATTERN.test(name);
}
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
export function validateArgumentValue(name, expectedType, value, isVariadic = false) {
    if (!isArgumentValueValid(expectedType, value, isVariadic)) {
        throw new HardhatError(HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
            name,
            type: expectedType,
            value,
        });
    }
}
/**
 * Checks if an argument value is valid for a given argument type.
 *
 * This function uses a map of validators, where each validator is a function
 * that checks if a value is valid for a specific argument type.
 * If the argument type is variadic, the value is considered valid if it is an
 * array and all its elements are valid for the argument type. An empty array
 * is considered invalid.
 */
export function isArgumentValueValid(type, value, isVariadic = false) {
    const validator = argumentTypeValidators[type];
    if (isVariadic) {
        return Array.isArray(value) && value.every(validator);
    }
    return validator(value);
}
const argumentTypeValidators = {
    [ArgumentType.STRING]: (value) => typeof value === "string",
    [ArgumentType.BOOLEAN]: (value) => typeof value === "boolean",
    [ArgumentType.FLAG]: (value) => typeof value === "boolean",
    [ArgumentType.INT]: (value) => Number.isInteger(value),
    [ArgumentType.LEVEL]: (value) => Number.isInteger(value) && Number(value) >= 0,
    [ArgumentType.BIGINT]: (value) => typeof value === "bigint",
    [ArgumentType.FLOAT]: (value) => typeof value === "number",
    [ArgumentType.FILE]: (value) => typeof value === "string",
    [ArgumentType.STRING_WITHOUT_DEFAULT]: (value) => typeof value === "string" || value === undefined,
    [ArgumentType.FILE_WITHOUT_DEFAULT]: (value) => typeof value === "string" || value === undefined,
};
/**
 * Parses an argument value from a string to the corresponding type.
 *
 * @param value - The string value to parse.
 * @param type - The type of the argument.
 * @param name - The name of the argument.
 */
export function parseArgumentValue(value, type, name) {
    switch (type) {
        case ArgumentType.STRING_WITHOUT_DEFAULT:
        case ArgumentType.FILE_WITHOUT_DEFAULT:
        case ArgumentType.STRING:
        case ArgumentType.FILE:
            return value;
        case ArgumentType.INT:
            return validateAndParseInt(name, value);
        case ArgumentType.LEVEL:
            return validateAndParseLevel(name, value);
        case ArgumentType.FLOAT:
            return validateAndParseFloat(name, value);
        case ArgumentType.BIGINT:
            return validateAndParseBigInt(name, value);
        case ArgumentType.BOOLEAN:
            return validateAndParseBoolean(name, value);
        case ArgumentType.FLAG:
            return validateAndParseFlag(name, value);
    }
}
function validateAndParseInt(name, value) {
    const decimalPattern = /^\d+(?:[eE]\d+)?$/;
    if (!decimalPattern.test(value) && !VALID_HEX_PATTERN.test(value)) {
        throw new HardhatError(HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
            value,
            name,
            type: ArgumentType.INT,
        });
    }
    return Number(value);
}
function validateAndParseLevel(name, value) {
    const decimalPattern = /^\d+$/;
    if (!decimalPattern.test(value) || Number(value) < 0) {
        throw new HardhatError(HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
            value,
            name,
            type: ArgumentType.LEVEL,
        });
    }
    return Number(value);
}
function validateAndParseFloat(name, value) {
    const decimalPattern = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE]\d+)?$/;
    if (!decimalPattern.test(value) && !VALID_HEX_PATTERN.test(value)) {
        throw new HardhatError(HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
            value,
            name,
            type: ArgumentType.FLOAT,
        });
    }
    return Number(value);
}
function validateAndParseBigInt(name, value) {
    const decimalPattern = /^\d+(?:n)?$/;
    if (!decimalPattern.test(value) && !VALID_HEX_PATTERN.test(value)) {
        throw new HardhatError(HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
            value,
            name,
            type: ArgumentType.BIGINT,
        });
    }
    return BigInt(value.replace("n", ""));
}
function validateAndParseBoolean(name, value) {
    const normalizedValue = value.toLowerCase();
    if (normalizedValue !== "true" && normalizedValue !== "false") {
        throw new HardhatError(HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
            value,
            name,
            type: ArgumentType.BOOLEAN,
        });
    }
    return normalizedValue === "true";
}
function validateAndParseFlag(name, value) {
    const normalizedValue = value.toLowerCase();
    if (normalizedValue !== "true" && normalizedValue !== "false") {
        throw new HardhatError(HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
            value,
            name,
            type: ArgumentType.FLAG,
        });
    }
    return normalizedValue === "true";
}
//# sourceMappingURL=arguments.js.map