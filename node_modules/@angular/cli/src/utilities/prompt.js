"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askChoices = exports.askQuestion = exports.askConfirmation = void 0;
const tty_1 = require("./tty");
async function askConfirmation(message, defaultResponse, noTTYResponse) {
    if (!(0, tty_1.isTTY)()) {
        return noTTYResponse ?? defaultResponse;
    }
    const question = {
        type: 'confirm',
        name: 'confirmation',
        prefix: '',
        message,
        default: defaultResponse,
    };
    const { prompt } = await Promise.resolve().then(() => __importStar(require('inquirer')));
    const answers = await prompt([question]);
    return answers['confirmation'];
}
exports.askConfirmation = askConfirmation;
async function askQuestion(message, choices, defaultResponseIndex, noTTYResponse) {
    if (!(0, tty_1.isTTY)()) {
        return noTTYResponse;
    }
    const question = {
        type: 'list',
        name: 'answer',
        prefix: '',
        message,
        choices,
        default: defaultResponseIndex,
    };
    const { prompt } = await Promise.resolve().then(() => __importStar(require('inquirer')));
    const answers = await prompt([question]);
    return answers['answer'];
}
exports.askQuestion = askQuestion;
async function askChoices(message, choices, noTTYResponse) {
    if (!(0, tty_1.isTTY)()) {
        return noTTYResponse;
    }
    const question = {
        type: 'checkbox',
        name: 'answer',
        prefix: '',
        message,
        choices,
    };
    const { prompt } = await Promise.resolve().then(() => __importStar(require('inquirer')));
    const answers = await prompt([question]);
    return answers['answer'];
}
exports.askChoices = askChoices;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhci9jbGkvc3JjL3V0aWxpdGllcy9wcm9tcHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTSCwrQkFBOEI7QUFFdkIsS0FBSyxVQUFVLGVBQWUsQ0FDbkMsT0FBZSxFQUNmLGVBQXdCLEVBQ3hCLGFBQXVCO0lBRXZCLElBQUksQ0FBQyxJQUFBLFdBQUssR0FBRSxFQUFFO1FBQ1osT0FBTyxhQUFhLElBQUksZUFBZSxDQUFDO0tBQ3pDO0lBRUQsTUFBTSxRQUFRLEdBQWE7UUFDekIsSUFBSSxFQUFFLFNBQVM7UUFDZixJQUFJLEVBQUUsY0FBYztRQUNwQixNQUFNLEVBQUUsRUFBRTtRQUNWLE9BQU87UUFDUCxPQUFPLEVBQUUsZUFBZTtLQUN6QixDQUFDO0lBRUYsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLHdEQUFhLFVBQVUsR0FBQyxDQUFDO0lBQzVDLE1BQU0sT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUV6QyxPQUFPLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBckJELDBDQXFCQztBQUVNLEtBQUssVUFBVSxXQUFXLENBQy9CLE9BQWUsRUFDZixPQUE0QixFQUM1QixvQkFBNEIsRUFDNUIsYUFBNEI7SUFFNUIsSUFBSSxDQUFDLElBQUEsV0FBSyxHQUFFLEVBQUU7UUFDWixPQUFPLGFBQWEsQ0FBQztLQUN0QjtJQUVELE1BQU0sUUFBUSxHQUFpQjtRQUM3QixJQUFJLEVBQUUsTUFBTTtRQUNaLElBQUksRUFBRSxRQUFRO1FBQ2QsTUFBTSxFQUFFLEVBQUU7UUFDVixPQUFPO1FBQ1AsT0FBTztRQUNQLE9BQU8sRUFBRSxvQkFBb0I7S0FDOUIsQ0FBQztJQUVGLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyx3REFBYSxVQUFVLEdBQUMsQ0FBQztJQUM1QyxNQUFNLE9BQU8sR0FBRyxNQUFNLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFFekMsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQXZCRCxrQ0F1QkM7QUFFTSxLQUFLLFVBQVUsVUFBVSxDQUM5QixPQUFlLEVBQ2YsT0FBZ0MsRUFDaEMsYUFBOEI7SUFFOUIsSUFBSSxDQUFDLElBQUEsV0FBSyxHQUFFLEVBQUU7UUFDWixPQUFPLGFBQWEsQ0FBQztLQUN0QjtJQUVELE1BQU0sUUFBUSxHQUFxQjtRQUNqQyxJQUFJLEVBQUUsVUFBVTtRQUNoQixJQUFJLEVBQUUsUUFBUTtRQUNkLE1BQU0sRUFBRSxFQUFFO1FBQ1YsT0FBTztRQUNQLE9BQU87S0FDUixDQUFDO0lBRUYsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLHdEQUFhLFVBQVUsR0FBQyxDQUFDO0lBQzVDLE1BQU0sT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUV6QyxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBckJELGdDQXFCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIENoZWNrYm94Q2hvaWNlT3B0aW9ucyxcbiAgQ2hlY2tib3hRdWVzdGlvbixcbiAgTGlzdENob2ljZU9wdGlvbnMsXG4gIExpc3RRdWVzdGlvbixcbiAgUXVlc3Rpb24sXG59IGZyb20gJ2lucXVpcmVyJztcbmltcG9ydCB7IGlzVFRZIH0gZnJvbSAnLi90dHknO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXNrQ29uZmlybWF0aW9uKFxuICBtZXNzYWdlOiBzdHJpbmcsXG4gIGRlZmF1bHRSZXNwb25zZTogYm9vbGVhbixcbiAgbm9UVFlSZXNwb25zZT86IGJvb2xlYW4sXG4pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgaWYgKCFpc1RUWSgpKSB7XG4gICAgcmV0dXJuIG5vVFRZUmVzcG9uc2UgPz8gZGVmYXVsdFJlc3BvbnNlO1xuICB9XG5cbiAgY29uc3QgcXVlc3Rpb246IFF1ZXN0aW9uID0ge1xuICAgIHR5cGU6ICdjb25maXJtJyxcbiAgICBuYW1lOiAnY29uZmlybWF0aW9uJyxcbiAgICBwcmVmaXg6ICcnLFxuICAgIG1lc3NhZ2UsXG4gICAgZGVmYXVsdDogZGVmYXVsdFJlc3BvbnNlLFxuICB9O1xuXG4gIGNvbnN0IHsgcHJvbXB0IH0gPSBhd2FpdCBpbXBvcnQoJ2lucXVpcmVyJyk7XG4gIGNvbnN0IGFuc3dlcnMgPSBhd2FpdCBwcm9tcHQoW3F1ZXN0aW9uXSk7XG5cbiAgcmV0dXJuIGFuc3dlcnNbJ2NvbmZpcm1hdGlvbiddO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXNrUXVlc3Rpb24oXG4gIG1lc3NhZ2U6IHN0cmluZyxcbiAgY2hvaWNlczogTGlzdENob2ljZU9wdGlvbnNbXSxcbiAgZGVmYXVsdFJlc3BvbnNlSW5kZXg6IG51bWJlcixcbiAgbm9UVFlSZXNwb25zZTogbnVsbCB8IHN0cmluZyxcbik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICBpZiAoIWlzVFRZKCkpIHtcbiAgICByZXR1cm4gbm9UVFlSZXNwb25zZTtcbiAgfVxuXG4gIGNvbnN0IHF1ZXN0aW9uOiBMaXN0UXVlc3Rpb24gPSB7XG4gICAgdHlwZTogJ2xpc3QnLFxuICAgIG5hbWU6ICdhbnN3ZXInLFxuICAgIHByZWZpeDogJycsXG4gICAgbWVzc2FnZSxcbiAgICBjaG9pY2VzLFxuICAgIGRlZmF1bHQ6IGRlZmF1bHRSZXNwb25zZUluZGV4LFxuICB9O1xuXG4gIGNvbnN0IHsgcHJvbXB0IH0gPSBhd2FpdCBpbXBvcnQoJ2lucXVpcmVyJyk7XG4gIGNvbnN0IGFuc3dlcnMgPSBhd2FpdCBwcm9tcHQoW3F1ZXN0aW9uXSk7XG5cbiAgcmV0dXJuIGFuc3dlcnNbJ2Fuc3dlciddO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXNrQ2hvaWNlcyhcbiAgbWVzc2FnZTogc3RyaW5nLFxuICBjaG9pY2VzOiBDaGVja2JveENob2ljZU9wdGlvbnNbXSxcbiAgbm9UVFlSZXNwb25zZTogc3RyaW5nW10gfCBudWxsLFxuKTogUHJvbWlzZTxzdHJpbmdbXSB8IG51bGw+IHtcbiAgaWYgKCFpc1RUWSgpKSB7XG4gICAgcmV0dXJuIG5vVFRZUmVzcG9uc2U7XG4gIH1cblxuICBjb25zdCBxdWVzdGlvbjogQ2hlY2tib3hRdWVzdGlvbiA9IHtcbiAgICB0eXBlOiAnY2hlY2tib3gnLFxuICAgIG5hbWU6ICdhbnN3ZXInLFxuICAgIHByZWZpeDogJycsXG4gICAgbWVzc2FnZSxcbiAgICBjaG9pY2VzLFxuICB9O1xuXG4gIGNvbnN0IHsgcHJvbXB0IH0gPSBhd2FpdCBpbXBvcnQoJ2lucXVpcmVyJyk7XG4gIGNvbnN0IGFuc3dlcnMgPSBhd2FpdCBwcm9tcHQoW3F1ZXN0aW9uXSk7XG5cbiAgcmV0dXJuIGFuc3dlcnNbJ2Fuc3dlciddO1xufVxuIl19