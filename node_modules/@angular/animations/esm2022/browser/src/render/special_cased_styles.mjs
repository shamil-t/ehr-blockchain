import { eraseStyles, setStyles } from '../util';
/**
 * Returns an instance of `SpecialCasedStyles` if and when any special (non animateable) styles are
 * detected.
 *
 * In CSS there exist properties that cannot be animated within a keyframe animation
 * (whether it be via CSS keyframes or web-animations) and the animation implementation
 * will ignore them. This function is designed to detect those special cased styles and
 * return a container that will be executed at the start and end of the animation.
 *
 * @returns an instance of `SpecialCasedStyles` if any special styles are detected otherwise `null`
 */
export function packageNonAnimatableStyles(element, styles) {
    let startStyles = null;
    let endStyles = null;
    if (Array.isArray(styles) && styles.length) {
        startStyles = filterNonAnimatableStyles(styles[0]);
        if (styles.length > 1) {
            endStyles = filterNonAnimatableStyles(styles[styles.length - 1]);
        }
    }
    else if (styles instanceof Map) {
        startStyles = filterNonAnimatableStyles(styles);
    }
    return (startStyles || endStyles) ? new SpecialCasedStyles(element, startStyles, endStyles) :
        null;
}
/**
 * Designed to be executed during a keyframe-based animation to apply any special-cased styles.
 *
 * When started (when the `start()` method is run) then the provided `startStyles`
 * will be applied. When finished (when the `finish()` method is called) the
 * `endStyles` will be applied as well any any starting styles. Finally when
 * `destroy()` is called then all styles will be removed.
 */
