/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ir from '../../ir';
/**
 * Transforms special-case bindings with 'style' or 'class' in their names. Must run before the
 * main binding specialization pass.
 */
export function phaseNoListenersOnTemplates(job) {
    for (const unit of job.units) {
        let inTemplate = false;
        for (const op of unit.create) {
            switch (op.kind) {
                case ir.OpKind.Template:
                    inTemplate = true;
                    break;
                case ir.OpKind.ElementStart:
                case ir.OpKind.Element:
                case ir.OpKind.ContainerStart:
                case ir.OpKind.Container:
                    inTemplate = false;
                    break;
                case ir.OpKind.Listener:
                    if (inTemplate) {
                        ir.OpList.remove(op);
                    }
                    break;
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9fbGlzdGVuZXJzX29uX3RlbXBsYXRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy90ZW1wbGF0ZS9waXBlbGluZS9zcmMvcGhhc2VzL25vX2xpc3RlbmVyc19vbl90ZW1wbGF0ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxLQUFLLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFHL0I7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLDJCQUEyQixDQUFDLEdBQW1CO0lBQzdELEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtRQUM1QixJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDdkIsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQzVCLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRTtnQkFDZixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUTtvQkFDckIsVUFBVSxHQUFHLElBQUksQ0FBQztvQkFDbEIsTUFBTTtnQkFDUixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO2dCQUM1QixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO2dCQUN2QixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDO2dCQUM5QixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUztvQkFDdEIsVUFBVSxHQUFHLEtBQUssQ0FBQztvQkFDbkIsTUFBTTtnQkFDUixLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUTtvQkFDckIsSUFBSSxVQUFVLEVBQUU7d0JBQ2QsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQWMsRUFBRSxDQUFDLENBQUM7cUJBQ25DO29CQUNELE1BQU07YUFDVDtTQUNGO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vLi4vLi4vLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0ICogYXMgaXIgZnJvbSAnLi4vLi4vaXInO1xuaW1wb3J0IHR5cGUge0NvbXBpbGF0aW9uSm9ifSBmcm9tICcuLi9jb21waWxhdGlvbic7XG5cbi8qKlxuICogVHJhbnNmb3JtcyBzcGVjaWFsLWNhc2UgYmluZGluZ3Mgd2l0aCAnc3R5bGUnIG9yICdjbGFzcycgaW4gdGhlaXIgbmFtZXMuIE11c3QgcnVuIGJlZm9yZSB0aGVcbiAqIG1haW4gYmluZGluZyBzcGVjaWFsaXphdGlvbiBwYXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGhhc2VOb0xpc3RlbmVyc09uVGVtcGxhdGVzKGpvYjogQ29tcGlsYXRpb25Kb2IpOiB2b2lkIHtcbiAgZm9yIChjb25zdCB1bml0IG9mIGpvYi51bml0cykge1xuICAgIGxldCBpblRlbXBsYXRlID0gZmFsc2U7XG4gICAgZm9yIChjb25zdCBvcCBvZiB1bml0LmNyZWF0ZSkge1xuICAgICAgc3dpdGNoIChvcC5raW5kKSB7XG4gICAgICAgIGNhc2UgaXIuT3BLaW5kLlRlbXBsYXRlOlxuICAgICAgICAgIGluVGVtcGxhdGUgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIGlyLk9wS2luZC5FbGVtZW50U3RhcnQ6XG4gICAgICAgIGNhc2UgaXIuT3BLaW5kLkVsZW1lbnQ6XG4gICAgICAgIGNhc2UgaXIuT3BLaW5kLkNvbnRhaW5lclN0YXJ0OlxuICAgICAgICBjYXNlIGlyLk9wS2luZC5Db250YWluZXI6XG4gICAgICAgICAgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIGlyLk9wS2luZC5MaXN0ZW5lcjpcbiAgICAgICAgICBpZiAoaW5UZW1wbGF0ZSkge1xuICAgICAgICAgICAgaXIuT3BMaXN0LnJlbW92ZTxpci5DcmVhdGVPcD4ob3ApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==