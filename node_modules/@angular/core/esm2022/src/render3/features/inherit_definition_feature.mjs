/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../../errors';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../../util/empty';
import { fillProperties } from '../../util/property';
import { isComponentDef } from '../interfaces/type_checks';
import { mergeHostAttrs } from '../util/attrs_utils';
import { stringifyForError } from '../util/stringify_utils';
export function getSuperType(type) {
    return Object.getPrototypeOf(type.prototype).constructor;
}
/**
 * Merges the definition from a super class to a sub class.
 * @param definition The definition that is a SubClass of another directive of component
 *
 * @codeGenApi
 */
export function ɵɵInheritDefinitionFeature(definition) {
    let superType = getSuperType(definition.type);
    let shouldInheritFields = true;
    const inheritanceChain = [definition];
    while (superType) {
        let superDef = undefined;
        if (isComponentDef(definition)) {
            // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
            superDef = superType.ɵcmp || superType.ɵdir;
        }
        else {
            if (superType.ɵcmp) {
                throw new RuntimeError(903 /* RuntimeErrorCode.INVALID_INHERITANCE */, ngDevMode &&
                    `Directives cannot inherit Components. Directive ${stringifyForError(definition.type)} is attempting to extend component ${stringifyForError(superType)}`);
            }
            // Don't use getComponentDef/getDirectiveDef. This logic relies on inheritance.
            superDef = superType.ɵdir;
        }
        if (superDef) {
            if (shouldInheritFields) {
                inheritanceChain.push(superDef);
                // Some fields in the definition may be empty, if there were no values to put in them that
                // would've justified object creation. Unwrap them if necessary.
                const writeableDef = definition;
                writeableDef.inputs = maybeUnwrapEmpty(definition.inputs);
                writeableDef.inputTransforms = maybeUnwrapEmpty(definition.inputTransforms);
                writeableDef.declaredInputs = maybeUnwrapEmpty(definition.declaredInputs);
                writeableDef.outputs = maybeUnwrapEmpty(definition.outputs);
                // Merge hostBindings
                const superHostBindings = superDef.hostBindings;
                superHostBindings && inheritHostBindings(definition, superHostBindings);
                // Merge queries
                const superViewQuery = superDef.viewQuery;
                const superContentQueries = superDef.contentQueries;
                superViewQuery && inheritViewQuery(definition, superViewQuery);
                superContentQueries && inheritContentQueries(definition, superContentQueries);
                // Merge inputs and outputs
                fillProperties(definition.inputs, superDef.inputs);
                fillProperties(definition.declaredInputs, superDef.declaredInputs);
                fillProperties(definition.outputs, superDef.outputs);
                if (superDef.inputTransforms !== null) {
                    if (writeableDef.inputTransforms === null) {
                        writeableDef.inputTransforms = {};
                    }
                    fillProperties(writeableDef.inputTransforms, superDef.inputTransforms);
                }
                // Merge animations metadata.
                // If `superDef` is a Component, the `data` field is present (defaults to an empty object).
                if (isComponentDef(superDef) && superDef.data.animation) {
                    // If super def is a Component, the `definition` is also a Component, since Directives can
                    // not inherit Components (we throw an error above and cannot reach this code).
                    const defData = definition.data;
                    defData.animation = (defData.animation || []).concat(superDef.data.animation);
                }
            }
            // Run parent features
            const features = superDef.features;
            if (features) {
                for (let i = 0; i < features.length; i++) {
                    const feature = features[i];
                    if (feature && feature.ngInherit) {
                        feature(definition);
                    }
                    // If `InheritDefinitionFeature` is a part of the current `superDef`, it means that this
                    // def already has all the necessary information inherited from its super class(es), so we
                    // can stop merging fields from super classes. However we need to iterate through the
                    // prototype chain to look for classes that might contain other "features" (like
                    // NgOnChanges), which we should invoke for the original `definition`. We set the
                    // `shouldInheritFields` flag to indicate that, essentially skipping fields inheritance
                    // logic and only invoking functions from the "features" list.
                    if (feature === ɵɵInheritDefinitionFeature) {
                        shouldInheritFields = false;
                    }
                }
            }
        }
        superType = Object.getPrototypeOf(superType);
    }
    mergeHostAttrsAcrossInheritance(inheritanceChain);
}
/**
 * Merge the `hostAttrs` and `hostVars` from the inherited parent to the base class.
 *
 * @param inheritanceChain A list of `WritableDefs` starting at the top most type and listing
 * sub-types in order. For each type take the `hostAttrs` and `hostVars` and merge it with the child
 * type.
 */
