import * as ts from 'typescript';
import { LazyRoute, Route } from './routes';
import { RoutingModule } from '../../../common/interfaces';
interface RoutesDeclaration {
    lazyRoutes: LazyRoute[];
    eagerRoutes: Route[];
}
export interface Registry {
    [path: string]: RoutesDeclaration;
}
export declare const findRootModule: (registry: Registry) => string;
export declare const collectRoutingModules: (rootFile: string, registry: Registry, result: RoutingModule[], parentFilePath?: string, currentRoutePath?: string, existing?: Set<string>) => void;
export declare const findMainModule: (program: ts.Program) => null;
export declare const getModulePathFromRoute: (parentPath: string, loadChildren: string, program: ts.Program, host: ts.CompilerHost) => string;
export declare const cleanModuleCache: () => {};
export declare const getModuleEntryPoint: (path: string, entryPoints: Set<string>, program: ts.Program, host: ts.CompilerHost) => string;
export declare const getLazyEntryPoints: (node: ts.ObjectLiteralExpression, program: ts.Program, host: ts.CompilerHost) => string | null;
export {};
