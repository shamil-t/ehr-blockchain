import { CustomError } from "./error.js";
export class InvalidParameterError extends CustomError {
    constructor(message, cause) {
        super(message, cause);
    }
}
//# sourceMappingURL=common-errors.js.map