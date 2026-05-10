import * as ts from 'typescript';
import { RoutingModule } from '../../../common/interfaces';
export declare const parseReactRoutes: (files: string[], options: ts.CompilerOptions) => RoutingModule[];
