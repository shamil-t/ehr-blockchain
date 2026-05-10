/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Distinguishes different kinds of IR operations.
 *
 * Includes both creation and update operations.
 */
export var OpKind;
(function (OpKind) {
    /**
     * A special operation type which is used to represent the beginning and end nodes of a linked
     * list of operations.
     */
    OpKind[OpKind["ListEnd"] = 0] = "ListEnd";
    /**
     * An operation which wraps an output AST statement.
     */
    OpKind[OpKind["Statement"] = 1] = "Statement";
    /**
     * An operation which declares and initializes a `SemanticVariable`.
     */
    OpKind[OpKind["Variable"] = 2] = "Variable";
    /**
     * An operation to begin rendering of an element.
     */
    OpKind[OpKind["ElementStart"] = 3] = "ElementStart";
    /**
     * An operation to render an element with no children.
     */
    OpKind[OpKind["Element"] = 4] = "Element";
    /**
     * An operation which declares an embedded view.
     */
    OpKind[OpKind["Template"] = 5] = "Template";
    /**
     * An operation to end rendering of an element previously started with `ElementStart`.
     */
    OpKind[OpKind["ElementEnd"] = 6] = "ElementEnd";
    /**
     * An operation to begin an `ng-container`.
     */
    OpKind[OpKind["ContainerStart"] = 7] = "ContainerStart";
    /**
     * An operation for an `ng-container` with no children.
     */
    OpKind[OpKind["Container"] = 8] = "Container";
    /**
     * An operation to end an `ng-container`.
     */
    OpKind[OpKind["ContainerEnd"] = 9] = "ContainerEnd";
    /**
     * An operation disable binding for subsequent elements, which are descendants of a non-bindable
     * node.
     */
    OpKind[OpKind["DisableBindings"] = 10] = "DisableBindings";
    /**
     * An operation to re-enable binding, after it was previously disabled.
     */
    OpKind[OpKind["EnableBindings"] = 11] = "EnableBindings";
    /**
     * An operation to render a text node.
     */
    OpKind[OpKind["Text"] = 12] = "Text";
    /**
     * An operation declaring an event listener for an element.
     */
    OpKind[OpKind["Listener"] = 13] = "Listener";
    /**
     * An operation to interpolate text into a text node.
     */
    OpKind[OpKind["InterpolateText"] = 14] = "InterpolateText";
    /**
     * An intermediate binding op, that has not yet been processed into an individual property,
     * attribute, style, etc.
     */
    OpKind[OpKind["Binding"] = 15] = "Binding";
    /**
     * An operation to bind an expression to a property of an element.
     */
    OpKind[OpKind["Property"] = 16] = "Property";
    /**
     * An operation to bind an expression to a style property of an element.
     */
    OpKind[OpKind["StyleProp"] = 17] = "StyleProp";
    /**
     * An operation to bind an expression to a class property of an element.
     */
    OpKind[OpKind["ClassProp"] = 18] = "ClassProp";
    /**
     * An operation to bind an expression to the styles of an element.
     */
    OpKind[OpKind["StyleMap"] = 19] = "StyleMap";
    /**
     * An operation to bind an expression to the classes of an element.
     */
    OpKind[OpKind["ClassMap"] = 20] = "ClassMap";
    /**
     * An operation to advance the runtime's implicit slot context during the update phase of a view.
     */
    OpKind[OpKind["Advance"] = 21] = "Advance";
    /**
     * An operation to instantiate a pipe.
     */
    OpKind[OpKind["Pipe"] = 22] = "Pipe";
    /**
     * An operation to associate an attribute with an element.
     */
    OpKind[OpKind["Attribute"] = 23] = "Attribute";
    /**
     * A host binding property.
     */
    OpKind[OpKind["HostProperty"] = 24] = "HostProperty";
    /**
     * A namespace change, which causes the subsequent elements to be processed as either HTML or SVG.
     */
    OpKind[OpKind["Namespace"] = 25] = "Namespace";
    // TODO: Add Host Listeners, and possibly other host ops also.
})(OpKind || (OpKind = {}));
/**
 * Distinguishes different kinds of IR expressions.
 */
