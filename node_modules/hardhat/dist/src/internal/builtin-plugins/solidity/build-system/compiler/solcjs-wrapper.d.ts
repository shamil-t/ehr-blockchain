interface Solc {
    cwrap<T>(ident: string, returnType: string | null, argTypes: string[]): T;
    _solidity_reset?: Reset | null;
    _solidity_version?: Version | null;
    _version?: Version | null;
    _compileStandard?: Compile | null;
    _solidity_compile?: Compile | null;
}
type Reset = () => string;
type Version = () => string;
type Compile = (input: string, callbackPtr: number | null, callbackContextPtr?: null) => string;
export interface SolcWrapper {
    compile: CompileWrapper;
    version: Version;
}
export type CompileWrapper = (input: string) => string;
export default function wrapper(solc: Solc): SolcWrapper;
export {};
//# sourceMappingURL=solcjs-wrapper.d.ts.map