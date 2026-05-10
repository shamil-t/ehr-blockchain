/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export type InsertionIndex = (properties: string[]) => number;
export type JSONPath = (string | number)[];
export declare function readAndParseJson(path: string): any;
export declare function parseJson(content: string): any;
