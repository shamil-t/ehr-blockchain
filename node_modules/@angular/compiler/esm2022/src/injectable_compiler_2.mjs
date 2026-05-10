/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from './output/output_ast';
import { compileFactoryFunction, FactoryTarget, R3FactoryDelegateType } from './render3/r3_factory';
import { Identifiers } from './render3/r3_identifiers';
import { convertFromMaybeForwardRefExpression, typeWithParameters } from './render3/util';
import { DefinitionMap } from './render3/view/util';
export function compileInjectable(meta, resolveForwardRefs) {
    let result = null;
    const factoryMeta = {
        name: meta.name,
        type: meta.type,
        typeArgumentCount: meta.typeArgumentCount,
        deps: [],
        target: FactoryTarget.Injectable,
    };
    if (meta.useClass !== undefined) {
        // meta.useClass has two modes of operation. Either deps are specified, in which case `new` is
        // used to instantiate the class with dependencies injected, or deps are not specified and
        // the factory of the class is used to instantiate it.
        //
        // A special case exists for useClass: Type where Type is the injectable type itself and no
        // deps are specified, in which case 'useClass' is effectively ignored.
        const useClassOnSelf = meta.useClass.expression.isEquivalent(meta.type.value);
        let deps = undefined;
        if (meta.deps !== undefined) {
            deps = meta.deps;
        }
        if (deps !== undefined) {
            // factory: () => new meta.useClass(...deps)
            result = compileFactoryFunction({
                ...factoryMeta,
                delegate: meta.useClass.expression,
                delegateDeps: deps,
                delegateType: R3FactoryDelegateType.Class,
            });
        }
        else if (useClassOnSelf) {
            result = compileFactoryFunction(factoryMeta);
        }
        else {
            result = {
                statements: [],
                expression: delegateToFactory(meta.type.value, meta.useClass.expression, resolveForwardRefs)
            };
        }
    }
    else if (meta.useFactory !== undefined) {
        if (meta.deps !== undefined) {
            result = compileFactoryFunction({
                ...factoryMeta,
                delegate: meta.useFactory,
                delegateDeps: meta.deps || [],
                delegateType: R3FactoryDelegateType.Function,
            });
        }
        else {
            result = {
                statements: [],
                expression: o.fn([], [new o.ReturnStatement(meta.useFactory.callFn([]))])
            };
        }
    }
    else if (meta.useValue !== undefined) {
        // Note: it's safe to use `meta.useValue` instead of the `USE_VALUE in meta` check used for
        // client code because meta.useValue is an Expression which will be defined even if the actual
        // value is undefined.
        result = compileFactoryFunction({
            ...factoryMeta,
            expression: meta.useValue.expression,
        });
    }
    else if (meta.useExisting !== undefined) {
        // useExisting is an `inject` call on the existing token.
        result = compileFactoryFunction({
            ...factoryMeta,
            expression: o.importExpr(Identifiers.inject).callFn([meta.useExisting.expression]),
        });
    }
    else {
        result = {
            statements: [],
            expression: delegateToFactory(meta.type.value, meta.type.value, resolveForwardRefs)
        };
    }
    const token = meta.type.value;
    const injectableProps = new DefinitionMap();
    injectableProps.set('token', token);
    injectableProps.set('factory', result.expression);
    // Only generate providedIn property if it has a non-null value
    if (meta.providedIn.expression.value !== null) {
        injectableProps.set('providedIn', convertFromMaybeForwardRefExpression(meta.providedIn));
    }
    const expression = o.importExpr(Identifiers.ɵɵdefineInjectable)
        .callFn([injectableProps.toLiteralMap()], undefined, true);
    return {
        expression,
        type: createInjectableType(meta),
        statements: result.statements,
    };
}
export function createInjectableType(meta) {
    return new o.ExpressionType(o.importExpr(Identifiers.InjectableDeclaration, [typeWithParameters(meta.type.type, meta.typeArgumentCount)]));
}
function delegateToFactory(type, useType, unwrapForwardRefs) {
    if (type.node === useType.node) {
        // The types are the same, so we can simply delegate directly to the type's factory.
        // ```
        // factory: type.ɵfac
        // ```
        return useType.prop('ɵfac');
    }
    if (!unwrapForwardRefs) {
        // The type is not wrapped in a `forwardRef()`, so we create a simple factory function that
        // accepts a sub-type as an argument.
        // ```
        // factory: function(t) { return useType.ɵfac(t); }
        // ```
        return createFactoryFunction(useType);
    }
    // The useType is actually wrapped in a `forwardRef()` so we need to resolve that before
    // calling its factory.
    // ```
    // factory: function(t) { return core.resolveForwardRef(type).ɵfac(t); }
    // ```
    const unwrappedType = o.importExpr(Identifiers.resolveForwardRef).callFn([useType]);
    return createFactoryFunction(unwrappedType);
}
function createFactoryFunction(type) {
    return o.fn([new o.FnParam('t', o.DYNAMIC_TYPE)], [new o.ReturnStatement(type.prop('ɵfac').callFn([o.variable('t')]))]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZV9jb21waWxlcl8yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL2luamVjdGFibGVfY29tcGlsZXJfMi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEtBQUssQ0FBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxhQUFhLEVBQXdCLHFCQUFxQixFQUFvQixNQUFNLHNCQUFzQixDQUFDO0FBQzNJLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsb0NBQW9DLEVBQXdHLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUwsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBY2xELE1BQU0sVUFBVSxpQkFBaUIsQ0FDN0IsSUFBMEIsRUFBRSxrQkFBMkI7SUFDekQsSUFBSSxNQUFNLEdBQStELElBQUksQ0FBQztJQUU5RSxNQUFNLFdBQVcsR0FBc0I7UUFDckMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1FBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1FBQ2YsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtRQUN6QyxJQUFJLEVBQUUsRUFBRTtRQUNSLE1BQU0sRUFBRSxhQUFhLENBQUMsVUFBVTtLQUNqQyxDQUFDO0lBRUYsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLFNBQVMsRUFBRTtRQUMvQiw4RkFBOEY7UUFDOUYsMEZBQTBGO1FBQzFGLHNEQUFzRDtRQUN0RCxFQUFFO1FBQ0YsMkZBQTJGO1FBQzNGLHVFQUF1RTtRQUV2RSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztR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QXFCLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDdkM7SUFFRCx3RkFBd0Y7SUFDeEYsdUJBQXVCO0lBQ3ZCLE1BQU07SUFDTix3RUFBd0U7SUFDeEUsTUFBTTtJQUNOLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNwRixPQUFPLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUFDLElBQWtCO0lBQy9DLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FDUCxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQ3BDLENBQUMsSUFBSSxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBvIGZyb20gJy4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtjb21waWxlRmFjdG9yeUZ1bmN0aW9uLCBGYWN0b3J5VGFyZ2V0LCBSM0RlcGVuZGVuY3lNZXRhZGF0YSwgUjNGYWN0b3J5RGVsZWdhdGVUeXBlLCBSM0ZhY3RvcnlNZXRhZGF0YX0gZnJvbSAnLi9yZW5kZXIzL3IzX2ZhY3RvcnknO1xuaW1wb3J0IHtJZGVudGlmaWVyc30gZnJvbSAnLi9yZW5kZXIzL3IzX2lkZW50aWZpZXJzJztcbmltcG9ydCB7Y29udmVydEZyb21NYXliZUZvcndhcmRSZWZFeHByZXNzaW9uLCBGb3J3YXJkUmVmSGFuZGxpbmcsIGdlbmVyYXRlRm9yd2FyZFJlZiwgTWF5YmVGb3J3YXJkUmVmRXhwcmVzc2lvbiwgUjNDb21waWxlZEV4cHJlc3Npb24sIFIzUmVmZXJlbmNlLCB0eXBlV2l0aFBhcmFtZXRlcnN9IGZyb20gJy4vcmVuZGVyMy91dGlsJztcbmltcG9ydCB7RGVmaW5pdGlvbk1hcH0gZnJvbSAnLi9yZW5kZXIzL3ZpZXcvdXRpbCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUjNJbmplY3RhYmxlTWV0YWRhdGEge1xuICBuYW1lOiBzdHJpbmc7XG4gIHR5cGU6IFIzUmVmZXJlbmNlO1xuICB0eXBlQXJndW1lbnRDb3VudDogbnVtYmVyO1xuICBwcm92aWRlZEluOiBNYXliZUZvcndhcmRSZWZFeHByZXNzaW9uO1xuICB1c2VDbGFzcz86IE1heWJlRm9yd2FyZFJlZkV4cHJlc3Npb247XG4gIHVzZUZhY3Rvcnk/OiBvLkV4cHJlc3Npb247XG4gIHVzZUV4aXN0aW5nPzogTWF5YmVGb3J3YXJkUmVmRXhwcmVzc2lvbjtcbiAgdXNlVmFsdWU/OiBNYXliZUZvcndhcmRSZWZFeHByZXNzaW9uO1xuICBkZXBzPzogUjNEZXBlbmRlbmN5TWV0YWRhdGFbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVJbmplY3RhYmxlKFxuICAgIG1ldGE6IFIzSW5qZWN0YWJsZU1ldGFkYXRhLCByZXNvbHZlRm9yd2FyZFJlZnM6IGJvb2xlYW4pOiBSM0NvbXBpbGVkRXhwcmVzc2lvbiB7XG4gIGxldCByZXN1bHQ6IHtleHByZXNzaW9uOiBvLkV4cHJlc3Npb24sIHN0YXRlbWVudHM6IG8uU3RhdGVtZW50W119fG51bGwgPSBudWxsO1xuXG4gIGNvbnN0IGZhY3RvcnlNZXRhOiBSM0ZhY3RvcnlNZXRhZGF0YSA9IHtcbiAgICBuYW1lOiBtZXRhLm5hbWUsXG4gICAgdHlwZTogbWV0YS50eXBlLFxuICAgIHR5cGVBcmd1bWVudENvdW50OiBtZXRhLnR5cGVBcmd1bWVudENvdW50LFxuICAgIGRlcHM6IFtdLFxuICAgIHRhcmdldDogRmFjdG9yeVRhcmdldC5JbmplY3RhYmxlLFxuICB9O1xuXG4gIGlmIChtZXRhLnVzZUNsYXNzICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBtZXRhLnVzZUNsYXNzIGhhcyB0d28gbW9kZXMgb2Ygb3BlcmF0aW9uLiBFaXRoZXIgZGVwcyBhcmUgc3BlY2lmaWVkLCBpbiB3aGljaCBjYXNlIGBuZXdgIGlzXG4gICAgLy8gdXNlZCB0byBpbnN0YW50aWF0ZSB0aGUgY2xhc3Mgd2l0aCBkZXBlbmRlbmNpZXMgaW5qZWN0ZWQsIG9yIGRlcHMgYXJlIG5vdCBzcGVjaWZpZWQgYW5kXG4gICAgLy8gdGhlIGZhY3Rvcnkgb2YgdGhlIGNsYXNzIGlzIHVzZWQgdG8gaW5zdGFudGlhdGUgaXQuXG4gICAgLy9cbiAgICAvLyBBIHNwZWNpYWwgY2FzZSBleGlzdHMgZm9yIHVzZUNsYXNzOiBUeXBlIHdoZXJlIFR5cGUgaXMgdGhlIGluamVjdGFibGUgdHlwZSBpdHNlbGYgYW5kIG5vXG4gICAgLy8gZGVwcyBhcmUgc3BlY2lmaWVkLCBpbiB3aGljaCBjYXNlICd1c2VDbGFzcycgaXMgZWZmZWN0aXZlbHkgaWdub3JlZC5cblxuICAgIGNvbnN0IHVzZUNsYXNzT25TZWxmID0gbWV0YS51c2VDbGFzcy5leHByZXNzaW9uLmlzRXF1aXZhbGVudChtZXRhLnR5cGUudmFsdWUpO1xuICAgIGxldCBkZXBzOiBSM0RlcGVuZGVuY3lNZXRhZGF0YVtdfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAobWV0YS5kZXBzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlcHMgPSBtZXRhLmRlcHM7XG4gICAgfVxuXG4gICAgaWYgKGRlcHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gZmFjdG9yeTogKCkgPT4gbmV3IG1ldGEudXNlQ2xhc3MoLi4uZGVwcylcbiAgICAgIHJlc3VsdCA9IGNvbXBpbGVGYWN0b3J5RnVuY3Rpb24oe1xuICAgICAgICAuLi5mYWN0b3J5TWV0YSxcbiAgICAgICAgZGVsZWdhdGU6IG1ldGEudXNlQ2xhc3MuZXhwcmVzc2lvbixcbiAgICAgICAgZGVsZWdhdGVEZXBzOiBkZXBzLFxuICAgICAgICBkZWxlZ2F0ZVR5cGU6IFIzRmFjdG9yeURlbGVnYXRlVHlwZS5DbGFzcyxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodXNlQ2xhc3NPblNlbGYpIHtcbiAgICAgIHJlc3VsdCA9IGNvbXBpbGVGYWN0b3J5RnVuY3Rpb24oZmFjdG9yeU1ldGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSB7XG4gICAgICAgIHN0YXRlbWVudHM6IFtdLFxuICAgICAgICBleHByZXNzaW9uOiBkZWxlZ2F0ZVRvRmFjdG9yeShcbiAgICAgICAgICAgIG1ldGEudHlwZS52YWx1ZSBhcyBvLldyYXBwZWROb2RlRXhwcjxhbnk+LFxuICAgICAgICAgICAgbWV0YS51c2VDbGFzcy5leHByZXNzaW9uIGFzIG8uV3JhcHBlZE5vZGVFeHByPGFueT4sIHJlc29sdmVGb3J3YXJkUmVmcylcbiAgICAgIH07XG4gICAgfVxuICB9IGVsc2UgaWYgKG1ldGEudXNlRmFjdG9yeSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKG1ldGEuZGVwcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXN1bHQgPSBjb21waWxlRmFjdG9yeUZ1bmN0aW9uKHtcbiAgICAgICAgLi4uZmFjdG9yeU1ldGEsXG4gICAgICAgIGRlbGVnYXRlOiBtZXRhLnVzZUZhY3RvcnksXG4gICAgICAgIGRlbGVnYXRlRGVwczogbWV0YS5kZXBzIHx8IFtdLFxuICAgICAgICBkZWxlZ2F0ZVR5cGU6IFIzRmFjdG9yeURlbGVnYXRlVHlwZS5GdW5jdGlvbixcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSB7XG4gICAgICAgIHN0YXRlbWVudHM6IFtdLFxuICAgICAgICBleHByZXNzaW9uOiBvLmZuKFtdLCBbbmV3IG8uUmV0dXJuU3RhdGVtZW50KG1ldGEudXNlRmFjdG9yeS5jYWxsRm4oW10pKV0pXG4gICAgICB9O1xuICAgIH1cbiAgfSBlbHNlIGlmIChtZXRhLnVzZVZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBOb3RlOiBpdCdzIHNhZmUgdG8gdXNlIGBtZXRhLnVzZVZhbHVlYCBpbnN0ZWFkIG9mIHRoZSBgVVNFX1ZBTFVFIGluIG1ldGFgIGNoZWNrIHVzZWQgZm9yXG4gICAgLy8gY2xpZW50IGNvZGUgYmVjYXVzZSBtZXRhLnVzZVZhbHVlIGlzIGFuIEV4cHJlc3Npb24gd2hpY2ggd2lsbCBiZSBkZWZpbmVkIGV2ZW4gaWYgdGhlIGFjdHVhbFxuICAgIC8vIHZhbHVlIGlzIHVuZGVmaW5lZC5cbiAgICByZXN1bHQgPSBjb21waWxlRmFjdG9yeUZ1bmN0aW9uKHtcbiAgICAgIC4uLmZhY3RvcnlNZXRhLFxuICAgICAgZXhwcmVzc2lvbjogbWV0YS51c2VWYWx1ZS5leHByZXNzaW9uLFxuICAgIH0pO1xuICB9IGVsc2UgaWYgKG1ldGEudXNlRXhpc3RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIHVzZUV4aXN0aW5nIGlzIGFuIGBpbmplY3RgIGNhbGwgb24gdGhlIGV4aXN0aW5nIHRva2VuLlxuICAgIHJlc3VsdCA9IGNvbXBpbGVGYWN0b3J5RnVuY3Rpb24oe1xuICAgICAgLi4uZmFjdG9yeU1ldGEsXG4gICAgICBleHByZXNzaW9uOiBvLmltcG9ydEV4cHIoSWRlbnRpZmllcnMuaW5qZWN0KS5jYWxsRm4oW21ldGEudXNlRXhpc3RpbmcuZXhwcmVzc2lvbl0pLFxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJlc3VsdCA9IHtcbiAgICAgIHN0YXRlbWVudHM6IFtdLFxuICAgICAgZXhwcmVzc2lvbjogZGVsZWdhdGVUb0ZhY3RvcnkoXG4gICAgICAgICAgbWV0YS50eXBlLnZhbHVlIGFzIG8uV3JhcHBlZE5vZGVFeHByPGFueT4sIG1ldGEudHlwZS52YWx1ZSBhcyBvLldyYXBwZWROb2RlRXhwcjxhbnk+LFxuICAgICAgICAgIHJlc29sdmVGb3J3YXJkUmVmcylcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgdG9rZW4gPSBtZXRhLnR5cGUudmFsdWU7XG5cbiAgY29uc3QgaW5qZWN0YWJsZVByb3BzID1cbiAgICAgIG5ldyBEZWZpbml0aW9uTWFwPHt0b2tlbjogby5FeHByZXNzaW9uLCBmYWN0b3J5OiBvLkV4cHJlc3Npb24sIHByb3ZpZGVkSW46IG8uRXhwcmVzc2lvbn0+KCk7XG4gIGluamVjdGFibGVQcm9wcy5zZXQoJ3Rva2VuJywgdG9rZW4pO1xuICBpbmplY3RhYmxlUHJvcHMuc2V0KCdmYWN0b3J5JywgcmVzdWx0LmV4cHJlc3Npb24pO1xuXG4gIC8vIE9ubHkgZ2VuZXJhdGUgcHJvdmlkZWRJbiBwcm9wZXJ0eSBpZiBpdCBoYXMgYSBub24tbnVsbCB2YWx1ZVxuICBpZiAoKG1ldGEucHJvdmlkZWRJbi5leHByZXNzaW9uIGFzIG8uTGl0ZXJhbEV4cHIpLnZhbHVlICE9PSBudWxsKSB7XG4gICAgaW5qZWN0YWJsZVByb3BzLnNldCgncHJvdmlkZWRJbicsIGNvbnZlcnRGcm9tTWF5YmVGb3J3YXJkUmVmRXhwcmVzc2lvbihtZXRhLnByb3ZpZGVkSW4pKTtcbiAgfVxuXG4gIGNvbnN0IGV4cHJlc3Npb24gPSBvLmltcG9ydEV4cHIoSWRlbnRpZmllcnMuybXJtWRlZmluZUluamVjdGFibGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLmNhbGxGbihbaW5qZWN0YWJsZVByb3BzLnRvTGl0ZXJhbE1hcCgpXSwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgcmV0dXJuIHtcbiAgICBleHByZXNzaW9uLFxuICAgIHR5cGU6IGNyZWF0ZUluamVjdGFibGVUeXBlKG1ldGEpLFxuICAgIHN0YXRlbWVudHM6IHJlc3VsdC5zdGF0ZW1lbnRzLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW5qZWN0YWJsZVR5cGUobWV0YTogUjNJbmplY3RhYmxlTWV0YWRhdGEpIHtcbiAgcmV0dXJuIG5ldyBvLkV4cHJlc3Npb25UeXBlKG8uaW1wb3J0RXhwcihcbiAgICAgIElkZW50aWZpZXJzLkluamVjdGFibGVEZWNsYXJhdGlvbixcbiAgICAgIFt0eXBlV2l0aFBhcmFtZXRlcnMobWV0YS50eXBlLnR5cGUsIG1ldGEudHlwZUFyZ3VtZW50Q291bnQpXSkpO1xufVxuXG5mdW5jdGlvbiBkZWxlZ2F0ZVRvRmFjdG9yeShcbiAgICB0eXBlOiBvLldyYXBwZWROb2RlRXhwcjxhbnk+LCB1c2VUeXBlOiBvLldyYXBwZWROb2RlRXhwcjxhbnk+LFxuICAgIHVud3JhcEZvcndhcmRSZWZzOiBib29sZWFuKTogby5FeHByZXNzaW9uIHtcbiAgaWYgKHR5cGUubm9kZSA9PT0gdXNlVHlwZS5ub2RlKSB7XG4gICAgLy8gVGhlIHR5cGVzIGFyZSB0aGUgc2FtZSwgc28gd2UgY2FuIHNpbXBseSBkZWxlZ2F0ZSBkaXJlY3RseSB0byB0aGUgdHlwZSdzIGZhY3RvcnkuXG4gICAgLy8gYGBgXG4gICAgLy8gZmFjdG9yeTogdHlwZS7JtWZhY1xuICAgIC8vIGBgYFxuICAgIHJldHVybiB1c2VUeXBlLnByb3AoJ8m1ZmFjJyk7XG4gIH1cblxuICBpZiAoIXVud3JhcEZvcndhcmRSZWZzKSB7XG4gICAgLy8gVGhlIHR5cGUgaXMgbm90IHdyYXBwZWQgaW4gYSBgZm9yd2FyZFJlZigpYCwgc28gd2UgY3JlYXRlIGEgc2ltcGxlIGZhY3RvcnkgZnVuY3Rpb24gdGhhdFxuICAgIC8vIGFjY2VwdHMgYSBzdWItdHlwZSBhcyBhbiBhcmd1bWVudC5cbiAgICAvLyBgYGBcbiAgICAvLyBmYWN0b3J5OiBmdW5jdGlvbih0KSB7IHJldHVybiB1c2VUeXBlLsm1ZmFjKHQpOyB9XG4gICAgLy8gYGBgXG4gICAgcmV0dXJuIGNyZWF0ZUZhY3RvcnlGdW5jdGlvbih1c2VUeXBlKTtcbiAgfVxuXG4gIC8vIFRoZSB1c2VUeXBlIGlzIGFjdHVhbGx5IHdyYXBwZWQgaW4gYSBgZm9yd2FyZFJlZigpYCBzbyB3ZSBuZWVkIHRvIHJlc29sdmUgdGhhdCBiZWZvcmVcbiAgLy8gY2FsbGluZyBpdHMgZmFjdG9yeS5cbiAgLy8gYGBgXG4gIC8vIGZhY3Rvcnk6IGZ1bmN0aW9uKHQpIHsgcmV0dXJuIGNvcmUucmVzb2x2ZUZvcndhcmRSZWYodHlwZSkuybVmYWModCk7IH1cbiAgLy8gYGBgXG4gIGNvbnN0IHVud3JhcHBlZFR5cGUgPSBvLmltcG9ydEV4cHIoSWRlbnRpZmllcnMucmVzb2x2ZUZvcndhcmRSZWYpLmNhbGxGbihbdXNlVHlwZV0pO1xuICByZXR1cm4gY3JlYXRlRmFjdG9yeUZ1bmN0aW9uKHVud3JhcHBlZFR5cGUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVGYWN0b3J5RnVuY3Rpb24odHlwZTogby5FeHByZXNzaW9uKTogby5GdW5jdGlvbkV4cHIge1xuICByZXR1cm4gby5mbihcbiAgICAgIFtuZXcgby5GblBhcmFtKCd0Jywgby5EWU5BTUlDX1RZUEUpXSxcbiAgICAgIFtuZXcgby5SZXR1cm5TdGF0ZW1lbnQodHlwZS5wcm9wKCfJtWZhYycpLmNhbGxGbihbby52YXJpYWJsZSgndCcpXSkpXSk7XG59XG4iXX0=