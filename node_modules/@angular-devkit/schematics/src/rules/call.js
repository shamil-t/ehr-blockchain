"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.callRule = exports.callSource = exports.InvalidSourceResultException = exports.InvalidRuleResultException = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const interface_1 = require("../tree/interface");
function _getTypeOfResult(value) {
    if (value === undefined) {
        return 'undefined';
    }
    else if (value === null) {
        return 'null';
    }
    else if (typeof value == 'function') {
        return `Function()`;
    }
    else if (typeof value != 'object') {
        return `${typeof value}(${JSON.stringify(value)})`;
    }
    else {
        if (Object.getPrototypeOf(value) == Object) {
            return `Object(${JSON.stringify(value)})`;
        }
        else if (value.constructor) {
            return `Instance of class ${value.constructor.name}`;
        }
        else {
            return 'Unknown Object';
        }
    }
}
/**
 * When a rule or source returns an invalid value.
 */
class InvalidRuleResultException extends core_1.BaseException {
    constructor(value) {
        super(`Invalid rule result: ${_getTypeOfResult(value)}.`);
    }
}
exports.InvalidRuleResultException = InvalidRuleResultException;
class InvalidSourceResultException extends core_1.BaseException {
    constructor(value) {
        super(`Invalid source result: ${_getTypeOfResult(value)}.`);
    }
}
exports.InvalidSourceResultException = InvalidSourceResultException;
function callSource(source, context) {
    return (0, rxjs_1.defer)(async () => {
        let result = source(context);
        if ((0, rxjs_1.isObservable)(result)) {
            result = await (0, rxjs_1.lastValueFrom)(result.pipe((0, rxjs_1.defaultIfEmpty)(undefined)));
        }
        if (result && interface_1.TreeSymbol in result) {
            return result;
        }
        throw new InvalidSourceResultException(result);
    });
}
exports.callSource = callSource;
function callRule(rule, input, context) {
    if ((0, rxjs_1.isObservable)(input)) {
        return input.pipe((0, rxjs_1.mergeMap)((inputTree) => callRuleAsync(rule, inputTree, context)));
    }
    else {
        return (0, rxjs_1.defer)(() => callRuleAsync(rule, input, context));
    }
}
exports.callRule = callRule;
async function callRuleAsync(rule, tree, context) {
    let result = await rule(tree, context);
    while (typeof result === 'function') {
        // This is considered a Rule, chain the rule and return its output.
        result = await result(tree, context);
    }
    if (typeof result === 'undefined') {
        return tree;
    }
    if ((0, rxjs_1.isObservable)(result)) {
        result = await (0, rxjs_1.lastValueFrom)(result.pipe((0, rxjs_1.defaultIfEmpty)(tree)));
    }
    if (result && interface_1.TreeSymbol in result) {
        return result;
    }
    throw new InvalidRuleResultException(result);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L3NjaGVtYXRpY3Mvc3JjL3J1bGVzL2NhbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsK0NBQXFEO0FBQ3JELCtCQUFnRztBQUVoRyxpREFBcUQ7QUFFckQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFVO0lBQ2xDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUN2QixPQUFPLFdBQVcsQ0FBQztLQUNwQjtTQUFNLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUN6QixPQUFPLE1BQU0sQ0FBQztLQUNmO1NBQU0sSUFBSSxPQUFPLEtBQUssSUFBSSxVQUFVLEVBQUU7UUFDckMsT0FBTyxZQUFZLENBQUM7S0FDckI7U0FBTSxJQUFJLE9BQU8sS0FBSyxJQUFJLFFBQVEsRUFBRTtRQUNuQyxPQUFPLEdBQUcsT0FBTyxLQUFLLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0tBQ3BEO1NBQU07UUFDTCxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxFQUFFO1lBQzFDLE9BQU8sVUFBVSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7U0FDM0M7YUFBTSxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUU7WUFDNUIsT0FBTyxxQkFBcUIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUN0RDthQUFNO1lBQ0wsT0FBTyxnQkFBZ0IsQ0FBQztTQUN6QjtLQUNGO0FBQ0gsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBYSwwQkFBMkIsU0FBUSxvQkFBYTtJQUMzRCxZQUFZLEtBQVU7UUFDcEIsS0FBSyxDQUFDLHdCQUF3QixnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUQsQ0FBQztDQUNGO0FBSkQsZ0VBSUM7QUFFRCxNQUFhLDRCQUE2QixTQUFRLG9CQUFhO0lBQzdELFlBQVksS0FBVTtRQUNwQixLQUFLLENBQUMsMEJBQTBCLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5RCxDQUFDO0NBQ0Y7QUFKRCxvRUFJQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxNQUFjLEVBQUUsT0FBeUI7SUFDbEUsT0FBTyxJQUFBLFlBQUssRUFBQyxLQUFLLElBQUksRUFBRTtRQUN0QixJQUFJLE1BQU0sR0FBd0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWxFLElBQUksSUFBQSxtQkFBWSxFQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3hCLE1BQU0sR0FBRyxNQUFNLElBQUEsb0JBQWEsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUEscUJBQWMsRUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdEU7UUFFRCxJQUFJLE1BQU0sSUFBSSxzQkFBVSxJQUFJLE1BQU0sRUFBRTtZQUNsQyxPQUFPLE1BQWMsQ0FBQztTQUN2QjtRQUVELE1BQU0sSUFBSSw0QkFBNEIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqRCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFkRCxnQ0FjQztBQUVELFNBQWdCLFFBQVEsQ0FDdEIsSUFBVSxFQUNWLEtBQThCLEVBQzlCLE9BQXlCO0lBRXpCLElBQUksSUFBQSxtQkFBWSxFQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3ZCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFBLGVBQVEsRUFBQyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3JGO1NBQU07UUFDTCxPQUFPLElBQUEsWUFBSyxFQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDekQ7QUFDSCxDQUFDO0FBVkQsNEJBVUM7QUFFRCxLQUFLLFVBQVUsYUFBYSxDQUFDLElBQVUsRUFBRSxJQUFVLEVBQUUsT0FBeUI7SUFDNUUsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRXZDLE9BQU8sT0FBTyxNQUFNLEtBQUssVUFBVSxFQUFFO1FBQ25DLG1FQUFtRTtRQUNuRSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3RDO0lBRUQsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7UUFDakMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELElBQUksSUFBQSxtQkFBWSxFQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3hCLE1BQU0sR0FBRyxNQUFNLElBQUEsb0JBQWEsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUEscUJBQWMsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDakU7SUFFRCxJQUFJLE1BQU0sSUFBSSxzQkFBVSxJQUFJLE1BQU0sRUFBRTtRQUNsQyxPQUFPLE1BQWMsQ0FBQztLQUN2QjtJQUVELE1BQU0sSUFBSSwwQkFBMEIsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMvQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJhc2VFeGNlcHRpb24gfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBkZWZhdWx0SWZFbXB0eSwgZGVmZXIsIGlzT2JzZXJ2YWJsZSwgbGFzdFZhbHVlRnJvbSwgbWVyZ2VNYXAgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IFJ1bGUsIFNjaGVtYXRpY0NvbnRleHQsIFNvdXJjZSB9IGZyb20gJy4uL2VuZ2luZS9pbnRlcmZhY2UnO1xuaW1wb3J0IHsgVHJlZSwgVHJlZVN5bWJvbCB9IGZyb20gJy4uL3RyZWUvaW50ZXJmYWNlJztcblxuZnVuY3Rpb24gX2dldFR5cGVPZlJlc3VsdCh2YWx1ZT86IHt9KTogc3RyaW5nIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gIH0gZWxzZSBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gJ251bGwnO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGBGdW5jdGlvbigpYDtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gYCR7dHlwZW9mIHZhbHVlfSgke0pTT04uc3RyaW5naWZ5KHZhbHVlKX0pYDtcbiAgfSBlbHNlIHtcbiAgICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbHVlKSA9PSBPYmplY3QpIHtcbiAgICAgIHJldHVybiBgT2JqZWN0KCR7SlNPTi5zdHJpbmdpZnkodmFsdWUpfSlgO1xuICAgIH0gZWxzZSBpZiAodmFsdWUuY29uc3RydWN0b3IpIHtcbiAgICAgIHJldHVybiBgSW5zdGFuY2Ugb2YgY2xhc3MgJHt2YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnVW5rbm93biBPYmplY3QnO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFdoZW4gYSBydWxlIG9yIHNvdXJjZSByZXR1cm5zIGFuIGludmFsaWQgdmFsdWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBJbnZhbGlkUnVsZVJlc3VsdEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3Rvcih2YWx1ZT86IHt9KSB7XG4gICAgc3VwZXIoYEludmFsaWQgcnVsZSByZXN1bHQ6ICR7X2dldFR5cGVPZlJlc3VsdCh2YWx1ZSl9LmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkU291cmNlUmVzdWx0RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHZhbHVlPzoge30pIHtcbiAgICBzdXBlcihgSW52YWxpZCBzb3VyY2UgcmVzdWx0OiAke19nZXRUeXBlT2ZSZXN1bHQodmFsdWUpfS5gKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsbFNvdXJjZShzb3VyY2U6IFNvdXJjZSwgY29udGV4dDogU2NoZW1hdGljQ29udGV4dCk6IE9ic2VydmFibGU8VHJlZT4ge1xuICByZXR1cm4gZGVmZXIoYXN5bmMgKCkgPT4ge1xuICAgIGxldCByZXN1bHQ6IFRyZWUgfCBPYnNlcnZhYmxlPFRyZWU+IHwgdW5kZWZpbmVkID0gc291cmNlKGNvbnRleHQpO1xuXG4gICAgaWYgKGlzT2JzZXJ2YWJsZShyZXN1bHQpKSB7XG4gICAgICByZXN1bHQgPSBhd2FpdCBsYXN0VmFsdWVGcm9tKHJlc3VsdC5waXBlKGRlZmF1bHRJZkVtcHR5KHVuZGVmaW5lZCkpKTtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0ICYmIFRyZWVTeW1ib2wgaW4gcmVzdWx0KSB7XG4gICAgICByZXR1cm4gcmVzdWx0IGFzIFRyZWU7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEludmFsaWRTb3VyY2VSZXN1bHRFeGNlcHRpb24ocmVzdWx0KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxsUnVsZShcbiAgcnVsZTogUnVsZSxcbiAgaW5wdXQ6IFRyZWUgfCBPYnNlcnZhYmxlPFRyZWU+LFxuICBjb250ZXh0OiBTY2hlbWF0aWNDb250ZXh0LFxuKTogT2JzZXJ2YWJsZTxUcmVlPiB7XG4gIGlmIChpc09ic2VydmFibGUoaW5wdXQpKSB7XG4gICAgcmV0dXJuIGlucHV0LnBpcGUobWVyZ2VNYXAoKGlucHV0VHJlZSkgPT4gY2FsbFJ1bGVBc3luYyhydWxlLCBpbnB1dFRyZWUsIGNvbnRleHQpKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGRlZmVyKCgpID0+IGNhbGxSdWxlQXN5bmMocnVsZSwgaW5wdXQsIGNvbnRleHQpKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjYWxsUnVsZUFzeW5jKHJ1bGU6IFJ1bGUsIHRyZWU6IFRyZWUsIGNvbnRleHQ6IFNjaGVtYXRpY0NvbnRleHQpOiBQcm9taXNlPFRyZWU+IHtcbiAgbGV0IHJlc3VsdCA9IGF3YWl0IHJ1bGUodHJlZSwgY29udGV4dCk7XG5cbiAgd2hpbGUgKHR5cGVvZiByZXN1bHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBUaGlzIGlzIGNvbnNpZGVyZWQgYSBSdWxlLCBjaGFpbiB0aGUgcnVsZSBhbmQgcmV0dXJuIGl0cyBvdXRwdXQuXG4gICAgcmVzdWx0ID0gYXdhaXQgcmVzdWx0KHRyZWUsIGNvbnRleHQpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIHRyZWU7XG4gIH1cblxuICBpZiAoaXNPYnNlcnZhYmxlKHJlc3VsdCkpIHtcbiAgICByZXN1bHQgPSBhd2FpdCBsYXN0VmFsdWVGcm9tKHJlc3VsdC5waXBlKGRlZmF1bHRJZkVtcHR5KHRyZWUpKSk7XG4gIH1cblxuICBpZiAocmVzdWx0ICYmIFRyZWVTeW1ib2wgaW4gcmVzdWx0KSB7XG4gICAgcmV0dXJuIHJlc3VsdCBhcyBUcmVlO1xuICB9XG5cbiAgdGhyb3cgbmV3IEludmFsaWRSdWxlUmVzdWx0RXhjZXB0aW9uKHJlc3VsdCk7XG59XG4iXX0=