/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Scans a CSS or Sass file and locates all valid url function values as defined by the
 * syntax specification.
 * @param contents A string containing a CSS or Sass file to scan.
 * @returns An iterable that yields each CSS url function value found.
 */
export declare function findUrls(contents: string): Iterable<{
    start: number;
    end: number;
    value: string;
}>;
/**
 * Scans a CSS or Sass file and locates all valid import/use directive values as defined by the
 * syntax specification.
 * @param contents A string containing a CSS or Sass file to scan.
 * @returns An iterable that yields each CSS directive value found.
 */
export declare function findImports(contents: string): Iterable<{
    start: number;
    end: number;
    specifier: string;
}>;
