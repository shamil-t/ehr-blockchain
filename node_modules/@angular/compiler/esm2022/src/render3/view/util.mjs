/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '../../output/output_ast';
import * as t from '../r3_ast';
import { Identifiers as R3 } from '../r3_identifiers';
import { isI18nAttribute } from './i18n/util';
/**
 * Checks whether an object key contains potentially unsafe chars, thus the key should be wrapped in
 * quotes. Note: we do not wrap all keys into quotes, as it may have impact on minification and may
 * bot work in some cases when object keys are mangled by minifier.
 *
 * TODO(FW-1136): this is a temporary solution, we need to come up with a better way of working with
 * inputs that contain potentially unsafe chars.
 */
const UNSAFE_OBJECT_KEY_NAME_REGEXP = /[-.]/;
/** Name of the temporary to use during data binding */
export const TEMPORARY_NAME = '_t';
/** Name of the context parameter passed into a template function */
export const CONTEXT_NAME = 'ctx';
/** Name of the RenderFlag passed into a template function */
export const RENDER_FLAGS = 'rf';
/** The prefix reference variables */
export const REFERENCE_PREFIX = '_r';
/** The name of the implicit context reference */
export const IMPLICIT_REFERENCE = '$implicit';
/** Non bindable attribute name **/
export const NON_BINDABLE_ATTR = 'ngNonBindable';
/** Name for the variable keeping track of the context returned by `ɵɵrestoreView`. */
export const RESTORED_VIEW_CONTEXT_NAME = 'restoredCtx';
/**
 * Maximum length of a single instruction chain. Because our output AST uses recursion, we're
 * limited in how many expressions we can nest before we reach the call stack limit. This
 * length is set very conservatively in order to reduce the chance of problems.
 */
const MAX_CHAIN_LENGTH = 500;
/** Instructions that support chaining. */
const CHAINABLE_INSTRUCTIONS = new Set([
    R3.element,
    R3.elementStart,
    R3.elementEnd,
    R3.elementContainer,
    R3.elementContainerStart,
    R3.elementContainerEnd,
    R3.i18nExp,
    R3.listener,
    R3.classProp,
    R3.syntheticHostListener,
    R3.hostProperty,
    R3.syntheticHostProperty,
    R3.property,
    R3.propertyInterpolate1,
    R3.propertyInterpolate2,
    R3.propertyInterpolate3,
    R3.propertyInterpolate4,
    R3.propertyInterpolate5,
    R3.propertyInterpolate6,
    R3.propertyInterpolate7,
    R3.propertyInterpolate8,
    R3.propertyInterpolateV,
    R3.attribute,
    R3.attributeInterpolate1,
    R3.attributeInterpolate2,
    R3.attributeInterpolate3,
    R3.attributeInterpolate4,
    R3.attributeInterpolate5,
    R3.attributeInterpolate6,
    R3.attributeInterpolate7,
    R3.attributeInterpolate8,
    R3.attributeInterpolateV,
    R3.styleProp,
    R3.stylePropInterpolate1,
    R3.stylePropInterpolate2,
    R3.stylePropInterpolate3,
    R3.stylePropInterpolate4,
    R3.stylePropInterpolate5,
    R3.stylePropInterpolate6,
    R3.stylePropInterpolate7,
    R3.stylePropInterpolate8,
    R3.stylePropInterpolateV,
    R3.textInterpolate,
    R3.textInterpolate1,
    R3.textInterpolate2,
    R3.textInterpolate3,
    R3.textInterpolate4,
    R3.textInterpolate5,
    R3.textInterpolate6,
    R3.textInterpolate7,
    R3.textInterpolate8,
    R3.textInterpolateV,
]);
/** Generates a call to a single instruction. */
export function invokeInstruction(span, reference, params) {
    return o.importExpr(reference, null, span).callFn(params, span);
}
/**
 * Creates an allocator for a temporary variable.
 *
 * A variable declaration is added to the statements the first time the allocator is invoked.
 */
export function temporaryAllocator(statements, name) {
    let temp = null;
    return () => {
        if (!temp) {
            statements.push(new o.DeclareVarStmt(TEMPORARY_NAME, undefined, o.DYNAMIC_TYPE));
            temp = o.variable(name);
        }
        return temp;
    };
}
export function invalid(arg) {
    throw new Error(`Invalid state: Visitor ${this.constructor.name} doesn't handle ${arg.constructor.name}`);
}
export function asLiteral(value) {
    if (Array.isArray(value)) {
        return o.literalArr(value.map(asLiteral));
    }
    return o.literal(value, o.INFERRED_TYPE);
}
export function conditionallyCreateDirectiveBindingLiteral(map, keepDeclared) {
    const keys = Object.getOwnPropertyNames(map);
    if (keys.length === 0) {
        return null;
    }
    return o.literalMap(keys.map(key => {
        const value = map[key];
        let declaredName;
        let publicName;
        let minifiedName;
        let expressionValue;
        if (typeof value === 'string') {
            // canonical syntax: `dirProp: publicProp`
            declaredName = key;
            minifiedName = key;
            publicName = value;
            expressionValue = asLiteral(publicName);
        }
        else {
            minifiedName = key;
            declaredName = value.classPropertyName;
            publicName = value.bindingPropertyName;
            if (keepDeclared && (publicName !== declaredName || value.transformFunction != null)) {
                const expressionKeys = [asLiteral(publicName), asLiteral(declaredName)];
                if (value.transformFunction != null) {
                    expressionKeys.push(value.transformFunction);
                }
                expressionValue = o.literalArr(expressionKeys);
            }
            else {
                expressionValue = asLiteral(publicName);
            }
        }
        return {
            key: minifiedName,
            // put quotes around keys that contain potentially unsafe characters
            quoted: UNSAFE_OBJECT_KEY_NAME_REGEXP.test(minifiedName),
            value: expressionValue,
        };
    }));
}
/**
 *  Remove trailing null nodes as they are implied.
 */
