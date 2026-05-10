import type { Artifact } from "../../../../types/artifacts.js";
import type { CompilationJob } from "../../../../types/solidity/compilation-job.js";
import type { CompilerOutput, CompilerOutputContract } from "../../../../types/solidity/compiler-io.js";
import type { SolidityBuildInfo, SolidityBuildInfoOutput } from "../../../../types/solidity/solidity-artifacts.js";
export declare function getContractArtifact(buildInfoId: string, userSourceName: string, inputSourceName: string, contractName: string, contract: CompilerOutputContract): Artifact;
export declare function getArtifactsDeclarationFile(artifacts: Artifact[]): string;
export declare function getDuplicatedContractNamesDeclarationFile(duplicatedContractNames: string[]): string;
export declare function getBuildInfo(compilationJob: CompilationJob): Promise<SolidityBuildInfo>;
export declare function getBuildInfoOutput(compilationJob: CompilationJob, compilerOutput: CompilerOutput): Promise<SolidityBuildInfoOutput>;
//# sourceMappingURL=artifacts.d.ts.map