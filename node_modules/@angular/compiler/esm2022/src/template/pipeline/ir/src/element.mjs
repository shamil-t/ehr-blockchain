/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { splitNsName } from '../../../../ml_parser/tags';
import * as o from '../../../../output/output_ast';
/**
 * Enumeration of the types of attributes which can be applied to an element.
 */
export var BindingKind;
(function (BindingKind) {
    /**
     * Static attributes.
     */
    BindingKind[BindingKind["Attribute"] = 0] = "Attribute";
    /**
     * Class bindings.
     */
    BindingKind[BindingKind["ClassName"] = 1] = "ClassName";
    /**
     * Style bindings.
     */
    BindingKind[BindingKind["StyleProperty"] = 2] = "StyleProperty";
    /**
     * Dynamic property bindings.
     */
    BindingKind[BindingKind["Property"] = 3] = "Property";
    /**
     * Property or attribute bindings on a template.
     */
    BindingKind[BindingKind["Template"] = 4] = "Template";
    /**
     * Internationalized attributes.
     */
    BindingKind[BindingKind["I18n"] = 5] = "I18n";
    /**
     * TODO: Consider how Animations are handled, and if they should be a distinct BindingKind.
     */
    BindingKind[BindingKind["Animation"] = 6] = "Animation";
})(BindingKind || (BindingKind = {}));
const FLYWEIGHT_ARRAY = Object.freeze([]);
/**
 * Container for all of the various kinds of attributes which are applied on an element.
 */
