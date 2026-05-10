import { getHardhatVersion } from "../../../../utils/package.js";
export async function clientVersion(edrClientVersion) {
    const hardhatVersion = await getHardhatVersion();
    const edrVersion = edrClientVersion.split("/")[1];
    return `HardhatNetwork/${hardhatVersion}/@nomicfoundation/edr/${edrVersion}`;
}
//# sourceMappingURL=client-version.js.map