#!/usr/bin/env node
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
declare function stringEncaseCRLFWithFirstIndex(value: string, prefix: string, postfix: string, index: number): string;
declare function styleMessage(message: string): string;
declare const warningMsg = "\n\n==========================================\n\nALERT: As of Angular 16, \"ngcc\" is no longer required and not invoked during CLI builds. You are seeing this message because the current operation invoked the \"ngcc\" command directly. This \"ngcc\" invocation can be safely removed.\n\nA common reason for this is invoking \"ngcc\" from a \"postinstall\" hook in package.json.\n\nIn Angular 17, this command will be removed. Remove this and any other invocations to prevent errors in later versions.\n\n==========================================\n\n";
