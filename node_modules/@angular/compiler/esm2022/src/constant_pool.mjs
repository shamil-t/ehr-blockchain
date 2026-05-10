/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from './output/output_ast';
const CONSTANT_PREFIX = '_c';
/**
 * `ConstantPool` tries to reuse literal factories when two or more literals are identical.
 * We determine whether literals are identical by creating a key out of their AST using the
 * `KeyVisitor`. This constant is used to replace dynamic expressions which can't be safely
 * converted into a key. E.g. given an expression `{foo: bar()}`, since we don't know what
 * the result of `bar` will be, we create a key that looks like `{foo: <unknown>}`. Note
 * that we use a variable, rather than something like `null` in order to avoid collisions.
 */
const UNKNOWN_VALUE_KEY = o.variable('<unknown>');
/**
 * Context to use when producing a key.
 *
 * This ensures we see the constant not the reference variable when producing
 * a key.
 */
const KEY_CONTEXT = {};
/**
 * Generally all primitive values are excluded from the `ConstantPool`, but there is an exclusion
 * for strings that reach a certain length threshold. This constant defines the length threshold for
 * strings.
 */
const POOL_INCLUSION_LENGTH_THRESHOLD_FOR_STRINGS = 50;
/**
 * A node that is a place-holder that allows the node to be replaced when the actual
 * node is known.
 *
 * This allows the constant pool to change an expression from a direct reference to
 * a constant to a shared constant. It returns a fix-up node that is later allowed to
 * change the referenced expression.
 */
class FixupExpression extends o.Expression {
    constructor(resolved) {
        super(resolved.type);
        this.resolved = resolved;
        this.shared = false;
        this.original = resolved;
    }
    visitExpression(visitor, context) {
        if (context === KEY_CONTEXT) {
            // When producing a key we want to traverse the constant not the
            // variable used to refer to it.
            return this.original.visitExpression(visitor, context);
        }
        else {
            return this.resolved.visitExpression(visitor, context);
        }
    }
    isEquivalent(e) {
        return e instanceof FixupExpression && this.resolved.isEquivalent(e.resolved);
    }
    isConstant() {
        return true;
    }
    clone() {
        throw new Error(`Not supported.`);
    }
    fixup(expression) {
        this.resolved = expression;
        this.shared = true;
    }
}
/**
 * A constant pool allows a code emitter to share constant in an output context.
 *
 * The constant pool also supports sharing access to ivy definitions references.
 */
