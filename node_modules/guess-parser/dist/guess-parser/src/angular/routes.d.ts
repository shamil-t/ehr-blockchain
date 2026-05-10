import * as ts from 'typescript';
export declare const readLoadChildren: (node: ts.ObjectLiteralExpression, typeChecker: ts.TypeChecker) => string | null;
export declare const readChildren: (node: ts.ObjectLiteralExpression) => ts.NodeArray<ts.Node> | null;
export interface Route {
    path: string;
    children: Route[];
    redirectTo?: string;
}
export interface LazyRoute extends Route {
    module: string;
}
export declare const getRoute: (node: ts.ObjectLiteralExpression, entryPoints: Set<string>, program: ts.Program, host: ts.CompilerHost) => Route | null;
export declare const isRoute: (n: ts.Node, typeChecker: ts.TypeChecker, redirects: boolean) => boolean;
