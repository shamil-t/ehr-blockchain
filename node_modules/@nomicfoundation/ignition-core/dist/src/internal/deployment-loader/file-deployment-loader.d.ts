import type { DeploymentLoader } from "./types.js";
import type { Artifact, BuildInfo } from "../../types/artifact.js";
import type { ExecutionEventListener } from "../../types/execution-events.js";
import type { JournalMessage } from "../execution/types/messages.js";
export declare class FileDeploymentLoader implements DeploymentLoader {
    private readonly _deploymentDirPath;
    private readonly _executionEventListener?;
    private readonly _journal;
    private _deploymentDirsEnsured;
    private readonly _paths;
    constructor(_deploymentDirPath: string, _executionEventListener?: ExecutionEventListener | undefined);
    recordToJournal(message: JournalMessage): Promise<void>;
    readFromJournal(): AsyncGenerator<JournalMessage, any, unknown>;
    storeNamedArtifact(futureId: string, _contractName: string, artifact: Artifact): Promise<void>;
    storeUserProvidedArtifact(futureId: string, artifact: Artifact): Promise<void>;
    storeBuildInfo(_futureId: string, buildInfo: BuildInfo): Promise<void>;
    readBuildInfo(futureId: string): Promise<BuildInfo>;
    loadArtifact(futureId: string): Promise<Artifact>;
    recordDeployedAddress(futureId: string, contractAddress: string): Promise<void>;
    private _initialize;
    private _resolveArtifactPathFor;
}
//# sourceMappingURL=file-deployment-loader.d.ts.map