export class ConstantPool {
    constructor(isClosureCompilerEnabled = false) {
        this.isClosureCompilerEnabled = isClosureCompilerEnabled;
        this.statements = [];
        this.literals = new Map();
        this.literalFactories = new Map();
        this.sharedConstants = new Map();
        this.nextNameIndex = 0;
    }
    getConstLiteral(literal, forceShared) {
        if ((literal instanceof o.LiteralExpr && !isLongStringLiteral(literal)) ||
            literal instanceof FixupExpression) {
            // Do no put simple literals into the constant pool or try to produce a constant for a
            // reference to a constant.
            return literal;
        }
        const key = GenericKeyFn.INSTANCE.keyOf(literal);
        let fixup = this.literals.get(key);
        let newValue = false;
        if (!fixup) {
            fixup = new FixupExpression(literal);
            this.literals.set(key, fixup);
            newValue = true;
        }
        if ((!newValue && !fixup.shared) || (newValue && forceShared)) {
            // Replace the expression with a variable
            const name = this.freshName();
            let definition;
            let usage;
            if (this.isClosureCompilerEnabled && isLongStringLiteral(literal)) {
                // For string literals, Closure will **always** inline the string at
                // **all** usages, duplicating it each time. For large strings, this
                // unnecessarily bloats bundle size. To work around this restriction, we
                // wrap the string in a function, and call that function for each usage.
                // This tricks Closure into using inline logic for functions instead of
                // string literals. Function calls are only inlined if the body is small
                // enough to be worth it. By doing this, very large strings will be
                // shared across multiple usages, rather than duplicating the string at
                // each usage site.
                //
                // const myStr = function() { return "very very very long string"; };
                // const usage1 = myStr();
                // const usage2 = myStr();
                definition = o.variable(name).set(new o.FunctionExpr([], // Params.
                [
                    // Statements.
                    new o.ReturnStatement(literal),
                ]));
                usage = o.variable(name).callFn([]);
            }
            else {
                // Just declare and use the variable directly, without a function call
                // indirection. This saves a few bytes and avoids an unnecessary call.
                definition = o.variable(name).set(literal);
                usage = o.variable(name);
            }
            this.statements.push(definition.toDeclStmt(o.INFERRED_TYPE, o.StmtModifier.Final));
            fixup.fixup(usage);
        }
        return fixup;
    }
    getSharedConstant(def, expr) {
        const key = def.keyOf(expr);
        if (!this.sharedConstants.has(key)) {
            const id = this.freshName();
            this.sharedConstants.set(key, o.variable(id));
            this.statements.push(def.toSharedConstantDeclaration(id, expr));
        }
        return this.sharedConstants.get(key);
    }
    getLiteralFactory(literal) {
        // Create a pure function that builds an array of a mix of constant and variable expressions
        if (literal instanceof o.LiteralArrayExpr) {
            const argumentsForKey = literal.entries.map(e => e.isConstant() ? e : UNKNOWN_VALUE_KEY);
            const key = GenericKeyFn.INSTANCE.keyOf(o.literalArr(argumentsForKey));
            return this._getLiteralFactory(key, literal.entries, entries => o.literalArr(entries));
        }
        else {
            const expressionForKey = o.literalMap(literal.entries.map(e => ({
                key: e.key,
                value: e.value.isConstant() ? e.value : UNKNOWN_VALUE_KEY,
                quoted: e.quoted
            })));
            const key = GenericKeyFn.INSTANCE.keyOf(expressionForKey);
            return this._getLiteralFactory(key, literal.entries.map(e => e.value), entries => o.literalMap(entries.map((value, index) => ({
                key: literal.entries[index].key,
                value,
                quoted: literal.entries[index].quoted
            }))));
        }
    }
    _getLiteralFactory(key, values, resultMap) {
        let literalFactory = this.literalFactories.get(key);
        const literalFactoryArguments = values.filter((e => !e.isConstant()));
        if (!literalFactory) {
            const resultExpressions = values.map((e, index) => e.isConstant() ? this.getConstLiteral(e, true) : o.variable(`a${index}`));
            const parameters = resultExpressions.filter(isVariable).map(e => new o.FnParam(e.name, o.DYNAMIC_TYPE));
            const pureFunctionDeclaration = o.fn(parameters, [new o.ReturnStatement(resultMap(resultExpressions))], o.INFERRED_TYPE);
            const name = this.freshName();
            this.statements.push(o.variable(name)
                .set(pureFunctionDeclaration)
                .toDeclStmt(o.INFERRED_TYPE, o.StmtModifier.Final));
            literalFactory = o.variable(name);
            this.literalFactories.set(key, literalFactory);
        }
        return { literalFactory, literalFactoryArguments };
    }
    /**
     * Produce a unique name.
     *
     * The name might be unique among different prefixes if any of the prefixes end in
     * a digit so the prefix should be a constant string (not based on user input) and
     * must not end in a digit.
     */
    uniqueName(prefix) {
        return `${prefix}${this.nextNameIndex++}`;
    }
    freshName() {
        return this.uniqueName(CONSTANT_PREFIX);
    }
}
export class GenericKeyFn {
    static { this.INSTANCE = new GenericKeyFn(); }
    keyOf(expr) {
        if (expr instanceof o.LiteralExpr && typeof expr.value === 'string') {
            return `"${expr.value}"`;
        }
        else if (expr instanceof o.LiteralExpr) {
            return String(expr.value);
        }
        else if (expr instanceof o.LiteralArrayExpr) {
            const entries = [];
            for (const entry of expr.entries) {
                entries.push(this.keyOf(entry));
            }
            return `[${entries.join(',')}]`;
        }
        else if (expr instanceof o.LiteralMapExpr) {
            const entries = [];
            for (const entry of expr.entries) {
                let key = entry.key;
                if (entry.quoted) {
                    key = `"${key}"`;
                }
                entries.push(key + ':' + this.keyOf(entry.value));
            }
            return `{${entries.join(',')}}`;
        }
        else if (expr instanceof o.ExternalExpr) {
            return `import("${expr.value.moduleName}", ${expr.value.name})`;
        }
        else if (expr instanceof o.ReadVarExpr) {
            return `read(${expr.name})`;
        }
        else if (expr instanceof o.TypeofExpr) {
            return `typeof(${this.keyOf(expr.expr)})`;
        }
        else {
            throw new Error(`${this.constructor.name} does not handle expressions of type ${expr.constructor.name}`);
        }
    }
}
function isVariable(e) {
    return e instanceof o.ReadVarExpr;
}
function isLongStringLiteral(expr) {
    return expr instanceof o.LiteralExpr && typeof expr.value === 'string' &&
        expr.value.length >= POOL_INCLUSION_LENGTH_THRESHOLD_FOR_STRINGS;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRfcG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy9jb25zdGFudF9wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sS0FBSyxDQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFekMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDO0FBRTdCOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7QUFFbEQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFFdkI7Ozs7R0FJRztBQUNILE1BQU0sMkNBQTJDLEdBQUcsRUFBRSxDQUFDO0FBRXZEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLGVBQWdCLFNBQVEsQ0FBQyxDQUFDLFVBQVU7SUFLeEMsWUFBbUIsUUFBc0I7UUFDdkMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURKLGFBQVEsR0FBUixRQUFRLENBQWM7UUFGekMsV0FBTSxHQUFHLEtBQUssQ0FBQztRQUliLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0lBQzNCLENBQUM7SUFFUSxlQUFlLENBQUMsT0FBNEIsRUFBRSxPQUFZO1FBQ2pFLElBQUksT0FBTyxLQUFLLFdBQVcsRUFBRTtZQUMzQixnRUFBZ0U7WUFDaEUsZ0NBQWdDO1lBQ2hDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3hEO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN4RDtJQUNILENBQUM7SUFFUSxZQUFZLENBQUMsQ0FBZTtRQUNuQyxPQUFPLENBQUMsWUFBWSxlQUFlLElB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QUFPLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztTQUMzQzthQUFNO1lBQ0wsTUFBTSxJQUFJLEtBQUssQ0FDWCxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSx3Q0FBd0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQzlGO0lBQ0gsQ0FBQzs7QUFHSCxTQUFTLFVBQVUsQ0FBQyxDQUFlO0lBQ2pDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFDcEMsQ0FBQztBQUVELFNBQVMsbUJBQW1CLENBQUMsSUFBa0I7SUFDN0MsT0FBTyxJQUFJLFlBQVksQ0FBQyxDQUFDLFdBQVcsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUTtRQUNsRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSwyQ0FBMkMsQ0FBQztBQUN2RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIG8gZnJvbSAnLi9vdXRwdXQvb3V0cHV0X2FzdCc7XG5cbmNvbnN0IENPTlNUQU5UX1BSRUZJWCA9ICdfYyc7XG5cbi8qKlxuICogYENvbnN0YW50UG9vbGAgdHJpZXMgdG8gcmV1c2UgbGl0ZXJhbCBmYWN0b3JpZXMgd2hlbiB0d28gb3IgbW9yZSBsaXRlcmFscyBhcmUgaWRlbnRpY2FsLlxuICogV2UgZGV0ZXJtaW5lIHdoZXRoZXIgbGl0ZXJhbHMgYXJlIGlkZW50aWNhbCBieSBjcmVhdGluZyBhIGtleSBvdXQgb2YgdGhlaXIgQVNUIHVzaW5nIHRoZVxuICogYEtleVZpc2l0b3JgLiBUaGlzIGNvbnN0YW50IGlzIHVzZWQgdG8gcmVwbGFjZSBkeW5hbWljIGV4cHJlc3Npb25zIHdoaWNoIGNhbid0IGJlIHNhZmVseVxuICogY29udmVydGVkIGludG8gYSBrZXkuIEUuZy4gZ2l2ZW4gYW4gZXhwcmVzc2lvbiBge2ZvbzogYmFyKCl9YCwgc2luY2Ugd2UgZG9uJ3Qga25vdyB3aGF0XG4gKiB0aGUgcmVzdWx0IG9mIGBiYXJgIHdpbGwgYmUsIHdlIGNyZWF0ZSBhIGtleSB0aGF0IGxvb2tzIGxpa2UgYHtmb286IDx1bmtub3duPn1gLiBOb3RlXG4gKiB0aGF0IHdlIHVzZSBhIHZhcmlhYmxlLCByYXRoZXIgdGhhbiBzb21ldGhpbmcgbGlrZSBgbnVsbGAgaW4gb3JkZXIgdG8gYXZvaWQgY29sbGlzaW9ucy5cbiAqL1xuY29uc3QgVU5LTk9XTl9WQUxVRV9LRVkgPSBvLnZhcmlhYmxlKCc8dW5rbm93bj4nKTtcblxuLyoqXG4gKiBDb250ZXh0IHRvIHVzZSB3aGVuIHByb2R1Y2luZyBhIGtleS5cbiAqXG4gKiBUaGlzIGVuc3VyZXMgd2Ugc2VlIHRoZSBjb25zdGFudCBub3QgdGhlIHJlZmVyZW5jZSB2YXJpYWJsZSB3aGVuIHByb2R1Y2luZ1xuICogYSBrZXkuXG4gKi9cbmNvbnN0IEtFWV9DT05URVhUID0ge307XG5cbi8qKlxuICogR2VuZXJhbGx5IGFsbCBwcmltaXRpdmUgdmFsdWVzIGFyZSBleGNsdWRlZCBmcm9tIHRoZSBgQ29uc3RhbnRQb29sYCwgYnV0IHRoZXJlIGlzIGFuIGV4Y2x1c2lvblxuICogZm9yIHN0cmluZ3MgdGhhdCByZWFjaCBhIGNlcnRhaW4gbGVuZ3RoIHRocmVzaG9sZC4gVGhpcyBjb25zdGFudCBkZWZpbmVzIHRoZSBsZW5ndGggdGhyZXNob2xkIGZvclxuICogc3RyaW5ncy5cbiAqL1xuY29uc3QgUE9PTF9JTkNMVVNJT05fTEVOR1RIX1RIUkVTSE9MRF9GT1JfU1RSSU5HUyA9IDUwO1xuXG4vKipcbiAqIEEgbm9kZSB0aGF0IGlzIGEgcGxhY2UtaG9sZGVyIHRoYXQgYWxsb3dzIHRoZSBub2RlIHRvIGJlIHJlcGxhY2VkIHdoZW4gdGhlIGFjdHVhbFxuICogbm9kZSBpcyBrbm93bi5cbiAqXG4gKiBUaGlzIGFsbG93cyB0aGUgY29uc3RhbnQgcG9vbCB0byBjaGFuZ2UgYW4gZXhwcmVzc2lvbiBmcm9tIGEgZGlyZWN0IHJlZmVyZW5jZSB0b1xuICogYSBjb25zdGFudCB0byBhIHNoYXJlZCBjb25zdGFudC4gSXQgcmV0dXJucyBhIGZpeC11cCBub2RlIHRoYXQgaXMgbGF0ZXIgYWxsb3dlZCB0b1xuICogY2hhbmdlIHRoZSByZWZlcmVuY2VkIGV4cHJlc3Npb24uXG4gKi9cbmNsYXNzIEZpeHVwRXhwcmVzc2lvbiBleHRlbmRzIG8uRXhwcmVzc2lvbiB7XG4gIHByaXZhdGUgb3JpZ2luYWw6IG8uRXhwcmVzc2lvbjtcblxuICBzaGFyZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVzb2x2ZWQ6IG8uRXhwcmVzc2lvbikge1xuICAgIHN1cGVyKHJlc29sdmVkLnR5cGUpO1xuICAgIHRoaXMub3JpZ2luYWwgPSByZXNvbHZlZDtcbiAgfVxuXG4gIG92ZXJyaWRlIHZpc2l0RXhwcmVzc2lvbih2aXNpdG9yOiBvLkV4cHJlc3Npb25WaXNpdG9yLCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIGlmIChjb250ZXh0ID09PSBLRVlfQ09OVEVYVCkge1xuICAgICAgLy8gV2hlbiBwcm9kdWNpbmcgYSBrZXkgd2Ugd2FudCB0byB0cmF2ZXJzZSB0aGUgY29uc3RhbnQgbm90IHRoZVxuICAgICAgLy8gdmFyaWFibGUgdXNlZCB0byByZWZlciB0byBpdC5cbiAgICAgIHJldHVybiB0aGlzLm9yaWdpbmFsLnZpc2l0RXhwcmVzc2lvbih2aXNpdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZWQudmlzaXRFeHByZXNzaW9uKHZpc2l0b3IsIGNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGlzRXF1aXZhbGVudChlOiBvLkV4cHJlc3Npb24pOiBib29sZWFuIHtcbiAgICByZXR1cm4gZSBpbnN0YW5jZW9mIEZpeHVwRXhwcmVzc2lvbiAmJiB0aGlzLnJlc29sdmVkLmlzRXF1aXZhbGVudChlLnJlc29sdmVkKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGlzQ29uc3RhbnQoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBvdmVycmlkZSBjbG9uZSgpOiBGaXh1cEV4cHJlc3Npb24ge1xuICAgIHRocm93IG5ldyBFcnJvcihgTm90IHN1cHBvcnRlZC5gKTtcbiAgfVxuXG4gIGZpeHVwKGV4cHJlc3Npb246IG8uRXhwcmVzc2lvbikge1xuICAgIHRoaXMucmVzb2x2ZWQgPSBleHByZXNzaW9uO1xuICAgIHRoaXMuc2hhcmVkID0gdHJ1ZTtcbiAgfVxufVxuXG4vKipcbiAqIEEgY29uc3RhbnQgcG9vbCBhbGxvd3MgYSBjb2RlIGVtaXR0ZXIgdG8gc2hhcmUgY29uc3RhbnQgaW4gYW4gb3V0cHV0IGNvbnRleHQuXG4gKlxuICogVGhlIGNvbnN0YW50IHBvb2wgYWxzbyBzdXBwb3J0cyBzaGFyaW5nIGFjY2VzcyB0byBpdnkgZGVmaW5pdGlvbnMgcmVmZXJlbmNlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbnN0YW50UG9vbCB7XG4gIHN0YXRlbWVudHM6IG8uU3RhdGVtZW50W10gPSBbXTtcbiAgcHJpdmF0ZSBsaXRlcmFscyA9IG5ldyBNYXA8c3RyaW5nLCBGaXh1cEV4cHJlc3Npb24+KCk7XG4gIHByaXZhdGUgbGl0ZXJhbEZhY3RvcmllcyA9IG5ldyBNYXA8c3RyaW5nLCBvLkV4cHJlc3Npb24+KCk7XG4gIHByaXZhdGUgc2hhcmVkQ29uc3RhbnRzID0gbmV3IE1hcDxzdHJpbmcsIG8uRXhwcmVzc2lvbj4oKTtcblxuICBwcml2YXRlIG5leHROYW1lSW5kZXggPSAwO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgaXNDbG9zdXJlQ29tcGlsZXJFbmFibGVkOiBib29sZWFuID0gZmFsc2UpIHt9XG5cbiAgZ2V0Q29uc3RMaXRlcmFsKGxpdGVyYWw6IG8uRXhwcmVzc2lvbiwgZm9yY2VTaGFyZWQ/OiBib29sZWFuKTogby5FeHByZXNzaW9uIHtcbiAgICBpZiAoKGxpdGVyYWwgaW5zdGFuY2VvZiBvLkxpdGVyYWxFeHByICYmICFpc0xvbmdTdHJpbmdMaXRlcmFsKGxpdGVyYWwpKSB8fFxuICAgICAgICBsaXRlcmFsIGluc3RhbmNlb2YgRml4dXBFeHByZXNzaW9uKSB7XG4gICAgICAvLyBEbyBubyBwdXQgc2ltcGxlIGxpdGVyYWxzIGludG8gdGhlIGNvbnN0YW50IHBvb2wgb3IgdHJ5IHRvIHByb2R1Y2UgYSBjb25zdGFudCBmb3IgYVxuICAgICAgLy8gcmVmZXJlbmNlIHRvIGEgY29uc3RhbnQuXG4gICAgICByZXR1cm4gbGl0ZXJhbDtcbiAgICB9XG4gICAgY29uc3Qga2V5ID0gR2VuZXJpY0tleUZuLklOU1RBTkNFLmtleU9mKGxpdGVyYWwpO1xuICAgIGxldCBmaXh1cCA9IHRoaXMubGl0ZXJhbHMuZ2V0KGtleSk7XG4gICAgbGV0IG5ld1ZhbHVlID0gZmFsc2U7XG4gICAgaWYgKCFmaXh1cCkge1xuICAgICAgZml4dXAgPSBuZXcgRml4dXBFeHByZXNzaW9uKGxpdGVyYWwpO1xuICAgICAgdGhpcy5saXRlcmFscy5zZXQoa2V5LCBmaXh1cCk7XG4gICAgICBuZXdWYWx1ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCghbmV3VmFsdWUgJiYgIWZpeHVwLnNoYXJlZCkgfHwgKG5ld1ZhbHVlICYmIGZvcmNlU2hhcmVkKSkge1xuICAgICAgLy8gUmVwbGFjZSB0aGUgZXhwcmVzc2lvbiB3aXRoIGEgdmFyaWFibGVcbiAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmZyZXNoTmFtZSgpO1xuICAgICAgbGV0IGRlZmluaXRpb246IG8uV3JpdGVWYXJFeHByO1xuICAgICAgbGV0IHVzYWdlOiBvLkV4cHJlc3Npb247XG4gICAgICBpZiAodGhpcy5pc0Nsb3N1cmVDb21waWxlckVuYWJsZWQgJiYgaXNMb25nU3RyaW5nTGl0ZXJhbChsaXRlcmFsKSkge1xuICAgICAgICAvLyBGb3Igc3RyaW5nIGxpdGVyYWxzLCBDbG9zdXJlIHdpbGwgKiphbHdheXMqKiBpbmxpbmUgdGhlIHN0cmluZyBhdFxuICAgICAgICAvLyAqKmFsbCoqIHVzYWdlcywgZHVwbGljYXRpbmcgaXQgZWFjaCB0aW1lLiBGb3IgbGFyZ2Ugc3RyaW5ncywgdGhpc1xuICAgICAgICAvLyB1bm5lY2Vzc2FyaWx5IGJsb2F0cyBidW5kbGUgc2l6ZS4gVG8gd29yayBhcm91bmQgdGhpcyByZXN0cmljdGlvbiwgd2VcbiAgICAgICAgLy8gd3JhcCB0aGUgc3RyaW5nIGluIGEgZnVuY3Rpb24sIGFuZCBjYWxsIHRoYXQgZnVuY3Rpb24gZm9yIGVhY2ggdXNhZ2UuXG4gICAgICAgIC8vIFRoaXMgdHJpY2tzIENsb3N1cmUgaW50byB1c2luZyBpbmxpbmUgbG9naWMgZm9yIGZ1bmN0aW9ucyBpbnN0ZWFkIG9mXG4gICAgICAgIC8vIHN0cmluZyBsaXRlcmFscy4gRnVuY3Rpb24gY2FsbHMgYXJlIG9ubHkgaW5saW5lZCBpZiB0aGUgYm9keSBpcyBzbWFsbFxuICAgICAgICAvLyBlbm91Z2ggdG8gYmUgd29ydGggaXQuIEJ5IGRvaW5nIHRoaXMsIHZlcnkgbGFyZ2Ugc3RyaW5ncyB3aWxsIGJlXG4gICAgICAgIC8vIHNoYXJlZCBhY3Jvc3MgbXVsdGlwbGUgdXNhZ2VzLCByYXRoZXIgdGhhbiBkdXBsaWNhdGluZyB0aGUgc3RyaW5nIGF0XG4gICAgICAgIC8vIGVhY2ggdXNhZ2Ugc2l0ZS5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gY29uc3QgbXlTdHIgPSBmdW5jdGlvbigpIHsgcmV0dXJuIFwidmVyeSB2ZXJ5IHZlcnkgbG9uZyBzdHJpbmdcIjsgfTtcbiAgICAgICAgLy8gY29uc3QgdXNhZ2UxID0gbXlTdHIoKTtcbiAgICAgICAgLy8gY29uc3QgdXNhZ2UyID0gbXlTdHIoKTtcbiAgICAgICAgZGVmaW5pdGlvbiA9IG8udmFyaWFibGUobmFtZSkuc2V0KG5ldyBvLkZ1bmN0aW9uRXhwcihcbiAgICAgICAgICAgIFtdLCAgLy8gUGFyYW1zLlxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAvLyBTdGF0ZW1lbnRzLlxuICAgICAgICAgICAgICBuZXcgby5SZXR1cm5TdGF0ZW1lbnQobGl0ZXJhbCksXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgKSk7XG4gICAgICAgIHVzYWdlID0gby52YXJpYWJsZShuYW1lKS5jYWxsRm4oW10pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSnVzdCBkZWNsYXJlIGFuZCB1c2UgdGhlIHZhcmlhYmxlIGRpcmVjdGx5LCB3aXRob3V0IGEgZnVuY3Rpb24gY2FsbFxuICAgICAgICAvLyBpbmRpcmVjdGlvbi4gVGhpcyBzYXZlcyBhIGZldyBieXRlcyBhbmQgYXZvaWRzIGFuIHVubmVjZXNzYXJ5IGNhbGwuXG4gICAgICAgIGRlZmluaXRpb24gPSBvLnZhcmlhYmxlKG5hbWUpLnNldChsaXRlcmFsKTtcbiAgICAgICAgdXNhZ2UgPSBvLnZhcmlhYmxlKG5hbWUpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YXRlbWVudHMucHVzaChkZWZpbml0aW9uLnRvRGVjbFN0bXQoby5JTkZFUlJFRF9UWVBFLCBvLlN0bXRNb2RpZmllci5GaW5hbCkpO1xuICAgICAgZml4dXAuZml4dXAodXNhZ2UpO1xuICAgIH1cblxuICAgIHJldHVybiBmaXh1cDtcbiAgfVxuXG4gIGdldFNoYXJlZENvbnN0YW50KGRlZjogU2hhcmVkQ29uc3RhbnREZWZpbml0aW9uLCBleHByOiBvLkV4cHJlc3Npb24pOiBvLkV4cHJlc3Npb24ge1xuICAgIGNvbnN0IGtleSA9IGRlZi5rZXlPZihleHByKTtcbiAgICBpZiAoIXRoaXMuc2hhcmVkQ29uc3RhbnRzLmhhcyhrZXkpKSB7XG4gICAgICBjb25zdCBpZCA9IHRoaXMuZnJlc2hOYW1lKCk7XG4gICAgICB0aGlzLnNoYXJlZENvbnN0YW50cy5zZXQoa2V5LCBvLnZhcmlhYmxlKGlkKSk7XG4gICAgICB0aGlzLnN0YXRlbWVudHMucHVzaChkZWYudG9TaGFyZWRDb25zdGFudERlY2xhcmF0aW9uKGlkLCBleHByKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNoYXJlZENvbnN0YW50cy5nZXQoa2V5KSE7XG4gIH1cblxuICBnZXRMaXRlcmFsRmFjdG9yeShsaXRlcmFsOiBvLkxpdGVyYWxBcnJheUV4cHJ8by5MaXRlcmFsTWFwRXhwcik6XG4gICAgICB7bGl0ZXJhbEZhY3Rvcnk6IG8uRXhwcmVzc2lvbiwgbGl0ZXJhbEZhY3RvcnlBcmd1bWVudHM6IG8uRXhwcmVzc2lvbltdfSB7XG4gICAgLy8gQ3JlYXRlIGEgcHVyZSBmdW5jdGlvbiB0aGF0IGJ1aWxkcyBhbiBhcnJheSBvZiBhIG1peCBvZiBjb25zdGFudCBhbmQgdmFyaWFibGUgZXhwcmVzc2lvbnNcbiAgICBpZiAobGl0ZXJhbCBpbnN0YW5jZW9mIG8uTGl0ZXJhbEFycmF5RXhwcikge1xuICAgICAgY29uc3QgYXJndW1lbnRzRm9yS2V5ID0gbGl0ZXJhbC5lbnRyaWVzLm1hcChlID0+IGUuaXNDb25zdGFudCgpID8gZSA6IFVOS05PV05fVkFMVUVfS0VZKTtcbiAgICAgIGNvbnN0IGtleSA9IEdlbmVyaWNLZXlGbi5JTlNUQU5DRS5rZXlPZihvLmxpdGVyYWxBcnIoYXJndW1lbnRzRm9yS2V5KSk7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0TGl0ZXJhbEZhY3Rvcnkoa2V5LCBsaXRlcmFsLmVudHJpZXMsIGVudHJpZXMgPT4gby5saXRlcmFsQXJyKGVudHJpZXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXhwcmVzc2lvbkZvcktleSA9IG8ubGl0ZXJhbE1hcChcbiAgICAgICAgICBsaXRlcmFsLmVudHJpZXMubWFwKGUgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBlLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGUudmFsdWUuaXNDb25zdGFudCgpID8gZS52YWx1ZSA6IFVOS05PV05fVkFMVUVfS0VZLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdW90ZWQ6IGUucXVvdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSkpO1xuICAgICAgY29uc3Qga2V5ID0gR2VuZXJpY0tleUZuLklOU1RBTkNFLmtleU9mKGV4cHJlc3Npb25Gb3JLZXkpO1xuICAgICAgcmV0dXJuIHRoaXMuX2dldExpdGVyYWxGYWN0b3J5KFxuICAgICAgICAgIGtleSwgbGl0ZXJhbC5lbnRyaWVzLm1hcChlID0+IGUudmFsdWUpLFxuICAgICAgICAgIGVudHJpZXMgPT4gby5saXRlcmFsTWFwKGVudHJpZXMubWFwKCh2YWx1ZSwgaW5kZXgpID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGxpdGVyYWwuZW50cmllc1tpbmRleF0ua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdW90ZWQ6IGxpdGVyYWwuZW50cmllc1tpbmRleF0ucXVvdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpKSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0TGl0ZXJhbEZhY3RvcnkoXG4gICAgICBrZXk6IHN0cmluZywgdmFsdWVzOiBvLkV4cHJlc3Npb25bXSwgcmVzdWx0TWFwOiAocGFyYW1ldGVyczogby5FeHByZXNzaW9uW10pID0+IG8uRXhwcmVzc2lvbik6XG4gICAgICB7bGl0ZXJhbEZhY3Rvcnk6IG8uRXhwcmVzc2lvbiwgbGl0ZXJhbEZhY3RvcnlBcmd1bWVudHM6IG8uRXhwcmVzc2lvbltdfSB7XG4gICAgbGV0IGxpdGVyYWxGYWN0b3J5ID0gdGhpcy5saXRlcmFsRmFjdG9yaWVzLmdldChrZXkpO1xuICAgIGNvbnN0IGxpdGVyYWxGYWN0b3J5QXJndW1lbnRzID0gdmFsdWVzLmZpbHRlcigoZSA9PiAhZS5pc0NvbnN0YW50KCkpKTtcbiAgICBpZiAoIWxpdGVyYWxGYWN0b3J5KSB7XG4gICAgICBjb25zdCByZXN1bHRFeHByZXNzaW9ucyA9IHZhbHVlcy5tYXAoXG4gICAgICAgICAgKGUsIGluZGV4KSA9PiBlLmlzQ29uc3RhbnQoKSA/IHRoaXMuZ2V0Q29uc3RMaXRlcmFsKGUsIHRydWUpIDogby52YXJpYWJsZShgYSR7aW5kZXh9YCkpO1xuICAgICAgY29uc3QgcGFyYW1ldGVycyA9XG4gICAgICAgICAgcmVzdWx0RXhwcmVzc2lvbnMuZmlsdGVyKGlzVmFyaWFibGUpLm1hcChlID0+IG5ldyBvLkZuUGFyYW0oZS5uYW1lISwgby5EWU5BTUlDX1RZUEUpKTtcbiAgICAgIGNvbnN0IHB1cmVGdW5jdGlvbkRlY2xhcmF0aW9uID1cbiAgICAgICAgICBvLmZuKHBhcmFtZXRlcnMsIFtuZXcgby5SZXR1cm5TdGF0ZW1lbnQocmVzdWx0TWFwKHJlc3VsdEV4cHJlc3Npb25zKSldLCBvLklORkVSUkVEX1RZUEUpO1xuICAgICAgY29uc3QgbmFtZSA9IHRoaXMuZnJlc2hOYW1lKCk7XG4gICAgICB0aGlzLnN0YXRlbWVudHMucHVzaChvLnZhcmlhYmxlKG5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldChwdXJlRnVuY3Rpb25EZWNsYXJhdGlvbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG9EZWNsU3RtdChvLklORkVSUkVEX1RZUEUsIG8uU3RtdE1vZGlmaWVyLkZpbmFsKSk7XG4gICAgICBsaXRlcmFsRmFjdG9yeSA9IG8udmFyaWFibGUobmFtZSk7XG4gICAgICB0aGlzLmxpdGVyYWxGYWN0b3JpZXMuc2V0KGtleSwgbGl0ZXJhbEZhY3RvcnkpO1xuICAgIH1cbiAgICByZXR1cm4ge2xpdGVyYWxGYWN0b3J5LCBsaXRlcmFsRmFjdG9yeUFyZ3VtZW50c307XG4gIH1cblxuICAvKipcbiAgICogUHJvZHVjZSBhIHVuaXF1ZSBuYW1lLlxuICAgKlxuICAgKiBUaGUgbmFtZSBtaWdodCBiZSB1bmlxdWUgYW1vbmcgZGlmZmVyZW50IHByZWZpeGVzIGlmIGFueSBvZiB0aGUgcHJlZml4ZXMgZW5kIGluXG4gICAqIGEgZGlnaXQgc28gdGhlIHByZWZpeCBzaG91bGQgYmUgYSBjb25zdGFudCBzdHJpbmcgKG5vdCBiYXNlZCBvbiB1c2VyIGlucHV0KSBhbmRcbiAgICogbXVzdCBub3QgZW5kIGluIGEgZGlnaXQuXG4gICAqL1xuICB1bmlxdWVOYW1lKHByZWZpeDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7cHJlZml4fSR7dGhpcy5uZXh0TmFtZUluZGV4Kyt9YDtcbiAgfVxuXG4gIHByaXZhdGUgZnJlc2hOYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudW5pcXVlTmFtZShDT05TVEFOVF9QUkVGSVgpO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhwcmVzc2lvbktleUZuIHtcbiAga2V5T2YoZXhwcjogby5FeHByZXNzaW9uKTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNoYXJlZENvbnN0YW50RGVmaW5pdGlvbiBleHRlbmRzIEV4cHJlc3Npb25LZXlGbiB7XG4gIHRvU2hhcmVkQ29uc3RhbnREZWNsYXJhdGlvbihkZWNsTmFtZTogc3RyaW5nLCBrZXlFeHByOiBvLkV4cHJlc3Npb24pOiBvLlN0YXRlbWVudDtcbn1cblxuZXhwb3J0IGNsYXNzIEdlbmVyaWNLZXlGbiBpbXBsZW1lbnRzIEV4cHJlc3Npb25LZXlGbiB7XG4gIHN0YXRpYyByZWFkb25seSBJTlNUQU5DRSA9IG5ldyBHZW5lcmljS2V5Rm4oKTtcblxuICBrZXlPZihleHByOiBvLkV4cHJlc3Npb24pOiBzdHJpbmcge1xuICAgIGlmIChleHByIGluc3RhbmNlb2Ygby5MaXRlcmFsRXhwciAmJiB0eXBlb2YgZXhwci52YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBgXCIke2V4cHIudmFsdWV9XCJgO1xuICAgIH0gZWxzZSBpZiAoZXhwciBpbnN0YW5jZW9mIG8uTGl0ZXJhbEV4cHIpIHtcbiAgICAgIHJldHVybiBTdHJpbmcoZXhwci52YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChleHByIGluc3RhbmNlb2Ygby5MaXRlcmFsQXJyYXlFeHByKSB7XG4gICAgICBjb25zdCBlbnRyaWVzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBleHByLmVudHJpZXMpIHtcbiAgICAgICAgZW50cmllcy5wdXNoKHRoaXMua2V5T2YoZW50cnkpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBgWyR7ZW50cmllcy5qb2luKCcsJyl9XWA7XG4gICAgfSBlbHNlIGlmIChleHByIGluc3RhbmNlb2Ygby5MaXRlcmFsTWFwRXhwcikge1xuICAgICAgY29uc3QgZW50cmllczogc3RyaW5nW10gPSBbXTtcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZXhwci5lbnRyaWVzKSB7XG4gICAgICAgIGxldCBrZXkgPSBlbnRyeS5rZXk7XG4gICAgICAgIGlmIChlbnRyeS5xdW90ZWQpIHtcbiAgICAgICAgICBrZXkgPSBgXCIke2tleX1cImA7XG4gICAgICAgIH1cbiAgICAgICAgZW50cmllcy5wdXNoKGtleSArICc6JyArIHRoaXMua2V5T2YoZW50cnkudmFsdWUpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBgeyR7ZW50cmllcy5qb2luKCcsJyl9fWA7XG4gICAgfSBlbHNlIGlmIChleHByIGluc3RhbmNlb2Ygby5FeHRlcm5hbEV4cHIpIHtcbiAgICAgIHJldHVybiBgaW1wb3J0KFwiJHtleHByLnZhbHVlLm1vZHVsZU5hbWV9XCIsICR7ZXhwci52YWx1ZS5uYW1lfSlgO1xuICAgIH0gZWxzZSBpZiAoZXhwciBpbnN0YW5jZW9mIG8uUmVhZFZhckV4cHIpIHtcbiAgICAgIHJldHVybiBgcmVhZCgke2V4cHIubmFtZX0pYDtcbiAgICB9IGVsc2UgaWYgKGV4cHIgaW5zdGFuY2VvZiBvLlR5cGVvZkV4cHIpIHtcbiAgICAgIHJldHVybiBgdHlwZW9mKCR7dGhpcy5rZXlPZihleHByLmV4cHIpfSlgO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSBkb2VzIG5vdCBoYW5kbGUgZXhwcmVzc2lvbnMgb2YgdHlwZSAke2V4cHIuY29uc3RydWN0b3IubmFtZX1gKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNWYXJpYWJsZShlOiBvLkV4cHJlc3Npb24pOiBlIGlzIG8uUmVhZFZhckV4cHIge1xuICByZXR1cm4gZSBpbnN0YW5jZW9mIG8uUmVhZFZhckV4cHI7XG59XG5cbmZ1bmN0aW9uIGlzTG9uZ1N0cmluZ0xpdGVyYWwoZXhwcjogby5FeHByZXNzaW9uKTogYm9vbGVhbiB7XG4gIHJldHVybiBleHByIGluc3RhbmNlb2Ygby5MaXRlcmFsRXhwciAmJiB0eXBlb2YgZXhwci52YWx1ZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgIGV4cHIudmFsdWUubGVuZ3RoID49IFBPT0xfSU5DTFVTSU9OX0xFTkdUSF9USFJFU0hPTERfRk9SX1NUUklOR1M7XG59XG4iXX0=