export class ElementAttributes {
    constructor() {
        this.known = new Set();
        this.byKind = new Map;
        this.projectAs = null;
    }
    get attributes() {
        return this.byKind.get(BindingKind.Attribute) ?? FLYWEIGHT_ARRAY;
    }
    get classes() {
        return this.byKind.get(BindingKind.ClassName) ?? FLYWEIGHT_ARRAY;
    }
    get styles() {
        return this.byKind.get(BindingKind.StyleProperty) ?? FLYWEIGHT_ARRAY;
    }
    get bindings() {
        return this.byKind.get(BindingKind.Property) ?? FLYWEIGHT_ARRAY;
    }
    get template() {
        return this.byKind.get(BindingKind.Template) ?? FLYWEIGHT_ARRAY;
    }
    get i18n() {
        return this.byKind.get(BindingKind.I18n) ?? FLYWEIGHT_ARRAY;
    }
    add(kind, name, value) {
        if (this.known.has(name)) {
            return;
        }
        this.known.add(name);
        const array = this.arrayFor(kind);
        array.push(...getAttributeNameLiterals(name));
        if (kind === BindingKind.Attribute || kind === BindingKind.StyleProperty) {
            if (value === null) {
                throw Error('Attribute & style element attributes must have a value');
            }
            array.push(value);
        }
    }
    arrayFor(kind) {
        if (!this.byKind.has(kind)) {
            this.byKind.set(kind, []);
        }
        return this.byKind.get(kind);
    }
}
function getAttributeNameLiterals(name) {
    const [attributeNamespace, attributeName] = splitNsName(name);
    const nameLiteral = o.literal(attributeName);
    if (attributeNamespace) {
        return [
            o.literal(0 /* core.AttributeMarker.NamespaceURI */), o.literal(attributeNamespace), nameLiteral
        ];
    }
    return [nameLiteral];
}
export function assertIsElementAttributes(attrs) {
    if (!(attrs instanceof ElementAttributes)) {
        throw new Error(`AssertionError: ElementAttributes has already been coalesced into the view constants`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy90ZW1wbGF0ZS9waXBlbGluZS9pci9zcmMvZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDdkQsT0FBTyxLQUFLLENBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUVuRDs7R0FFRztBQUNILE1BQU0sQ0FBTixJQUFZLFdBbUNYO0FBbkNELFdBQVksV0FBVztJQUNyQjs7T0FFRztJQUNILHVEQUFTLENBQUE7SUFFVDs7T0FFRztJQUNILHVEQUFTLENBQUE7SUFFVDs7T0FFRztJQUNILCtEQUFhLENBQUE7SUFFYjs7T0FFRztJQUNILHFEQUFRLENBQUE7SUFFUjs7T0FFRztJQUNILHFEQUFRLENBQUE7SUFFUjs7T0FFRztJQUNILDZDQUFJLENBQUE7SUFFSjs7T0FFRztJQUNILHVEQUFTLENBQUE7QUFDWCxDQUFDLEVBbkNXLFdBQVcsS0FBWCxXQUFXLFFBbUN0QjtBQUVELE1BQU0sZUFBZSxHQUFnQyxNQUFNLENBQUMsTUFBTSxDQUFpQixFQUFFLENBQUMsQ0FBQztBQUV2Rjs7R0FFRztBQUNILE1BQU0sT0FBTyxpQkFBaUI7SUFBOUI7UUFDVSxVQUFLLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUMxQixXQUFNLEdBQUcsSUFBSSxHQUFnQyxDQUFDO1FBRXRELGNBQVMsR0FBZ0IsSUFBSSxDQUFDO0lBK0NoQyxDQUFDO0lBN0NDLElBQUksVUFBVTtRQUNaLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQWUsQ0FBQztJQUNuRSxDQUFDO0lBRUQsSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksZUFBZSxDQUFDO0lBQ25FLENBQUM7SUFFRCxJQUFJLE1BQU07UUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxlQUFlLENBQUM7SUFDdkUsQ0FBQztJQUVELElBQUksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLGVBQWUsQ0FBQztJQUNsRSxDQUFDO0lBRUQsSUFBSSxRQUFRO1FBQ1YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksZUFBZSxDQUFDO0lBQ2xFLENBQUM7SUFFRCxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxlQUFlLENBQUM7SUFDOUQsQ0FBQztJQUVELEdBQUcsQ0FBQyxJQUFpQixFQUFFLElBQVksRUFBRSxLQUF3QjtRQUMzRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3hCLE9BQU87U0FDUjtRQUNELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDOUMsSUFBSSxJQUFJLEtBQUssV0FBVyxDQUFDLFNBQVMsSUFBSSxJQUFJLEtBQUssV0FBVyxDQUFDLGFBQWEsRUFBRTtZQUN4RSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7Z0JBQ2xCLE1BQU0sS0FBSyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7YUFDdkU7WUFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ25CO0lBQ0gsQ0FBQztJQUVPLFFBQVEsQ0FBQyxJQUFpQjtRQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQzNCO1FBQ0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUUsQ0FBQztJQUNoQyxDQUFDO0NBQ0Y7QUFFRCxTQUFTLHdCQUF3QixDQUFDLElBQVk7SUFDNUMsTUFBTSxDQUFDLGtCQUFrQixFQUFFLGFBQWEsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5RCxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRTdDLElBQUksa0JBQWtCLEVBQUU7UUFDdEIsT0FBTztZQUNMLENBQUMsQ0FBQyxPQUFPLDJDQUFtQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsRUFBRSxXQUFXO1NBQ3pGLENBQUM7S0FDSDtJQUVELE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUN2QixDQUFDO0FBRUQsTUFBTSxVQUFVLHlCQUF5QixDQUFDLEtBQVU7SUFDbEQsSUFBSSxDQUFDLENBQUMsS0FBSyxZQUFZLGlCQUFpQixDQUFDLEVBQUU7UUFDekMsTUFBTSxJQUFJLEtBQUssQ0FDWCxzRkFBc0YsQ0FBQyxDQUFDO0tBQzdGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBjb3JlIGZyb20gJy4uLy4uLy4uLy4uL2NvcmUnO1xuaW1wb3J0IHtzcGxpdE5zTmFtZX0gZnJvbSAnLi4vLi4vLi4vLi4vbWxfcGFyc2VyL3RhZ3MnO1xuaW1wb3J0ICogYXMgbyBmcm9tICcuLi8uLi8uLi8uLi9vdXRwdXQvb3V0cHV0X2FzdCc7XG5cbi8qKlxuICogRW51bWVyYXRpb24gb2YgdGhlIHR5cGVzIG9mIGF0dHJpYnV0ZXMgd2hpY2ggY2FuIGJlIGFwcGxpZWQgdG8gYW4gZWxlbWVudC5cbiAqL1xuZXhwb3J0IGVudW0gQmluZGluZ0tpbmQge1xuICAvKipcbiAgICogU3RhdGljIGF0dHJpYnV0ZXMuXG4gICAqL1xuICBBdHRyaWJ1dGUsXG5cbiAgLyoqXG4gICAqIENsYXNzIGJpbmRpbmdzLlxuICAgKi9cbiAgQ2xhc3NOYW1lLFxuXG4gIC8qKlxuICAgKiBTdHlsZSBiaW5kaW5ncy5cbiAgICovXG4gIFN0eWxlUHJvcGVydHksXG5cbiAgLyoqXG4gICAqIER5bmFtaWMgcHJvcGVydHkgYmluZGluZ3MuXG4gICAqL1xuICBQcm9wZXJ0eSxcblxuICAvKipcbiAgICogUHJvcGVydHkgb3IgYXR0cmlidXRlIGJpbmRpbmdzIG9uIGEgdGVtcGxhdGUuXG4gICAqL1xuICBUZW1wbGF0ZSxcblxuICAvKipcbiAgICogSW50ZXJuYXRpb25hbGl6ZWQgYXR0cmlidXRlcy5cbiAgICovXG4gIEkxOG4sXG5cbiAgLyoqXG4gICAqIFRPRE86IENvbnNpZGVyIGhvdyBBbmltYXRpb25zIGFyZSBoYW5kbGVkLCBhbmQgaWYgdGhleSBzaG91bGQgYmUgYSBkaXN0aW5jdCBCaW5kaW5nS2luZC5cbiAgICovXG4gIEFuaW1hdGlvbixcbn1cblxuY29uc3QgRkxZV0VJR0hUX0FSUkFZOiBSZWFkb25seUFycmF5PG8uRXhwcmVzc2lvbj4gPSBPYmplY3QuZnJlZXplPG8uRXhwcmVzc2lvbltdPihbXSk7XG5cbi8qKlxuICogQ29udGFpbmVyIGZvciBhbGwgb2YgdGhlIHZhcmlvdXMga2luZHMgb2YgYXR0cmlidXRlcyB3aGljaCBhcmUgYXBwbGllZCBvbiBhbiBlbGVtZW50LlxuICovXG5leHBvcnQgY2xhc3MgRWxlbWVudEF0dHJpYnV0ZXMge1xuICBwcml2YXRlIGtub3duID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHByaXZhdGUgYnlLaW5kID0gbmV3IE1hcDxCaW5kaW5nS2luZCwgby5FeHByZXNzaW9uW10+O1xuXG4gIHByb2plY3RBczogc3RyaW5nfG51bGwgPSBudWxsO1xuXG4gIGdldCBhdHRyaWJ1dGVzKCk6IFJlYWRvbmx5QXJyYXk8by5FeHByZXNzaW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuYnlLaW5kLmdldChCaW5kaW5nS2luZC5BdHRyaWJ1dGUpID8/IEZMWVdFSUdIVF9BUlJBWTtcbiAgfVxuXG4gIGdldCBjbGFzc2VzKCk6IFJlYWRvbmx5QXJyYXk8by5FeHByZXNzaW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuYnlLaW5kLmdldChCaW5kaW5nS2luZC5DbGFzc05hbWUpID8/IEZMWVdFSUdIVF9BUlJBWTtcbiAgfVxuXG4gIGdldCBzdHlsZXMoKTogUmVhZG9ubHlBcnJheTxvLkV4cHJlc3Npb24+IHtcbiAgICByZXR1cm4gdGhpcy5ieUtpbmQuZ2V0KEJpbmRpbmdLaW5kLlN0eWxlUHJvcGVydHkpID8/IEZMWVdFSUdIVF9BUlJBWTtcbiAgfVxuXG4gIGdldCBiaW5kaW5ncygpOiBSZWFkb25seUFycmF5PG8uRXhwcmVzc2lvbj4ge1xuICAgIHJldHVybiB0aGlzLmJ5S2luZC5nZXQoQmluZGluZ0tpbmQuUHJvcGVydHkpID8/IEZMWVdFSUdIVF9BUlJBWTtcbiAgfVxuXG4gIGdldCB0ZW1wbGF0ZSgpOiBSZWFkb25seUFycmF5PG8uRXhwcmVzc2lvbj4ge1xuICAgIHJldHVybiB0aGlzLmJ5S2luZC5nZXQoQmluZGluZ0tpbmQuVGVtcGxhdGUpID8/IEZMWVdFSUdIVF9BUlJBWTtcbiAgfVxuXG4gIGdldCBpMThuKCk6IFJlYWRvbmx5QXJyYXk8by5FeHByZXNzaW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuYnlLaW5kLmdldChCaW5kaW5nS2luZC5JMThuKSA/PyBGTFlXRUlHSFRfQVJSQVk7XG4gIH1cblxuICBhZGQoa2luZDogQmluZGluZ0tpbmQsIG5hbWU6IHN0cmluZywgdmFsdWU6IG8uRXhwcmVzc2lvbnxudWxsKTogdm9pZCB7XG4gICAgaWYgKHRoaXMua25vd24uaGFzKG5hbWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMua25vd24uYWRkKG5hbWUpO1xuICAgIGNvbnN0IGFycmF5ID0gdGhpcy5hcnJheUZvcihraW5kKTtcbiAgICBhcnJheS5wdXNoKC4uLmdldEF0dHJpYnV0ZU5hbWVMaXRlcmFscyhuYW1lKSk7XG4gICAgaWYgKGtpbmQgPT09IEJpbmRpbmdLaW5kLkF0dHJpYnV0ZSB8fCBraW5kID09PSBCaW5kaW5nS2luZC5TdHlsZVByb3BlcnR5KSB7XG4gICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ0F0dHJpYnV0ZSAmIHN0eWxlIGVsZW1lbnQgYXR0cmlidXRlcyBtdXN0IGhhdmUgYSB2YWx1ZScpO1xuICAgICAgfVxuICAgICAgYXJyYXkucHVzaCh2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhcnJheUZvcihraW5kOiBCaW5kaW5nS2luZCk6IG8uRXhwcmVzc2lvbltdIHtcbiAgICBpZiAoIXRoaXMuYnlLaW5kLmhhcyhraW5kKSkge1xuICAgICAgdGhpcy5ieUtpbmQuc2V0KGtpbmQsIFtdKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYnlLaW5kLmdldChraW5kKSE7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlTmFtZUxpdGVyYWxzKG5hbWU6IHN0cmluZyk6IG8uTGl0ZXJhbEV4cHJbXSB7XG4gIGNvbnN0IFthdHRyaWJ1dGVOYW1lc3BhY2UsIGF0dHJpYnV0ZU5hbWVdID0gc3BsaXROc05hbWUobmFtZSk7XG4gIGNvbnN0IG5hbWVMaXRlcmFsID0gby5saXRlcmFsKGF0dHJpYnV0ZU5hbWUpO1xuXG4gIGlmIChhdHRyaWJ1dGVOYW1lc3BhY2UpIHtcbiAgICByZXR1cm4gW1xuICAgICAgby5saXRlcmFsKGNvcmUuQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSksIG8ubGl0ZXJhbChhdHRyaWJ1dGVOYW1lc3BhY2UpLCBuYW1lTGl0ZXJhbFxuICAgIF07XG4gIH1cblxuICByZXR1cm4gW25hbWVMaXRlcmFsXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydElzRWxlbWVudEF0dHJpYnV0ZXMoYXR0cnM6IGFueSk6IGFzc2VydHMgYXR0cnMgaXMgRWxlbWVudEF0dHJpYnV0ZXMge1xuICBpZiAoIShhdHRycyBpbnN0YW5jZW9mIEVsZW1lbnRBdHRyaWJ1dGVzKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEFzc2VydGlvbkVycm9yOiBFbGVtZW50QXR0cmlidXRlcyBoYXMgYWxyZWFkeSBiZWVuIGNvYWxlc2NlZCBpbnRvIHRoZSB2aWV3IGNvbnN0YW50c2ApO1xuICB9XG59XG4iXX0=