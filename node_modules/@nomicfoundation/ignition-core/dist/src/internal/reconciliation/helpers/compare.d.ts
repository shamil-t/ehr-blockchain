import type { Future } from "../../../types/module.js";
import type { ReconciliationFutureResultFailure } from "../types.js";
export declare function compare<ValueT extends bigint | number | boolean | string | undefined>(future: Future, fieldName: string, existingValue: ValueT, newValue: ValueT, messageSuffix?: string): ReconciliationFutureResultFailure | undefined;
//# sourceMappingURL=compare.d.ts.map