export var ExpressionKind;
(function (ExpressionKind) {
    /**
     * Read of a variable in a lexical scope.
     */
    ExpressionKind[ExpressionKind["LexicalRead"] = 0] = "LexicalRead";
    /**
     * A reference to the current view context.
     */
    ExpressionKind[ExpressionKind["Context"] = 1] = "Context";
    /**
     * Read of a variable declared in a `VariableOp`.
     */
    ExpressionKind[ExpressionKind["ReadVariable"] = 2] = "ReadVariable";
    /**
     * Runtime operation to navigate to the next view context in the view hierarchy.
     */
    ExpressionKind[ExpressionKind["NextContext"] = 3] = "NextContext";
    /**
     * Runtime operation to retrieve the value of a local reference.
     */
    ExpressionKind[ExpressionKind["Reference"] = 4] = "Reference";
    /**
     * Runtime operation to snapshot the current view context.
     */
    ExpressionKind[ExpressionKind["GetCurrentView"] = 5] = "GetCurrentView";
    /**
     * Runtime operation to restore a snapshotted view.
     */
    ExpressionKind[ExpressionKind["RestoreView"] = 6] = "RestoreView";
    /**
     * Runtime operation to reset the current view context after `RestoreView`.
     */
    ExpressionKind[ExpressionKind["ResetView"] = 7] = "ResetView";
    /**
     * Defines and calls a function with change-detected arguments.
     */
    ExpressionKind[ExpressionKind["PureFunctionExpr"] = 8] = "PureFunctionExpr";
    /**
     * Indicates a positional parameter to a pure function definition.
     */
    ExpressionKind[ExpressionKind["PureFunctionParameterExpr"] = 9] = "PureFunctionParameterExpr";
    /**
     * Binding to a pipe transformation.
     */
    ExpressionKind[ExpressionKind["PipeBinding"] = 10] = "PipeBinding";
    /**
     * Binding to a pipe transformation with a variable number of arguments.
     */
    ExpressionKind[ExpressionKind["PipeBindingVariadic"] = 11] = "PipeBindingVariadic";
    /*
     * A safe property read requiring expansion into a null check.
     */
    ExpressionKind[ExpressionKind["SafePropertyRead"] = 12] = "SafePropertyRead";
    /**
     * A safe keyed read requiring expansion into a null check.
     */
    ExpressionKind[ExpressionKind["SafeKeyedRead"] = 13] = "SafeKeyedRead";
    /**
     * A safe function call requiring expansion into a null check.
     */
    ExpressionKind[ExpressionKind["SafeInvokeFunction"] = 14] = "SafeInvokeFunction";
    /**
     * An intermediate expression that will be expanded from a safe read into an explicit ternary.
     */
    ExpressionKind[ExpressionKind["SafeTernaryExpr"] = 15] = "SafeTernaryExpr";
    /**
     * An empty expression that will be stipped before generating the final output.
     */
    ExpressionKind[ExpressionKind["EmptyExpr"] = 16] = "EmptyExpr";
    /*
     * An assignment to a temporary variable.
     */
    ExpressionKind[ExpressionKind["AssignTemporaryExpr"] = 17] = "AssignTemporaryExpr";
    /**
     * A reference to a temporary variable.
     */
    ExpressionKind[ExpressionKind["ReadTemporaryExpr"] = 18] = "ReadTemporaryExpr";
    /**
     * An expression representing a sanitizer function.
     */
    ExpressionKind[ExpressionKind["SanitizerExpr"] = 19] = "SanitizerExpr";
})(ExpressionKind || (ExpressionKind = {}));
/**
 * Distinguishes between different kinds of `SemanticVariable`s.
 */
export var SemanticVariableKind;
(function (SemanticVariableKind) {
    /**
     * Represents the context of a particular view.
     */
    SemanticVariableKind[SemanticVariableKind["Context"] = 0] = "Context";
    /**
     * Represents an identifier declared in the lexical scope of a view.
     */
    SemanticVariableKind[SemanticVariableKind["Identifier"] = 1] = "Identifier";
    /**
     * Represents a saved state that can be used to restore a view in a listener handler function.
     */
    SemanticVariableKind[SemanticVariableKind["SavedView"] = 2] = "SavedView";
})(SemanticVariableKind || (SemanticVariableKind = {}));
/**
 * Whether to compile in compatibilty mode. In compatibility mode, the template pipeline will
 * attempt to match the output of `TemplateDefinitionBuilder` as exactly as possible, at the cost of
 * producing quirky or larger code in some cases.
 */
