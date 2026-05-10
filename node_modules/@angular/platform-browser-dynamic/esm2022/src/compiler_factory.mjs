/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CompilerConfig } from '@angular/compiler';
import { Compiler, Injector, MissingTranslationStrategy, ViewEncapsulation } from '@angular/core';
export const COMPILER_PROVIDERS = [{ provide: Compiler, useFactory: () => new Compiler() }];
/**
 * @publicApi
 *
 * @deprecated
 * Ivy JIT mode doesn't require accessing this symbol.
 * See [JIT API changes due to ViewEngine deprecation](guide/deprecations#jit-api-changes) for
 * additional context.
 */
export class JitCompilerFactory {
    /** @internal */
    constructor(defaultOptions) {
        const compilerOptions = {
            useJit: true,
            defaultEncapsulation: ViewEncapsulation.Emulated,
            missingTranslation: MissingTranslationStrategy.Warning,
        };
        this._defaultOptions = [compilerOptions, ...defaultOptions];
    }
    createCompiler(options = []) {
        const opts = _mergeOptions(this._defaultOptions.concat(options));
        const injector = Injector.create({
            providers: [
                COMPILER_PROVIDERS, {
                    provide: CompilerConfig,
                    useFactory: () => {
                        return new CompilerConfig({
                            // let explicit values from the compiler options overwrite options
                            // from the app providers
                            useJit: opts.useJit,
                            // let explicit values from the compiler options overwrite options
                            // from the app providers
                            defaultEncapsulation: opts.defaultEncapsulation,
                            missingTranslation: opts.missingTranslation,
                            preserveWhitespaces: opts.preserveWhitespaces,
                        });
                    },
                    deps: []
                },
                opts.providers
            ]
        });
        return injector.get(Compiler);
    }
}
function _mergeOptions(optionsArr) {
    return {
        useJit: _lastDefined(optionsArr.map(options => options.useJit)),
        defaultEncapsulation: _lastDefined(optionsArr.map(options => options.defaultEncapsulation)),
        providers: _mergeArrays(optionsArr.map(options => options.providers)),
        missingTranslation: _lastDefined(optionsArr.map(options => options.missingTranslation)),
        preserveWhitespaces: _lastDefined(optionsArr.map(options => options.preserveWhitespaces)),
    };
}
function _lastDefined(args) {
    for (let i = args.length - 1; i >= 0; i--) {
        if (args[i] !== undefined) {
            return args[i];
        }
    }
    return undefined;
}
function _mergeArrays(parts) {
    const result = [];
    parts.forEach((part) => part && result.push(...part));
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJfZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3BsYXRmb3JtLWJyb3dzZXItZHluYW1pYy9zcmMvY29tcGlsZXJfZmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBb0MsUUFBUSxFQUFFLDBCQUEwQixFQUFrQixpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUVsSixNQUFNLENBQUMsTUFBTSxrQkFBa0IsR0FDVCxDQUFDLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxRQUFRLEVBQUUsRUFBQyxDQUFDLENBQUM7QUFDOUU7Ozs7Ozs7R0FPRztBQUNILE1BQU0sT0FBTyxrQkFBa0I7SUFHN0IsZ0JBQWdCO0lBQ2hCLFlBQVksY0FBaUM7UUFDM0MsTUFBTSxlQUFlLEdBQW9CO1lBQ3ZDLE1BQU0sRUFBRSxJQUFJO1lBQ1osb0JBQW9CLEVBQUUsaUJBQWlCLENBQUMsUUFBUTtZQUNoRCxrQkFBa0IsRUFBRSwwQkFBMEIsQ0FBQyxPQUFPO1NBQ3ZELENBQUM7UUFFRixJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsZUFBZSxFQUFFLEdBQUcsY0FBYyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVELGNBQWMsQ0FBQyxVQUE2QixFQUFFO1FBQzVDLE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7WUFDL0IsU0FBUyxFQUFFO2dCQUNULGtCQUFrQixFQUFFO29CQUNsQixPQUFPLEVBQUUsY0FBYztvQkFDdkIsVUFBVSxFQUFFLEdBQUcsRUFBRTt3QkFDZixPQUFPLElBQUksY0FBYyxDQUFDOzRCQUN4QixrRUFBa0U7NEJBQ2xFLHlCQUF5Qjs0QkFDekIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNOzRCQUNuQixrRUFBa0U7NEJBQ2xFLHlCQUF5Qjs0QkFDekIsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLG9CQUFvQjs0QkFDL0Msa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQjs0QkFDM0MsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLG1CQUFtQjt5QkFDOUMsQ0FBQyxDQUFDO29CQUNMLENBQUM7b0JBQ0QsSUFBSSxFQUFFLEVBQUU7aUJBQ1Q7Z0JBQ0QsSUFBSSxDQUFDLFNBQVU7YUFDaEI7U0FDRixDQUFDLENBQUM7UUFDSCxPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUNGO0FBRUQsU0FBUyxhQUFhLENBQUMsVUFBNkI7SUFDbEQsT0FBTztRQUNMLE1BQU0sRUFBRSxZQUFZLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvRCxvQkFBb0IsRUFBRSxZQUFZLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzNGLFNBQVMsRUFBRSxZQUFZLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFVLENBQUMsQ0FBQztRQUN0RSxrQkFBa0IsRUFBRSxZQUFZLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3ZGLG1CQUFtQixFQUFFLFlBQVksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7S0FDMUYsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBSSxJQUFTO0lBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN6QyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFDekIsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDaEI7S0FDRjtJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxLQUFjO0lBQ2xDLE1BQU0sTUFBTSxHQUFVLEVBQUUsQ0FBQztJQUN6QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdEQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbXBpbGVyQ29uZmlnfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0NvbXBpbGVyLCBDb21waWxlckZhY3RvcnksIENvbXBpbGVyT3B0aW9ucywgSW5qZWN0b3IsIE1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5LCBTdGF0aWNQcm92aWRlciwgVmlld0VuY2Fwc3VsYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5leHBvcnQgY29uc3QgQ09NUElMRVJfUFJPVklERVJTID1cbiAgICA8U3RhdGljUHJvdmlkZXJbXT5be3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VGYWN0b3J5OiAoKSA9PiBuZXcgQ29tcGlsZXIoKX1dO1xuLyoqXG4gKiBAcHVibGljQXBpXG4gKlxuICogQGRlcHJlY2F0ZWRcbiAqIEl2eSBKSVQgbW9kZSBkb2Vzbid0IHJlcXVpcmUgYWNjZXNzaW5nIHRoaXMgc3ltYm9sLlxuICogU2VlIFtKSVQgQVBJIGNoYW5nZXMgZHVlIHRvIFZpZXdFbmdpbmUgZGVwcmVjYXRpb25dKGd1aWRlL2RlcHJlY2F0aW9ucyNqaXQtYXBpLWNoYW5nZXMpIGZvclxuICogYWRkaXRpb25hbCBjb250ZXh0LlxuICovXG5leHBvcnQgY2xhc3MgSml0Q29tcGlsZXJGYWN0b3J5IGltcGxlbWVudHMgQ29tcGlsZXJGYWN0b3J5IHtcbiAgcHJpdmF0ZSBfZGVmYXVsdE9wdGlvbnM6IENvbXBpbGVyT3B0aW9uc1tdO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgY29uc3RydWN0b3IoZGVmYXVsdE9wdGlvbnM6IENvbXBpbGVyT3B0aW9uc1tdKSB7XG4gICAgY29uc3QgY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnMgPSB7XG4gICAgICB1c2VKaXQ6IHRydWUsXG4gICAgICBkZWZhdWx0RW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWQsXG4gICAgICBtaXNzaW5nVHJhbnNsYXRpb246IE1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5Lldhcm5pbmcsXG4gICAgfTtcblxuICAgIHRoaXMuX2RlZmF1bHRPcHRpb25zID0gW2NvbXBpbGVyT3B0aW9ucywgLi4uZGVmYXVsdE9wdGlvbnNdO1xuICB9XG5cbiAgY3JlYXRlQ29tcGlsZXIob3B0aW9uczogQ29tcGlsZXJPcHRpb25zW10gPSBbXSk6IENvbXBpbGVyIHtcbiAgICBjb25zdCBvcHRzID0gX21lcmdlT3B0aW9ucyh0aGlzLl9kZWZhdWx0T3B0aW9ucy5jb25jYXQob3B0aW9ucykpO1xuICAgIGNvbnN0IGluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtcbiAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICBDT01QSUxFUl9QUk9WSURFUlMsIHtcbiAgICAgICAgICBwcm92aWRlOiBDb21waWxlckNvbmZpZyxcbiAgICAgICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbXBpbGVyQ29uZmlnKHtcbiAgICAgICAgICAgICAgLy8gbGV0IGV4cGxpY2l0IHZhbHVlcyBmcm9tIHRoZSBjb21waWxlciBvcHRpb25zIG92ZXJ3cml0ZSBvcHRpb25zXG4gICAgICAgICAgICAgIC8vIGZyb20gdGhlIGFwcCBwcm92aWRlcnNcbiAgICAgICAgICAgICAgdXNlSml0OiBvcHRzLnVzZUppdCxcbiAgICAgICAgICAgICAgLy8gbGV0IGV4cGxpY2l0IHZhbHVlcyBmcm9tIHRoZSBjb21waWxlciBvcHRpb25zIG92ZXJ3cml0ZSBvcHRpb25zXG4gICAgICAgICAgICAgIC8vIGZyb20gdGhlIGFwcCBwcm92aWRlcnNcbiAgICAgICAgICAgICAgZGVmYXVsdEVuY2Fwc3VsYXRpb246IG9wdHMuZGVmYXVsdEVuY2Fwc3VsYXRpb24sXG4gICAgICAgICAgICAgIG1pc3NpbmdUcmFuc2xhdGlvbjogb3B0cy5taXNzaW5nVHJhbnNsYXRpb24sXG4gICAgICAgICAgICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IG9wdHMucHJlc2VydmVXaGl0ZXNwYWNlcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZGVwczogW11cbiAgICAgICAgfSxcbiAgICAgICAgb3B0cy5wcm92aWRlcnMhXG4gICAgICBdXG4gICAgfSk7XG4gICAgcmV0dXJuIGluamVjdG9yLmdldChDb21waWxlcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gX21lcmdlT3B0aW9ucyhvcHRpb25zQXJyOiBDb21waWxlck9wdGlvbnNbXSk6IENvbXBpbGVyT3B0aW9ucyB7XG4gIHJldHVybiB7XG4gICAgdXNlSml0OiBfbGFzdERlZmluZWQob3B0aW9uc0Fyci5tYXAob3B0aW9ucyA9PiBvcHRpb25zLnVzZUppdCkpLFxuICAgIGRlZmF1bHRFbmNhcHN1bGF0aW9uOiBfbGFzdERlZmluZWQob3B0aW9uc0Fyci5tYXAob3B0aW9ucyA9PiBvcHRpb25zLmRlZmF1bHRFbmNhcHN1bGF0aW9uKSksXG4gICAgcHJvdmlkZXJzOiBfbWVyZ2VBcnJheXMob3B0aW9uc0Fyci5tYXAob3B0aW9ucyA9PiBvcHRpb25zLnByb3ZpZGVycyEpKSxcbiAgICBtaXNzaW5nVHJhbnNsYXRpb246IF9sYXN0RGVmaW5lZChvcHRpb25zQXJyLm1hcChvcHRpb25zID0+IG9wdGlvbnMubWlzc2luZ1RyYW5zbGF0aW9uKSksXG4gICAgcHJlc2VydmVXaGl0ZXNwYWNlczogX2xhc3REZWZpbmVkKG9wdGlvbnNBcnIubWFwKG9wdGlvbnMgPT4gb3B0aW9ucy5wcmVzZXJ2ZVdoaXRlc3BhY2VzKSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIF9sYXN0RGVmaW5lZDxUPihhcmdzOiBUW10pOiBUfHVuZGVmaW5lZCB7XG4gIGZvciAobGV0IGkgPSBhcmdzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGFyZ3NbaV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGFyZ3NbaV07XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIF9tZXJnZUFycmF5cyhwYXJ0czogYW55W11bXSk6IGFueVtdIHtcbiAgY29uc3QgcmVzdWx0OiBhbnlbXSA9IFtdO1xuICBwYXJ0cy5mb3JFYWNoKChwYXJ0KSA9PiBwYXJ0ICYmIHJlc3VsdC5wdXNoKC4uLnBhcnQpKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiJdfQ==