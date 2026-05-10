import type { LastParameter } from "../../../types/utils.js";
import { spawn as nodeSpawn } from "node:child_process";
export declare function spawn(command: string, args: string[], options: LastParameter<typeof nodeSpawn>): Promise<void>;
//# sourceMappingURL=subprocess.d.ts.map