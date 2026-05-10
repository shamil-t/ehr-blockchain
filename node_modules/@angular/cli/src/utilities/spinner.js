"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spinner = void 0;
const ora_1 = __importDefault(require("ora"));
const color_1 = require("./color");
class Spinner {
    constructor(text) {
        /** When false, only fail messages will be displayed. */
        this.enabled = true;
        this.spinner = (0, ora_1.default)({
            text,
            // The below 2 options are needed because otherwise CTRL+C will be delayed
            // when the underlying process is sync.
            hideCursor: false,
            discardStdin: false,
        });
    }
    set text(text) {
        this.spinner.text = text;
    }
    succeed(text) {
        if (this.enabled) {
            this.spinner.succeed(text);
        }
    }
    info(text) {
        this.spinner.info(text);
    }
    fail(text) {
        this.spinner.fail(text && color_1.colors.redBright(text));
    }
    warn(text) {
        this.spinner.warn(text && color_1.colors.yellowBright(text));
    }
    stop() {
        this.spinner.stop();
    }
    start(text) {
        if (this.enabled) {
            this.spinner.start(text);
        }
    }
}
exports.Spinner = Spinner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Bpbm5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXIvY2xpL3NyYy91dGlsaXRpZXMvc3Bpbm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCw4Q0FBc0I7QUFDdEIsbUNBQWlDO0FBRWpDLE1BQWEsT0FBTztJQU1sQixZQUFZLElBQWE7UUFIekIsd0RBQXdEO1FBQ3hELFlBQU8sR0FBRyxJQUFJLENBQUM7UUFHYixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsYUFBRyxFQUFDO1lBQ2pCLElBQUk7WUFDSiwwRUFBMEU7WUFDMUUsdUNBQXVDO1lBQ3ZDLFVBQVUsRUFBRSxLQUFLO1lBQ2pCLFlBQVksRUFBRSxLQUFLO1NBQ3BCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxJQUFJLElBQUksQ0FBQyxJQUFZO1FBQ25CLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUMzQixDQUFDO0lBRUQsT0FBTyxDQUFDLElBQWE7UUFDbkIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFhO1FBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFJLENBQUMsSUFBYTtRQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksY0FBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCxJQUFJLENBQUMsSUFBYTtRQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksY0FBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxJQUFJO1FBQ0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQWE7UUFDakIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzFCO0lBQ0gsQ0FBQztDQUNGO0FBL0NELDBCQStDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgb3JhIGZyb20gJ29yYSc7XG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuL2NvbG9yJztcblxuZXhwb3J0IGNsYXNzIFNwaW5uZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IHNwaW5uZXI6IG9yYS5PcmE7XG5cbiAgLyoqIFdoZW4gZmFsc2UsIG9ubHkgZmFpbCBtZXNzYWdlcyB3aWxsIGJlIGRpc3BsYXllZC4gKi9cbiAgZW5hYmxlZCA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IodGV4dD86IHN0cmluZykge1xuICAgIHRoaXMuc3Bpbm5lciA9IG9yYSh7XG4gICAgICB0ZXh0LFxuICAgICAgLy8gVGhlIGJlbG93IDIgb3B0aW9ucyBhcmUgbmVlZGVkIGJlY2F1c2Ugb3RoZXJ3aXNlIENUUkwrQyB3aWxsIGJlIGRlbGF5ZWRcbiAgICAgIC8vIHdoZW4gdGhlIHVuZGVybHlpbmcgcHJvY2VzcyBpcyBzeW5jLlxuICAgICAgaGlkZUN1cnNvcjogZmFsc2UsXG4gICAgICBkaXNjYXJkU3RkaW46IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgc2V0IHRleHQodGV4dDogc3RyaW5nKSB7XG4gICAgdGhpcy5zcGlubmVyLnRleHQgPSB0ZXh0O1xuICB9XG5cbiAgc3VjY2VlZCh0ZXh0Pzogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZW5hYmxlZCkge1xuICAgICAgdGhpcy5zcGlubmVyLnN1Y2NlZWQodGV4dCk7XG4gICAgfVxuICB9XG5cbiAgaW5mbyh0ZXh0Pzogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zcGlubmVyLmluZm8odGV4dCk7XG4gIH1cblxuICBmYWlsKHRleHQ/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnNwaW5uZXIuZmFpbCh0ZXh0ICYmIGNvbG9ycy5yZWRCcmlnaHQodGV4dCkpO1xuICB9XG5cbiAgd2Fybih0ZXh0Pzogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zcGlubmVyLndhcm4odGV4dCAmJiBjb2xvcnMueWVsbG93QnJpZ2h0KHRleHQpKTtcbiAgfVxuXG4gIHN0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5zcGlubmVyLnN0b3AoKTtcbiAgfVxuXG4gIHN0YXJ0KHRleHQ/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5lbmFibGVkKSB7XG4gICAgICB0aGlzLnNwaW5uZXIuc3RhcnQodGV4dCk7XG4gICAgfVxuICB9XG59XG4iXX0=