export var CompatibilityMode;
(function (CompatibilityMode) {
    CompatibilityMode[CompatibilityMode["Normal"] = 0] = "Normal";
    CompatibilityMode[CompatibilityMode["TemplateDefinitionBuilder"] = 1] = "TemplateDefinitionBuilder";
})(CompatibilityMode || (CompatibilityMode = {}));
/**
 * Represents functions used to sanitize different pieces of a template.
 */
export var SanitizerFn;
(function (SanitizerFn) {
    SanitizerFn[SanitizerFn["Html"] = 0] = "Html";
    SanitizerFn[SanitizerFn["Script"] = 1] = "Script";
    SanitizerFn[SanitizerFn["Style"] = 2] = "Style";
    SanitizerFn[SanitizerFn["Url"] = 3] = "Url";
    SanitizerFn[SanitizerFn["ResourceUrl"] = 4] = "ResourceUrl";
    SanitizerFn[SanitizerFn["IframeAttribute"] = 5] = "IframeAttribute";
})(SanitizerFn || (SanitizerFn = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci9zcmMvdGVtcGxhdGUvcGlwZWxpbmUvaXIvc3JjL2VudW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVIOzs7O0dBSUc7QUFDSCxNQUFNLENBQU4sSUFBWSxNQXVJWDtBQXZJRCxXQUFZLE1BQU07SUFDaEI7OztPQUdHO0lBQ0gseUNBQU8sQ0FBQTtJQUVQOztPQUVHO0lBQ0gsNkNBQVMsQ0FBQTtJQUVUOztPQUVHO0lBQ0gsMkNBQVEsQ0FBQTtJQUVSOztPQUVHO0lBQ0gsbURBQVksQ0FBQTtJQUVaOztPQUVHO0lBQ0gseUNBQU8sQ0FBQTtJQUVQOztPQUVHO0lBQ0gsMkNBQVEsQ0FBQTtJQUVSOztPQUVHO0lBQ0gsK0NBQVUsQ0FBQTtJQUVWOztPQUVHO0lBQ0gsdURBQWMsQ0FBQTtJQUVkOztPQUVHO0lBQ0gsNkNBQVMsQ0FBQTtJQUVUOztPQUVHO0lBQ0gsbURBQVksQ0FBQTtJQUVaOzs7T0FHRztJQUNILDBEQUFlLENBQUE7SUFFZjs7T0FFRztJQUNILHdEQUFjLENBQUE7SUFFZDs7T0FFRztJQUNILG9DQUFJLENBQUE7SUFFSjs7T0FFRztJQUNILDRDQUFRLENBQUE7SUFFUjs7T0FFRztJQUNILDBEQUFlLENBQUE7SUFFZjs7O09BR0c7SUFDSCwwQ0FBTyxDQUFBO0lBRVA7O09BRUc7SUFDSCw0Q0FBUSxDQUFBO0lBRVI7O09BRUc7SUFDSCw4Q0FBUyxDQUFBO0lBRVQ7O09BRUc7SUFDSCw4Q0FBUyxDQUFBO0lBRVQ7O09BRUc7SUFDSCw0Q0FBUSxDQUFBO0lBRVI7O09BRUc7SUFDSCw0Q0FBUSxDQUFBO0lBRVI7O09BRUc7SUFDSCwwQ0FBTyxDQUFBO0lBRVA7O09BRUc7SUFDSCxvQ0FBSSxDQUFBO0lBRUo7O09BRUc7SUFDSCw4Q0FBUyxDQUFBO0lBRVQ7O09BRUc7SUFDSCxvREFBWSxDQUFBO0lBRVo7O09BRUc7SUFDSCw4Q0FBUyxDQUFBO0lBRVQsOERBQThEO0FBQ2hFLENBQUMsRUF2SVcsTUFBTSxLQUFOLE1BQU0sUUF1SWpCO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLENBQU4sSUFBWSxjQW9HWDtBQXBHRCxXQUFZLGNBQWM7SUFDeEI7O09BRUc7SUFDSCxpRUFBVyxDQUFBO0lBRVg7O09BRUc7SUFDSCx5REFBTyxDQUFBO0lBRVA7O09BRUc7SUFDSCxtRUFBWSxDQUFBO0lBRVo7O09BRUc7SUFDSCxpRUFBVyxDQUFBO0lBRVg7O09BRUc7SUFDSCw2REFBUyxDQUFBO0lBRVQ7O09BRUc7SUFDSCx1RUFBYyxDQUFBO0lBRWQ7O09BRUc7SUFDSCxpRUFBVyxDQUFBO0lBRVg7O09BRUc7SUFDSCw2REFBUyxDQUFBO0lBRVQ7O09BRUc7SUFDSCwyRUFBZ0IsQ0FBQTtJQUVoQjs7T0FFRztJQUNILDZGQUF5QixDQUFBO0lBRXpCOztPQUVHO0lBQ0gsa0VBQVcsQ0FBQTtJQUVYOztPQUVHO0lBQ0gsa0ZBQW1CLENBQUE7SUFFbkI7O09BRUc7SUFDSCw0RUFBZ0IsQ0FBQTtJQUVoQjs7T0FFRztJQUNILHNFQUFhLENBQUE7SUFFYjs7T0FFRztJQUNILGdGQUFrQixDQUFBO0lBRWxCOztPQUVHO0lBQ0gsMEVBQWUsQ0FBQTtJQUVmOztPQUVHO0lBQ0gsOERBQVMsQ0FBQTtJQUVUOztPQUVHO0lBQ0gsa0ZBQW1CLENBQUE7SUFFbkI7O09BRUc7SUFDSCw4RUFBaUIsQ0FBQTtJQUVqQjs7T0FFRztJQUNILHNFQUFhLENBQUE7QUFDZixDQUFDLEVBcEdXLGNBQWMsS0FBZCxjQUFjLFFBb0d6QjtBQUVEOztHQUVHO0FBQ0gsTUFBTSxDQUFOLElBQVksb0JBZVg7QUFmRCxXQUFZLG9CQUFvQjtJQUM5Qjs7T0FFRztJQUNILHFFQUFPLENBQUE7SUFFUDs7T0FFRztJQUNILDJFQUFVLENBQUE7SUFFVjs7T0FFRztJQUNILHlFQUFTLENBQUE7QUFDWCxDQUFDLEVBZlcsb0JBQW9CLEtBQXBCLG9CQUFvQixRQWUvQjtBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLENBQU4sSUFBWSxpQkFHWDtBQUhELFdBQVksaUJBQWlCO0lBQzNCLDZEQUFNLENBQUE7SUFDTixtR0FBeUIsQ0FBQTtBQUMzQixDQUFDLEVBSFcsaUJBQWlCLEtBQWpCLGlCQUFpQixRQUc1QjtBQUVEOztHQUVHO0FBQ0gsTUFBTSxDQUFOLElBQVksV0FPWDtBQVBELFdBQVksV0FBVztJQUNyQiw2Q0FBSSxDQUFBO0lBQ0osaURBQU0sQ0FBQTtJQUNOLCtDQUFLLENBQUE7SUFDTCwyQ0FBRyxDQUFBO0lBQ0gsMkRBQVcsQ0FBQTtJQUNYLG1FQUFlLENBQUE7QUFDakIsQ0FBQyxFQVBXLFdBQVcsS0FBWCxXQUFXLFFBT3RCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogRGlzdGluZ3Vpc2hlcyBkaWZmZXJlbnQga2luZHMgb2YgSVIgb3BlcmF0aW9ucy5cbiAqXG4gKiBJbmNsdWRlcyBib3RoIGNyZWF0aW9uIGFuZCB1cGRhdGUgb3BlcmF0aW9ucy5cbiAqL1xuZXhwb3J0IGVudW0gT3BLaW5kIHtcbiAgLyoqXG4gICAqIEEgc3BlY2lhbCBvcGVyYXRpb24gdHlwZSB3aGljaCBpcyB1c2VkIHRvIHJlcHJlc2VudCB0aGUgYmVnaW5uaW5nIGFuZCBlbmQgbm9kZXMgb2YgYSBsaW5rZWRcbiAgICogbGlzdCBvZiBvcGVyYXRpb25zLlxuICAgKi9cbiAgTGlzdEVuZCxcblxuICAvKipcbiAgICogQW4gb3BlcmF0aW9uIHdoaWNoIHdyYXBzIGFuIG91dHB1dCBBU1Qgc3RhdGVtZW50LlxuICAgKi9cbiAgU3RhdGVtZW50LFxuXG4gIC8qKlxuICAgKiBBbiBvcGVyYXRpb24gd2hpY2ggZGVjbGFyZXMgYW5kIGluaXRpYWxpemVzIGEgYFNlbWFudGljVmFyaWFibGVgLlxuICAgKi9cbiAgVmFyaWFibGUsXG5cbiAgLyoqXG4gICAqIEFuIG9wZXJhdGlvbiB0byBiZWdpbiByZW5kZXJpbmcgb2YgYW4gZWxlbWVudC5cbiAgICovXG4gIEVsZW1lbnRTdGFydCxcblxuICAvKipcbiAgICogQW4gb3BlcmF0aW9uIHRvIHJlbmRlciBhbiBlbGVtZW50IHdpdGggbm8gY2hpbGRyZW4uXG4gICAqL1xuICBFbGVtZW50LFxuXG4gIC8qKlxuICAgKiBBbiBvcGVyYXRpb24gd2hpY2ggZGVjbGFyZXMgYW4gZW1iZWRkZWQgdmlldy5cbiAgICovXG4gIFRlbXBsYXRlLFxuXG4gIC8qKlxuICAgKiBBbiBvcGVyYXRpb24gdG8gZW5kIHJlbmRlcmluZyBvZiBhbiBlbGVtZW50IHByZXZpb3VzbHkgc3RhcnRlZCB3aXRoIGBFbGVtZW50U3RhcnRgLlxuICAgKi9cbiAgRWxlbWVudEVuZCxcblxuICAvKipcbiAgICogQW4gb3BlcmF0aW9uIHRvIGJlZ2luIGFuIGBuZy1jb250YWluZXJgLlxuICAgKi9cbiAgQ29udGFpbmVyU3RhcnQsXG5cbiAgLyoqXG4gICAqIEFuIG9wZXJhdGlvbiBmb3IgYW4gYG5nLWNvbnRhaW5lcmAgd2l0aCBubyBjaGlsZHJlbi5cbiAgICovXG4gIENvbnRhaW5lcixcblxuICAvKipcbiAgICogQW4gb3BlcmF0aW9uIHRvIGVuZCBhbiBgbmctY29udGFpbmVyYC5cbiAgICovXG4gIENvbnRhaW5lckVuZCxcblxuICAvKipcbiAgICogQW4gb3BlcmF0aW9uIGRpc2FibGUgYmluZGluZyBmb3Igc3Vic2VxdWVudCBlbGVtZW50cywgd2hpY2ggYXJlIGRlc2NlbmRhbnRzIG9mIGEgbm9uLWJpbmRhYmxlXG4gICAqIG5vZGUuXG4gICAqL1xuICBEaXNhYmxlQmluZGluZ3MsXG5cbiAgLyoqXG4gICAqIEFuIG9wZXJhdGlvbiB0byByZS1lbmFibGUgYmluZGluZywgYWZ0ZXIgaXQgd2FzIHByZXZpb3VzbHkgZGlzYWJsZWQuXG4gICAqL1xuICBFbmFibGVCaW5kaW5ncyxcblxuICAvKipcbiAgICogQW4gb3BlcmF0aW9uIHRvIHJlbmRlciBhIHRleHQgbm9kZS5cbiAgICovXG4gIFRleHQsXG5cbiAgLyoqXG4gICAqIEFuIG9wZXJhdGlvbiBkZWNsYXJpbmcgYW4gZXZlbnQgbGlzdGVuZXIgZm9yIGFuIGVsZW1lbnQuXG4gICAqL1xuICBMaXN0ZW5lcixcblxuICAvKipcbiAgICogQW4gb3BlcmF0aW9uIHRvIGludGVycG9sYXRlIHRleHQgaW50byBhIHRleHQgbm9kZS5cbiAgICovXG4gIEludGVycG9sYXRlVGV4dCxcblxuICAvKipcbiAgICogQW4gaW50ZXJtZWRpYXRlIGJpbmRpbmcgb3AsIHRoYXQgaGFzIG5vdCB5ZXQgYmVlbiBwcm9jZXNzZWQgaW50byBhbiBpbmRpdmlkdWFsIHByb3BlcnR5LFxuICAgKiBhdHRyaWJ1dGUsIHN0eWxlLCBldGMuXG4gICAqL1xuICBCaW5kaW5nLFxuXG4gIC8qKlxuICAgKiBBbiBvcGVyYXRpb24gdG8gYmluZCBhbiBleHByZXNzaW9uIHRvIGEgcHJvcGVydHkgb2YgYW4gZWxlbWVudC5cbiAgICovXG4gIFByb3BlcnR5LFxuXG4gIC8qKlxuICAgKiBBbiBvcGVyYXRpb24gdG8gYmluZCBhbiBleHByZXNzaW9uIHRvIGEgc3R5bGUgcHJvcGVydHkgb2YgYW4gZWxlbWVudC5cbiAgICovXG4gIFN0eWxlUHJvcCxcblxuICAvKipcbiAgICogQW4gb3BlcmF0aW9uIHRvIGJpbmQgYW4gZXhwcmVzc2lvbiB0byBhIGNsYXNzIHByb3BlcnR5IG9mIGFuIGVsZW1lbnQuXG4gICAqL1xuICBDbGFzc1Byb3AsXG5cbiAgLyoqXG4gICAqIEFuIG9wZXJhdGlvbiB0byBiaW5kIGFuIGV4cHJlc3Npb24gdG8gdGhlIHN0eWxlcyBvZiBhbiBlbGVtZW50LlxuICAgKi9cbiAgU3R5bGVNYXAsXG5cbiAgLyoqXG4gICAqIEFuIG9wZXJhdGlvbiB0byBiaW5kIGFuIGV4cHJlc3Npb24gdG8gdGhlIGNsYXNzZXMgb2YgYW4gZWxlbWVudC5cbiAgICovXG4gIENsYXNzTWFwLFxuXG4gIC8qKlxuICAgKiBBbiBvcGVyYXRpb24gdG8gYWR2YW5jZSB0aGUgcnVudGltZSdzIGltcGxpY2l0IHNsb3QgY29udGV4dCBkdXJpbmcgdGhlIHVwZGF0ZSBwaGFzZSBvZiBhIHZpZXcuXG4gICAqL1xuICBBZHZhbmNlLFxuXG4gIC8qKlxuICAgKiBBbiBvcGVyYXRpb24gdG8gaW5zdGFudGlhdGUgYSBwaXBlLlxuICAgKi9cbiAgUGlwZSxcblxuICAvKipcbiAgICogQW4gb3BlcmF0aW9uIHRvIGFzc29jaWF0ZSBhbiBhdHRyaWJ1dGUgd2l0aCBhbiBlbGVtZW50LlxuICAgKi9cbiAgQXR0cmlidXRlLFxuXG4gIC8qKlxuICAgKiBBIGhvc3QgYmluZGluZyBwcm9wZXJ0eS5cbiAgICovXG4gIEhvc3RQcm9wZXJ0eSxcblxuICAvKipcbiAgICogQSBuYW1lc3BhY2UgY2hhbmdlLCB3aGljaCBjYXVzZXMgdGhlIHN1YnNlcXVlbnQgZWxlbWVudHMgdG8gYmUgcHJvY2Vzc2VkIGFzIGVpdGhlciBIVE1MIG9yIFNWRy5cbiAgICovXG4gIE5hbWVzcGFjZSxcblxuICAvLyBUT0RPOiBBZGQgSG9zdCBMaXN0ZW5lcnMsIGFuZCBwb3NzaWJseSBvdGhlciBob3N0IG9wcyBhbHNvLlxufVxuXG4vKipcbiAqIERpc3Rpbmd1aXNoZXMgZGlmZmVyZW50IGtpbmRzIG9mIElSIGV4cHJlc3Npb25zLlxuICovXG5leHBvcnQgZW51bSBFeHByZXNzaW9uS2luZCB7XG4gIC8qKlxuICAgKiBSZWFkIG9mIGEgdmFyaWFibGUgaW4gYSBsZXhpY2FsIHNjb3BlLlxuICAgKi9cbiAgTGV4aWNhbFJlYWQsXG5cbiAgLyoqXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IHZpZXcgY29udGV4dC5cbiAgICovXG4gIENvbnRleHQsXG5cbiAgLyoqXG4gICAqIFJlYWQgb2YgYSB2YXJpYWJsZSBkZWNsYXJlZCBpbiBhIGBWYXJpYWJsZU9wYC5cbiAgICovXG4gIFJlYWRWYXJpYWJsZSxcblxuICAvKipcbiAgICogUnVudGltZSBvcGVyYXRpb24gdG8gbmF2aWdhdGUgdG8gdGhlIG5leHQgdmlldyBjb250ZXh0IGluIHRoZSB2aWV3IGhpZXJhcmNoeS5cbiAgICovXG4gIE5leHRDb250ZXh0LFxuXG4gIC8qKlxuICAgKiBSdW50aW1lIG9wZXJhdGlvbiB0byByZXRyaWV2ZSB0aGUgdmFsdWUgb2YgYSBsb2NhbCByZWZlcmVuY2UuXG4gICAqL1xuICBSZWZlcmVuY2UsXG5cbiAgLyoqXG4gICAqIFJ1bnRpbWUgb3BlcmF0aW9uIHRvIHNuYXBzaG90IHRoZSBjdXJyZW50IHZpZXcgY29udGV4dC5cbiAgICovXG4gIEdldEN1cnJlbnRWaWV3LFxuXG4gIC8qKlxuICAgKiBSdW50aW1lIG9wZXJhdGlvbiB0byByZXN0b3JlIGEgc25hcHNob3R0ZWQgdmlldy5cbiAgICovXG4gIFJlc3RvcmVWaWV3LFxuXG4gIC8qKlxuICAgKiBSdW50aW1lIG9wZXJhdGlvbiB0byByZXNldCB0aGUgY3VycmVudCB2aWV3IGNvbnRleHQgYWZ0ZXIgYFJlc3RvcmVWaWV3YC5cbiAgICovXG4gIFJlc2V0VmlldyxcblxuICAvKipcbiAgICogRGVmaW5lcyBhbmQgY2FsbHMgYSBmdW5jdGlvbiB3aXRoIGNoYW5nZS1kZXRlY3RlZCBhcmd1bWVudHMuXG4gICAqL1xuICBQdXJlRnVuY3Rpb25FeHByLFxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgYSBwb3NpdGlvbmFsIHBhcmFtZXRlciB0byBhIHB1cmUgZnVuY3Rpb24gZGVmaW5pdGlvbi5cbiAgICovXG4gIFB1cmVGdW5jdGlvblBhcmFtZXRlckV4cHIsXG5cbiAgLyoqXG4gICAqIEJpbmRpbmcgdG8gYSBwaXBlIHRyYW5zZm9ybWF0aW9uLlxuICAgKi9cbiAgUGlwZUJpbmRpbmcsXG5cbiAgLyoqXG4gICAqIEJpbmRpbmcgdG8gYSBwaXBlIHRyYW5zZm9ybWF0aW9uIHdpdGggYSB2YXJpYWJsZSBudW1iZXIgb2YgYXJndW1lbnRzLlxuICAgKi9cbiAgUGlwZUJpbmRpbmdWYXJpYWRpYyxcblxuICAvKlxuICAgKiBBIHNhZmUgcHJvcGVydHkgcmVhZCByZXF1aXJpbmcgZXhwYW5zaW9uIGludG8gYSBudWxsIGNoZWNrLlxuICAgKi9cbiAgU2FmZVByb3BlcnR5UmVhZCxcblxuICAvKipcbiAgICogQSBzYWZlIGtleWVkIHJlYWQgcmVxdWlyaW5nIGV4cGFuc2lvbiBpbnRvIGEgbnVsbCBjaGVjay5cbiAgICovXG4gIFNhZmVLZXllZFJlYWQsXG5cbiAgLyoqXG4gICAqIEEgc2FmZSBmdW5jdGlvbiBjYWxsIHJlcXVpcmluZyBleHBhbnNpb24gaW50byBhIG51bGwgY2hlY2suXG4gICAqL1xuICBTYWZlSW52b2tlRnVuY3Rpb24sXG5cbiAgLyoqXG4gICAqIEFuIGludGVybWVkaWF0ZSBleHByZXNzaW9uIHRoYXQgd2lsbCBiZSBleHBhbmRlZCBmcm9tIGEgc2FmZSByZWFkIGludG8gYW4gZXhwbGljaXQgdGVybmFyeS5cbiAgICovXG4gIFNhZmVUZXJuYXJ5RXhwcixcblxuICAvKipcbiAgICogQW4gZW1wdHkgZXhwcmVzc2lvbiB0aGF0IHdpbGwgYmUgc3RpcHBlZCBiZWZvcmUgZ2VuZXJhdGluZyB0aGUgZmluYWwgb3V0cHV0LlxuICAgKi9cbiAgRW1wdHlFeHByLFxuXG4gIC8qXG4gICAqIEFuIGFzc2lnbm1lbnQgdG8gYSB0ZW1wb3JhcnkgdmFyaWFibGUuXG4gICAqL1xuICBBc3NpZ25UZW1wb3JhcnlFeHByLFxuXG4gIC8qKlxuICAgKiBBIHJlZmVyZW5jZSB0byBhIHRlbXBvcmFyeSB2YXJpYWJsZS5cbiAgICovXG4gIFJlYWRUZW1wb3JhcnlFeHByLFxuXG4gIC8qKlxuICAgKiBBbiBleHByZXNzaW9uIHJlcHJlc2VudGluZyBhIHNhbml0aXplciBmdW5jdGlvbi5cbiAgICovXG4gIFNhbml0aXplckV4cHIsXG59XG5cbi8qKlxuICogRGlzdGluZ3Vpc2hlcyBiZXR3ZWVuIGRpZmZlcmVudCBraW5kcyBvZiBgU2VtYW50aWNWYXJpYWJsZWBzLlxuICovXG5leHBvcnQgZW51bSBTZW1hbnRpY1ZhcmlhYmxlS2luZCB7XG4gIC8qKlxuICAgKiBSZXByZXNlbnRzIHRoZSBjb250ZXh0IG9mIGEgcGFydGljdWxhciB2aWV3LlxuICAgKi9cbiAgQ29udGV4dCxcblxuICAvKipcbiAgICogUmVwcmVzZW50cyBhbiBpZGVudGlmaWVyIGRlY2xhcmVkIGluIHRoZSBsZXhpY2FsIHNjb3BlIG9mIGEgdmlldy5cbiAgICovXG4gIElkZW50aWZpZXIsXG5cbiAgLyoqXG4gICAqIFJlcHJlc2VudHMgYSBzYXZlZCBzdGF0ZSB0aGF0IGNhbiBiZSB1c2VkIHRvIHJlc3RvcmUgYSB2aWV3IGluIGEgbGlzdGVuZXIgaGFuZGxlciBmdW5jdGlvbi5cbiAgICovXG4gIFNhdmVkVmlldyxcbn1cblxuLyoqXG4gKiBXaGV0aGVyIHRvIGNvbXBpbGUgaW4gY29tcGF0aWJpbHR5IG1vZGUuIEluIGNvbXBhdGliaWxpdHkgbW9kZSwgdGhlIHRlbXBsYXRlIHBpcGVsaW5lIHdpbGxcbiAqIGF0dGVtcHQgdG8gbWF0Y2ggdGhlIG91dHB1dCBvZiBgVGVtcGxhdGVEZWZpbml0aW9uQnVpbGRlcmAgYXMgZXhhY3RseSBhcyBwb3NzaWJsZSwgYXQgdGhlIGNvc3Qgb2ZcbiAqIHByb2R1Y2luZyBxdWlya3kgb3IgbGFyZ2VyIGNvZGUgaW4gc29tZSBjYXNlcy5cbiAqL1xuZXhwb3J0IGVudW0gQ29tcGF0aWJpbGl0eU1vZGUge1xuICBOb3JtYWwsXG4gIFRlbXBsYXRlRGVmaW5pdGlvbkJ1aWxkZXIsXG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBmdW5jdGlvbnMgdXNlZCB0byBzYW5pdGl6ZSBkaWZmZXJlbnQgcGllY2VzIG9mIGEgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBlbnVtIFNhbml0aXplckZuIHtcbiAgSHRtbCxcbiAgU2NyaXB0LFxuICBTdHlsZSxcbiAgVXJsLFxuICBSZXNvdXJjZVVybCxcbiAgSWZyYW1lQXR0cmlidXRlLFxufVxuIl19