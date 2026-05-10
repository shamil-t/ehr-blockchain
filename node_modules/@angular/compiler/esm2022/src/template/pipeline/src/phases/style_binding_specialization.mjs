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
export function phaseStyleBindingSpecialization(cpl) {
    for (const unit of cpl.units) {
        for (const op of unit.update) {
            if (op.kind !== ir.OpKind.Binding) {
                continue;
            }
            switch (op.bindingKind) {
                case ir.BindingKind.ClassName:
                    if (op.expression instanceof ir.Interpolation) {
                        throw new Error(`Unexpected interpolation in ClassName binding`);
                    }
                    ir.OpList.replace(op, ir.createClassPropOp(op.target, op.name, op.expression, op.sourceSpan));
                    break;
                case ir.BindingKind.StyleProperty:
                    ir.OpList.replace(op, ir.createStylePropOp(op.target, op.name, op.expression, op.unit, op.sourceSpan));
                    break;
                case ir.BindingKind.Property:
                case ir.BindingKind.Template:
                    if (op.name === 'style') {
                        ir.OpList.replace(op, ir.createStyleMapOp(op.target, op.expression, op.sourceSpan));
                    }
                    else if (op.name === 'class') {
                        ir.OpList.replace(op, ir.createClassMapOp(op.target, op.expression, op.sourceSpan));
                    }
                    break;
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfYmluZGluZ19zcGVjaWFsaXphdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyL3NyYy90ZW1wbGF0ZS9waXBlbGluZS9zcmMvcGhhc2VzL3N0eWxlX2JpbmRpbmdfc3BlY2lhbGl6YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxLQUFLLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFHL0I7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLCtCQUErQixDQUFDLEdBQW1CO0lBQ2pFLEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtRQUM1QixLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDNUIsSUFBSSxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO2dCQUNqQyxTQUFTO2FBQ1Y7WUFFRCxRQUFRLEVBQUUsQ0FBQyxXQUFXLEVBQUU7Z0JBQ3RCLEtBQUssRUFBRSxDQUFDLFdBQVcsQ0FBQyxTQUFTO29CQUMzQixJQUFJLEVBQUUsQ0FBQyxVQUFVLFlBQVksRUFBRSxDQUFDLGFBQWEsRUFBRTt3QkFDN0MsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO3FCQUNsRTtvQkFDRCxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FDYixFQUFFLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUNoRixNQUFNO2dCQUNSLEtBQUssRUFBRSxDQUFDLFdBQVcsQ0FBQyxhQUFhO29CQUMvQixFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FDYixFQUFFLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBQ3pGLE1BQU07Z0JBQ1IsS0FBSyxFQUFFLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQztnQkFDN0IsS0FBSyxFQUFFLENBQUMsV0FBVyxDQUFDLFFBQVE7b0JBQzFCLElBQUksRUFBRSxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUU7d0JBQ3ZCLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUNiLEVBQUUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO3FCQUN2RTt5QkFBTSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFO3dCQUM5QixFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FDYixFQUFFLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztxQkFDdkU7b0JBQ0QsTUFBTTthQUNUO1NBQ0Y7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgbyBmcm9tICcuLi8uLi8uLi8uLi9vdXRwdXQvb3V0cHV0X2FzdCc7XG5pbXBvcnQgKiBhcyBpciBmcm9tICcuLi8uLi9pcic7XG5pbXBvcnQgdHlwZSB7Q29tcGlsYXRpb25Kb2J9IGZyb20gJy4uL2NvbXBpbGF0aW9uJztcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHNwZWNpYWwtY2FzZSBiaW5kaW5ncyB3aXRoICdzdHlsZScgb3IgJ2NsYXNzJyBpbiB0aGVpciBuYW1lcy4gTXVzdCBydW4gYmVmb3JlIHRoZVxuICogbWFpbiBiaW5kaW5nIHNwZWNpYWxpemF0aW9uIHBhc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwaGFzZVN0eWxlQmluZGluZ1NwZWNpYWxpemF0aW9uKGNwbDogQ29tcGlsYXRpb25Kb2IpOiB2b2lkIHtcbiAgZm9yIChjb25zdCB1bml0IG9mIGNwbC51bml0cykge1xuICAgIGZvciAoY29uc3Qgb3Agb2YgdW5pdC51cGRhdGUpIHtcbiAgICAgIGlmIChvcC5raW5kICE9PSBpci5PcEtpbmQuQmluZGluZykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoIChvcC5iaW5kaW5nS2luZCkge1xuICAgICAgICBjYXNlIGlyLkJpbmRpbmdLaW5kLkNsYXNzTmFtZTpcbiAgICAgICAgICBpZiAob3AuZXhwcmVzc2lvbiBpbnN0YW5jZW9mIGlyLkludGVycG9sYXRpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBpbnRlcnBvbGF0aW9uIGluIENsYXNzTmFtZSBiaW5kaW5nYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlyLk9wTGlzdC5yZXBsYWNlPGlyLlVwZGF0ZU9wPihcbiAgICAgICAgICAgICAgb3AsIGlyLmNyZWF0ZUNsYXNzUHJvcE9wKG9wLnRhcmdldCwgb3AubmFtZSwgb3AuZXhwcmVzc2lvbiwgb3Auc291cmNlU3BhbikpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIGlyLkJpbmRpbmdLaW5kLlN0eWxlUHJvcGVydHk6XG4gICAgICAgICAgaXIuT3BMaXN0LnJlcGxhY2U8aXIuVXBkYXRlT3A+KFxuICAgICAgICAgICAgICBvcCwgaXIuY3JlYXRlU3R5bGVQcm9wT3Aob3AudGFyZ2V0LCBvcC5uYW1lLCBvcC5leHByZXNzaW9uLCBvcC51bml0LCBvcC5zb3VyY2VTcGFuKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgaXIuQmluZGluZ0tpbmQuUHJvcGVydHk6XG4gICAgICAgIGNhc2UgaXIuQmluZGluZ0tpbmQuVGVtcGxhdGU6XG4gICAgICAgICAgaWYgKG9wLm5hbWUgPT09ICdzdHlsZScpIHtcbiAgICAgICAgICAgIGlyLk9wTGlzdC5yZXBsYWNlPGlyLlVwZGF0ZU9wPihcbiAgICAgICAgICAgICAgICBvcCwgaXIuY3JlYXRlU3R5bGVNYXBPcChvcC50YXJnZXQsIG9wLmV4cHJlc3Npb24sIG9wLnNvdXJjZVNwYW4pKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG9wLm5hbWUgPT09ICdjbGFzcycpIHtcbiAgICAgICAgICAgIGlyLk9wTGlzdC5yZXBsYWNlPGlyLlVwZGF0ZU9wPihcbiAgICAgICAgICAgICAgICBvcCwgaXIuY3JlYXRlQ2xhc3NNYXBPcChvcC50YXJnZXQsIG9wLmV4cHJlc3Npb24sIG9wLnNvdXJjZVNwYW4pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=