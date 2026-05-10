import { bases } from 'multiformats/basics';
import type { MultibaseCodec } from 'multiformats';
export type SupportedEncodings = 'utf8' | 'utf-8' | 'hex' | 'latin1' | 'ascii' | 'binary' | keyof typeof bases;
declare const BASES: Record<SupportedEncodings, MultibaseCodec<any>>;
export default BASES;
//# sourceMappingURL=bases.d.ts.map