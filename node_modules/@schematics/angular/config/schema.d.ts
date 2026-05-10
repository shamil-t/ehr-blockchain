/**
 * Generates a configuration file in the given project.
 */
export interface Schema {
    /**
     * The name of the project.
     */
    project: string;
    /**
     * Specifies which type of configuration file to create.
     */
    type: Type;
}
/**
 * Specifies which type of configuration file to create.
 */
export declare enum Type {
    Browserslist = "browserslist",
    Karma = "karma"
}
