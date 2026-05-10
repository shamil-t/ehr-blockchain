export var RootResolutionErrorType;
(function (RootResolutionErrorType) {
    /**
     * Trying to resolve a project file as root, but it's not part of the project.
     */
    RootResolutionErrorType["PROJECT_ROOT_FILE_NOT_IN_PROJECT"] = "PROJECT_ROOT_FILE_NOT_IN_PROJECT";
    /**
     * Trying to resolve a project file as root, but it doesn't exist.
     */
    RootResolutionErrorType["PROJECT_ROOT_FILE_DOES_NOT_EXIST"] = "PROJECT_ROOT_FILE_DOES_NOT_EXIST";
    /**
     * Trying to resolve a project file as root, but it's in a node_modules
     * directory.
     */
    RootResolutionErrorType["PROJECT_ROOT_FILE_IN_NODE_MODULES"] = "PROJECT_ROOT_FILE_IN_NODE_MODULES";
    /**
     * Trying to resolve an npm file as root, but it's module name has an invalid
     * format.
     */
    RootResolutionErrorType["NPM_ROOT_FILE_NAME_WITH_INVALID_FORMAT"] = "NPM_ROOT_FILE_NAME_WITH_INVALID_FORMAT";
    /**
     * Trying to resolve an npm file as root resolves into a project file
     * because a direct local import was provided (e.g. "contracts/A.sol"), or
     * because its being affected by a user remapping which resolves into a
     * project file.
     */
    RootResolutionErrorType["NPM_ROOT_FILE_RESOLVES_TO_PROJECT_FILE"] = "NPM_ROOT_FILE_RESOLVES_TO_PROJECT_FILE";
    /**
     * Trying to resolve an npm file as root, but it's package is not installed.
     */
    RootResolutionErrorType["NPM_ROOT_FILE_OF_UNINSTALLED_PACKAGE"] = "NPM_ROOT_FILE_OF_UNINSTALLED_PACKAGE";
    /**
     * Trying to resolve an npm file as root, but remapping errors were found.
     */
    RootResolutionErrorType["NPM_ROOT_FILE_RESOLUTION_WITH_REMAPPING_ERRORS"] = "NPM_ROOT_FILE_RESOLUTION_WITH_REMAPPING_ERRORS";
    /**
     * Trying to resolve an npm file as root, but it doesn't exist within its
     * package.
     */
    RootResolutionErrorType["NPM_ROOT_FILE_DOES_NOT_EXIST_WITHIN_ITS_PACKAGE"] = "NPM_ROOT_FILE_DOES_NOT_EXIST_WITHIN_ITS_PACKAGE";
    /**
     * Trying to resolve an npm file as root, but the casing you are using is
     * incorrect.
     */
    RootResolutionErrorType["NPM_ROOT_FILE_WITH_INCORRECT_CASING"] = "NPM_ROOT_FILE_WITH_INCORRECT_CASING";
    /**
     * Trying to resolve an npm file as root, but the file is not exported by the
     * package.
     */
    RootResolutionErrorType["NPM_ROOT_FILE_NON_EXPORTED_FILE"] = "NPM_ROOT_FILE_NON_EXPORTED_FILE";
})(RootResolutionErrorType || (RootResolutionErrorType = {}));
/**
 * The different types of errors that can happen when resolving an import.
 */
export var ImportResolutionErrorType;
(function (ImportResolutionErrorType) {
    /**
     * An import has windows path separators.
     */
    ImportResolutionErrorType["IMPORT_WITH_WINDOWS_PATH_SEPARATORS"] = "IMPORT_WITH_WINDOWS_PATH_SEPARATORS";
    /**
     * A relative import gets outside of its package/project.
     */
    ImportResolutionErrorType["ILLEGAL_RELATIVE_IMPORT"] = "ILLEGAL_RELATIVE_IMPORT";
    /**
     * A relative import gets into node_modules instead of just using the
     * npm module name.
     */
    ImportResolutionErrorType["RELATIVE_IMPORT_INTO_NODE_MODULES"] = "RELATIVE_IMPORT_INTO_NODE_MODULES";
    /**
     * The imported file doesn't exist.
     */
    ImportResolutionErrorType["IMPORT_DOES_NOT_EXIST"] = "IMPORT_DOES_NOT_EXIST";
    /**
     * The imported file exists, but the casing you are using is incorrect.
     */
    ImportResolutionErrorType["IMPORT_INVALID_CASING"] = "IMPORT_INVALID_CASING";
    /**
     * Trying to import a file via npm, but the import syntax is invalid.
     */
    ImportResolutionErrorType["IMPORT_WITH_INVALID_NPM_SYNTAX"] = "IMPORT_WITH_INVALID_NPM_SYNTAX";
    /**
     * Importing an uninstalled npm package.
     */
    ImportResolutionErrorType["IMPORT_OF_UNINSTALLED_PACKAGE"] = "IMPORT_OF_UNINSTALLED_PACKAGE";
    /**
     * Processing an import lead to loading remappings with errors.
     */
    ImportResolutionErrorType["IMPORT_WITH_REMAPPING_ERRORS"] = "WITH_REMAPPING_ERRORS";
    /**
     * Importing a file that is not exported by the npm package' package.exports.
     */
    ImportResolutionErrorType["IMPORT_OF_NON_EXPORTED_NPM_FILE"] = "IMPORT_OF_NON_EXPORTED_NPM_FILE";
    /**
     * A relative import is affected by a user remapping, which we forbid.
     */
    ImportResolutionErrorType["RELATIVE_IMPORT_CLASHES_WITH_USER_REMAPPING"] = "RELATIVE_IMPORT_CLASHES_WITH_USER_REMAPPING";
    /**
     * A direct import to a local file was found, which we forbid.
     */
    ImportResolutionErrorType["DIRECT_IMPORT_TO_LOCAL_FILE"] = "DIRECT_IMPORT_TO_LOCAL_FILE";
})(ImportResolutionErrorType || (ImportResolutionErrorType = {}));
/**
 * The different types of errors that can happen when processing a user
 * remapping.
 */
export var UserRemappingErrorType;
(function (UserRemappingErrorType) {
    /**
     * The syntax of the remapping is invalid.
     */
    UserRemappingErrorType["REMAPPING_WITH_INVALID_SYNTAX"] = "REMAPPING_WITH_INVALID_SYNTAX";
    /**
     * Remapping into an uninstalled npm package.
     */
    UserRemappingErrorType["REMAPPING_TO_UNINSTALLED_PACKAGE"] = "REMAPPING_TO_UNINSTALLED_PACKAGE";
})(UserRemappingErrorType || (UserRemappingErrorType = {}));
//# sourceMappingURL=errors.js.map