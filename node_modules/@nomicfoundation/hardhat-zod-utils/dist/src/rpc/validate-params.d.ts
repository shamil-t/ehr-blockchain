import type { ZodType } from "zod";
export declare function validateParams<TypesT extends ReadonlyArray<ZodType<any>>>(params: any[], ...types: TypesT): {
    [i in keyof TypesT]: TypesT[i] extends ZodType<infer TypeT> ? TypeT : never;
};
//# sourceMappingURL=validate-params.d.ts.map