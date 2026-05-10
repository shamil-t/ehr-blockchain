/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { sanitizeIdentifier } from '../../../../parse_util';
import { hyphenate } from '../../../../render3/view/style_parser';
import * as ir from '../../ir';
import { ViewCompilationUnit } from '../compilation';
import { prefixWithNamespace } from '../conversion';
/**
 * Generate names for functions and variables across all views.
 *
 * This includes propagating those names into any `ir.ReadVariableExpr`s of those variables, so that
 * the reads can be emitted correctly.
 */
export function phaseNaming(cpl) {
    addNamesToView(cpl.root, cpl.componentName, { index: 0 }, cpl.compatibility === ir.CompatibilityMode.TemplateDefinitionBuilder);
}
function addNamesToView(unit, baseName, state, compatibility) {
    if (unit.fnName === null) {
        unit.fnName = sanitizeIdentifier(`${baseName}_${unit.job.fnSuffix}`);
    }
    // Keep track of the names we assign to variables in the view. We'll need to propagate these
    // into reads of those variables afterwards.
    const varNames = new Map();
    for (const op of unit.ops()) {
        switch (op.kind) {
            case ir.OpKind.Property:
                if (op.isAnimationTrigger) {
                    op.name = '@' + op.name;
                }
                break;
            case ir.OpKind.Listener:
                if (op.handlerFnName === null) {
                    if (op.slot === null) {
                        throw new Error(`Expected a slot to be assigned`);
                    }
                    const safeTagName = op.tag.replace('-', '_');
                    if (op.isAnimationListener) {
                        op.handlerFnName = sanitizeIdentifier(`${unit.fnName}_${safeTagName}_animation_${op.name}_${op.animationPhase}_${op.slot}_listener`);
                        op.name = `@${op.name}.${op.animationPhase}`;
                    }
                    else {
                        op.handlerFnName =
                            sanitizeIdentifier(`${unit.fnName}_${safeTagName}_${op.name}_${op.slot}_listener`);
                    }
                }
                break;
            case ir.OpKind.Variable:
                varNames.set(op.xref, getVariableName(op.variable, state));
                break;
            case ir.OpKind.Template:
                if (!(unit instanceof ViewCompilationUnit)) {
                    throw new Error(`AssertionError: must be compiling a component`);
                }
                const childView = unit.job.views.get(op.xref);
                if (op.slot === null) {
                    throw new Error(`Expected slot to be assigned`);
                }
                addNamesToView(childView, `${baseName}_${prefixWithNamespace(op.tag, op.namespace)}_${op.slot}`, state, compatibility);
                break;
            case ir.OpKind.StyleProp:
                op.name = normalizeStylePropName(op.name);
                if (compatibility) {
                    op.name = stripImportant(op.name);
                }
                break;
            case ir.OpKind.ClassProp:
                if (compatibility) {
                    op.name = stripImportant(op.name);
                }
                break;
        }
    }
    // Having named all variables declared in the view, now we can push those names into the
    // `ir.ReadVariableExpr` expressions which represent reads of those variables.
    for (const op of unit.ops()) {
        ir.visitExpressionsInOp(op, expr => {
            if (!(expr instanceof ir.ReadVariableExpr) || expr.name !== null) {
                return;
            }
            if (!varNames.has(expr.xref)) {
                throw new Error(`Variable ${expr.xref} not yet named`);
            }
            expr.name = varNames.get(expr.xref);
        });
    }
}
function getVariableName(variable, state) {
    if (variable.name === null) {
        switch (variable.kind) {
            case ir.SemanticVariableKind.Context:
                variable.name = `ctx_r${state.index++}`;
                break;
            case ir.SemanticVariableKind.Identifier:
                variable.name = `${variable.identifier}_${state.index++}`;
                break;
            default:
                variable.name = `_r${state.index++}`;
                break;
        }
    }
    return variable.name;
}
/**
 * Normalizes a style prop name by hyphenating it (unless its a CSS variable).
 */
function normalizeStylePropName(name) {
    return name.startsWith('--') ? name : hyphenate(name);
}
/**
 * Strips `!important` out of the given style or class name.
 */
