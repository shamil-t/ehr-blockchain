import type { DeploymentLoader } from "./types.js";
import type { Artifact, ArtifactResolver, BuildInfo } from "../../types/artifact.js";
import type { ExecutionEventListener } from "../../types/execution-events.js";
import type { JournalMessage } from "../execution/types/messages.js";
/**
 * Stores and loads deployment related information without making changes
 * on disk, by either storing in memory or loading already existing files.
 * Used when running in environments like Hardhat tests.
 */
export declare class EphemeralDeploymentLoader implements DeploymentLoader {
    private readonly _artifactResolver;
    private readonly _executionEventListener?;
    private readonly _journal;
    private _deployedAddresses;
    private _savedArtifacts;
    constructor(_artifactResolver: ArtifactResolver, _executionEventListener?: ExecutionEventListener | undefined);
    recordToJournal(message: JournalMessage): Promise<void>;
    readFromJournal(): AsyncGenerator<JournalMessage, any, unknown>;
    recordDeployedAddress(futureId: string, contractAddress: string): Promise<void>;
    storeBuildInfo(_futureId: string, _buildInfo: BuildInfo): Promise<void>;
    storeNamedArtifact(futureId: string, contractName: string, _artifact: Artifact): Promise<void>;
    storeUserProvidedArtifact(futureId: string, artifact: Artifact): Promise<void>;
    loadArtifact(artifactId: string): Promise<Artifact>;
}
//# sourceMappingURL=ephemeral-deployment-loader.d.ts.map