export function trimTrailingNulls(parameters) {
    while (o.isNull(parameters[parameters.length - 1])) {
        parameters.pop();
    }
    return parameters;
}
export function getQueryPredicate(query, constantPool) {
    if (Array.isArray(query.predicate)) {
        let predicate = [];
        query.predicate.forEach((selector) => {
            // Each item in predicates array may contain strings with comma-separated refs
            // (for ex. 'ref, ref1, ..., refN'), thus we extract individual refs and store them
            // as separate array entities
            const selectors = selector.split(',').map(token => o.literal(token.trim()));
            predicate.push(...selectors);
        });
        return constantPool.getConstLiteral(o.literalArr(predicate), true);
    }
    else {
        // The original predicate may have been wrapped in a `forwardRef()` call.
        switch (query.predicate.forwardRef) {
            case 0 /* ForwardRefHandling.None */:
            case 2 /* ForwardRefHandling.Unwrapped */:
                return query.predicate.expression;
            case 1 /* ForwardRefHandling.Wrapped */:
                return o.importExpr(R3.resolveForwardRef).callFn([query.predicate.expression]);
        }
    }
}
/**
 * A representation for an object literal used during codegen of definition objects. The generic
 * type `T` allows to reference a documented type of the generated structure, such that the
 * property names that are set can be resolved to their documented declaration.
 */
export class DefinitionMap {
    constructor() {
        this.values = [];
    }
    set(key, value) {
        if (value) {
            this.values.push({ key: key, value, quoted: false });
        }
    }
    toLiteralMap() {
        return o.literalMap(this.values);
    }
}
/**
 * Extract a map of properties to values for a given element or template node, which can be used
 * by the directive matching machinery.
 *
 * @param elOrTpl the element or template in question
 * @return an object set up for directive matching. For attributes on the element/template, this
 * object maps a property name to its (static) value. For any bindings, this map simply maps the
 * property name to an empty string.
 */
export function getAttrsForDirectiveMatching(elOrTpl) {
    const attributesMap = {};
    if (elOrTpl instanceof t.Template && elOrTpl.tagName !== 'ng-template') {
        elOrTpl.templateAttrs.forEach(a => attributesMap[a.name] = '');
    }
    else {
        elOrTpl.attributes.forEach(a => {
            if (!isI18nAttribute(a.name)) {
                attributesMap[a.name] = a.value;
            }
        });
        elOrTpl.inputs.forEach(i => {
            if (i.type === 0 /* BindingType.Property */) {
                attributesMap[i.name] = '';
            }
        });
        elOrTpl.outputs.forEach(o => {
            attributesMap[o.name] = '';
        });
    }
    return attributesMap;
}
/**
 * Gets the number of arguments expected to be passed to a generated instruction in the case of
 * interpolation instructions.
 * @param interpolation An interpolation ast
 */
export function getInterpolationArgsLength(interpolation) {
    const { expressions, strings } = interpolation;
    if (expressions.length === 1 && strings.length === 2 && strings[0] === '' && strings[1] === '') {
        // If the interpolation has one interpolated value, but the prefix and suffix are both empty
        // strings, we only pass one argument, to a special instruction like `propertyInterpolate` or
        // `textInterpolate`.
        return 1;
    }
    else {
        return expressions.length + strings.length;
    }
}
/**
 * Generates the final instruction call statements based on the passed in configuration.
 * Will try to chain instructions as much as possible, if chaining is supported.
 */