export class SpecialCasedStyles {
    static { this.initialStylesByElement = ( /* @__PURE__ */new WeakMap()); }
    constructor(_element, _startStyles, _endStyles) {
        this._element = _element;
        this._startStyles = _startStyles;
        this._endStyles = _endStyles;
        this._state = 0 /* SpecialCasedStylesState.Pending */;
        let initialStyles = SpecialCasedStyles.initialStylesByElement.get(_element);
        if (!initialStyles) {
            SpecialCasedStyles.initialStylesByElement.set(_element, initialStyles = new Map());
        }
        this._initialStyles = initialStyles;
    }
    start() {
        if (this._state < 1 /* SpecialCasedStylesState.Started */) {
            if (this._startStyles) {
                setStyles(this._element, this._startStyles, this._initialStyles);
            }
            this._state = 1 /* SpecialCasedStylesState.Started */;
        }
    }
    finish() {
        this.start();
        if (this._state < 2 /* SpecialCasedStylesState.Finished */) {
            setStyles(this._element, this._initialStyles);
            if (this._endStyles) {
                setStyles(this._element, this._endStyles);
                this._endStyles = null;
            }
            this._state = 1 /* SpecialCasedStylesState.Started */;
        }
    }
    destroy() {
        this.finish();
        if (this._state < 3 /* SpecialCasedStylesState.Destroyed */) {
            SpecialCasedStyles.initialStylesByElement.delete(this._element);
            if (this._startStyles) {
                eraseStyles(this._element, this._startStyles);
                this._endStyles = null;
            }
            if (this._endStyles) {
                eraseStyles(this._element, this._endStyles);
                this._endStyles = null;
            }
            setStyles(this._element, this._initialStyles);
            this._state = 3 /* SpecialCasedStylesState.Destroyed */;
        }
    }
}
function filterNonAnimatableStyles(styles) {
    let result = null;
    styles.forEach((val, prop) => {
        if (isNonAnimatableStyle(prop)) {
            result = result || new Map();
            result.set(prop, val);
        }
    });
    return result;
}
function isNonAnimatableStyle(prop) {
    return prop === 'display' || prop === 'position';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlY2lhbF9jYXNlZF9zdHlsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmltYXRpb25zL2Jyb3dzZXIvc3JjL3JlbmRlci9zcGVjaWFsX2Nhc2VkX3N0eWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFTQSxPQUFPLEVBQUMsV0FBVyxFQUFFLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUUvQzs7Ozs7Ozs7OztHQVVHO0FBQ0gsTUFBTSxVQUFVLDBCQUEwQixDQUN0QyxPQUFZLEVBQUUsTUFBMEM7SUFDMUQsSUFBSSxXQUFXLEdBQXVCLElBQUksQ0FBQztJQUMzQyxJQUFJLFNBQVMsR0FBdUIsSUFBSSxDQUFDO0lBQ3pDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQzFDLFdBQVcsR0FBRyx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3JCLFNBQVMsR0FBRyx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2xFO0tBQ0Y7U0FBTSxJQUFJLE1BQU0sWUFBWSxHQUFHLEVBQUU7UUFDaEMsV0FBVyxHQUFHLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ2pEO0lBRUQsT0FBTyxDQUFDLFdBQVcsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDO0FBQzNDLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxPQUFPLGtCQUFrQjthQUN0QiwyQkFBc0IsR0FBRyxFQUFDLGVBQWdCLElB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QyxPQUFPLElBQUksS0FBSyxTQUFTLElBQUksSUFBSSxLQUFLLFVBQVUsQ0FBQztBQUNuRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge8m1U3R5bGVEYXRhTWFwfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcblxuaW1wb3J0IHtlcmFzZVN0eWxlcywgc2V0U3R5bGVzfSBmcm9tICcuLi91dGlsJztcblxuLyoqXG4gKiBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIGBTcGVjaWFsQ2FzZWRTdHlsZXNgIGlmIGFuZCB3aGVuIGFueSBzcGVjaWFsIChub24gYW5pbWF0ZWFibGUpIHN0eWxlcyBhcmVcbiAqIGRldGVjdGVkLlxuICpcbiAqIEluIENTUyB0aGVyZSBleGlzdCBwcm9wZXJ0aWVzIHRoYXQgY2Fubm90IGJlIGFuaW1hdGVkIHdpdGhpbiBhIGtleWZyYW1lIGFuaW1hdGlvblxuICogKHdoZXRoZXIgaXQgYmUgdmlhIENTUyBrZXlmcmFtZXMgb3Igd2ViLWFuaW1hdGlvbnMpIGFuZCB0aGUgYW5pbWF0aW9uIGltcGxlbWVudGF0aW9uXG4gKiB3aWxsIGlnbm9yZSB0aGVtLiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGRldGVjdCB0aG9zZSBzcGVjaWFsIGNhc2VkIHN0eWxlcyBhbmRcbiAqIHJldHVybiBhIGNvbnRhaW5lciB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgYXQgdGhlIHN0YXJ0IGFuZCBlbmQgb2YgdGhlIGFuaW1hdGlvbi5cbiAqXG4gKiBAcmV0dXJucyBhbiBpbnN0YW5jZSBvZiBgU3BlY2lhbENhc2VkU3R5bGVzYCBpZiBhbnkgc3BlY2lhbCBzdHlsZXMgYXJlIGRldGVjdGVkIG90aGVyd2lzZSBgbnVsbGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhY2thZ2VOb25BbmltYXRhYmxlU3R5bGVzKFxuICAgIGVsZW1lbnQ6IGFueSwgc3R5bGVzOiDJtVN0eWxlRGF0YU1hcHxBcnJheTzJtVN0eWxlRGF0YU1hcD4pOiBTcGVjaWFsQ2FzZWRTdHlsZXN8bnVsbCB7XG4gIGxldCBzdGFydFN0eWxlczogybVTdHlsZURhdGFNYXB8bnVsbCA9IG51bGw7XG4gIGxldCBlbmRTdHlsZXM6IMm1U3R5bGVEYXRhTWFwfG51bGwgPSBudWxsO1xuICBpZiAoQXJyYXkuaXNBcnJheShzdHlsZXMpICYmIHN0eWxlcy5sZW5ndGgpIHtcbiAgICBzdGFydFN0eWxlcyA9IGZpbHRlck5vbkFuaW1hdGFibGVTdHlsZXMoc3R5bGVzWzBdKTtcbiAgICBpZiAoc3R5bGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGVuZFN0eWxlcyA9IGZpbHRlck5vbkFuaW1hdGFibGVTdHlsZXMoc3R5bGVzW3N0eWxlcy5sZW5ndGggLSAxXSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHN0eWxlcyBpbnN0YW5jZW9mIE1hcCkge1xuICAgIHN0YXJ0U3R5bGVzID0gZmlsdGVyTm9uQW5pbWF0YWJsZVN0eWxlcyhzdHlsZXMpO1xuICB9XG5cbiAgcmV0dXJuIChzdGFydFN0eWxlcyB8fCBlbmRTdHlsZXMpID8gbmV3IFNwZWNpYWxDYXNlZFN0eWxlcyhlbGVtZW50LCBzdGFydFN0eWxlcywgZW5kU3R5bGVzKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGw7XG59XG5cbi8qKlxuICogRGVzaWduZWQgdG8gYmUgZXhlY3V0ZWQgZHVyaW5nIGEga2V5ZnJhbWUtYmFzZWQgYW5pbWF0aW9uIHRvIGFwcGx5IGFueSBzcGVjaWFsLWNhc2VkIHN0eWxlcy5cbiAqXG4gKiBXaGVuIHN0YXJ0ZWQgKHdoZW4gdGhlIGBzdGFydCgpYCBtZXRob2QgaXMgcnVuKSB0aGVuIHRoZSBwcm92aWRlZCBgc3RhcnRTdHlsZXNgXG4gKiB3aWxsIGJlIGFwcGxpZWQuIFdoZW4gZmluaXNoZWQgKHdoZW4gdGhlIGBmaW5pc2goKWAgbWV0aG9kIGlzIGNhbGxlZCkgdGhlXG4gKiBgZW5kU3R5bGVzYCB3aWxsIGJlIGFwcGxpZWQgYXMgd2VsbCBhbnkgYW55IHN0YXJ0aW5nIHN0eWxlcy4gRmluYWxseSB3aGVuXG4gKiBgZGVzdHJveSgpYCBpcyBjYWxsZWQgdGhlbiBhbGwgc3R5bGVzIHdpbGwgYmUgcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNwZWNpYWxDYXNlZFN0eWxlcyB7XG4gIHN0YXRpYyBpbml0aWFsU3R5bGVzQnlFbGVtZW50ID0gKC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcDxhbnksIMm1U3R5bGVEYXRhTWFwPigpKTtcblxuICBwcml2YXRlIF9zdGF0ZSA9IFNwZWNpYWxDYXNlZFN0eWxlc1N0YXRlLlBlbmRpbmc7XG4gIHByaXZhdGUgX2luaXRpYWxTdHlsZXMhOiDJtVN0eWxlRGF0YU1hcDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2VsZW1lbnQ6IGFueSwgcHJpdmF0ZSBfc3RhcnRTdHlsZXM6IMm1U3R5bGVEYXRhTWFwfG51bGwsXG4gICAgICBwcml2YXRlIF9lbmRTdHlsZXM6IMm1U3R5bGVEYXRhTWFwfG51bGwpIHtcbiAgICBsZXQgaW5pdGlhbFN0eWxlcyA9IFNwZWNpYWxDYXNlZFN0eWxlcy5pbml0aWFsU3R5bGVzQnlFbGVtZW50LmdldChfZWxlbWVudCk7XG4gICAgaWYgKCFpbml0aWFsU3R5bGVzKSB7XG4gICAgICBTcGVjaWFsQ2FzZWRTdHlsZXMuaW5pdGlhbFN0eWxlc0J5RWxlbWVudC5zZXQoX2VsZW1lbnQsIGluaXRpYWxTdHlsZXMgPSBuZXcgTWFwKCkpO1xuICAgIH1cbiAgICB0aGlzLl9pbml0aWFsU3R5bGVzID0gaW5pdGlhbFN0eWxlcztcbiAgfVxuXG4gIHN0YXJ0KCkge1xuICAgIGlmICh0aGlzLl9zdGF0ZSA8IFNwZWNpYWxDYXNlZFN0eWxlc1N0YXRlLlN0YXJ0ZWQpIHtcbiAgICAgIGlmICh0aGlzLl9zdGFydFN0eWxlcykge1xuICAgICAgICBzZXRTdHlsZXModGhpcy5fZWxlbWVudCwgdGhpcy5fc3RhcnRTdHlsZXMsIHRoaXMuX2luaXRpYWxTdHlsZXMpO1xuICAgICAgfVxuICAgICAgdGhpcy5fc3RhdGUgPSBTcGVjaWFsQ2FzZWRTdHlsZXNTdGF0ZS5TdGFydGVkO1xuICAgIH1cbiAgfVxuXG4gIGZpbmlzaCgpIHtcbiAgICB0aGlzLnN0YXJ0KCk7XG4gICAgaWYgKHRoaXMuX3N0YXRlIDwgU3BlY2lhbENhc2VkU3R5bGVzU3RhdGUuRmluaXNoZWQpIHtcbiAgICAgIHNldFN0eWxlcyh0aGlzLl9lbGVtZW50LCB0aGlzLl9pbml0aWFsU3R5bGVzKTtcbiAgICAgIGlmICh0aGlzLl9lbmRTdHlsZXMpIHtcbiAgICAgICAgc2V0U3R5bGVzKHRoaXMuX2VsZW1lbnQsIHRoaXMuX2VuZFN0eWxlcyk7XG4gICAgICAgIHRoaXMuX2VuZFN0eWxlcyA9IG51bGw7XG4gICAgICB9XG4gICAgICB0aGlzLl9zdGF0ZSA9IFNwZWNpYWxDYXNlZFN0eWxlc1N0YXRlLlN0YXJ0ZWQ7XG4gICAgfVxuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmZpbmlzaCgpO1xuICAgIGlmICh0aGlzLl9zdGF0ZSA8IFNwZWNpYWxDYXNlZFN0eWxlc1N0YXRlLkRlc3Ryb3llZCkge1xuICAgICAgU3BlY2lhbENhc2VkU3R5bGVzLmluaXRpYWxTdHlsZXNCeUVsZW1lbnQuZGVsZXRlKHRoaXMuX2VsZW1lbnQpO1xuICAgICAgaWYgKHRoaXMuX3N0YXJ0U3R5bGVzKSB7XG4gICAgICAgIGVyYXNlU3R5bGVzKHRoaXMuX2VsZW1lbnQsIHRoaXMuX3N0YXJ0U3R5bGVzKTtcbiAgICAgICAgdGhpcy5fZW5kU3R5bGVzID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9lbmRTdHlsZXMpIHtcbiAgICAgICAgZXJhc2VTdHlsZXModGhpcy5fZWxlbWVudCwgdGhpcy5fZW5kU3R5bGVzKTtcbiAgICAgICAgdGhpcy5fZW5kU3R5bGVzID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHNldFN0eWxlcyh0aGlzLl9lbGVtZW50LCB0aGlzLl9pbml0aWFsU3R5bGVzKTtcbiAgICAgIHRoaXMuX3N0YXRlID0gU3BlY2lhbENhc2VkU3R5bGVzU3RhdGUuRGVzdHJveWVkO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFuIGVudW0gb2Ygc3RhdGVzIHJlZmxlY3RpdmUgb2Ygd2hhdCB0aGUgc3RhdHVzIG9mIGBTcGVjaWFsQ2FzZWRTdHlsZXNgIGlzLlxuICpcbiAqIERlcGVuZGluZyBvbiBob3cgYFNwZWNpYWxDYXNlZFN0eWxlc2AgaXMgaW50ZXJhY3RlZCB3aXRoLCB0aGUgc3RhcnQgYW5kIGVuZFxuICogc3R5bGVzIG1heSBub3QgYmUgYXBwbGllZCBpbiB0aGUgc2FtZSB3YXkuIFRoaXMgZW51bSBlbnN1cmVzIHRoYXQgaWYgYW5kIHdoZW5cbiAqIHRoZSBlbmRpbmcgc3R5bGVzIGFyZSBhcHBsaWVkIHRoZW4gdGhlIHN0YXJ0aW5nIHN0eWxlcyBhcmUgYXBwbGllZC4gSXQgaXNcbiAqIGFsc28gdXNlZCB0byByZWZsZWN0IHdoYXQgdGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBzcGVjaWFsIGNhc2VkIHN0eWxlcyBhcmVcbiAqIHdoaWNoIGhlbHBzIHByZXZlbnQgdGhlIHN0YXJ0aW5nL2VuZGluZyBzdHlsZXMgbm90IGJlIGFwcGxpZWQgdHdpY2UuIEl0IGlzXG4gKiBhbHNvIHVzZWQgdG8gY2xlYW51cCB0aGUgc3R5bGVzIG9uY2UgYFNwZWNpYWxDYXNlZFN0eWxlc2AgaXMgZGVzdHJveWVkLlxuICovXG5jb25zdCBlbnVtIFNwZWNpYWxDYXNlZFN0eWxlc1N0YXRlIHtcbiAgUGVuZGluZyA9IDAsXG4gIFN0YXJ0ZWQgPSAxLFxuICBGaW5pc2hlZCA9IDIsXG4gIERlc3Ryb3llZCA9IDMsXG59XG5cbmZ1bmN0aW9uIGZpbHRlck5vbkFuaW1hdGFibGVTdHlsZXMoc3R5bGVzOiDJtVN0eWxlRGF0YU1hcCk6IMm1U3R5bGVEYXRhTWFwfG51bGwge1xuICBsZXQgcmVzdWx0OiDJtVN0eWxlRGF0YU1hcHxudWxsID0gbnVsbDtcbiAgc3R5bGVzLmZvckVhY2goKHZhbCwgcHJvcCkgPT4ge1xuICAgIGlmIChpc05vbkFuaW1hdGFibGVTdHlsZShwcm9wKSkge1xuICAgICAgcmVzdWx0ID0gcmVzdWx0IHx8IG5ldyBNYXAoKTtcbiAgICAgIHJlc3VsdC5zZXQocHJvcCwgdmFsKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpc05vbkFuaW1hdGFibGVTdHlsZShwcm9wOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHByb3AgPT09ICdkaXNwbGF5JyB8fCBwcm9wID09PSAncG9zaXRpb24nO1xufVxuIl19