/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AbsoluteFsPath } from '../../../src/ngtsc/file_system';
import { SourceFile, SourceFileLoader } from '../../../src/ngtsc/sourcemaps';
/**
 * A function that will return a `SourceFile` object (or null) for the current file being linked.
 */
export type GetSourceFileFn = () => SourceFile | null;
/**
 * Create a `GetSourceFileFn` that will return the `SourceFile` being linked or `null`, if not
 * available.
 */
export declare function createGetSourceFile(sourceUrl: AbsoluteFsPath, code: string, loader: SourceFileLoader | null): GetSourceFileFn;
