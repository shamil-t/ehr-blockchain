import type { ChainType } from "../../../../../types/network.js";
export declare enum L1HardforkName {
    FRONTIER = "chainstart",
    HOMESTEAD = "homestead",
    DAO = "dao",
    TANGERINE_WHISTLE = "tangerineWhistle",
    SPURIOUS_DRAGON = "spuriousDragon",
    BYZANTIUM = "byzantium",
    CONSTANTINOPLE = "constantinople",
    PETERSBURG = "petersburg",
    ISTANBUL = "istanbul",
    MUIR_GLACIER = "muirGlacier",
    BERLIN = "berlin",
    LONDON = "london",
    ARROW_GLACIER = "arrowGlacier",
    GRAY_GLACIER = "grayGlacier",
    MERGE = "merge",
    SHANGHAI = "shanghai",
    CANCUN = "cancun",
    PRAGUE = "prague",
    OSAKA = "osaka"
}
export declare enum OpHardforkName {
    BEDROCK = "bedrock",
    REGOLITH = "regolith",
    CANYON = "canyon",
    ECOTONE = "ecotone",
    FJORD = "fjord",
    GRANITE = "granite",
    HOLOCENE = "holocene",
    ISTHMUS = "isthmus"
}
export declare function getHardforks(chainType: ChainType): string[];
export declare function getCurrentHardfork(chainType: ChainType): string;
/**
 * Check if `hardforkA` is greater than or equal to `hardforkB`,
 * that is, if it includes all its changes.
 *
 * This function is not type-safe, as it accepts any string as hardfork name.
 * It is the caller's responsibility to ensure that the hardfork names are valid.
 */
export declare function hardforkGte(hardforkA: string, hardforkB: string, chainType: ChainType): boolean;
export declare function isValidHardforkName(hardfork: string, chainType: ChainType): boolean;
//# sourceMappingURL=hardfork.d.ts.map