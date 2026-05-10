import path from "node:path";
import { ensureDir, exists, readJsonFile, writeJsonFile, } from "@nomicfoundation/hardhat-utils/fs";
import { FileJournal } from "../journal/file-journal.js";
import { assertIgnitionInvariant } from "../utils/assertions.js";
export class FileDeploymentLoader {
    _deploymentDirPath;
    _executionEventListener;
    _journal;
    _deploymentDirsEnsured;
    _paths;
    constructor(_deploymentDirPath, _executionEventListener) {
        this._deploymentDirPath = _deploymentDirPath;
        this._executionEventListener = _executionEventListener;
        const artifactsDir = path.join(this._deploymentDirPath, "artifacts");
        const buildInfoDir = path.join(this._deploymentDirPath, "build-info");
        const journalPath = path.join(this._deploymentDirPath, "journal.jsonl");
        const deployedAddressesPath = path.join(this._deploymentDirPath, "deployed_addresses.json");
        this._journal = new FileJournal(journalPath, this._executionEventListener);
        this._paths = {
            deploymentDir: this._deploymentDirPath,
            artifactsDir,
            buildInfoDir,
            journalPath,
            deployedAddressesPath,
        };
        this._deploymentDirsEnsured = false;
    }
    async recordToJournal(message) {
        await this._initialize();
        // NOTE: the journal record is sync, even though this call is async
        await this._journal.record(message);
    }
    readFromJournal() {
        return this._journal.read();
    }
    storeNamedArtifact(futureId, _contractName, artifact) {
        // For a file deployment we don't differentiate between
        // named contracts (from HH) and anonymous contracts passed in by the user
        return this.storeUserProvidedArtifact(futureId, artifact);
    }
    async storeUserProvidedArtifact(futureId, artifact) {
        await this._initialize();
        const artifactFilePath = path.join(this._paths.artifactsDir, `${futureId}.json`);
        await writeJsonFile(artifactFilePath, artifact);
    }
    async storeBuildInfo(_futureId, buildInfo) {
        await this._initialize();
        const buildInfoFilePath = path.join(this._paths.buildInfoDir, `${buildInfo.id}.json`);
        await writeJsonFile(buildInfoFilePath, buildInfo);
    }
    async readBuildInfo(futureId) {
        await this._initialize();
        const artifact = await this.loadArtifact(futureId);
        assertIgnitionInvariant(artifact.buildInfoId !== undefined, "Artifact does not have a buildInfoId");
        const buildInfoPath = path.resolve(this._paths.buildInfoDir, `${artifact.buildInfoId}.json`);
        const buildInfo = (await readJsonFile(buildInfoPath));
        return buildInfo;
    }
    async loadArtifact(futureId) {
        await this._initialize();
        const artifactFilePath = this._resolveArtifactPathFor(futureId);
        const artifact = (await readJsonFile(artifactFilePath));
        return artifact;
    }
    async recordDeployedAddress(futureId, contractAddress) {
        await this._initialize();
        let deployedAddresses;
        if (await exists(this._paths.deployedAddressesPath)) {
            deployedAddresses = await readJsonFile(this._paths.deployedAddressesPath);
        }
        else {
            deployedAddresses = {};
        }
        deployedAddresses[futureId] = contractAddress;
        await writeJsonFile(this._paths.deployedAddressesPath, deployedAddresses);
    }
    async _initialize() {
        if (this._deploymentDirsEnsured) {
            return;
        }
        await ensureDir(this._paths.deploymentDir);
        await ensureDir(this._paths.artifactsDir);
        await ensureDir(this._paths.buildInfoDir);
        this._deploymentDirsEnsured = true;
    }
    _resolveArtifactPathFor(futureId) {
        const artifactFilePath = path.join(this._paths.artifactsDir, `${futureId}.json`);
        return artifactFilePath;
    }
}
//# sourceMappingURL=file-deployment-loader.js.map