function stripImportant(name) {
    const importantIndex = name.indexOf('!important');
    if (importantIndex > -1) {
        return name.substring(0, importantIndex);
    }
    return name;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFtaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3RlbXBsYXRlL3BpcGVsaW5lL3NyYy9waGFzZXMvbmFtaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSx1Q0FBdUMsQ0FBQztBQUNoRSxPQUFPLEtBQUssRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUMvQixPQUFPLEVBQUMsbUJBQW1CLEVBQTRDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUYsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRWxEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FBQyxHQUFtQjtJQUM3QyxjQUFjLENBQ1YsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsYUFBYSxFQUFFLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBQyxFQUN2QyxHQUFHLENBQUMsYUFBYSxLQUFLLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQzVFLENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FDbkIsSUFBcUIsRUFBRSxRQUFnQixFQUFFLEtBQXNCLEVBQUUsYUFBc0I7SUFDekYsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksRUFBRTtRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLGtCQUFrQixDQUFDLEdBQUcsUUFBUSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztLQUN0RTtJQUVELDRGQUE0RjtJQUM1Riw0Q0FBNEM7SUFDNUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7SUFFOUMsS0FBSyxNQUFNLEVBQUUsSUFBSSxJ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SyxFQUFFLEVBQUUsQ0FBQztnQkFDckMsTUFBTTtTQUNUO0tBQ0Y7SUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7QUFDdkIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxzQkFBc0IsQ0FBQyxJQUFZO0lBQzFDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxjQUFjLENBQUMsSUFBWTtJQUNsQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ2xELElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQyxFQUFFO1FBQ3ZCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7S0FDMUM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtzYW5pdGl6ZUlkZW50aWZpZXJ9IGZyb20gJy4uLy4uLy4uLy4uL3BhcnNlX3V0aWwnO1xuaW1wb3J0IHtoeXBoZW5hdGV9IGZyb20gJy4uLy4uLy4uLy4uL3JlbmRlcjMvdmlldy9zdHlsZV9wYXJzZXInO1xuaW1wb3J0ICogYXMgaXIgZnJvbSAnLi4vLi4vaXInO1xuaW1wb3J0IHtWaWV3Q29tcGlsYXRpb25Vbml0LCB0eXBlIENvbXBpbGF0aW9uSm9iLCB0eXBlIENvbXBpbGF0aW9uVW5pdH0gZnJvbSAnLi4vY29tcGlsYXRpb24nO1xuaW1wb3J0IHtwcmVmaXhXaXRoTmFtZXNwYWNlfSBmcm9tICcuLi9jb252ZXJzaW9uJztcblxuLyoqXG4gKiBHZW5lcmF0ZSBuYW1lcyBmb3IgZnVuY3Rpb25zIGFuZCB2YXJpYWJsZXMgYWNyb3NzIGFsbCB2aWV3cy5cbiAqXG4gKiBUaGlzIGluY2x1ZGVzIHByb3BhZ2F0aW5nIHRob3NlIG5hbWVzIGludG8gYW55IGBpci5SZWFkVmFyaWFibGVFeHByYHMgb2YgdGhvc2UgdmFyaWFibGVzLCBzbyB0aGF0XG4gKiB0aGUgcmVhZHMgY2FuIGJlIGVtaXR0ZWQgY29ycmVjdGx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGhhc2VOYW1pbmcoY3BsOiBDb21waWxhdGlvbkpvYik6IHZvaWQge1xuICBhZGROYW1lc1RvVmlldyhcbiAgICAgIGNwbC5yb290LCBjcGwuY29tcG9uZW50TmFtZSwge2luZGV4OiAwfSxcbiAgICAgIGNwbC5jb21wYXRpYmlsaXR5ID09PSBpci5Db21wYXRpYmlsaXR5TW9kZS5UZW1wbGF0ZURlZmluaXRpb25CdWlsZGVyKTtcbn1cblxuZnVuY3Rpb24gYWRkTmFtZXNUb1ZpZXcoXG4gICAgdW5pdDogQ29tcGlsYXRpb25Vbml0LCBiYXNlTmFtZTogc3RyaW5nLCBzdGF0ZToge2luZGV4OiBudW1iZXJ9LCBjb21wYXRpYmlsaXR5OiBib29sZWFuKTogdm9pZCB7XG4gIGlmICh1bml0LmZuTmFtZSA9PT0gbnVsbCkge1xuICAgIHVuaXQuZm5OYW1lID0gc2FuaXRpemVJZGVudGlmaWVyKGAke2Jhc2VOYW1lfV8ke3VuaXQuam9iLmZuU3VmZml4fWApO1xuICB9XG5cbiAgLy8gS2VlcCB0cmFjayBvZiB0aGUgbmFtZXMgd2UgYXNzaWduIHRvIHZhcmlhYmxlcyBpbiB0aGUgdmlldy4gV2UnbGwgbmVlZCB0byBwcm9wYWdhdGUgdGhlc2VcbiAgLy8gaW50byByZWFkcyBvZiB0aG9zZSB2YXJpYWJsZXMgYWZ0ZXJ3YXJkcy5cbiAgY29uc3QgdmFyTmFtZXMgPSBuZXcgTWFwPGlyLlhyZWZJZCwgc3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3Qgb3Agb2YgdW5pdC5vcHMoKSkge1xuICAgIHN3aXRjaCAob3Aua2luZCkge1xuICAgICAgY2FzZSBpci5PcEtpbmQuUHJvcGVydHk6XG4gICAgICAgIGlmIChvcC5pc0FuaW1hdGlvblRyaWdnZXIpIHtcbiAgICAgICAgICBvcC5uYW1lID0gJ0AnICsgb3AubmFtZTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgaXIuT3BLaW5kLkxpc3RlbmVyOlxuICAgICAgICBpZiAob3AuaGFuZGxlckZuTmFtZSA9PT0gbnVsbCkge1xuICAgICAgICAgIGlmIChvcC5zbG90ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGEgc2xvdCB0byBiZSBhc3NpZ25lZGApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBzYWZlVGFnTmFtZSA9IG9wLnRhZy5yZXBsYWNlKCctJywgJ18nKTtcbiAgICAgICAgICBpZiAob3AuaXNBbmltYXRpb25MaXN0ZW5lcikge1xuICAgICAgICAgICAgb3AuaGFuZGxlckZuTmFtZSA9IHNhbml0aXplSWRlbnRpZmllcihgJHt1bml0LmZuTmFtZX1fJHtzYWZlVGFnTmFtZX1fYW5pbWF0aW9uXyR7XG4gICAgICAgICAgICAgICAgb3AubmFtZX1fJHtvcC5hbmltYXRpb25QaGFzZX1fJHtvcC5zbG90fV9saXN0ZW5lcmApO1xuICAgICAgICAgICAgb3AubmFtZSA9IGBAJHtvcC5uYW1lfS4ke29wLmFuaW1hdGlvblBoYXNlfWA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wLmhhbmRsZXJGbk5hbWUgPVxuICAgICAgICAgICAgICAgIHNhbml0aXplSWRlbnRpZmllcihgJHt1bml0LmZuTmFtZX1fJHtzYWZlVGFnTmFtZX1fJHtvcC5uYW1lfV8ke29wLnNsb3R9X2xpc3RlbmVyYCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBpci5PcEtpbmQuVmFyaWFibGU6XG4gICAgICAgIHZhck5hbWVzLnNldChvcC54cmVmLCBnZXRWYXJpYWJsZU5hbWUob3AudmFyaWFibGUsIHN0YXRlKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBpci5PcEtpbmQuVGVtcGxhdGU6XG4gICAgICAgIGlmICghKHVuaXQgaW5zdGFuY2VvZiBWaWV3Q29tcGlsYXRpb25Vbml0KSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXJ0aW9uRXJyb3I6IG11c3QgYmUgY29tcGlsaW5nIGEgY29tcG9uZW50YCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2hpbGRWaWV3ID0gdW5pdC5qb2Iudmlld3MuZ2V0KG9wLnhyZWYpITtcbiAgICAgICAgaWYgKG9wLnNsb3QgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHNsb3QgdG8gYmUgYXNzaWduZWRgKTtcbiAgICAgICAgfVxuICAgICAgICBhZGROYW1lc1RvVmlldyhcbiAgICAgICAgICAgIGNoaWxkVmlldywgYCR7YmFzZU5hbWV9XyR7cHJlZml4V2l0aE5hbWVzcGFjZShvcC50YWcsIG9wLm5hbWVzcGFjZSl9XyR7b3Auc2xvdH1gLCBzdGF0ZSxcbiAgICAgICAgICAgIGNvbXBhdGliaWxpdHkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgaXIuT3BLaW5kLlN0eWxlUHJvcDpcbiAgICAgICAgb3AubmFtZSA9IG5vcm1hbGl6ZVN0eWxlUHJvcE5hbWUob3AubmFtZSk7XG4gICAgICAgIGlmIChjb21wYXRpYmlsaXR5KSB7XG4gICAgICAgICAgb3AubmFtZSA9IHN0cmlwSW1wb3J0YW50KG9wLm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBpci5PcEtpbmQuQ2xhc3NQcm9wOlxuICAgICAgICBpZiAoY29tcGF0aWJpbGl0eSkge1xuICAgICAgICAgIG9wLm5hbWUgPSBzdHJpcEltcG9ydGFudChvcC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBIYXZpbmcgbmFtZWQgYWxsIHZhcmlhYmxlcyBkZWNsYXJlZCBpbiB0aGUgdmlldywgbm93IHdlIGNhbiBwdXNoIHRob3NlIG5hbWVzIGludG8gdGhlXG4gIC8vIGBpci5SZWFkVmFyaWFibGVFeHByYCBleHByZXNzaW9ucyB3aGljaCByZXByZXNlbnQgcmVhZHMgb2YgdGhvc2UgdmFyaWFibGVzLlxuICBmb3IgKGNvbnN0IG9wIG9mIHVuaXQub3BzKCkpIHtcbiAgICBpci52aXNpdEV4cHJlc3Npb25zSW5PcChvcCwgZXhwciA9PiB7XG4gICAgICBpZiAoIShleHByIGluc3RhbmNlb2YgaXIuUmVhZFZhcmlhYmxlRXhwcikgfHwgZXhwci5uYW1lICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghdmFyTmFtZXMuaGFzKGV4cHIueHJlZikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBWYXJpYWJsZSAke2V4cHIueHJlZn0gbm90IHlldCBuYW1lZGApO1xuICAgICAgfVxuICAgICAgZXhwci5uYW1lID0gdmFyTmFtZXMuZ2V0KGV4cHIueHJlZikhO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFZhcmlhYmxlTmFtZSh2YXJpYWJsZTogaXIuU2VtYW50aWNWYXJpYWJsZSwgc3RhdGU6IHtpbmRleDogbnVtYmVyfSk6IHN0cmluZyB7XG4gIGlmICh2YXJpYWJsZS5uYW1lID09PSBudWxsKSB7XG4gICAgc3dpdGNoICh2YXJpYWJsZS5raW5kKSB7XG4gICAgICBjYXNlIGlyLlNlbWFudGljVmFyaWFibGVLaW5kLkNvbnRleHQ6XG4gICAgICAgIHZhcmlhYmxlLm5hbWUgPSBgY3R4X3Ike3N0YXRlLmluZGV4Kyt9YDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGlyLlNlbWFudGljVmFyaWFibGVLaW5kLklkZW50aWZpZXI6XG4gICAgICAgIHZhcmlhYmxlLm5hbWUgPSBgJHt2YXJpYWJsZS5pZGVudGlmaWVyfV8ke3N0YXRlLmluZGV4Kyt9YDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXJpYWJsZS5uYW1lID0gYF9yJHtzdGF0ZS5pbmRleCsrfWA7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFyaWFibGUubmFtZTtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemVzIGEgc3R5bGUgcHJvcCBuYW1lIGJ5IGh5cGhlbmF0aW5nIGl0ICh1bmxlc3MgaXRzIGEgQ1NTIHZhcmlhYmxlKS5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplU3R5bGVQcm9wTmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgcmV0dXJuIG5hbWUuc3RhcnRzV2l0aCgnLS0nKSA/IG5hbWUgOiBoeXBoZW5hdGUobmFtZSk7XG59XG5cbi8qKlxuICogU3RyaXBzIGAhaW1wb3J0YW50YCBvdXQgb2YgdGhlIGdpdmVuIHN0eWxlIG9yIGNsYXNzIG5hbWUuXG4gKi9cbmZ1bmN0aW9uIHN0cmlwSW1wb3J0YW50KG5hbWU6IHN0cmluZykge1xuICBjb25zdCBpbXBvcnRhbnRJbmRleCA9IG5hbWUuaW5kZXhPZignIWltcG9ydGFudCcpO1xuICBpZiAoaW1wb3J0YW50SW5kZXggPiAtMSkge1xuICAgIHJldHVybiBuYW1lLnN1YnN0cmluZygwLCBpbXBvcnRhbnRJbmRleCk7XG4gIH1cbiAgcmV0dXJuIG5hbWU7XG59XG4iXX0=