/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { invalidCssUnitValue } from '../../error_helpers';
import { dashCaseToCamelCase } from '../../util';
import { AnimationStyleNormalizer } from './animation_style_normalizer';
const DIMENSIONAL_PROP_SET = new Set([
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'left',
    'top',
    'bottom',
    'right',
    'fontSize',
    'outlineWidth',
    'outlineOffset',
    'paddingTop',
    'paddingLeft',
    'paddingBottom',
    'paddingRight',
    'marginTop',
    'marginLeft',
    'marginBottom',
    'marginRight',
    'borderRadius',
    'borderWidth',
    'borderTopWidth',
    'borderLeftWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'textIndent',
    'perspective'
]);
export class WebAnimationsStyleNormalizer extends AnimationStyleNormalizer {
    normalizePropertyName(propertyName, errors) {
        return dashCaseToCamelCase(propertyName);
    }
    normalizeStyleValue(userProvidedProperty, normalizedProperty, value, errors) {
        let unit = '';
        const strVal = value.toString().trim();
        if (DIMENSIONAL_PROP_SET.has(normalizedProperty) && value !== 0 && value !== '0') {
            if (typeof value === 'number') {
                unit = 'px';
            }
            else {
                const valAndSuffixMatch = value.match(/^[+-]?[\d\.]+([a-z]*)$/);
                if (valAndSuffixMatch && valAndSuffixMatch[1].length == 0) {
                    errors.push(invalidCssUnitValue(userProvidedProperty, value));
                }
            }
        }
        return strVal + unit;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViX2FuaW1hdGlvbnNfc3R5bGVfbm9ybWFsaXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuaW1hdGlvbnMvYnJvd3Nlci9zcmMvZHNsL3N0eWxlX25vcm1hbGl6YXRpb24vd2ViX2FuaW1hdGlvbnNfc3R5bGVfbm9ybWFsaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFL0MsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFdEUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsQ0FBQztJQUNuQyxPQUFPO0lBQ1AsUUFBUTtJQUNSLFVBQVU7SUFDVixXQUFXO0lBQ1gsVUFBVTtJQUNWLFdBQVc7SUFDWCxNQUFNO0lBQ04sS0FBSztJQUNMLFFBQVE7SUFDUixPQUFPO0lBQ1AsVUFBVTtJQUNWLGNBQWM7SUFDZCxlQUFlO0lBQ2YsWUFBWTtJQUNaLGFBQWE7SUFDYixlQUFlO0lBQ2YsY0FBYztJQUNkLFdBQVc7SUFDWCxZQUFZO0lBQ1osY0FBYztJQUNkLGFBQWE7SUFDYixjQUFjO0lBQ2QsYUFBYTtJQUNiLGdCQUFnQjtJQUNoQixpQkFBaUI7SUFDakIsa0JBQWtCO0lBQ2xCLG1CQUFtQjtJQUNuQixZQUFZO0lBQ1osYUFBYTtDQUNkLENBQUMsQ0FBQztBQUVILE1BQU0sT0FBTyw0QkFBNkIsU0FBUSx3QkFBd0I7SUFDL0QscUJBQXFCLENBQUMsWUFBb0IsRUFBRSxNQUFlO1FBQ2xFLE9BQU8sbUJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVRLG1CQUFtQixDQUN4QixvQkFBNEIsRUFBRSxrQkFBMEIsRUFBRSxLQUFvQixFQUM5RSxNQUFlO1FBQ2pCLElBQUksSUFBSSxHQUFXLEVBQUUsQ0FBQztRQUN0QixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFdkMsSUFBSSxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLEtBQUssS0FBSyxHQUFHLEVBQUU7WUFDaEYsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7Z0JBQzdCLElBQUksR0FBRyxJQUFJLENBQUM7YUFDYjtpQkFBTTtnQkFDTCxNQUFNLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO29CQUN6RCxNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7aUJBQy9EO2FBQ0Y7U0FDRjtRQUNELE9BQU8sTUFBTSxHQUFHLElBQUksQ0FBQztJQUN2QixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7aW52YWxpZENzc1VuaXRWYWx1ZX0gZnJvbSAnLi4vLi4vZXJyb3JfaGVscGVycyc7XG5pbXBvcnQge2Rhc2hDYXNlVG9DYW1lbENhc2V9IGZyb20gJy4uLy4uL3V0aWwnO1xuXG5pbXBvcnQge0FuaW1hdGlvblN0eWxlTm9ybWFsaXplcn0gZnJvbSAnLi9hbmltYXRpb25fc3R5bGVfbm9ybWFsaXplcic7XG5cbmNvbnN0IERJTUVOU0lPTkFMX1BST1BfU0VUID0gbmV3IFNldChbXG4gICd3aWR0aCcsXG4gICdoZWlnaHQnLFxuICAnbWluV2lkdGgnLFxuICAnbWluSGVpZ2h0JyxcbiAgJ21heFdpZHRoJyxcbiAgJ21heEhlaWdodCcsXG4gICdsZWZ0JyxcbiAgJ3RvcCcsXG4gICdib3R0b20nLFxuICAncmlnaHQnLFxuICAnZm9udFNpemUnLFxuICAnb3V0bGluZVdpZHRoJyxcbiAgJ291dGxpbmVPZmZzZXQnLFxuICAncGFkZGluZ1RvcCcsXG4gICdwYWRkaW5nTGVmdCcsXG4gICdwYWRkaW5nQm90dG9tJyxcbiAgJ3BhZGRpbmdSaWdodCcsXG4gICdtYXJnaW5Ub3AnLFxuICAnbWFyZ2luTGVmdCcsXG4gICdtYXJnaW5Cb3R0b20nLFxuICAnbWFyZ2luUmlnaHQnLFxuICAnYm9yZGVyUmFkaXVzJyxcbiAgJ2JvcmRlcldpZHRoJyxcbiAgJ2JvcmRlclRvcFdpZHRoJyxcbiAgJ2JvcmRlckxlZnRXaWR0aCcsXG4gICdib3JkZXJSaWdodFdpZHRoJyxcbiAgJ2JvcmRlckJvdHRvbVdpZHRoJyxcbiAgJ3RleHRJbmRlbnQnLFxuICAncGVyc3BlY3RpdmUnXG5dKTtcblxuZXhwb3J0IGNsYXNzIFdlYkFuaW1hdGlvbnNTdHlsZU5vcm1hbGl6ZXIgZXh0ZW5kcyBBbmltYXRpb25TdHlsZU5vcm1hbGl6ZXIge1xuICBvdmVycmlkZSBub3JtYWxpemVQcm9wZXJ0eU5hbWUocHJvcGVydHlOYW1lOiBzdHJpbmcsIGVycm9yczogRXJyb3JbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGRhc2hDYXNlVG9DYW1lbENhc2UocHJvcGVydHlOYW1lKTtcbiAgfVxuXG4gIG92ZXJyaWRlIG5vcm1hbGl6ZVN0eWxlVmFsdWUoXG4gICAgICB1c2VyUHJvdmlkZWRQcm9wZXJ0eTogc3RyaW5nLCBub3JtYWxpemVkUHJvcGVydHk6IHN0cmluZywgdmFsdWU6IHN0cmluZ3xudW1iZXIsXG4gICAgICBlcnJvcnM6IEVycm9yW10pOiBzdHJpbmcge1xuICAgIGxldCB1bml0OiBzdHJpbmcgPSAnJztcbiAgICBjb25zdCBzdHJWYWwgPSB2YWx1ZS50b1N0cmluZygpLnRyaW0oKTtcblxuICAgIGlmIChESU1FTlNJT05BTF9QUk9QX1NFVC5oYXMobm9ybWFsaXplZFByb3BlcnR5KSAmJiB2YWx1ZSAhPT0gMCAmJiB2YWx1ZSAhPT0gJzAnKSB7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICB1bml0ID0gJ3B4JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZhbEFuZFN1ZmZpeE1hdGNoID0gdmFsdWUubWF0Y2goL15bKy1dP1tcXGRcXC5dKyhbYS16XSopJC8pO1xuICAgICAgICBpZiAodmFsQW5kU3VmZml4TWF0Y2ggJiYgdmFsQW5kU3VmZml4TWF0Y2hbMV0ubGVuZ3RoID09IDApIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChpbnZhbGlkQ3NzVW5pdFZhbHVlKHVzZXJQcm92aWRlZFByb3BlcnR5LCB2YWx1ZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHJWYWwgKyB1bml0O1xuICB9XG59XG4iXX0=