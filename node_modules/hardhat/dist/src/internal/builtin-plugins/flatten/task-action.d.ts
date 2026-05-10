import type { NewTaskActionFunction } from "../../../types/tasks.js";
export interface FlattenActionArguments {
    files: string[];
    logFunction?: typeof console.log;
    warnFunction?: typeof console.warn;
}
export interface FlattenActionResult {
    flattened: string;
    metadata?: FlattenMetadata;
}
export interface FlattenMetadata {
    filesWithoutLicenses: string[];
    pragmaDirective: string;
    filesWithoutPragmaDirectives: string[];
    filesWithDifferentPragmaDirectives: string[];
}
declare const flattenAction: NewTaskActionFunction<FlattenActionArguments>;
export default flattenAction;
//# sourceMappingURL=task-action.d.ts.map