/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ParseSourceSpan } from '@angular/compiler';
import ts from 'typescript';
import { TemplateDiagnostic, TemplateId, TemplateSourceMapping } from '../../api';
/**
 * Constructs a `ts.Diagnostic` for a given `ParseSourceSpan` within a template.
 */
export declare function makeTemplateDiagnostic(templateId: TemplateId, mapping: TemplateSourceMapping, span: ParseSourceSpan, category: ts.DiagnosticCategory, code: number, messageText: string | ts.DiagnosticMessageChain, relatedMessages?: {
    text: string;
    start: number;
    end: number;
    sourceFile: ts.SourceFile;
}[]): TemplateDiagnostic;
export declare function setParseTemplateAsSourceFileForTest(fn: typeof parseTemplateAsSourceFile): void;
export declare function resetParseTemplateAsSourceFileForTest(): void;
declare function parseTemplateAsSourceFile(fileName: string, template: string): ts.SourceFile;
export declare function isTemplateDiagnostic(diagnostic: ts.Diagnostic): diagnostic is TemplateDiagnostic;
export {};
