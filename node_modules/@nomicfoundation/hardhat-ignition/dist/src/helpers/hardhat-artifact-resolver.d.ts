import type { Artifact, ArtifactResolver, BuildInfo } from "@nomicfoundation/ignition-core";
import type { ArtifactManager } from "hardhat/types/artifacts";
export declare class HardhatArtifactResolver implements ArtifactResolver {
    #private;
    constructor(artifactManager: ArtifactManager);
    getBuildInfo(contractName: string): Promise<BuildInfo | undefined>;
    loadArtifact(contractName: string): Promise<Artifact>;
}
//# sourceMappingURL=hardhat-artifact-resolver.d.ts.map