function mergeHostAttrsAcrossInheritance(inheritanceChain) {
    let hostVars = 0;
    let hostAttrs = null;
    // We process the inheritance order from the base to the leaves here.
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
        const def = inheritanceChain[i];
        // For each `hostVars`, we need to add the superclass amount.
        def.hostVars = (hostVars += def.hostVars);
        // for each `hostAttrs` we need to merge it with superclass.
        def.hostAttrs =
            mergeHostAttrs(def.hostAttrs, hostAttrs = mergeHostAttrs(hostAttrs, def.hostAttrs));
    }
}
function maybeUnwrapEmpty(value) {
    if (value === EMPTY_OBJ) {
        return {};
    }
    else if (value === EMPTY_ARRAY) {
        return [];
    }
    else {
        return value;
    }
}
function inheritViewQuery(definition, superViewQuery) {
    const prevViewQuery = definition.viewQuery;
    if (prevViewQuery) {
        definition.viewQuery = (rf, ctx) => {
            superViewQuery(rf, ctx);
            prevViewQuery(rf, ctx);
        };
    }
    else {
        definition.viewQuery = superViewQuery;
    }
}
function inheritContentQueries(definition, superContentQueries) {
    const prevContentQueries = definition.contentQueries;
    if (prevContentQueries) {
        definition.contentQueries = (rf, ctx, directiveIndex) => {
            superContentQueries(rf, ctx, directiveIndex);
            prevContentQueries(rf, ctx, directiveIndex);
        };
    }
    else {
        definition.contentQueries = superContentQueries;
    }
}
function inheritHostBindings(definition, superHostBindings) {
    const prevHostBindings = definition.hostBindings;
    if (prevHostBindings) {
        definition.hostBindings = (rf, ctx) => {
            superHostBindings(rf, ctx);
            prevHostBindings(rf, ctx);
        };
    }
    else {
        definition.hostBindings = superHostBindings;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5oZXJpdF9kZWZpbml0aW9uX2ZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ZlYXR1cmVzL2luaGVyaXRfZGVmaW5pdGlvbl9mZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBRTVELE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBR25ELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUN6RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFMUQsTUFBTSxVQUFVLFlBQVksQ0FBQyxJQUFlO0lBRTFDLE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDO0FBQzNELENBQUM7QUFJRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxVQUErQztJQUN4RixJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlDLElBQUksbUJBQW1CLEdBQUcsSUFBSSxDQUFDO0lBQy9CLE1BQU0sZ0JBQWdCLEdBQWtCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFckQsT0FBTyxTQUFTLEVBQUU7UUFDaEIsSUFBSSxRQUFRLEdBQWtELFNBQVMsQ0FBQztRQUN4RSxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM5QiwrRUFBK0U7WUFDL0UsUUFBUSxHQUFHLFNBQVMsQ0FBQyxJQUFJLElB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QUUsaUJBQTRDO0lBQ3ZFLE1BQU0sZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQztJQUNqRCxJQUFJLGdCQUFnQixFQUFFO1FBQ3BCLFVBQVUsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxFQUFlLEVBQUUsR0FBUSxFQUFFLEVBQUU7WUFDdEQsaUJBQWlCLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUM7S0FDSDtTQUFNO1FBQ0wsVUFBVSxDQUFDLFlBQVksR0FBRyxpQkFBaUIsQ0FBQztLQUM3QztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge1R5cGUsIFdyaXRhYmxlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0VNUFRZX0FSUkFZLCBFTVBUWV9PQkp9IGZyb20gJy4uLy4uL3V0aWwvZW1wdHknO1xuaW1wb3J0IHtmaWxsUHJvcGVydGllc30gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29udGVudFF1ZXJpZXNGdW5jdGlvbiwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZGZWF0dXJlLCBIb3N0QmluZGluZ3NGdW5jdGlvbiwgUmVuZGVyRmxhZ3MsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1RBdHRyaWJ1dGVzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge21lcmdlSG9zdEF0dHJzfSBmcm9tICcuLi91dGlsL2F0dHJzX3V0aWxzJztcbmltcG9ydCB7c3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5X3V0aWxzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN1cGVyVHlwZSh0eXBlOiBUeXBlPGFueT4pOiBUeXBlPGFueT4mXG4gICAge8m1Y21wPzogQ29tcG9uZW50RGVmPGFueT4sIMm1ZGlyPzogRGlyZWN0aXZlRGVmPGFueT59IHtcbiAgcmV0dXJuIE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3I7XG59XG5cbnR5cGUgV3JpdGFibGVEZWYgPSBXcml0YWJsZTxEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55Pj47XG5cbi8qKlxuICogTWVyZ2VzIHRoZSBkZWZpbml0aW9uIGZyb20gYSBzdXBlciBjbGFzcyB0byBhIHN1YiBjbGFzcy5cbiAqIEBwYXJhbSBkZWZpbml0aW9uIFRoZSBkZWZpbml0aW9uIHRoYXQgaXMgYSBTdWJDbGFzcyBvZiBhbm90aGVyIGRpcmVjdGl2ZSBvZiBjb21wb25lbnRcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtUluaGVyaXREZWZpbml0aW9uRmVhdHVyZShkZWZpbml0aW9uOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55Pik6IHZvaWQge1xuICBsZXQgc3VwZXJUeXBlID0gZ2V0U3VwZXJUeXBlKGRlZmluaXRpb24udHlwZSk7XG4gIGxldCBzaG91bGRJbmhlcml0RmllbGRzID0gdHJ1ZTtcbiAgY29uc3QgaW5oZXJpdGFuY2VDaGFpbjogV3JpdGFibGVEZWZbXSA9IFtkZWZpbml0aW9uXTtcblxuICB3aGlsZSAoc3VwZXJUeXBlKSB7XG4gICAgbGV0IHN1cGVyRGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55Pnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZmluaXRpb24pKSB7XG4gICAgICAvLyBEb24ndCB1c2UgZ2V0Q29tcG9uZW50RGVmL2dldERpcmVjdGl2ZURlZi4gVGhpcyBsb2dpYyByZWxpZXMgb24gaW5oZXJpdGFuY2UuXG4gICAgICBzdXBlckRlZiA9IHN1cGVyVHlwZS7JtWNtcCB8fCBzdXBlclR5cGUuybVkaXI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdXBlclR5cGUuybVjbXApIHtcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU5WQUxJRF9JTkhFUklUQU5DRSxcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAgIGBEaXJlY3RpdmVzIGNhbm5vdCBpbmhlcml0IENvbXBvbmVudHMuIERpcmVjdGl2ZSAke1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmdpZnlGb3JFcnJvcihkZWZpbml0aW9uLnR5cGUpfSBpcyBhdHRlbXB0aW5nIHRvIGV4dGVuZCBjb21wb25lbnQgJHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5naWZ5Rm9yRXJyb3Ioc3VwZXJUeXBlKX1gKTtcbiAgICAgIH1cbiAgICAgIC8vIERvbid0IHVzZSBnZXRDb21wb25lbnREZWYvZ2V0RGlyZWN0aXZlRGVmLiBUaGlzIGxvZ2ljIHJlbGllcyBvbiBpbmhlcml0YW5jZS5cbiAgICAgIHN1cGVyRGVmID0gc3VwZXJUeXBlLsm1ZGlyO1xuICAgIH1cblxuICAgIGlmIChzdXBlckRlZikge1xuICAgICAgaWYgKHNob3VsZEluaGVyaXRGaWVsZHMpIHtcbiAgICAgICAgaW5oZXJpdGFuY2VDaGFpbi5wdXNoKHN1cGVyRGVmKTtcbiAgICAgICAgLy8gU29tZSBmaWVsZHMgaW4gdGhlIGRlZmluaXRpb24gbWF5IGJlIGVtcHR5LCBpZiB0aGVyZSB3ZXJlIG5vIHZhbHVlcyB0byBwdXQgaW4gdGhlbSB0aGF0XG4gICAgICAgIC8vIHdvdWxkJ3ZlIGp1c3RpZmllZCBvYmplY3QgY3JlYXRpb24uIFVud3JhcCB0aGVtIGlmIG5lY2Vzc2FyeS5cbiAgICAgICAgY29uc3Qgd3JpdGVhYmxlRGVmID0gZGVmaW5pdGlvbiBhcyBXcml0YWJsZURlZjtcbiAgICAgICAgd3JpdGVhYmxlRGVmLmlucHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5pbnB1dHMpO1xuICAgICAgICB3cml0ZWFibGVEZWYuaW5wdXRUcmFuc2Zvcm1zID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLmlucHV0VHJhbnNmb3Jtcyk7XG4gICAgICAgIHdyaXRlYWJsZURlZi5kZWNsYXJlZElucHV0cyA9IG1heWJlVW53cmFwRW1wdHkoZGVmaW5pdGlvbi5kZWNsYXJlZElucHV0cyk7XG4gICAgICAgIHdyaXRlYWJsZURlZi5vdXRwdXRzID0gbWF5YmVVbndyYXBFbXB0eShkZWZpbml0aW9uLm91dHB1dHMpO1xuXG4gICAgICAgIC8vIE1lcmdlIGhvc3RCaW5kaW5nc1xuICAgICAgICBjb25zdCBzdXBlckhvc3RCaW5kaW5ncyA9IHN1cGVyRGVmLmhvc3RCaW5kaW5ncztcbiAgICAgICAgc3VwZXJIb3N0QmluZGluZ3MgJiYgaW5oZXJpdEhvc3RCaW5kaW5ncyhkZWZpbml0aW9uLCBzdXBlckhvc3RCaW5kaW5ncyk7XG5cbiAgICAgICAgLy8gTWVyZ2UgcXVlcmllc1xuICAgICAgICBjb25zdCBzdXBlclZpZXdRdWVyeSA9IHN1cGVyRGVmLnZpZXdRdWVyeTtcbiAgICAgICAgY29uc3Qgc3VwZXJDb250ZW50UXVlcmllcyA9IHN1cGVyRGVmLmNvbnRlbnRRdWVyaWVzO1xuICAgICAgICBzdXBlclZpZXdRdWVyeSAmJiBpbmhlcml0Vmlld1F1ZXJ5KGRlZmluaXRpb24sIHN1cGVyVmlld1F1ZXJ5KTtcbiAgICAgICAgc3VwZXJDb250ZW50UXVlcmllcyAmJiBpbmhlcml0Q29udGVudFF1ZXJpZXMoZGVmaW5pdGlvbiwgc3VwZXJDb250ZW50UXVlcmllcyk7XG5cbiAgICAgICAgLy8gTWVyZ2UgaW5wdXRzIGFuZCBvdXRwdXRzXG4gICAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24uaW5wdXRzLCBzdXBlckRlZi5pbnB1dHMpO1xuICAgICAgICBmaWxsUHJvcGVydGllcyhkZWZpbml0aW9uLmRlY2xhcmVkSW5wdXRzLCBzdXBlckRlZi5kZWNsYXJlZElucHV0cyk7XG4gICAgICAgIGZpbGxQcm9wZXJ0aWVzKGRlZmluaXRpb24ub3V0cHV0cywgc3VwZXJEZWYub3V0cHV0cyk7XG5cbiAgICAgICAgaWYgKHN1cGVyRGVmLmlucHV0VHJhbnNmb3JtcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGlmICh3cml0ZWFibGVEZWYuaW5wdXRUcmFuc2Zvcm1zID09PSBudWxsKSB7XG4gICAgICAgICAgICB3cml0ZWFibGVEZWYuaW5wdXRUcmFuc2Zvcm1zID0ge307XG4gICAgICAgICAgfVxuICAgICAgICAgIGZpbGxQcm9wZXJ0aWVzKHdyaXRlYWJsZURlZi5pbnB1dFRyYW5zZm9ybXMsIHN1cGVyRGVmLmlucHV0VHJhbnNmb3Jtcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNZXJnZSBhbmltYXRpb25zIG1ldGFkYXRhLlxuICAgICAgICAvLyBJZiBgc3VwZXJEZWZgIGlzIGEgQ29tcG9uZW50LCB0aGUgYGRhdGFgIGZpZWxkIGlzIHByZXNlbnQgKGRlZmF1bHRzIHRvIGFuIGVtcHR5IG9iamVjdCkuXG4gICAgICAgIGlmIChpc0NvbXBvbmVudERlZihzdXBlckRlZikgJiYgc3VwZXJEZWYuZGF0YS5hbmltYXRpb24pIHtcbiAgICAgICAgICAvLyBJZiBzdXBlciBkZWYgaXMgYSBDb21wb25lbnQsIHRoZSBgZGVmaW5pdGlvbmAgaXMgYWxzbyBhIENvbXBvbmVudCwgc2luY2UgRGlyZWN0aXZlcyBjYW5cbiAgICAgICAgICAvLyBub3QgaW5oZXJpdCBDb21wb25lbnRzICh3ZSB0aHJvdyBhbiBlcnJvciBhYm92ZSBhbmQgY2Fubm90IHJlYWNoIHRoaXMgY29kZSkuXG4gICAgICAgICAgY29uc3QgZGVmRGF0YSA9IChkZWZpbml0aW9uIGFzIENvbXBvbmVudERlZjxhbnk+KS5kYXRhO1xuICAgICAgICAgIGRlZkRhdGEuYW5pbWF0aW9uID0gKGRlZkRhdGEuYW5pbWF0aW9uIHx8IFtdKS5jb25jYXQoc3VwZXJEZWYuZGF0YS5hbmltYXRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJ1biBwYXJlbnQgZmVhdHVyZXNcbiAgICAgIGNvbnN0IGZlYXR1cmVzID0gc3VwZXJEZWYuZmVhdHVyZXM7XG4gICAgICBpZiAoZmVhdHVyZXMpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmZWF0dXJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGZlYXR1cmUgPSBmZWF0dXJlc1tpXTtcbiAgICAgICAgICBpZiAoZmVhdHVyZSAmJiBmZWF0dXJlLm5nSW5oZXJpdCkge1xuICAgICAgICAgICAgKGZlYXR1cmUgYXMgRGlyZWN0aXZlRGVmRmVhdHVyZSkoZGVmaW5pdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIElmIGBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmVgIGlzIGEgcGFydCBvZiB0aGUgY3VycmVudCBgc3VwZXJEZWZgLCBpdCBtZWFucyB0aGF0IHRoaXNcbiAgICAgICAgICAvLyBkZWYgYWxyZWFkeSBoYXMgYWxsIHRoZSBuZWNlc3NhcnkgaW5mb3JtYXRpb24gaW5oZXJpdGVkIGZyb20gaXRzIHN1cGVyIGNsYXNzKGVzKSwgc28gd2VcbiAgICAgICAgICAvLyBjYW4gc3RvcCBtZXJnaW5nIGZpZWxkcyBmcm9tIHN1cGVyIGNsYXNzZXMuIEhvd2V2ZXIgd2UgbmVlZCB0byBpdGVyYXRlIHRocm91Z2ggdGhlXG4gICAgICAgICAgLy8gcHJvdG90eXBlIGNoYWluIHRvIGxvb2sgZm9yIGNsYXNzZXMgdGhhdCBtaWdodCBjb250YWluIG90aGVyIFwiZmVhdHVyZXNcIiAobGlrZVxuICAgICAgICAgIC8vIE5nT25DaGFuZ2VzKSwgd2hpY2ggd2Ugc2hvdWxkIGludm9rZSBmb3IgdGhlIG9yaWdpbmFsIGBkZWZpbml0aW9uYC4gV2Ugc2V0IHRoZVxuICAgICAgICAgIC8vIGBzaG91bGRJbmhlcml0RmllbGRzYCBmbGFnIHRvIGluZGljYXRlIHRoYXQsIGVzc2VudGlhbGx5IHNraXBwaW5nIGZpZWxkcyBpbmhlcml0YW5jZVxuICAgICAgICAgIC8vIGxvZ2ljIGFuZCBvbmx5IGludm9raW5nIGZ1bmN0aW9ucyBmcm9tIHRoZSBcImZlYXR1cmVzXCIgbGlzdC5cbiAgICAgICAgICBpZiAoZmVhdHVyZSA9PT0gybXJtUluaGVyaXREZWZpbml0aW9uRmVhdHVyZSkge1xuICAgICAgICAgICAgc2hvdWxkSW5oZXJpdEZpZWxkcyA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHN1cGVyVHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihzdXBlclR5cGUpO1xuICB9XG4gIG1lcmdlSG9zdEF0dHJzQWNyb3NzSW5oZXJpdGFuY2UoaW5oZXJpdGFuY2VDaGFpbik7XG59XG5cbi8qKlxuICogTWVyZ2UgdGhlIGBob3N0QXR0cnNgIGFuZCBgaG9zdFZhcnNgIGZyb20gdGhlIGluaGVyaXRlZCBwYXJlbnQgdG8gdGhlIGJhc2UgY2xhc3MuXG4gKlxuICogQHBhcmFtIGluaGVyaXRhbmNlQ2hhaW4gQSBsaXN0IG9mIGBXcml0YWJsZURlZnNgIHN0YXJ0aW5nIGF0IHRoZSB0b3AgbW9zdCB0eXBlIGFuZCBsaXN0aW5nXG4gKiBzdWItdHlwZXMgaW4gb3JkZXIuIEZvciBlYWNoIHR5cGUgdGFrZSB0aGUgYGhvc3RBdHRyc2AgYW5kIGBob3N0VmFyc2AgYW5kIG1lcmdlIGl0IHdpdGggdGhlIGNoaWxkXG4gKiB0eXBlLlxuICovXG5mdW5jdGlvbiBtZXJnZUhvc3RBdHRyc0Fjcm9zc0luaGVyaXRhbmNlKGluaGVyaXRhbmNlQ2hhaW46IFdyaXRhYmxlRGVmW10pIHtcbiAgbGV0IGhvc3RWYXJzOiBudW1iZXIgPSAwO1xuICBsZXQgaG9zdEF0dHJzOiBUQXR0cmlidXRlc3xudWxsID0gbnVsbDtcbiAgLy8gV2UgcHJvY2VzcyB0aGUgaW5oZXJpdGFuY2Ugb3JkZXIgZnJvbSB0aGUgYmFzZSB0byB0aGUgbGVhdmVzIGhlcmUuXG4gIGZvciAobGV0IGkgPSBpbmhlcml0YW5jZUNoYWluLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgY29uc3QgZGVmID0gaW5oZXJpdGFuY2VDaGFpbltpXTtcbiAgICAvLyBGb3IgZWFjaCBgaG9zdFZhcnNgLCB3ZSBuZWVkIHRvIGFkZCB0aGUgc3VwZXJjbGFzcyBhbW91bnQuXG4gICAgZGVmLmhvc3RWYXJzID0gKGhvc3RWYXJzICs9IGRlZi5ob3N0VmFycyk7XG4gICAgLy8gZm9yIGVhY2ggYGhvc3RBdHRyc2Agd2UgbmVlZCB0byBtZXJnZSBpdCB3aXRoIHN1cGVyY2xhc3MuXG4gICAgZGVmLmhvc3RBdHRycyA9XG4gICAgICAgIG1lcmdlSG9zdEF0dHJzKGRlZi5ob3N0QXR0cnMsIGhvc3RBdHRycyA9IG1lcmdlSG9zdEF0dHJzKGhvc3RBdHRycywgZGVmLmhvc3RBdHRycykpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFRbXSk6IFRbXTtcbmZ1bmN0aW9uIG1heWJlVW53cmFwRW1wdHk8VD4odmFsdWU6IFQpOiBUO1xuZnVuY3Rpb24gbWF5YmVVbndyYXBFbXB0eSh2YWx1ZTogYW55KTogYW55IHtcbiAgaWYgKHZhbHVlID09PSBFTVBUWV9PQkopIHtcbiAgICByZXR1cm4ge307XG4gIH0gZWxzZSBpZiAodmFsdWUgPT09IEVNUFRZX0FSUkFZKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbmhlcml0Vmlld1F1ZXJ5KGRlZmluaXRpb246IFdyaXRhYmxlRGVmLCBzdXBlclZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjxhbnk+KSB7XG4gIGNvbnN0IHByZXZWaWV3UXVlcnkgPSBkZWZpbml0aW9uLnZpZXdRdWVyeTtcbiAgaWYgKHByZXZWaWV3UXVlcnkpIHtcbiAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IChyZiwgY3R4KSA9PiB7XG4gICAgICBzdXBlclZpZXdRdWVyeShyZiwgY3R4KTtcbiAgICAgIHByZXZWaWV3UXVlcnkocmYsIGN0eCk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBkZWZpbml0aW9uLnZpZXdRdWVyeSA9IHN1cGVyVmlld1F1ZXJ5O1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaGVyaXRDb250ZW50UXVlcmllcyhcbiAgICBkZWZpbml0aW9uOiBXcml0YWJsZURlZiwgc3VwZXJDb250ZW50UXVlcmllczogQ29udGVudFF1ZXJpZXNGdW5jdGlvbjxhbnk+KSB7XG4gIGNvbnN0IHByZXZDb250ZW50UXVlcmllcyA9IGRlZmluaXRpb24uY29udGVudFF1ZXJpZXM7XG4gIGlmIChwcmV2Q29udGVudFF1ZXJpZXMpIHtcbiAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gKHJmLCBjdHgsIGRpcmVjdGl2ZUluZGV4KSA9PiB7XG4gICAgICBzdXBlckNvbnRlbnRRdWVyaWVzKHJmLCBjdHgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgIHByZXZDb250ZW50UXVlcmllcyhyZiwgY3R4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBkZWZpbml0aW9uLmNvbnRlbnRRdWVyaWVzID0gc3VwZXJDb250ZW50UXVlcmllcztcbiAgfVxufVxuXG5mdW5jdGlvbiBpbmhlcml0SG9zdEJpbmRpbmdzKFxuICAgIGRlZmluaXRpb246IFdyaXRhYmxlRGVmLCBzdXBlckhvc3RCaW5kaW5nczogSG9zdEJpbmRpbmdzRnVuY3Rpb248YW55Pikge1xuICBjb25zdCBwcmV2SG9zdEJpbmRpbmdzID0gZGVmaW5pdGlvbi5ob3N0QmluZGluZ3M7XG4gIGlmIChwcmV2SG9zdEJpbmRpbmdzKSB7XG4gICAgZGVmaW5pdGlvbi5ob3N0QmluZGluZ3MgPSAocmY6IFJlbmRlckZsYWdzLCBjdHg6IGFueSkgPT4ge1xuICAgICAgc3VwZXJIb3N0QmluZGluZ3MocmYsIGN0eCk7XG4gICAgICBwcmV2SG9zdEJpbmRpbmdzKHJmLCBjdHgpO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgZGVmaW5pdGlvbi5ob3N0QmluZGluZ3MgPSBzdXBlckhvc3RCaW5kaW5ncztcbiAgfVxufVxuIl19