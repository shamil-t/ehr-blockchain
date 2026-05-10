import { RoutingModule } from '../../../common/interfaces';
export interface Options {
    redirects: boolean;
}
export declare const parseRoutes: (tsconfig: string, exclude?: string[], inputOptions?: Partial<Options>) => RoutingModule[];
