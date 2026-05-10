import type { ArgumentTypeToValueType, GlobalOptionDefinition } from "../../types/arguments.js";
import type { GlobalOptions, GlobalOptionDefinitions } from "../../types/global-options.js";
import type { HardhatPlugin } from "../../types/plugins.js";
import { ArgumentType } from "../../types/arguments.js";
/**
 * Builds a map of the global option definitions by going through all the
 * plugins and validating the global options they define.
 *
 * Note: this function can be used before initializing the HRE, so the plugins
 * shouldn't be consider validated. Hence, we should validate the global
 * options.
 */
export declare function buildGlobalOptionDefinitions(resolvedPlugins: HardhatPlugin[]): GlobalOptionDefinitions;
/**
 * Builds a global option definition, validating the name, type, and default
 * value.
 */
export declare function buildGlobalOptionDefinition<T extends ArgumentType = ArgumentType.STRING>({ name, shortName, description, type, defaultValue, }: {
    name: string;
    shortName?: string;
    description: string;
    type?: T;
    defaultValue: ArgumentTypeToValueType<T>;
}): GlobalOptionDefinition;
/**
 * Resolves global options by merging user-provided options with environment
 * variables, adhering to predefined global option definitions. This function
 * ensures that only options specified in the globalOptionDefinitions are
 * considered. Each option is validated against its definition in the map, with
 * user-provided options taking precedence over environment variables. If an
 * option is not provided by the user or set as an environment variable, its
 * default value (as specified in the globalOptionDefinitions) is used.
 *
 * @param userProvidedGlobalOptions The options explicitly provided by the
 * user. These take precedence over equivalent environment variables.
 * @param globalOptionDefinitions A map defining valid global options, their default
 * values, and expected types. This map is used to validate and parse the options.
 * @returns {GlobalOptions} An object containing the resolved global options,
 * with each option adhering to its definition in the globalOptionDefinitions.
 * @throws {HardhatError} with descriptor
 * {@link HardhatError.ERRORS.CORE.ARGUMENTS.INVALID_VALUE_FOR_TYPE} if a user-provided
 * option has an invalid value for its type.
 */
export declare function resolveGlobalOptions(userProvidedGlobalOptions: Partial<GlobalOptions>, globalOptionDefinitions: GlobalOptionDefinitions): GlobalOptions;
//# sourceMappingURL=global-options.d.ts.map