export function getInstructionStatements(instructions) {
    const statements = [];
    let pendingExpression = null;
    let pendingExpressionType = null;
    let chainLength = 0;
    for (const current of instructions) {
        const resolvedParams = (typeof current.paramsOrFn === 'function' ? current.paramsOrFn() : current.paramsOrFn) ??
            [];
        const params = Array.isArray(resolvedParams) ? resolvedParams : [resolvedParams];
        // If the current instruction is the same as the previous one
        // and it can be chained, add another call to the chain.
        if (chainLength < MAX_CHAIN_LENGTH && pendingExpressionType === current.reference &&
            CHAINABLE_INSTRUCTIONS.has(pendingExpressionType)) {
            // We'll always have a pending expression when there's a pending expression type.
            pendingExpression = pendingExpression.callFn(params, pendingExpression.sourceSpan);
            chainLength++;
        }
        else {
            if (pendingExpression !== null) {
                statements.push(pendingExpression.toStmt());
            }
            pendingExpression = invokeInstruction(current.span, current.reference, params);
            pendingExpressionType = current.reference;
            chainLength = 0;
        }
    }
    // Since the current instruction adds the previous one to the statements,
    // we may be left with the final one at the end that is still pending.
    if (pendingExpression !== null) {
        statements.push(pendingExpression.toStmt());
    }
    return statements;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9yZW5kZXIzL3ZpZXcvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEtBQUssQ0FBQyxNQUFNLHlCQUF5QixDQUFDO0FBRTdDLE9BQU8sS0FBSyxDQUFDLE1BQU0sV0FBVyxDQUFDO0FBQy9CLE9BQU8sRUFBQyxXQUFXLElBQUksRUFBRSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFJcEQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUc1Qzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSw2QkFBNkIsR0FBRyxNQUFNLENBQUM7QUFFN0MsdURBQXVEO0FBQ3ZELE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFFbkMsb0VBQW9FO0FBQ3BFLE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7QUFFbEMsNkRBQTZEO0FBQzdELE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUM7QUFFakMscUNBQXFDO0FBQ3JDLE1BQU0sQ0FBQyxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQztBQUVyQyxpREFBaUQ7QUFDakQsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQUcsV0FBVyxDQUFDO0FBRTlDLG1DQUFtQztBQUNuQyxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxlQUFlLENBQUM7QUFFakQsc0ZBQXNGO0FBQ3RGLE1BQU0sQ0FBQyxNQUFNLDBCQUEwQixHQUFHLGFBQWEsQ0FBQztBQUV4RDs7OztHQUlHO0FBQ0gsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLENBQUM7QUFFN0IsMENBQTBDO0FBQzFDLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDckMsRUFBRSxDQUFDLE9BQU87SUFDVixFQUFFLENBQUMs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aUIsR0FBRyxpQkFBa0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGlCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JGLFdBQVcsRUFBRSxDQUFDO1NBQ2Y7YUFBTTtZQUNMLElBQUksaUJBQWlCLEtBQUssSUFBSSxFQUFFO2dCQUM5QixVQUFVLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7YUFDN0M7WUFDRCxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDL0UscUJBQXFCLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztZQUMxQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1NBQ2pCO0tBQ0Y7SUFFRCx5RUFBeUU7SUFDekUsc0VBQXNFO0lBQ3RFLElBQUksaUJBQWlCLEtBQUssSUFBSSxFQUFFO1FBQzlCLFVBQVUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztLQUM3QztJQUVELE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb25zdGFudFBvb2x9IGZyb20gJy4uLy4uL2NvbnN0YW50X3Bvb2wnO1xuaW1wb3J0IHtCaW5kaW5nVHlwZSwgSW50ZXJwb2xhdGlvbn0gZnJvbSAnLi4vLi4vZXhwcmVzc2lvbl9wYXJzZXIvYXN0JztcbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtQYXJzZVNvdXJjZVNwYW59IGZyb20gJy4uLy4uL3BhcnNlX3V0aWwnO1xuaW1wb3J0ICogYXMgdCBmcm9tICcuLi9yM19hc3QnO1xuaW1wb3J0IHtJZGVudGlmaWVycyBhcyBSM30gZnJvbSAnLi4vcjNfaWRlbnRpZmllcnMnO1xuaW1wb3J0IHtGb3J3YXJkUmVmSGFuZGxpbmd9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge1IzUXVlcnlNZXRhZGF0YX0gZnJvbSAnLi9hcGknO1xuaW1wb3J0IHtpc0kxOG5BdHRyaWJ1dGV9IGZyb20gJy4vaTE4bi91dGlsJztcblxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGFuIG9iamVjdCBrZXkgY29udGFpbnMgcG90ZW50aWFsbHkgdW5zYWZlIGNoYXJzLCB0aHVzIHRoZSBrZXkgc2hvdWxkIGJlIHdyYXBwZWQgaW5cbiAqIHF1b3Rlcy4gTm90ZTogd2UgZG8gbm90IHdyYXAgYWxsIGtleXMgaW50byBxdW90ZXMsIGFzIGl0IG1heSBoYXZlIGltcGFjdCBvbiBtaW5pZmljYXRpb24gYW5kIG1heVxuICogYm90IHdvcmsgaW4gc29tZSBjYXNlcyB3aGVuIG9iamVjdCBrZXlzIGFyZSBtYW5nbGVkIGJ5IG1pbmlmaWVyLlxuICpcbiAqIFRPRE8oRlctMTEzNik6IHRoaXMgaXMgYSB0ZW1wb3Jhcnkgc29sdXRpb24sIHdlIG5lZWQgdG8gY29tZSB1cCB3aXRoIGEgYmV0dGVyIHdheSBvZiB3b3JraW5nIHdpdGhcbiAqIGlucHV0cyB0aGF0IGNvbnRhaW4gcG90ZW50aWFsbHkgdW5zYWZlIGNoYXJzLlxuICovXG5jb25zdCBVTlNBRkVfT0JKRUNUX0tFWV9OQU1FX1JFR0VYUCA9IC9bLS5dLztcblxuLyoqIE5hbWUgb2YgdGhlIHRlbXBvcmFyeSB0byB1c2UgZHVyaW5nIGRhdGEgYmluZGluZyAqL1xuZXhwb3J0IGNvbnN0IFRFTVBPUkFSWV9OQU1FID0gJ190JztcblxuLyoqIE5hbWUgb2YgdGhlIGNvbnRleHQgcGFyYW1ldGVyIHBhc3NlZCBpbnRvIGEgdGVtcGxhdGUgZnVuY3Rpb24gKi9cbmV4cG9ydCBjb25zdCBDT05URVhUX05BTUUgPSAnY3R4JztcblxuLyoqIE5hbWUgb2YgdGhlIFJlbmRlckZsYWcgcGFzc2VkIGludG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiAqL1xuZXhwb3J0IGNvbnN0IFJFTkRFUl9GTEFHUyA9ICdyZic7XG5cbi8qKiBUaGUgcHJlZml4IHJlZmVyZW5jZSB2YXJpYWJsZXMgKi9cbmV4cG9ydCBjb25zdCBSRUZFUkVOQ0VfUFJFRklYID0gJ19yJztcblxuLyoqIFRoZSBuYW1lIG9mIHRoZSBpbXBsaWNpdCBjb250ZXh0IHJlZmVyZW5jZSAqL1xuZXhwb3J0IGNvbnN0IElNUExJQ0lUX1JFRkVSRU5DRSA9ICckaW1wbGljaXQnO1xuXG4vKiogTm9uIGJpbmRhYmxlIGF0dHJpYnV0ZSBuYW1lICoqL1xuZXhwb3J0IGNvbnN0IE5PTl9CSU5EQUJMRV9BVFRSID0gJ25nTm9uQmluZGFibGUnO1xuXG4vKiogTmFtZSBmb3IgdGhlIHZhcmlhYmxlIGtlZXBpbmcgdHJhY2sgb2YgdGhlIGNvbnRleHQgcmV0dXJuZWQgYnkgYMm1ybVyZXN0b3JlVmlld2AuICovXG5leHBvcnQgY29uc3QgUkVTVE9SRURfVklFV19DT05URVhUX05BTUUgPSAncmVzdG9yZWRDdHgnO1xuXG4vKipcbiAqIE1heGltdW0gbGVuZ3RoIG9mIGEgc2luZ2xlIGluc3RydWN0aW9uIGNoYWluLiBCZWNhdXNlIG91ciBvdXRwdXQgQVNUIHVzZXMgcmVjdXJzaW9uLCB3ZSdyZVxuICogbGltaXRlZCBpbiBob3cgbWFueSBleHByZXNzaW9ucyB3ZSBjYW4gbmVzdCBiZWZvcmUgd2UgcmVhY2ggdGhlIGNhbGwgc3RhY2sgbGltaXQuIFRoaXNcbiAqIGxlbmd0aCBpcyBzZXQgdmVyeSBjb25zZXJ2YXRpdmVseSBpbiBvcmRlciB0byByZWR1Y2UgdGhlIGNoYW5jZSBvZiBwcm9ibGVtcy5cbiAqL1xuY29uc3QgTUFYX0NIQUlOX0xFTkdUSCA9IDUwMDtcblxuLyoqIEluc3RydWN0aW9ucyB0aGF0IHN1cHBvcnQgY2hhaW5pbmcuICovXG5jb25zdCBDSEFJTkFCTEVfSU5TVFJVQ1RJT05TID0gbmV3IFNldChbXG4gIFIzLmVsZW1lbnQsXG4gIFIzLmVsZW1lbnRTdGFydCxcbiAgUjMuZWxlbWVudEVuZCxcbiAgUjMuZWxlbWVudENvbnRhaW5lcixcbiAgUjMuZWxlbWVudENvbnRhaW5lclN0YXJ0LFxuICBSMy5lbGVtZW50Q29udGFpbmVyRW5kLFxuICBSMy5pMThuRXhwLFxuICBSMy5saXN0ZW5lcixcbiAgUjMuY2xhc3NQcm9wLFxuICBSMy5zeW50aGV0aWNIb3N0TGlzdGVuZXIsXG4gIFIzLmhvc3RQcm9wZXJ0eSxcbiAgUjMuc3ludGhldGljSG9zdFByb3BlcnR5LFxuICBSMy5wcm9wZXJ0eSxcbiAgUjMucHJvcGVydHlJbnRlcnBvbGF0ZTEsXG4gIFIzLnByb3BlcnR5SW50ZXJwb2xhdGUyLFxuICBSMy5wcm9wZXJ0eUludGVycG9sYXRlMyxcbiAgUjMucHJvcGVydHlJbnRlcnBvbGF0ZTQsXG4gIFIzLnByb3BlcnR5SW50ZXJwb2xhdGU1LFxuICBSMy5wcm9wZXJ0eUludGVycG9sYXRlNixcbiAgUjMucHJvcGVydHlJbnRlcnBvbGF0ZTcsXG4gIFIzLnByb3BlcnR5SW50ZXJwb2xhdGU4LFxuICBSMy5wcm9wZXJ0eUludGVycG9sYXRlVixcbiAgUjMuYXR0cmlidXRlLFxuICBSMy5hdHRyaWJ1dGVJbnRlcnBvbGF0ZTEsXG4gIFIzLmF0dHJpYnV0ZUludGVycG9sYXRlMixcbiAgUjMuYXR0cmlidXRlSW50ZXJwb2xhdGUzLFxuICBSMy5hdHRyaWJ1dGVJbnRlcnBvbGF0ZTQsXG4gIFIzLmF0dHJpYnV0ZUludGVycG9sYXRlNSxcbiAgUjMuYXR0cmlidXRlSW50ZXJwb2xhdGU2LFxuICBSMy5hdHRyaWJ1dGVJbnRlcnBvbGF0ZTcsXG4gIFIzLmF0dHJpYnV0ZUludGVycG9sYXRlOCxcbiAgUjMuYXR0cmlidXRlSW50ZXJwb2xhdGVWLFxuICBSMy5zdHlsZVByb3AsXG4gIFIzLnN0eWxlUHJvcEludGVycG9sYXRlMSxcbiAgUjMuc3R5bGVQcm9wSW50ZXJwb2xhdGUyLFxuICBSMy5zdHlsZVByb3BJbnRlcnBvbGF0ZTMsXG4gIFIzLnN0eWxlUHJvcEludGVycG9sYXRlNCxcbiAgUjMuc3R5bGVQcm9wSW50ZXJwb2xhdGU1LFxuICBSMy5zdHlsZVByb3BJbnRlcnBvbGF0ZTYsXG4gIFIzLnN0eWxlUHJvcEludGVycG9sYXRlNyxcbiAgUjMuc3R5bGVQcm9wSW50ZXJwb2xhdGU4LFxuICBSMy5zdHlsZVByb3BJbnRlcnBvbGF0ZVYsXG4gIFIzLnRleHRJbnRlcnBvbGF0ZSxcbiAgUjMudGV4dEludGVycG9sYXRlMSxcbiAgUjMudGV4dEludGVycG9sYXRlMixcbiAgUjMudGV4dEludGVycG9sYXRlMyxcbiAgUjMudGV4dEludGVycG9sYXRlNCxcbiAgUjMudGV4dEludGVycG9sYXRlNSxcbiAgUjMudGV4dEludGVycG9sYXRlNixcbiAgUjMudGV4dEludGVycG9sYXRlNyxcbiAgUjMudGV4dEludGVycG9sYXRlOCxcbiAgUjMudGV4dEludGVycG9sYXRlVixcbl0pO1xuXG4vKipcbiAqIFBvc3NpYmxlIHR5cGVzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIHBhcmFtZXRlcnMgb2YgYW4gaW5zdHJ1Y3Rpb24gY2FsbC5cbiAqIElmIHRoZSBwYXJhbWV0ZXJzIGFyZSBhIGZ1bmN0aW9uLCB0aGUgZnVuY3Rpb24gd2lsbCBiZSBpbnZva2VkIGF0IHRoZSB0aW1lIHRoZSBpbnN0cnVjdGlvblxuICogaXMgZ2VuZXJhdGVkLlxuICovXG5leHBvcnQgdHlwZSBJbnN0cnVjdGlvblBhcmFtcyA9IChvLkV4cHJlc3Npb258by5FeHByZXNzaW9uW10pfCgoKSA9PiAoby5FeHByZXNzaW9ufG8uRXhwcmVzc2lvbltdKSk7XG5cbi8qKiBOZWNlc3NhcnkgaW5mb3JtYXRpb24gdG8gZ2VuZXJhdGUgYSBjYWxsIHRvIGFuIGluc3RydWN0aW9uIGZ1bmN0aW9uLiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbnN0cnVjdGlvbiB7XG4gIHNwYW46IFBhcnNlU291cmNlU3BhbnxudWxsO1xuICByZWZlcmVuY2U6IG8uRXh0ZXJuYWxSZWZlcmVuY2U7XG4gIHBhcmFtc09yRm4/OiBJbnN0cnVjdGlvblBhcmFtcztcbn1cblxuLyoqIEdlbmVyYXRlcyBhIGNhbGwgdG8gYSBzaW5nbGUgaW5zdHJ1Y3Rpb24uICovXG5leHBvcnQgZnVuY3Rpb24gaW52b2tlSW5zdHJ1Y3Rpb24oXG4gICAgc3BhbjogUGFyc2VTb3VyY2VTcGFufG51bGwsIHJlZmVyZW5jZTogby5FeHRlcm5hbFJlZmVyZW5jZSxcbiAgICBwYXJhbXM6IG8uRXhwcmVzc2lvbltdKTogby5FeHByZXNzaW9uIHtcbiAgcmV0dXJuIG8uaW1wb3J0RXhwcihyZWZlcmVuY2UsIG51bGwsIHNwYW4pLmNhbGxGbihwYXJhbXMsIHNwYW4pO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gYWxsb2NhdG9yIGZvciBhIHRlbXBvcmFyeSB2YXJpYWJsZS5cbiAqXG4gKiBBIHZhcmlhYmxlIGRlY2xhcmF0aW9uIGlzIGFkZGVkIHRvIHRoZSBzdGF0ZW1lbnRzIHRoZSBmaXJzdCB0aW1lIHRoZSBhbGxvY2F0b3IgaXMgaW52b2tlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRlbXBvcmFyeUFsbG9jYXRvcihzdGF0ZW1lbnRzOiBvLlN0YXRlbWVudFtdLCBuYW1lOiBzdHJpbmcpOiAoKSA9PiBvLlJlYWRWYXJFeHByIHtcbiAgbGV0IHRlbXA6IG8uUmVhZFZhckV4cHJ8bnVsbCA9IG51bGw7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgaWYgKCF0ZW1wKSB7XG4gICAgICBzdGF0ZW1lbnRzLnB1c2gobmV3IG8uRGVjbGFyZVZhclN0bXQoVEVNUE9SQVJZX05BTUUsIHVuZGVmaW5lZCwgby5EWU5BTUlDX1RZUEUpKTtcbiAgICAgIHRlbXAgPSBvLnZhcmlhYmxlKG5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGVtcDtcbiAgfTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gaW52YWxpZDxUPih0aGlzOiB0LlZpc2l0b3IsIGFyZzogby5FeHByZXNzaW9ufG8uU3RhdGVtZW50fHQuTm9kZSk6IG5ldmVyIHtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEludmFsaWQgc3RhdGU6IFZpc2l0b3IgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9IGRvZXNuJ3QgaGFuZGxlICR7YXJnLmNvbnN0cnVjdG9yLm5hbWV9YCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc0xpdGVyYWwodmFsdWU6IGFueSk6IG8uRXhwcmVzc2lvbiB7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiBvLmxpdGVyYWxBcnIodmFsdWUubWFwKGFzTGl0ZXJhbCkpO1xuICB9XG4gIHJldHVybiBvLmxpdGVyYWwodmFsdWUsIG8uSU5GRVJSRURfVFlQRSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25kaXRpb25hbGx5Q3JlYXRlRGlyZWN0aXZlQmluZGluZ0xpdGVyYWwoXG4gICAgbWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmd8e1xuICAgICAgY2xhc3NQcm9wZXJ0eU5hbWU6IHN0cmluZztcbiAgICAgIGJpbmRpbmdQcm9wZXJ0eU5hbWU6IHN0cmluZztcbiAgICAgIHRyYW5zZm9ybUZ1bmN0aW9uOiBvLkV4cHJlc3Npb258bnVsbDtcbiAgICB9Piwga2VlcERlY2xhcmVkPzogYm9vbGVhbik6IG8uRXhwcmVzc2lvbnxudWxsIHtcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG1hcCk7XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gby5saXRlcmFsTWFwKGtleXMubWFwKGtleSA9PiB7XG4gICAgY29uc3QgdmFsdWUgPSBtYXBba2V5XTtcbiAgICBsZXQgZGVjbGFyZWROYW1lOiBzdHJpbmc7XG4gICAgbGV0IHB1YmxpY05hbWU6IHN0cmluZztcbiAgICBsZXQgbWluaWZpZWROYW1lOiBzdHJpbmc7XG4gICAgbGV0IGV4cHJlc3Npb25WYWx1ZTogby5FeHByZXNzaW9uO1xuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIGNhbm9uaWNhbCBzeW50YXg6IGBkaXJQcm9wOiBwdWJsaWNQcm9wYFxuICAgICAgZGVjbGFyZWROYW1lID0ga2V5O1xuICAgICAgbWluaWZpZWROYW1lID0ga2V5O1xuICAgICAgcHVibGljTmFtZSA9IHZhbHVlO1xuICAgICAgZXhwcmVzc2lvblZhbHVlID0gYXNMaXRlcmFsKHB1YmxpY05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtaW5pZmllZE5hbWUgPSBrZXk7XG4gICAgICBkZWNsYXJlZE5hbWUgPSB2YWx1ZS5jbGFzc1Byb3BlcnR5TmFtZTtcbiAgICAgIHB1YmxpY05hbWUgPSB2YWx1ZS5iaW5kaW5nUHJvcGVydHlOYW1lO1xuXG4gICAgICBpZiAoa2VlcERlY2xhcmVkICYmIChwdWJsaWNOYW1lICE9PSBkZWNsYXJlZE5hbWUgfHwgdmFsdWUudHJhbnNmb3JtRnVuY3Rpb24gIT0gbnVsbCkpIHtcbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbktleXMgPSBbYXNMaXRlcmFsKHB1YmxpY05hbWUpLCBhc0xpdGVyYWwoZGVjbGFyZWROYW1lKV07XG5cbiAgICAgICAgaWYgKHZhbHVlLnRyYW5zZm9ybUZ1bmN0aW9uICE9IG51bGwpIHtcbiAgICAgICAgICBleHByZXNzaW9uS2V5cy5wdXNoKHZhbHVlLnRyYW5zZm9ybUZ1bmN0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cHJlc3Npb25WYWx1ZSA9IG8ubGl0ZXJhbEFycihleHByZXNzaW9uS2V5cyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBleHByZXNzaW9uVmFsdWUgPSBhc0xpdGVyYWwocHVibGljTmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGtleTogbWluaWZpZWROYW1lLFxuICAgICAgLy8gcHV0IHF1b3RlcyBhcm91bmQga2V5cyB0aGF0IGNvbnRhaW4gcG90ZW50aWFsbHkgdW5zYWZlIGNoYXJhY3RlcnNcbiAgICAgIHF1b3RlZDogVU5TQUZFX09CSkVDVF9LRVlfTkFNRV9SRUdFWFAudGVzdChtaW5pZmllZE5hbWUpLFxuICAgICAgdmFsdWU6IGV4cHJlc3Npb25WYWx1ZSxcbiAgICB9O1xuICB9KSk7XG59XG5cbi8qKlxuICogIFJlbW92ZSB0cmFpbGluZyBudWxsIG5vZGVzIGFzIHRoZXkgYXJlIGltcGxpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmltVHJhaWxpbmdOdWxscyhwYXJhbWV0ZXJzOiBvLkV4cHJlc3Npb25bXSk6IG8uRXhwcmVzc2lvbltdIHtcbiAgd2hpbGUgKG8uaXNOdWxsKHBhcmFtZXRlcnNbcGFyYW1ldGVycy5sZW5ndGggLSAxXSkpIHtcbiAgICBwYXJhbWV0ZXJzLnBvcCgpO1xuICB9XG4gIHJldHVybiBwYXJhbWV0ZXJzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UXVlcnlQcmVkaWNhdGUoXG4gICAgcXVlcnk6IFIzUXVlcnlNZXRhZGF0YSwgY29uc3RhbnRQb29sOiBDb25zdGFudFBvb2wpOiBvLkV4cHJlc3Npb24ge1xuICBpZiAoQXJyYXkuaXNBcnJheShxdWVyeS5wcmVkaWNhdGUpKSB7XG4gICAgbGV0IHByZWRpY2F0ZTogby5FeHByZXNzaW9uW10gPSBbXTtcbiAgICBxdWVyeS5wcmVkaWNhdGUuZm9yRWFjaCgoc2VsZWN0b3I6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgICAgLy8gRWFjaCBpdGVtIGluIHByZWRpY2F0ZXMgYXJyYXkgbWF5IGNvbnRhaW4gc3RyaW5ncyB3aXRoIGNvbW1hLXNlcGFyYXRlZCByZWZzXG4gICAgICAvLyAoZm9yIGV4LiAncmVmLCByZWYxLCAuLi4sIHJlZk4nKSwgdGh1cyB3ZSBleHRyYWN0IGluZGl2aWR1YWwgcmVmcyBhbmQgc3RvcmUgdGhlbVxuICAgICAgLy8gYXMgc2VwYXJhdGUgYXJyYXkgZW50aXRpZXNcbiAgICAgIGNvbnN0IHNlbGVjdG9ycyA9IHNlbGVjdG9yLnNwbGl0KCcsJykubWFwKHRva2VuID0+IG8ubGl0ZXJhbCh0b2tlbi50cmltKCkpKTtcbiAgICAgIHByZWRpY2F0ZS5wdXNoKC4uLnNlbGVjdG9ycyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvbnN0YW50UG9vbC5nZXRDb25zdExpdGVyYWwoby5saXRlcmFsQXJyKHByZWRpY2F0ZSksIHRydWUpO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSBvcmlnaW5hbCBwcmVkaWNhdGUgbWF5IGhhdmUgYmVlbiB3cmFwcGVkIGluIGEgYGZvcndhcmRSZWYoKWAgY2FsbC5cbiAgICBzd2l0Y2ggKHF1ZXJ5LnByZWRpY2F0ZS5mb3J3YXJkUmVmKSB7XG4gICAgICBjYXNlIEZvcndhcmRSZWZIYW5kbGluZy5Ob25lOlxuICAgICAgY2FzZSBGb3J3YXJkUmVmSGFuZGxpbmcuVW53cmFwcGVkOlxuICAgICAgICByZXR1cm4gcXVlcnkucHJlZGljYXRlLmV4cHJlc3Npb247XG4gICAgICBjYXNlIEZvcndhcmRSZWZIYW5kbGluZy5XcmFwcGVkOlxuICAgICAgICByZXR1cm4gby5pbXBvcnRFeHByKFIzLnJlc29sdmVGb3J3YXJkUmVmKS5jYWxsRm4oW3F1ZXJ5LnByZWRpY2F0ZS5leHByZXNzaW9uXSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBmb3IgYW4gb2JqZWN0IGxpdGVyYWwgdXNlZCBkdXJpbmcgY29kZWdlbiBvZiBkZWZpbml0aW9uIG9iamVjdHMuIFRoZSBnZW5lcmljXG4gKiB0eXBlIGBUYCBhbGxvd3MgdG8gcmVmZXJlbmNlIGEgZG9jdW1lbnRlZCB0eXBlIG9mIHRoZSBnZW5lcmF0ZWQgc3RydWN0dXJlLCBzdWNoIHRoYXQgdGhlXG4gKiBwcm9wZXJ0eSBuYW1lcyB0aGF0IGFyZSBzZXQgY2FuIGJlIHJlc29sdmVkIHRvIHRoZWlyIGRvY3VtZW50ZWQgZGVjbGFyYXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWZpbml0aW9uTWFwPFQgPSBhbnk+IHtcbiAgdmFsdWVzOiB7a2V5OiBzdHJpbmcsIHF1b3RlZDogYm9vbGVhbiwgdmFsdWU6IG8uRXhwcmVzc2lvbn1bXSA9IFtdO1xuXG4gIHNldChrZXk6IGtleW9mIFQsIHZhbHVlOiBvLkV4cHJlc3Npb258bnVsbCk6IHZvaWQge1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgdGhpcy52YWx1ZXMucHVzaCh7a2V5OiBrZXkgYXMgc3RyaW5nLCB2YWx1ZSwgcXVvdGVkOiBmYWxzZX0pO1xuICAgIH1cbiAgfVxuXG4gIHRvTGl0ZXJhbE1hcCgpOiBvLkxpdGVyYWxNYXBFeHByIHtcbiAgICByZXR1cm4gby5saXRlcmFsTWFwKHRoaXMudmFsdWVzKTtcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3QgYSBtYXAgb2YgcHJvcGVydGllcyB0byB2YWx1ZXMgZm9yIGEgZ2l2ZW4gZWxlbWVudCBvciB0ZW1wbGF0ZSBub2RlLCB3aGljaCBjYW4gYmUgdXNlZFxuICogYnkgdGhlIGRpcmVjdGl2ZSBtYXRjaGluZyBtYWNoaW5lcnkuXG4gKlxuICogQHBhcmFtIGVsT3JUcGwgdGhlIGVsZW1lbnQgb3IgdGVtcGxhdGUgaW4gcXVlc3Rpb25cbiAqIEByZXR1cm4gYW4gb2JqZWN0IHNldCB1cCBmb3IgZGlyZWN0aXZlIG1hdGNoaW5nLiBGb3IgYXR0cmlidXRlcyBvbiB0aGUgZWxlbWVudC90ZW1wbGF0ZSwgdGhpc1xuICogb2JqZWN0IG1hcHMgYSBwcm9wZXJ0eSBuYW1lIHRvIGl0cyAoc3RhdGljKSB2YWx1ZS4gRm9yIGFueSBiaW5kaW5ncywgdGhpcyBtYXAgc2ltcGx5IG1hcHMgdGhlXG4gKiBwcm9wZXJ0eSBuYW1lIHRvIGFuIGVtcHR5IHN0cmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEF0dHJzRm9yRGlyZWN0aXZlTWF0Y2hpbmcoZWxPclRwbDogdC5FbGVtZW50fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdC5UZW1wbGF0ZSk6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSB7XG4gIGNvbnN0IGF0dHJpYnV0ZXNNYXA6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuXG5cbiAgaWYgKGVsT3JUcGwgaW5zdGFuY2VvZiB0LlRlbXBsYXRlICYmIGVsT3JUcGwudGFnTmFtZSAhPT0gJ25nLXRlbXBsYXRlJykge1xuICAgIGVsT3JUcGwudGVtcGxhdGVBdHRycy5mb3JFYWNoKGEgPT4gYXR0cmlidXRlc01hcFthLm5hbWVdID0gJycpO1xuICB9IGVsc2Uge1xuICAgIGVsT3JUcGwuYXR0cmlidXRlcy5mb3JFYWNoKGEgPT4ge1xuICAgICAgaWYgKCFpc0kxOG5BdHRyaWJ1dGUoYS5uYW1lKSkge1xuICAgICAgICBhdHRyaWJ1dGVzTWFwW2EubmFtZV0gPSBhLnZhbHVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZWxPclRwbC5pbnB1dHMuZm9yRWFjaChpID0+IHtcbiAgICAgIGlmIChpLnR5cGUgPT09IEJpbmRpbmdUeXBlLlByb3BlcnR5KSB7XG4gICAgICAgIGF0dHJpYnV0ZXNNYXBbaS5uYW1lXSA9ICcnO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGVsT3JUcGwub3V0cHV0cy5mb3JFYWNoKG8gPT4ge1xuICAgICAgYXR0cmlidXRlc01hcFtvLm5hbWVdID0gJyc7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlc01hcDtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBudW1iZXIgb2YgYXJndW1lbnRzIGV4cGVjdGVkIHRvIGJlIHBhc3NlZCB0byBhIGdlbmVyYXRlZCBpbnN0cnVjdGlvbiBpbiB0aGUgY2FzZSBvZlxuICogaW50ZXJwb2xhdGlvbiBpbnN0cnVjdGlvbnMuXG4gKiBAcGFyYW0gaW50ZXJwb2xhdGlvbiBBbiBpbnRlcnBvbGF0aW9uIGFzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW50ZXJwb2xhdGlvbkFyZ3NMZW5ndGgoaW50ZXJwb2xhdGlvbjogSW50ZXJwb2xhdGlvbikge1xuICBjb25zdCB7ZXhwcmVzc2lvbnMsIHN0cmluZ3N9ID0gaW50ZXJwb2xhdGlvbjtcbiAgaWYgKGV4cHJlc3Npb25zLmxlbmd0aCA9PT0gMSAmJiBzdHJpbmdzLmxlbmd0aCA9PT0gMiAmJiBzdHJpbmdzWzBdID09PSAnJyAmJiBzdHJpbmdzWzFdID09PSAnJykge1xuICAgIC8vIElmIHRoZSBpbnRlcnBvbGF0aW9uIGhhcyBvbmUgaW50ZXJwb2xhdGVkIHZhbHVlLCBidXQgdGhlIHByZWZpeCBhbmQgc3VmZml4IGFyZSBib3RoIGVtcHR5XG4gICAgLy8gc3RyaW5ncywgd2Ugb25seSBwYXNzIG9uZSBhcmd1bWVudCwgdG8gYSBzcGVjaWFsIGluc3RydWN0aW9uIGxpa2UgYHByb3BlcnR5SW50ZXJwb2xhdGVgIG9yXG4gICAgLy8gYHRleHRJbnRlcnBvbGF0ZWAuXG4gICAgcmV0dXJuIDE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGV4cHJlc3Npb25zLmxlbmd0aCArIHN0cmluZ3MubGVuZ3RoO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIHRoZSBmaW5hbCBpbnN0cnVjdGlvbiBjYWxsIHN0YXRlbWVudHMgYmFzZWQgb24gdGhlIHBhc3NlZCBpbiBjb25maWd1cmF0aW9uLlxuICogV2lsbCB0cnkgdG8gY2hhaW4gaW5zdHJ1Y3Rpb25zIGFzIG11Y2ggYXMgcG9zc2libGUsIGlmIGNoYWluaW5nIGlzIHN1cHBvcnRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluc3RydWN0aW9uU3RhdGVtZW50cyhpbnN0cnVjdGlvbnM6IEluc3RydWN0aW9uW10pOiBvLlN0YXRlbWVudFtdIHtcbiAgY29uc3Qgc3RhdGVtZW50czogby5TdGF0ZW1lbnRbXSA9IFtdO1xuICBsZXQgcGVuZGluZ0V4cHJlc3Npb246IG8uRXhwcmVzc2lvbnxudWxsID0gbnVsbDtcbiAgbGV0IHBlbmRpbmdFeHByZXNzaW9uVHlwZTogby5FeHRlcm5hbFJlZmVyZW5jZXxudWxsID0gbnVsbDtcbiAgbGV0IGNoYWluTGVuZ3RoID0gMDtcblxuICBmb3IgKGNvbnN0IGN1cnJlbnQgb2YgaW5zdHJ1Y3Rpb25zKSB7XG4gICAgY29uc3QgcmVzb2x2ZWRQYXJhbXMgPVxuICAgICAgICAodHlwZW9mIGN1cnJlbnQucGFyYW1zT3JGbiA9PT0gJ2Z1bmN0aW9uJyA/IGN1cnJlbnQucGFyYW1zT3JGbigpIDogY3VycmVudC5wYXJhbXNPckZuKSA/P1xuICAgICAgICBbXTtcbiAgICBjb25zdCBwYXJhbXMgPSBBcnJheS5pc0FycmF5KHJlc29sdmVkUGFyYW1zKSA/IHJlc29sdmVkUGFyYW1zIDogW3Jlc29sdmVkUGFyYW1zXTtcblxuICAgIC8vIElmIHRoZSBjdXJyZW50IGluc3RydWN0aW9uIGlzIHRoZSBzYW1lIGFzIHRoZSBwcmV2aW91cyBvbmVcbiAgICAvLyBhbmQgaXQgY2FuIGJlIGNoYWluZWQsIGFkZCBhbm90aGVyIGNhbGwgdG8gdGhlIGNoYWluLlxuICAgIGlmIChjaGFpbkxlbmd0aCA8IE1BWF9DSEFJTl9MRU5HVEggJiYgcGVuZGluZ0V4cHJlc3Npb25UeXBlID09PSBjdXJyZW50LnJlZmVyZW5jZSAmJlxuICAgICAgICBDSEFJTkFCTEVfSU5TVFJVQ1RJT05TLmhhcyhwZW5kaW5nRXhwcmVzc2lvblR5cGUpKSB7XG4gICAgICAvLyBXZSdsbCBhbHdheXMgaGF2ZSBhIHBlbmRpbmcgZXhwcmVzc2lvbiB3aGVuIHRoZXJlJ3MgYSBwZW5kaW5nIGV4cHJlc3Npb24gdHlwZS5cbiAgICAgIHBlbmRpbmdFeHByZXNzaW9uID0gcGVuZGluZ0V4cHJlc3Npb24hLmNhbGxGbihwYXJhbXMsIHBlbmRpbmdFeHByZXNzaW9uIS5zb3VyY2VTcGFuKTtcbiAgICAgIGNoYWluTGVuZ3RoKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChwZW5kaW5nRXhwcmVzc2lvbiAhPT0gbnVsbCkge1xuICAgICAgICBzdGF0ZW1lbnRzLnB1c2gocGVuZGluZ0V4cHJlc3Npb24udG9TdG10KCkpO1xuICAgICAgfVxuICAgICAgcGVuZGluZ0V4cHJlc3Npb24gPSBpbnZva2VJbnN0cnVjdGlvbihjdXJyZW50LnNwYW4sIGN1cnJlbnQucmVmZXJlbmNlLCBwYXJhbXMpO1xuICAgICAgcGVuZGluZ0V4cHJlc3Npb25UeXBlID0gY3VycmVudC5yZWZlcmVuY2U7XG4gICAgICBjaGFpbkxlbmd0aCA9IDA7XG4gICAgfVxuICB9XG5cbiAgLy8gU2luY2UgdGhlIGN1cnJlbnQgaW5zdHJ1Y3Rpb24gYWRkcyB0aGUgcHJldmlvdXMgb25lIHRvIHRoZSBzdGF0ZW1lbnRzLFxuICAvLyB3ZSBtYXkgYmUgbGVmdCB3aXRoIHRoZSBmaW5hbCBvbmUgYXQgdGhlIGVuZCB0aGF0IGlzIHN0aWxsIHBlbmRpbmcuXG4gIGlmIChwZW5kaW5nRXhwcmVzc2lvbiAhPT0gbnVsbCkge1xuICAgIHN0YXRlbWVudHMucHVzaChwZW5kaW5nRXhwcmVzc2lvbi50b1N0bXQoKSk7XG4gIH1cblxuICByZXR1cm4gc3RhdGVtZW50cztcbn1cbiJdfQ==