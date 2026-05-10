"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchematicImpl = exports.InvalidSchematicsNameException = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const call_1 = require("../rules/call");
const scoped_1 = require("../tree/scoped");
class InvalidSchematicsNameException extends core_1.BaseException {
    constructor(name) {
        super(`Schematics has invalid name: "${name}".`);
    }
}
exports.InvalidSchematicsNameException = InvalidSchematicsNameException;
class SchematicImpl {
    constructor(_description, _factory, _collection, _engine) {
        this._description = _description;
        this._factory = _factory;
        this._collection = _collection;
        this._engine = _engine;
        if (!_description.name.match(/^[-@/_.a-zA-Z0-9]+$/)) {
            throw new InvalidSchematicsNameException(_description.name);
        }
    }
    get description() {
        return this._description;
    }
    get collection() {
        return this._collection;
    }
    call(options, host, parentContext, executionOptions) {
        const context = this._engine.createContext(this, parentContext, executionOptions);
        return host.pipe((0, rxjs_1.first)(), (0, rxjs_1.concatMap)((tree) => this._engine
            .transformOptions(this, options, context)
            .pipe((0, rxjs_1.map)((o) => [tree, o]))), (0, rxjs_1.concatMap)(([tree, transformedOptions]) => {
            let input;
            let scoped = false;
            if (executionOptions && executionOptions.scope) {
                scoped = true;
                input = new scoped_1.ScopedTree(tree, executionOptions.scope);
            }
            else {
                input = tree;
            }
            return (0, call_1.callRule)(this._factory(transformedOptions), input, context).pipe((0, rxjs_1.map)((output) => {
                if (output === input) {
                    return tree;
                }
                else if (scoped) {
                    tree.merge(output);
                    return tree;
                }
                else {
                    return output;
                }
            }));
        }));
    }
}
exports.SchematicImpl = SchematicImpl;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hdGljLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvc2NoZW1hdGljcy9zcmMvZW5naW5lL3NjaGVtYXRpYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBcUQ7QUFDckQsK0JBQXlEO0FBQ3pELHdDQUF5QztBQUV6QywyQ0FBNEM7QUFXNUMsTUFBYSw4QkFBK0IsU0FBUSxvQkFBYTtJQUMvRCxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLGlDQUFpQyxJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ25ELENBQUM7Q0FDRjtBQUpELHdFQUlDO0FBRUQsTUFBYSxhQUFhO0lBR3hCLFlBQ1UsWUFBMkQsRUFDM0QsUUFBeUIsRUFDekIsV0FBZ0QsRUFDaEQsT0FBd0M7UUFIeEMsaUJBQVksR0FBWixZQUFZLENBQStDO1FBQzNELGFBQVEsR0FBUixRQUFRLENBQWlCO1FBQ3pCLGdCQUFXLEdBQVgsV0FBVyxDQUFxQztRQUNoRCxZQUFPLEdBQVAsT0FBTyxDQUFpQztRQUVoRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsRUFBRTtZQUNuRCxNQUFNLElBQUksOEJBQThCLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzdEO0lBQ0gsQ0FBQztJQUVELElBQUksV0FBVztRQUNiLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztJQUMzQixDQUFDO0lBQ0QsSUFBSSxVQUFVO1FBQ1osT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFJLENBQ0YsT0FBZ0IsRUFDaEIsSUFBc0IsRUFDdEIsYUFBdUUsRUFDdkUsZ0JBQTRDO1FBRTVDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUVsRixPQUFPLElBQUksQ0FBQyxJQUFJLENBQ2QsSUFBQSxZQUFLLEdBQUUsRUFDUCxJQUFBLGdCQUFTLEVBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUNqQixJQUFJLENBQUMsT0FBTzthQUNULGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDO2FBQ3hDLElBQUksQ0FBQyxJQUFBLFVBQUcsRUFBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFvQixDQUFDLENBQUMsQ0FDbEQsRUFDRCxJQUFBLGdCQUFTLEVBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLEVBQUU7WUFDdkMsSUFBSSxLQUFXLENBQUM7WUFDaEIsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksZ0JBQWdCLElBQUksZ0JBQWdCLENBQUMsS0FBSyxFQUFFO2dCQUM5QyxNQUFNLEdBQUcsSUFBSSxDQUFDO2dCQUNkLEtBQUssR0FBRyxJQUFJLG1CQUFVLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3REO2lCQUFNO2dCQUNMLEtBQUssR0FBRyxJQUFJLENBQUM7YUFDZDtZQUVELE9BQU8sSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQ3JFLElBQUEsVUFBRyxFQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ2IsSUFBSSxNQUFNLEtBQUssS0FBSyxFQUFFO29CQUNwQixPQUFPLElBQUksQ0FBQztpQkFDYjtxQkFBTSxJQUFJLE1BQU0sRUFBRTtvQkFDakIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFFbkIsT0FBTyxJQUFJLENBQUM7aUJBQ2I7cUJBQU07b0JBQ0wsT0FBTyxNQUFNLENBQUM7aUJBQ2Y7WUFDSCxDQUFDLENBQUMsQ0FDSCxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQTlERCxzQ0E4REMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIGNvbmNhdE1hcCwgZmlyc3QsIG1hcCB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgY2FsbFJ1bGUgfSBmcm9tICcuLi9ydWxlcy9jYWxsJztcbmltcG9ydCB7IFRyZWUgfSBmcm9tICcuLi90cmVlL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBTY29wZWRUcmVlIH0gZnJvbSAnLi4vdHJlZS9zY29wZWQnO1xuaW1wb3J0IHtcbiAgQ29sbGVjdGlvbixcbiAgRW5naW5lLFxuICBFeGVjdXRpb25PcHRpb25zLFxuICBSdWxlRmFjdG9yeSxcbiAgU2NoZW1hdGljLFxuICBTY2hlbWF0aWNEZXNjcmlwdGlvbixcbiAgVHlwZWRTY2hlbWF0aWNDb250ZXh0LFxufSBmcm9tICcuL2ludGVyZmFjZSc7XG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkU2NoZW1hdGljc05hbWVFeGNlcHRpb24gZXh0ZW5kcyBCYXNlRXhjZXB0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFNjaGVtYXRpY3MgaGFzIGludmFsaWQgbmFtZTogXCIke25hbWV9XCIuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNjaGVtYXRpY0ltcGw8Q29sbGVjdGlvblQgZXh0ZW5kcyBvYmplY3QsIFNjaGVtYXRpY1QgZXh0ZW5kcyBvYmplY3Q+XG4gIGltcGxlbWVudHMgU2NoZW1hdGljPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPlxue1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIF9kZXNjcmlwdGlvbjogU2NoZW1hdGljRGVzY3JpcHRpb248Q29sbGVjdGlvblQsIFNjaGVtYXRpY1Q+LFxuICAgIHByaXZhdGUgX2ZhY3Rvcnk6IFJ1bGVGYWN0b3J5PHt9PixcbiAgICBwcml2YXRlIF9jb2xsZWN0aW9uOiBDb2xsZWN0aW9uPENvbGxlY3Rpb25ULCBTY2hlbWF0aWNUPixcbiAgICBwcml2YXRlIF9lbmdpbmU6IEVuZ2luZTxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4sXG4gICkge1xuICAgIGlmICghX2Rlc2NyaXB0aW9uLm5hbWUubWF0Y2goL15bLUAvXy5hLXpBLVowLTldKyQvKSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRTY2hlbWF0aWNzTmFtZUV4Y2VwdGlvbihfZGVzY3JpcHRpb24ubmFtZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGRlc2NyaXB0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9kZXNjcmlwdGlvbjtcbiAgfVxuICBnZXQgY29sbGVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fY29sbGVjdGlvbjtcbiAgfVxuXG4gIGNhbGw8T3B0aW9uVCBleHRlbmRzIG9iamVjdD4oXG4gICAgb3B0aW9uczogT3B0aW9uVCxcbiAgICBob3N0OiBPYnNlcnZhYmxlPFRyZWU+LFxuICAgIHBhcmVudENvbnRleHQ/OiBQYXJ0aWFsPFR5cGVkU2NoZW1hdGljQ29udGV4dDxDb2xsZWN0aW9uVCwgU2NoZW1hdGljVD4+LFxuICAgIGV4ZWN1dGlvbk9wdGlvbnM/OiBQYXJ0aWFsPEV4ZWN1dGlvbk9wdGlvbnM+LFxuICApOiBPYnNlcnZhYmxlPFRyZWU+IHtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5fZW5naW5lLmNyZWF0ZUNvbnRleHQodGhpcywgcGFyZW50Q29udGV4dCwgZXhlY3V0aW9uT3B0aW9ucyk7XG5cbiAgICByZXR1cm4gaG9zdC5waXBlKFxuICAgICAgZmlyc3QoKSxcbiAgICAgIGNvbmNhdE1hcCgodHJlZSkgPT5cbiAgICAgICAgdGhpcy5fZW5naW5lXG4gICAgICAgICAgLnRyYW5zZm9ybU9wdGlvbnModGhpcywgb3B0aW9ucywgY29udGV4dClcbiAgICAgICAgICAucGlwZShtYXAoKG8pID0+IFt0cmVlLCBvXSBhcyBbVHJlZSwgT3B0aW9uVF0pKSxcbiAgICAgICksXG4gICAgICBjb25jYXRNYXAoKFt0cmVlLCB0cmFuc2Zvcm1lZE9wdGlvbnNdKSA9PiB7XG4gICAgICAgIGxldCBpbnB1dDogVHJlZTtcbiAgICAgICAgbGV0IHNjb3BlZCA9IGZhbHNlO1xuICAgICAgICBpZiAoZXhlY3V0aW9uT3B0aW9ucyAmJiBleGVjdXRpb25PcHRpb25zLnNjb3BlKSB7XG4gICAgICAgICAgc2NvcGVkID0gdHJ1ZTtcbiAgICAgICAgICBpbnB1dCA9IG5ldyBTY29wZWRUcmVlKHRyZWUsIGV4ZWN1dGlvbk9wdGlvbnMuc2NvcGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlucHV0ID0gdHJlZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjYWxsUnVsZSh0aGlzLl9mYWN0b3J5KHRyYW5zZm9ybWVkT3B0aW9ucyksIGlucHV0LCBjb250ZXh0KS5waXBlKFxuICAgICAgICAgIG1hcCgob3V0cHV0KSA9PiB7XG4gICAgICAgICAgICBpZiAob3V0cHV0ID09PSBpbnB1dCkge1xuICAgICAgICAgICAgICByZXR1cm4gdHJlZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2NvcGVkKSB7XG4gICAgICAgICAgICAgIHRyZWUubWVyZ2Uob3V0cHV0KTtcblxuICAgICAgICAgICAgICByZXR1cm4gdHJlZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG59XG4iXX0=