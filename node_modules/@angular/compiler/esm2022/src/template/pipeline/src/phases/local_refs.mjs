/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '../../../../output/output_ast';
import * as ir from '../../ir';
/**
 * Lifts local reference declarations on element-like structures within each view into an entry in
 * the `consts` array for the whole component.
 */
export function phaseLocalRefs(cpl) {
    for (const view of cpl.views.values()) {
        for (const op of view.create) {
            switch (op.kind) {
                case ir.OpKind.ElementStart:
                case ir.OpKind.Element:
                case ir.OpKind.Template:
                    if (!Array.isArray(op.localRefs)) {
                        throw new Error(`AssertionError: expected localRefs to be an array still`);
                    }
                    op.numSlotsUsed += op.localRefs.length;
                    if (op.localRefs.length > 0) {
                        const localRefs = serializeLocalRefs(op.localRefs);
                        op.localRefs = cpl.addConst(localRefs);
                    }
                    else {
                        op.localRefs = null;
                    }
                    break;
            }
        }
    }
}
function serializeLocalRefs(refs) {
    const constRefs = [];
    for (const ref of refs) {
        constRefs.push(o.literal(ref.name), o.literal(ref.target));
    }
    return o.literalArr(constRefs);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxfcmVmcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy90ZW1wbGF0ZS9waXBlbGluZS9zcmMvcGhhc2VzL2xvY2FsX3JlZnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxLQUFLLENBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNuRCxPQUFPLEtBQUssRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUkvQjs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUFDLEdBQTRCO0lBQ3pELEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRTtRQUNyQyxLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDNUIsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFO2dCQUNmLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUM7Z0JBQzVCLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7Z0JBQ3ZCLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRO29CQUNyQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUU7d0JBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMseURBQXlELENBQUMsQ0FBQztxQkFDNUU7b0JBQ0QsRUFBRSxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztvQkFFdkMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7d0JBQzNCLE1BQU0sU0FBUyxHQUFHLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQzt3QkFDbkQsRUFBRSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3FCQUN4Qzt5QkFBTTt3QkFDTCxFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztxQkFDckI7b0JBQ0QsTUFBTTthQUNUO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLElBQW1CO0lBQzdDLE1BQU0sU0FBUyxHQUFtQixFQUFFLENBQUM7SUFDckMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUU7UUFDdEIsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQzVEO0lBQ0QsT0FBTyxDQUFDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgbyBmcm9tICcuLi8uLi8uLi8uLi9vdXRwdXQvb3V0cHV0X2FzdCc7XG5pbXBvcnQgKiBhcyBpciBmcm9tICcuLi8uLi9pcic7XG5cbmltcG9ydCB0eXBlIHtDb21wb25lbnRDb21waWxhdGlvbkpvYn0gZnJvbSAnLi4vY29tcGlsYXRpb24nO1xuXG4vKipcbiAqIExpZnRzIGxvY2FsIHJlZmVyZW5jZSBkZWNsYXJhdGlvbnMgb24gZWxlbWVudC1saWtlIHN0cnVjdHVyZXMgd2l0aGluIGVhY2ggdmlldyBpbnRvIGFuIGVudHJ5IGluXG4gKiB0aGUgYGNvbnN0c2AgYXJyYXkgZm9yIHRoZSB3aG9sZSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaGFzZUxvY2FsUmVmcyhjcGw6IENvbXBvbmVudENvbXBpbGF0aW9uSm9iKTogdm9pZCB7XG4gIGZvciAoY29uc3QgdmlldyBvZiBjcGwudmlld3MudmFsdWVzKCkpIHtcbiAgICBmb3IgKGNvbnN0IG9wIG9mIHZpZXcuY3JlYXRlKSB7XG4gICAgICBzd2l0Y2ggKG9wLmtpbmQpIHtcbiAgICAgICAgY2FzZSBpci5PcEtpbmQuRWxlbWVudFN0YXJ0OlxuICAgICAgICBjYXNlIGlyLk9wS2luZC5FbGVtZW50OlxuICAgICAgICBjYXNlIGlyLk9wS2luZC5UZW1wbGF0ZTpcbiAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkob3AubG9jYWxSZWZzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NlcnRpb25FcnJvcjogZXhwZWN0ZWQgbG9jYWxSZWZzIHRvIGJlIGFuIGFycmF5IHN0aWxsYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIG9wLm51bVNsb3RzVXNlZCArPSBvcC5sb2NhbFJlZnMubGVuZ3RoO1xuXG4gICAgICAgICAgaWYgKG9wLmxvY2FsUmVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBsb2NhbFJlZnMgPSBzZXJpYWxpemVMb2NhbFJlZnMob3AubG9jYWxSZWZzKTtcbiAgICAgICAgICAgIG9wLmxvY2FsUmVmcyA9IGNwbC5hZGRDb25zdChsb2NhbFJlZnMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcC5sb2NhbFJlZnMgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VyaWFsaXplTG9jYWxSZWZzKHJlZnM6IGlyLkxvY2FsUmVmW10pOiBvLkV4cHJlc3Npb24ge1xuICBjb25zdCBjb25zdFJlZnM6IG8uRXhwcmVzc2lvbltdID0gW107XG4gIGZvciAoY29uc3QgcmVmIG9mIHJlZnMpIHtcbiAgICBjb25zdFJlZnMucHVzaChvLmxpdGVyYWwocmVmLm5hbWUpLCBvLmxpdGVyYWwocmVmLnRhcmdldCkpO1xuICB9XG4gIHJldHVybiBvLmxpdGVyYWxBcnIoY29uc3RSZWZzKTtcbn1cbiJdfQ==