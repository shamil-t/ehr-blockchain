/**
 * Generates a new, generic route guard definition in the given project.
 */
export interface Schema {
    /**
     * When true (the default), creates the new files at the top level of the current project.
     */
    flat?: boolean;
    /**
     * Specifies whether to generate a guard as a function.
     */
    functional?: boolean;
    /**
     * Specifies which type of guard to create.
     */
    implements?: Implement[];
    /**
     * The name of the new route guard.
     */
    name: string;
    /**
     * The path at which to create the interface that defines the guard, relative to the current
     * workspace.
     */
    path?: string;
    /**
     * The name of the project.
     */
    project: string;
    /**
     * Do not create "spec.ts" test files for the new guard.
     */
    skipTests?: boolean;
}
export declare enum Implement {
    CanActivate = "CanActivate",
    CanActivateChild = "CanActivateChild",
    CanDeactivate = "CanDeactivate",
    CanMatch = "CanMatch"
}
