import { StandardTestKind, FuzzTestKind, InvariantTestKind } from "../../index";

export enum SortOrder {
  Ascending,
  Descending,
}

export interface GasUsageFilter {
  minThreshold?: bigint;
  maxThreshold?: bigint;
}

export function extractGasUsage(
  testResults: {
    name: string;
    kind: StandardTestKind | FuzzTestKind | InvariantTestKind;
  }[],
  filter?: GasUsageFilter,
  ordering?: SortOrder
): { name: string; gas: bigint }[] {
  const gasUsage: { name: string; gas: bigint }[] = [];

  for (const result of testResults) {
    // Default to zero gas for invariant tests
    const gas = "consumedGas" in result.kind
      ? result.kind.consumedGas
      : "medianGas" in result.kind
        ? result.kind.medianGas
        : BigInt(0);

    if (
      (!filter?.minThreshold || gas >= filter.minThreshold) &&
      (!filter?.maxThreshold || gas <= filter.maxThreshold)
    ) {
      gasUsage.push({ name: result.name, gas });
    }
  }

  if (ordering === SortOrder.Ascending) {
    gasUsage.sort((a, b) => (a.gas < b.gas ? -1 : a.gas > b.gas ? 1 : 0));
  } else if (ordering === SortOrder.Descending) {
    gasUsage.sort((a, b) => (a.gas > b.gas ? -1 : a.gas < b.gas ? 1 : 0));
  }

  return gasUsage;
}
