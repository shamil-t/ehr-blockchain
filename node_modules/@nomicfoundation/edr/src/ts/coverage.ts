import * as fs from "fs";
import * as path from "path";

import { COVERAGE_LIBRARY_FILE_NAME } from "@nomicfoundation/edr";

export interface CoverageLib {
  content: string;
  filename: string;
}

export function getCoverageLibrary(): CoverageLib {
  const packageRoot = path.dirname(require.resolve("@nomicfoundation/edr"));
  const sourcePath = path.join(packageRoot, "coverage.sol");
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `Coverage library file not found at ${sourcePath}. It should be bundled with @nomicfoundation/edr.`,
    );
  }
  return {
    content: fs.readFileSync(sourcePath, "utf-8"),
    filename: COVERAGE_LIBRARY_FILE_NAME,
  };
}
