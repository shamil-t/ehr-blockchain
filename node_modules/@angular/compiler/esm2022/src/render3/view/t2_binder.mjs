/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AST, ImplicitReceiver, RecursiveAstVisitor } from '../../expression_parser/ast';
import { BoundDeferredTrigger, Template } from '../r3_ast';
import { createCssSelector } from './template';
import { getAttrsForDirectiveMatching } from './util';
/**
 * Processes `Target`s with a given set of directives and performs a binding operation, which
 * returns an object similar to TypeScript's `ts.TypeChecker` that contains knowledge about the
 * target.
 */
export class R3TargetBinder {
    constructor(directiveMatcher) {
        this.directiveMatcher = directiveMatcher;
    }
    /**
     * Perform a binding operation on the given `Target` and return a `BoundTarget` which contains
     * metadata about the types referenced in the template.
     */
    bind(target) {
        if (!target.template) {
            // TODO(alxhub): handle targets which contain things like HostBindings, etc.
            throw new Error('Binding without a template not yet supported');
        }
        // First, parse the template into a `Scope` structure. This operation captures the syntactic
        // scopes in the template and makes them available for later use.
        const scope = Scope.apply(target.template);
        // Use the `Scope` to extract the entities present at every level of the template.
        const templateEntities = extractTemplateEntities(scope);
        // Next, perform directive matching on the template using the `DirectiveBinder`. This returns:
        //   - directives: Map of nodes (elements & ng-templates) to the directives on them.
        //   - bindings: Map of inputs, outputs, and attributes to the directive/element that claims
        //     them. TODO(alxhub): handle multiple directives claiming an input/output/etc.
        //   - references: Map of #references to their targets.
        const { directives, eagerDirectives, bindings, references } = DirectiveBinder.apply(target.template, this.directiveMatcher);
        // Finally, run the TemplateBinder to bind references, variables, and other entities within the
        // template. This extracts all the metadata that doesn't depend on directive matching.
        const { expressions, symbols, nestingLevel, usedPipes, eagerPipes, deferBlocks } = TemplateBinder.applyWithScope(target.template, scope);
        return new R3BoundTarget(target, directives, eagerDirectives, bindings, references, expressions, symbols, nestingLevel, templateEntities, usedPipes, eagerPipes, deferBlocks);
    }
}
/**
 * Represents a binding scope within a template.
 *
 * Any variables, references, or other named entities declared within the template will
 * be captured and available by name in `namedEntities`. Additionally, child templates will
 * be analyzed and have their child `Scope`s available in `childScopes`.
 */
class Scope {
    constructor(parentScope, template) {
        this.parentScope = parentScope;
        this.template = template;
        /**
         * Named members of the `Scope`, such as `Reference`s or `Variable`s.
         */
        this.namedEntities = new Map();
        /**
         * Child `Scope`s for immediately nested `Template`s.
         */
        this.childScopes = new Map();
    }
    static newRootScope() {
        return new Scope(null, null);
    }
    /**
     * Process a template (either as a `Template` sub-template with variables, or a plain array of
     * template `Node`s) and construct its `Scope`.
     */
    static apply(template) {
        const scope = Scope.newRootScope();
        scope.ingest(template);
        return scope;
    }
    /**
     * Internal method to process the template and populate the `Scope`.
     */
    ingest(template) {
        if (template instanceof Template) {
            // Variables on an <ng-template> are defined in the inner scope.
            template.variables.forEach(node => this.visitVariable(node));
            // Process the nodes of the template.
            template.children.forEach(node => node.visit(this));
        }
        else {
            // No overarching `Template` instance, so process the nodes directly.
            template.forEach(node => node.visit(this));
        }
    }
    visitElement(element) {
        // `Element`s in the template may have `Reference`s which are captured in the scope.
        element.references.forEach(node => this.visitReference(node));
        // Recurse into the `Element`'s children.
        element.children.forEach(node => node.visit(this));
    }
    visitTemplate(template) {
        // References on a <ng-template> are defined in the outer scope, so capture them before
        // processing the template's child scope.
        template.references.forEach(node => this.visitReference(node));
        // Next, create an inner scope and process the template within it.
        const scope = new Scope(this, template);
        scope.ingest(template);
        this.childScopes.set(template, scope);
    }
    visitVariable(variable) {
        // Declare the variable if it's not already.
        this.maybeDeclare(variable);
    }
    visitReference(reference) {
        // Declare the variable if it's not already.
        this.maybeDeclare(reference);
    }
    visitDeferredBlock(deferred) {
        deferred.children.forEach(node => node.visit(this));
        deferred.placeholder?.visit(this);
        deferred.loading?.visit(this);
        deferred.error?.visit(this);
    }
    visitDeferredBlockPlaceholder(block) {
        block.children.forEach(node => node.visit(this));
    }
    visitDeferredBlockError(block) {
        block.children.forEach(node => node.visit(this));
    }
    visitDeferredBlockLoading(block) {
        block.children.forEach(node => node.visit(this));
    }
    // Unused visitors.
    visitContent(content) { }
    visitBoundAttribute(attr) { }
    visitBoundEvent(event) { }
    visitBoundText(text) { }
    visitText(text) { }
    visitTextAttribute(attr) { }
    visitIcu(icu) { }
    visitDeferredTrigger(trigger) { }
    maybeDeclare(thing) {
        // Declare something with a name, as long as that name isn't taken.
        if (!this.namedEntities.has(thing.name)) {
            this.namedEntities.set(thing.name, thing);
        }
    }
    /**
     * Look up a variable within this `Scope`.
     *
     * This can recurse into a parent `Scope` if it's available.
     */
    lookup(name) {
        if (this.namedEntities.has(name)) {
            // Found in the local scope.
            return this.namedEntities.get(name);
        }
        else if (this.parentScope !== null) {
            // Not in the local scope, but there's a parent scope so check there.
            return this.parentScope.lookup(name);
        }
        else {
            // At the top level and it wasn't found.
            return null;
        }
    }
    /**
     * Get the child scope for a `Template`.
     *
     * This should always be defined.
     */
    getChildScope(template) {
        const res = this.childScopes.get(template);
        if (res === undefined) {
            throw new Error(`Assertion error: child scope for ${template} not found`);
        }
        return res;
    }
}
/**
 * Processes a template and matches directives on nodes (elements and templates).
 *
 * Usually used via the static `apply()` method.
 */
class DirectiveBinder {
    constructor(matcher, directives, eagerDirectives, bindings, references) {
        this.matcher = matcher;
        this.directives = directives;
        this.eagerDirectives = eagerDirectives;
        this.bindings = bindings;
        this.references = references;
        // Indicates whether we are visiting elements within a {#defer} block
        this.isInDeferBlock = false;
    }
    /**
     * Process a template (list of `Node`s) and perform directive matching against each node.
     *
     * @param template the list of template `Node`s to match (recursively).
     * @param selectorMatcher a `SelectorMatcher` containing the directives that are in scope for
     * this template.
     * @returns three maps which contain information about directives in the template: the
     * `directives` map which lists directives matched on each node, the `bindings` map which
     * indicates which directives claimed which bindings (inputs, outputs, etc), and the `references`
     * map which resolves #references (`Reference`s) within the template to the named directive or
     * template node.
     */
    static apply(template, selectorMatcher) {
        const directives = new Map();
        const bindings = new Map();
        const references = new Map();
        const eagerDirectives = [];
        const matcher = new DirectiveBinder(selectorMatcher, directives, eagerDirectives, bindings, references);
        matcher.ingest(template);
        return { directives, eagerDirectives, bindings, references };
    }
    ingest(template) {
        template.forEach(node => node.visit(this));
    }
    visitElement(element) {
        this.visitElementOrTemplate(element.name, element);
    }
    visitTemplate(template) {
        this.visitElementOrTemplate('ng-template', template);
    }
    visitElementOrTemplate(elementName, node) {
        // First, determine the HTML shape of the node for the purpose of directive matching.
        // Do this by building up a `CssSelector` for the node.
        const cssSelector = createCssSelector(elementName, getAttrsForDirectiveMatching(node));
        // Next, use the `SelectorMatcher` to get the list of directives on the node.
        const directives = [];
        this.matcher.match(cssSelector, (_selector, results) => directives.push(...results));
        if (directives.length > 0) {
            this.directives.set(node, directives);
            if (!this.isInDeferBlock) {
                this.eagerDirectives.push(...directives);
            }
        }
        // Resolve any references that are created on this node.
        node.references.forEach(ref => {
            let dirTarget = null;
            // If the reference expression is empty, then it matches the "primary" directive on the node
            // (if there is one). Otherwise it matches the host node itself (either an element or
            // <ng-template> node).
            if (ref.value.trim() === '') {
                // This could be a reference to a component if there is one.
                dirTarget = directives.find(dir => dir.isComponent) || null;
            }
            else {
                // This should be a reference to a directive exported via exportAs.
                dirTarget =
                    directives.find(dir => dir.exportAs !== null && dir.exportAs.some(value => value === ref.value)) ||
                        null;
                // Check if a matching directive was found.
                if (dirTarget === null) {
                    // No matching directive was found - this reference points to an unknown target. Leave it
                    // unmapped.
                    return;
                }
            }
            if (dirTarget !== null) {
                // This reference points to a directive.
                this.references.set(ref, { directive: dirTarget, node });
            }
            else {
                // This reference points to the node itself.
                this.references.set(ref, node);
            }
        });
        const setAttributeBinding = (attribute, ioType) => {
            const dir = directives.find(dir => dir[ioType].hasBindingPropertyName(attribute.name));
            const binding = dir !== undefined ? dir : node;
            this.bindings.set(attribute, binding);
        };
        // Node inputs (bound attributes) and text attributes can be bound to an
        // input on a directive.
        node.inputs.forEach(input => setAttributeBinding(input, 'inputs'));
        node.attributes.forEach(attr => setAttributeBinding(attr, 'inputs'));
        if (node instanceof Template) {
            node.templateAttrs.forEach(attr => setAttributeBinding(attr, 'inputs'));
        }
        // Node outputs (bound events) can be bound to an output on a directive.
        node.outputs.forEach(output => setAttributeBinding(output, 'outputs'));
        // Recurse into the node's children.
        node.children.forEach(child => child.visit(this));
    }
    visitDeferredBlock(deferred) {
        this.isInDeferBlock = true;
        deferred.children.forEach(child => child.visit(this));
        this.isInDeferBlock = false;
        deferred.placeholder?.visit(this);
        deferred.loading?.visit(this);
        deferred.error?.visit(this);
    }
    visitDeferredBlockPlaceholder(block) {
        block.children.forEach(child => child.visit(this));
    }
    visitDeferredBlockError(block) {
        block.children.forEach(child => child.visit(this));
    }
    visitDeferredBlockLoading(block) {
        block.children.forEach(child => child.visit(this));
    }
    // Unused visitors.
    visitContent(content) { }
    visitVariable(variable) { }
    visitReference(reference) { }
    visitTextAttribute(attribute) { }
    visitBoundAttribute(attribute) { }
    visitBoundEvent(attribute) { }
    visitBoundAttributeOrEvent(node) { }
    visitText(text) { }
    visitBoundText(text) { }
    visitIcu(icu) { }
    visitDeferredTrigger(trigger) { }
}
/**
 * Processes a template and extract metadata about expressions and symbols within.
 *
 * This is a companion to the `DirectiveBinder` that doesn't require knowledge of directives matched
 * within the template in order to operate.
 *
 * Expressions are visited by the superclass `RecursiveAstVisitor`, with custom logic provided
 * by overridden methods from that visitor.
 */
class TemplateBinder extends RecursiveAstVisitor {
    constructor(bindings, symbols, usedPipes, eagerPipes, deferBlocks, nestingLevel, scope, template, level) {
        super();
        this.bindings = bindings;
        this.symbols = symbols;
        this.usedPipes = usedPipes;
        this.eagerPipes = eagerPipes;
        this.deferBlocks = deferBlocks;
        this.nestingLevel = nestingLevel;
        this.scope = scope;
        this.template = template;
        this.level = level;
        // Indicates whether we are visiting elements within a {#defer} block
        this.isInDeferBlock = false;
        // Save a bit of processing time by constructing this closure in advance.
        this.visitNode = (node) => node.visit(this);
    }
    // This method is defined to reconcile the type of TemplateBinder since both
    // RecursiveAstVisitor and Visitor define the visit() method in their
    // interfaces.
    visit(node, context) {
        if (node instanceof AST) {
            node.visit(this, context);
        }
        else {
            node.visit(this);
        }
    }
    /**
     * Process a template and extract metadata about expressions and symbols within.
     *
     * @param nodes the nodes of the template to process
     * @param scope the `Scope` of the template being processed.
     * @returns three maps which contain metadata about the template: `expressions` which interprets
     * special `AST` nodes in expressions as pointing to references or variables declared within the
     * template, `symbols` which maps those variables and references to the nested `Template` which
     * declares them, if any, and `nestingLevel` which associates each `Template` with a integer
     * nesting level (how many levels deep within the template structure the `Template` is), starting
     * at 1.
     */
    static applyWithScope(nodes, scope) {
        const expressions = new Map();
        const symbols = new Map();
        const nestingLevel = new Map();
        const usedPipes = new Set();
        const eagerPipes = new Set();
        const template = nodes instanceof Template ? nodes : null;
        const deferBlocks = new Set();
        // The top-level template has nesting level 0.
        const binder = new TemplateBinder(expressions, symbols, usedPipes, eagerPipes, deferBlocks, nestingLevel, scope, template, 0);
        binder.ingest(nodes);
        return { expressions, symbols, nestingLevel, usedPipes, eagerPipes, deferBlocks };
    }
    ingest(template) {
        if (template instanceof Template) {
            // For <ng-template>s, process only variables and child nodes. Inputs, outputs, templateAttrs,
            // and references were all processed in the scope of the containing template.
            template.variables.forEach(this.visitNode);
            template.children.forEach(this.visitNode);
            // Set the nesting level.
            this.nestingLevel.set(template, this.level);
        }
        else {
            // Visit each node from the top-level template.
            template.forEach(this.visitNode);
        }
    }
    visitElement(element) {
        // Visit the inputs, outputs, and children of the element.
        element.inputs.forEach(this.visitNode);
        element.outputs.forEach(this.visitNode);
        element.children.forEach(this.visitNode);
    }
    visitTemplate(template) {
        // First, visit inputs, outputs and template attributes of the template node.
        template.inputs.forEach(this.visitNode);
        template.outputs.forEach(this.visitNode);
        template.templateAttrs.forEach(this.visitNode);
        // References are also evaluated in the outer context.
        template.references.forEach(this.visitNode);
        // Next, recurse into the template using its scope, and bumping the nesting level up by one.
        const childScope = this.scope.getChildScope(template);
        const binder = new TemplateBinder(this.bindings, this.symbols, this.usedPipes, this.eagerPipes, this.deferBlocks, this.nestingLevel, childScope, template, this.level + 1);
        binder.ingest(template);
    }
    visitVariable(variable) {
        // Register the `Variable` as a symbol in the current `Template`.
        if (this.template !== null) {
            this.symbols.set(variable, this.template);
        }
    }
    visitReference(reference) {
        // Register the `Reference` as a symbol in the current `Template`.
        if (this.template !== null) {
            this.symbols.set(reference, this.template);
        }
    }
    // Unused template visitors
    visitText(text) { }
    visitContent(content) { }
    visitTextAttribute(attribute) { }
    visitIcu(icu) {
        Object.keys(icu.vars).forEach(key => icu.vars[key].visit(this));
        Object.keys(icu.placeholders).forEach(key => icu.placeholders[key].visit(this));
    }
    // The remaining visitors are concerned with processing AST expressions within template bindings
    visitBoundAttribute(attribute) {
        attribute.value.visit(this);
    }
    visitBoundEvent(event) {
        event.handler.visit(this);
    }
    visitDeferredBlock(deferred) {
        this.deferBlocks.add(deferred);
        this.isInDeferBlock = true;
        deferred.children.forEach(this.visitNode);
        this.isInDeferBlock = false;
        deferred.triggers.forEach(this.visitNode);
        deferred.prefetchTriggers.forEach(this.visitNode);
        deferred.placeholder && this.visitNode(deferred.placeholder);
        deferred.loading && this.visitNode(deferred.loading);
        deferred.error && this.visitNode(deferred.error);
    }
    visitDeferredTrigger(trigger) {
        if (trigger instanceof BoundDeferredTrigger) {
            trigger.value.visit(this);
        }
    }
    visitDeferredBlockPlaceholder(block) {
        block.children.forEach(this.visitNode);
    }
    visitDeferredBlockError(block) {
        block.children.forEach(this.visitNode);
    }
    visitDeferredBlockLoading(block) {
        block.children.forEach(this.visitNode);
    }
    visitBoundText(text) {
        text.value.visit(this);
    }
    visitPipe(ast, context) {
        this.usedPipes.add(ast.name);
        if (!this.isInDeferBlock) {
            this.eagerPipes.add(ast.name);
        }
        return super.visitPipe(ast, context);
    }
    // These five types of AST expressions can refer to expression roots, which could be variables
    // or references in the current scope.
    visitPropertyRead(ast, context) {
        this.maybeMap(context, ast, ast.name);
        return super.visitPropertyRead(ast, context);
    }
    visitSafePropertyRead(ast, context) {
        this.maybeMap(context, ast, ast.name);
        return super.visitSafePropertyRead(ast, context);
    }
    visitPropertyWrite(ast, context) {
        this.maybeMap(context, ast, ast.name);
        return super.visitPropertyWrite(ast, context);
    }
    maybeMap(scope, ast, name) {
        // If the receiver of the expression isn't the `ImplicitReceiver`, this isn't the root of an
        // `AST` expression that maps to a `Variable` or `Reference`.
        if (!(ast.receiver instanceof ImplicitReceiver)) {
            return;
        }
        // Check whether the name exists in the current scope. If so, map it. Otherwise, the name is
        // probably a property on the top-level component context.
        let target = this.scope.lookup(name);
        if (target !== null) {
            this.bindings.set(ast, target);
        }
    }
}
/**
 * Metadata container for a `Target` that allows queries for specific bits of metadata.
 *
 * See `BoundTarget` for documentation on the individual methods.
 */
export class R3BoundTarget {
    constructor(target, directives, eagerDirectives, bindings, references, exprTargets, symbols, nestingLevel, templateEntities, usedPipes, eagerPipes, deferredBlocks) {
        this.target = target;
        this.directives = directives;
        this.eagerDirectives = eagerDirectives;
        this.bindings = bindings;
        this.references = references;
        this.exprTargets = exprTargets;
        this.symbols = symbols;
        this.nestingLevel = nestingLevel;
        this.templateEntities = templateEntities;
        this.usedPipes = usedPipes;
        this.eagerPipes = eagerPipes;
        this.deferredBlocks = deferredBlocks;
    }
    getEntitiesInTemplateScope(template) {
        return this.templateEntities.get(template) ?? new Set();
    }
    getDirectivesOfNode(node) {
        return this.directives.get(node) || null;
    }
    getReferenceTarget(ref) {
        return this.references.get(ref) || null;
    }
    getConsumerOfBinding(binding) {
        return this.bindings.get(binding) || null;
    }
    getExpressionTarget(expr) {
        return this.exprTargets.get(expr) || null;
    }
    getTemplateOfSymbol(symbol) {
        return this.symbols.get(symbol) || null;
    }
    getNestingLevel(template) {
        return this.nestingLevel.get(template) || 0;
    }
    getUsedDirectives() {
        const set = new Set();
        this.directives.forEach(dirs => dirs.forEach(dir => set.add(dir)));
        return Array.from(set.values());
    }
    getEagerlyUsedDirectives() {
        const set = new Set(this.eagerDirectives);
        return Array.from(set.values());
    }
    getUsedPipes() {
        return Array.from(this.usedPipes);
    }
    getEagerlyUsedPipes() {
        return Array.from(this.eagerPipes);
    }
    getDeferBlocks() {
        return Array.from(this.deferredBlocks);
    }
}
function extractTemplateEntities(rootScope) {
    const entityMap = new Map();
    function extractScopeEntities(scope) {
        if (entityMap.has(scope.template)) {
            return entityMap.get(scope.template);
        }
        const currentEntities = scope.namedEntities;
        let templateEntities;
        if (scope.parentScope !== null) {
            templateEntities = new Map([...extractScopeEntities(scope.parentScope), ...currentEntities]);
        }
        else {
            templateEntities = new Map(currentEntities);
        }
        entityMap.set(scope.template, templateEntities);
        return templateEntities;
    }
    const scopesToProcess = [rootScope];
    while (scopesToProcess.length > 0) {
        const scope = scopesToProcess.pop();
        for (const childScope of scope.childScopes.values()) {
            scopesToProcess.push(childScope);
        }
        extractScopeEntities(scope);
    }
    const templateEntities = new Map();
    for (const [template, entities] of entityMap) {
        templateEntities.set(template, new Set(entities.values()));
    }
    return templateEntities;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidDJfYmluZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3JlbmRlcjMvdmlldy90Ml9iaW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLEdBQUcsRUFBZSxnQkFBZ0IsRUFBK0IsbUJBQW1CLEVBQW1CLE1BQU0sNkJBQTZCLENBQUM7QUFFbkosT0FBTyxFQUFpQixvQkFBb0IsRUFBcUssUUFBUSxFQUF5QyxNQUFNLFdBQVcsQ0FBQztBQUdwUixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDN0MsT0FBTyxFQUFDLDRCQUE0QixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBR3BEOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sY0FBYztJQUN6QixZQUFvQixnQkFBK0M7UUFBL0MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUErQjtJQUFHLENBQUM7SUFFdkU7OztPQUdHO0lBQ0gsSUFBSSxDQUFDLE1BQWM7UUFDakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDcEIsNEVBQTRFO1lBQzVFLE1BQU0sSUFBSSxLQUFLLENBQUMsOENBQThDLENBQUMsQ0FBQztTQUNqRTtRQUVELDRGQUE0RjtRQUM1RixpRUFBaUU7UUFDakUsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFHM0Msa0ZBQWtGO1FBQ2xGLE1BQU0sZ0JBQWdCLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFeEQsOEZBQThGO1FBQzlGLG9GQUFvRjtRQUNwRiw0RkFBNEY7UUFDNUYsbUZBQW1GO1FBQ25GLHVEQUF1RDtRQUN2RCxNQUFNLEVBQUMsVUFBVSxFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFDLEdBQ3JELGVBQWUsQ0FB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RUFBRSxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUM7U0FDOUY7YUFBTTtZQUNMLGdCQUFnQixHQUFHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQzdDO1FBRUQsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDaEQsT0FBTyxnQkFBZ0IsQ0FBQztJQUMxQixDQUFDO0lBRUQsTUFBTSxlQUFlLEdBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM3QyxPQUFPLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ2pDLE1BQU0sS0FBSyxHQUFHLGVBQWUsQ0FBQyxHQUFHLEVBQUcsQ0FBQztRQUNyQyxLQUFLLE1BQU0sVUFBVSxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDbkQsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNsQztRQUNELG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzdCO0lBRUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBMEMsQ0FBQztJQUMzRSxLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLElBQUksU0FBUyxFQUFFO1FBQzVDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztLQUM1RDtJQUNELE9BQU8sZ0JBQWdCLENBQUM7QUFDMUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FTVCwgQmluZGluZ1BpcGUsIEltcGxpY2l0UmVjZWl2ZXIsIFByb3BlcnR5UmVhZCwgUHJvcGVydHlXcml0ZSwgUmVjdXJzaXZlQXN0VmlzaXRvciwgU2FmZVByb3BlcnR5UmVhZH0gZnJvbSAnLi4vLi4vZXhwcmVzc2lvbl9wYXJzZXIvYXN0JztcbmltcG9ydCB7U2VsZWN0b3JNYXRjaGVyfSBmcm9tICcuLi8uLi9zZWxlY3Rvcic7XG5pbXBvcnQge0JvdW5kQXR0cmlidXRlLCBCb3VuZERlZmVycmVkVHJpZ2dlciwgQm91bmRFdmVudCwgQm91bmRUZXh0LCBDb250ZW50LCBEZWZlcnJlZEJsb2NrLCBEZWZlcnJlZEJsb2NrRXJyb3IsIERlZmVycmVkQmxvY2tMb2FkaW5nLCBEZWZlcnJlZEJsb2NrUGxhY2Vob2xkZXIsIERlZmVycmVkVHJpZ2dlciwgRWxlbWVudCwgSWN1LCBOb2RlLCBSZWZlcmVuY2UsIFRlbXBsYXRlLCBUZXh0LCBUZXh0QXR0cmlidXRlLCBWYXJpYWJsZSwgVmlzaXRvcn0gZnJvbSAnLi4vcjNfYXN0JztcblxuaW1wb3J0IHtCb3VuZFRhcmdldCwgRGlyZWN0aXZlTWV0YSwgVGFyZ2V0LCBUYXJnZXRCaW5kZXJ9IGZyb20gJy4vdDJfYXBpJztcbmltcG9ydCB7Y3JlYXRlQ3NzU2VsZWN0b3J9IGZyb20gJy4vdGVtcGxhdGUnO1xuaW1wb3J0IHtnZXRBdHRyc0ZvckRpcmVjdGl2ZU1hdGNoaW5nfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogUHJvY2Vzc2VzIGBUYXJnZXRgcyB3aXRoIGEgZ2l2ZW4gc2V0IG9mIGRpcmVjdGl2ZXMgYW5kIHBlcmZvcm1zIGEgYmluZGluZyBvcGVyYXRpb24sIHdoaWNoXG4gKiByZXR1cm5zIGFuIG9iamVjdCBzaW1pbGFyIHRvIFR5cGVTY3JpcHQncyBgdHMuVHlwZUNoZWNrZXJgIHRoYXQgY29udGFpbnMga25vd2xlZGdlIGFib3V0IHRoZVxuICogdGFyZ2V0LlxuICovXG5leHBvcnQgY2xhc3MgUjNUYXJnZXRCaW5kZXI8RGlyZWN0aXZlVCBleHRlbmRzIERpcmVjdGl2ZU1ldGE+IGltcGxlbWVudHMgVGFyZ2V0QmluZGVyPERpcmVjdGl2ZVQ+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBkaXJlY3RpdmVNYXRjaGVyOiBTZWxlY3Rvck1hdGNoZXI8RGlyZWN0aXZlVFtdPikge31cblxuICAvKipcbiAgICogUGVyZm9ybSBhIGJpbmRpbmcgb3BlcmF0aW9uIG9uIHRoZSBnaXZlbiBgVGFyZ2V0YCBhbmQgcmV0dXJuIGEgYEJvdW5kVGFyZ2V0YCB3aGljaCBjb250YWluc1xuICAgKiBtZXRhZGF0YSBhYm91dCB0aGUgdHlwZXMgcmVmZXJlbmNlZCBpbiB0aGUgdGVtcGxhdGUuXG4gICAqL1xuICBiaW5kKHRhcmdldDogVGFyZ2V0KTogQm91bmRUYXJnZXQ8RGlyZWN0aXZlVD4ge1xuICAgIGlmICghdGFyZ2V0LnRlbXBsYXRlKSB7XG4gICAgICAvLyBUT0RPKGFseGh1Yik6IGhhbmRsZSB0YXJnZXRzIHdoaWNoIGNvbnRhaW4gdGhpbmdzIGxpa2UgSG9zdEJpbmRpbmdzLCBldGMuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JpbmRpbmcgd2l0aG91dCBhIHRlbXBsYXRlIG5vdCB5ZXQgc3VwcG9ydGVkJyk7XG4gICAgfVxuXG4gICAgLy8gRmlyc3QsIHBhcnNlIHRoZSB0ZW1wbGF0ZSBpbnRvIGEgYFNjb3BlYCBzdHJ1Y3R1cmUuIFRoaXMgb3BlcmF0aW9uIGNhcHR1cmVzIHRoZSBzeW50YWN0aWNcbiAgICAvLyBzY29wZXMgaW4gdGhlIHRlbXBsYXRlIGFuZCBtYWtlcyB0aGVtIGF2YWlsYWJsZSBmb3IgbGF0ZXIgdXNlLlxuICAgIGNvbnN0IHNjb3BlID0gU2NvcGUuYXBwbHkodGFyZ2V0LnRlbXBsYXRlKTtcblxuXG4gICAgLy8gVXNlIHRoZSBgU2NvcGVgIHRvIGV4dHJhY3QgdGhlIGVudGl0aWVzIHByZXNlbnQgYXQgZXZlcnkgbGV2ZWwgb2YgdGhlIHRlbXBsYXRlLlxuICAgIGNvbnN0IHRlbXBsYXRlRW50aXRpZXMgPSBleHRyYWN0VGVtcGxhdGVFbnRpdGllcyhzY29wZSk7XG5cbiAgICAvLyBOZXh0LCBwZXJmb3JtIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiB0aGUgdGVtcGxhdGUgdXNpbmcgdGhlIGBEaXJlY3RpdmVCaW5kZXJgLiBUaGlzIHJldHVybnM6XG4gICAgLy8gICAtIGRpcmVjdGl2ZXM6IE1hcCBvZiBub2RlcyAoZWxlbWVudHMgJiBuZy10ZW1wbGF0ZXMpIHRvIHRoZSBkaXJlY3RpdmVzIG9uIHRoZW0uXG4gICAgLy8gICAtIGJpbmRpbmdzOiBNYXAgb2YgaW5wdXRzLCBvdXRwdXRzLCBhbmQgYXR0cmlidXRlcyB0byB0aGUgZGlyZWN0aXZlL2VsZW1lbnQgdGhhdCBjbGFpbXNcbiAgICAvLyAgICAgdGhlbS4gVE9ETyhhbHhodWIpOiBoYW5kbGUgbXVsdGlwbGUgZGlyZWN0aXZlcyBjbGFpbWluZyBhbiBpbnB1dC9vdXRwdXQvZXRjLlxuICAgIC8vICAgLSByZWZlcmVuY2VzOiBNYXAgb2YgI3JlZmVyZW5jZXMgdG8gdGhlaXIgdGFyZ2V0cy5cbiAgICBjb25zdCB7ZGlyZWN0aXZlcywgZWFnZXJEaXJlY3RpdmVzLCBiaW5kaW5ncywgcmVmZXJlbmNlc30gPVxuICAgICAgICBEaXJlY3RpdmVCaW5kZXIuYXBwbHkodGFyZ2V0LnRlbXBsYXRlLCB0aGlzLmRpcmVjdGl2ZU1hdGNoZXIpO1xuICAgIC8vIEZpbmFsbHksIHJ1biB0aGUgVGVtcGxhdGVCaW5kZXIgdG8gYmluZCByZWZlcmVuY2VzLCB2YXJpYWJsZXMsIGFuZCBvdGhlciBlbnRpdGllcyB3aXRoaW4gdGhlXG4gICAgLy8gdGVtcGxhdGUuIFRoaXMgZXh0cmFjdHMgYWxsIHRoZSBtZXRhZGF0YSB0aGF0IGRvZXNuJ3QgZGVwZW5kIG9uIGRpcmVjdGl2ZSBtYXRjaGluZy5cbiAgICBjb25zdCB7ZXhwcmVzc2lvbnMsIHN5bWJvbHMsIG5lc3RpbmdMZXZlbCwgdXNlZFBpcGVzLCBlYWdlclBpcGVzLCBkZWZlckJsb2Nrc30gPVxuICAgICAgICBUZW1wbGF0ZUJpbmRlci5hcHBseVdpdGhTY29wZSh0YXJnZXQudGVtcGxhdGUsIHNjb3BlKTtcbiAgICByZXR1cm4gbmV3IFIzQm91bmRUYXJnZXQoXG4gICAgICAgIHRhcmdldCwgZGlyZWN0aXZlcywgZWFnZXJEaXJlY3RpdmVzLCBiaW5kaW5ncywgcmVmZXJlbmNlcywgZXhwcmVzc2lvbnMsIHN5bWJvbHMsXG4gICAgICAgIG5lc3RpbmdMZXZlbCwgdGVtcGxhdGVFbnRpdGllcywgdXNlZFBpcGVzLCBlYWdlclBpcGVzLCBkZWZlckJsb2Nrcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgYmluZGluZyBzY29wZSB3aXRoaW4gYSB0ZW1wbGF0ZS5cbiAqXG4gKiBBbnkgdmFyaWFibGVzLCByZWZlcmVuY2VzLCBvciBvdGhlciBuYW1lZCBlbnRpdGllcyBkZWNsYXJlZCB3aXRoaW4gdGhlIHRlbXBsYXRlIHdpbGxcbiAqIGJlIGNhcHR1cmVkIGFuZCBhdmFpbGFibGUgYnkgbmFtZSBpbiBgbmFtZWRFbnRpdGllc2AuIEFkZGl0aW9uYWxseSwgY2hpbGQgdGVtcGxhdGVzIHdpbGxcbiAqIGJlIGFuYWx5emVkIGFuZCBoYXZlIHRoZWlyIGNoaWxkIGBTY29wZWBzIGF2YWlsYWJsZSBpbiBgY2hpbGRTY29wZXNgLlxuICovXG5jbGFzcyBTY29wZSBpbXBsZW1lbnRzIFZpc2l0b3Ige1xuICAvKipcbiAgICogTmFtZWQgbWVtYmVycyBvZiB0aGUgYFNjb3BlYCwgc3VjaCBhcyBgUmVmZXJlbmNlYHMgb3IgYFZhcmlhYmxlYHMuXG4gICAqL1xuICByZWFkb25seSBuYW1lZEVudGl0aWVzID0gbmV3IE1hcDxzdHJpbmcsIFJlZmVyZW5jZXxWYXJpYWJsZT4oKTtcblxuICAvKipcbiAgICogQ2hpbGQgYFNjb3BlYHMgZm9yIGltbWVkaWF0ZWx5IG5lc3RlZCBgVGVtcGxhdGVgcy5cbiAgICovXG4gIHJlYWRvbmx5IGNoaWxkU2NvcGVzID0gbmV3IE1hcDxUZW1wbGF0ZSwgU2NvcGU+KCk7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihyZWFkb25seSBwYXJlbnRTY29wZTogU2NvcGV8bnVsbCwgcmVhZG9ubHkgdGVtcGxhdGU6IFRlbXBsYXRlfG51bGwpIHt9XG5cbiAgc3RhdGljIG5ld1Jvb3RTY29wZSgpOiBTY29wZSB7XG4gICAgcmV0dXJuIG5ldyBTY29wZShudWxsLCBudWxsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIGEgdGVtcGxhdGUgKGVpdGhlciBhcyBhIGBUZW1wbGF0ZWAgc3ViLXRlbXBsYXRlIHdpdGggdmFyaWFibGVzLCBvciBhIHBsYWluIGFycmF5IG9mXG4gICAqIHRlbXBsYXRlIGBOb2RlYHMpIGFuZCBjb25zdHJ1Y3QgaXRzIGBTY29wZWAuXG4gICAqL1xuICBzdGF0aWMgYXBwbHkodGVtcGxhdGU6IE5vZGVbXSk6IFNjb3BlIHtcbiAgICBjb25zdCBzY29wZSA9IFNjb3BlLm5ld1Jvb3RTY29wZSgpO1xuICAgIHNjb3BlLmluZ2VzdCh0ZW1wbGF0ZSk7XG4gICAgcmV0dXJuIHNjb3BlO1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIG1ldGhvZCB0byBwcm9jZXNzIHRoZSB0ZW1wbGF0ZSBhbmQgcG9wdWxhdGUgdGhlIGBTY29wZWAuXG4gICAqL1xuICBwcml2YXRlIGluZ2VzdCh0ZW1wbGF0ZTogVGVtcGxhdGV8Tm9kZVtdKTogdm9pZCB7XG4gICAgaWYgKHRlbXBsYXRlIGluc3RhbmNlb2YgVGVtcGxhdGUpIHtcbiAgICAgIC8vIFZhcmlhYmxlcyBvbiBhbiA8bmctdGVtcGxhdGU+IGFyZSBkZWZpbmVkIGluIHRoZSBpbm5lciBzY29wZS5cbiAgICAgIHRlbXBsYXRlLnZhcmlhYmxlcy5mb3JFYWNoKG5vZGUgPT4gdGhpcy52aXNpdFZhcmlhYmxlKG5vZGUpKTtcblxuICAgICAgLy8gUHJvY2VzcyB0aGUgbm9kZXMgb2YgdGhlIHRlbXBsYXRlLlxuICAgICAgdGVtcGxhdGUuY2hpbGRyZW4uZm9yRWFjaChub2RlID0+IG5vZGUudmlzaXQodGhpcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBObyBvdmVyYXJjaGluZyBgVGVtcGxhdGVgIGluc3RhbmNlLCBzbyBwcm9jZXNzIHRoZSBub2RlcyBkaXJlY3RseS5cbiAgICAgIHRlbXBsYXRlLmZvckVhY2gobm9kZSA9PiBub2RlLnZpc2l0KHRoaXMpKTtcbiAgICB9XG4gIH1cblxuICB2aXNpdEVsZW1lbnQoZWxlbWVudDogRWxlbWVudCkge1xuICAgIC8vIGBFbGVtZW50YHMgaW4gdGhlIHRlbXBsYXRlIG1heSBoYXZlIGBSZWZlcmVuY2VgcyB3aGljaCBhcmUgY2FwdHVyZWQgaW4gdGhlIHNjb3BlLlxuICAgIGVsZW1lbnQucmVmZXJlbmNlcy5mb3JFYWNoKG5vZGUgPT4gdGhpcy52aXNpdFJlZmVyZW5jZShub2RlKSk7XG5cbiAgICAvLyBSZWN1cnNlIGludG8gdGhlIGBFbGVtZW50YCdzIGNoaWxkcmVuLlxuICAgIGVsZW1lbnQuY2hpbGRyZW4uZm9yRWFjaChub2RlID0+IG5vZGUudmlzaXQodGhpcykpO1xuICB9XG5cbiAgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogVGVtcGxhdGUpIHtcbiAgICAvLyBSZWZlcmVuY2VzIG9uIGEgPG5nLXRlbXBsYXRlPiBhcmUgZGVmaW5lZCBpbiB0aGUgb3V0ZXIgc2NvcGUsIHNvIGNhcHR1cmUgdGhlbSBiZWZvcmVcbiAgICAvLyBwcm9jZXNzaW5nIHRoZSB0ZW1wbGF0ZSdzIGNoaWxkIHNjb3BlLlxuICAgIHRlbXBsYXRlLnJlZmVyZW5jZXMuZm9yRWFjaChub2RlID0+IHRoaXMudmlzaXRSZWZlcmVuY2Uobm9kZSkpO1xuXG4gICAgLy8gTmV4dCwgY3JlYXRlIGFuIGlubmVyIHNjb3BlIGFuZCBwcm9jZXNzIHRoZSB0ZW1wbGF0ZSB3aXRoaW4gaXQuXG4gICAgY29uc3Qgc2NvcGUgPSBuZXcgU2NvcGUodGhpcywgdGVtcGxhdGUpO1xuICAgIHNjb3BlLmluZ2VzdCh0ZW1wbGF0ZSk7XG4gICAgdGhpcy5jaGlsZFNjb3Blcy5zZXQodGVtcGxhdGUsIHNjb3BlKTtcbiAgfVxuXG4gIHZpc2l0VmFyaWFibGUodmFyaWFibGU6IFZhcmlhYmxlKSB7XG4gICAgLy8gRGVjbGFyZSB0aGUgdmFyaWFibGUgaWYgaXQncyBub3QgYWxyZWFkeS5cbiAgICB0aGlzLm1heWJlRGVjbGFyZSh2YXJpYWJsZSk7XG4gIH1cblxuICB2aXNpdFJlZmVyZW5jZShyZWZlcmVuY2U6IFJlZmVyZW5jZSkge1xuICAgIC8vIERlY2xhcmUgdGhlIHZhcmlhYmxlIGlmIGl0J3Mgbm90IGFscmVhZHkuXG4gICAgdGhpcy5tYXliZURlY2xhcmUocmVmZXJlbmNlKTtcbiAgfVxuXG4gIHZpc2l0RGVmZXJyZWRCbG9jayhkZWZlcnJlZDogRGVmZXJyZWRCbG9jaykge1xuICAgIGRlZmVycmVkLmNoaWxkcmVuLmZvckVhY2gobm9kZSA9PiBub2RlLnZpc2l0KHRoaXMpKTtcbiAgICBkZWZlcnJlZC5wbGFjZWhvbGRlcj8udmlzaXQodGhpcyk7XG4gICAgZGVmZXJyZWQubG9hZGluZz8udmlzaXQodGhpcyk7XG4gICAgZGVmZXJyZWQuZXJyb3I/LnZpc2l0KHRoaXMpO1xuICB9XG5cbiAgdmlzaXREZWZlcnJlZEJsb2NrUGxhY2Vob2xkZXIoYmxvY2s6IERlZmVycmVkQmxvY2tQbGFjZWhvbGRlcikge1xuICAgIGJsb2NrLmNoaWxkcmVuLmZvckVhY2gobm9kZSA9PiBub2RlLnZpc2l0KHRoaXMpKTtcbiAgfVxuXG4gIHZpc2l0RGVmZXJyZWRCbG9ja0Vycm9yKGJsb2NrOiBEZWZlcnJlZEJsb2NrRXJyb3IpIHtcbiAgICBibG9jay5jaGlsZHJlbi5mb3JFYWNoKG5vZGUgPT4gbm9kZS52aXNpdCh0aGlzKSk7XG4gIH1cblxuICB2aXNpdERlZmVycmVkQmxvY2tMb2FkaW5nKGJsb2NrOiBEZWZlcnJlZEJsb2NrTG9hZGluZykge1xuICAgIGJsb2NrLmNoaWxkcmVuLmZvckVhY2gobm9kZSA9PiBub2RlLnZpc2l0KHRoaXMpKTtcbiAgfVxuXG4gIC8vIFVudXNlZCB2aXNpdG9ycy5cbiAgdmlzaXRDb250ZW50KGNvbnRlbnQ6IENvbnRlbnQpIHt9XG4gIHZpc2l0Qm91bmRBdHRyaWJ1dGUoYXR0cjogQm91bmRBdHRyaWJ1dGUpIHt9XG4gIHZpc2l0Qm91bmRFdmVudChldmVudDogQm91bmRFdmVudCkge31cbiAgdmlzaXRCb3VuZFRleHQodGV4dDogQm91bmRUZXh0KSB7fVxuICB2aXNpdFRleHQodGV4dDogVGV4dCkge31cbiAgdmlzaXRUZXh0QXR0cmlidXRlKGF0dHI6IFRleHRBdHRyaWJ1dGUpIHt9XG4gIHZpc2l0SWN1KGljdTogSWN1KSB7fVxuICB2aXNpdERlZmVycmVkVHJpZ2dlcih0cmlnZ2VyOiBEZWZlcnJlZFRyaWdnZXIpIHt9XG5cbiAgcHJpdmF0ZSBtYXliZURlY2xhcmUodGhpbmc6IFJlZmVyZW5jZXxWYXJpYWJsZSkge1xuICAgIC8vIERlY2xhcmUgc29tZXRoaW5nIHdpdGggYSBuYW1lLCBhcyBsb25nIGFzIHRoYXQgbmFtZSBpc24ndCB0YWtlbi5cbiAgICBpZiAoIXRoaXMubmFtZWRFbnRpdGllcy5oYXModGhpbmcubmFtZSkpIHtcbiAgICAgIHRoaXMubmFtZWRFbnRpdGllcy5zZXQodGhpbmcubmFtZSwgdGhpbmcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBMb29rIHVwIGEgdmFyaWFibGUgd2l0aGluIHRoaXMgYFNjb3BlYC5cbiAgICpcbiAgICogVGhpcyBjYW4gcmVjdXJzZSBpbnRvIGEgcGFyZW50IGBTY29wZWAgaWYgaXQncyBhdmFpbGFibGUuXG4gICAqL1xuICBsb29rdXAobmFtZTogc3RyaW5nKTogUmVmZXJlbmNlfFZhcmlhYmxlfG51bGwge1xuICAgIGlmICh0aGlzLm5hbWVkRW50aXRpZXMuaGFzKG5hbWUpKSB7XG4gICAgICAvLyBGb3VuZCBpbiB0aGUgbG9jYWwgc2NvcGUuXG4gICAgICByZXR1cm4gdGhpcy5uYW1lZEVudGl0aWVzLmdldChuYW1lKSE7XG4gICAgfSBlbHNlIGlmICh0aGlzLnBhcmVudFNjb3BlICE9PSBudWxsKSB7XG4gICAgICAvLyBOb3QgaW4gdGhlIGxvY2FsIHNjb3BlLCBidXQgdGhlcmUncyBhIHBhcmVudCBzY29wZSBzbyBjaGVjayB0aGVyZS5cbiAgICAgIHJldHVybiB0aGlzLnBhcmVudFNjb3BlLmxvb2t1cChuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQXQgdGhlIHRvcCBsZXZlbCBhbmQgaXQgd2Fzbid0IGZvdW5kLlxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY2hpbGQgc2NvcGUgZm9yIGEgYFRlbXBsYXRlYC5cbiAgICpcbiAgICogVGhpcyBzaG91bGQgYWx3YXlzIGJlIGRlZmluZWQuXG4gICAqL1xuICBnZXRDaGlsZFNjb3BlKHRlbXBsYXRlOiBUZW1wbGF0ZSk6IFNjb3BlIHtcbiAgICBjb25zdCByZXMgPSB0aGlzLmNoaWxkU2NvcGVzLmdldCh0ZW1wbGF0ZSk7XG4gICAgaWYgKHJlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEFzc2VydGlvbiBlcnJvcjogY2hpbGQgc2NvcGUgZm9yICR7dGVtcGxhdGV9IG5vdCBmb3VuZGApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdGVtcGxhdGUgYW5kIG1hdGNoZXMgZGlyZWN0aXZlcyBvbiBub2RlcyAoZWxlbWVudHMgYW5kIHRlbXBsYXRlcykuXG4gKlxuICogVXN1YWxseSB1c2VkIHZpYSB0aGUgc3RhdGljIGBhcHBseSgpYCBtZXRob2QuXG4gKi9cbmNsYXNzIERpcmVjdGl2ZUJpbmRlcjxEaXJlY3RpdmVUIGV4dGVuZHMgRGlyZWN0aXZlTWV0YT4gaW1wbGVtZW50cyBWaXNpdG9yIHtcbiAgLy8gSW5kaWNhdGVzIHdoZXRoZXIgd2UgYXJlIHZpc2l0aW5nIGVsZW1lbnRzIHdpdGhpbiBhIHsjZGVmZXJ9IGJsb2NrXG4gIHByaXZhdGUgaXNJbkRlZmVyQmxvY2sgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgbWF0Y2hlcjogU2VsZWN0b3JNYXRjaGVyPERpcmVjdGl2ZVRbXT4sXG4gICAgICBwcml2YXRlIGRpcmVjdGl2ZXM6IE1hcDxFbGVtZW50fFRlbXBsYXRlLCBEaXJlY3RpdmVUW10+LFxuICAgICAgcHJpdmF0ZSBlYWdlckRpcmVjdGl2ZXM6IERpcmVjdGl2ZVRbXSxcbiAgICAgIHByaXZhdGUgYmluZGluZ3M6IE1hcDxCb3VuZEF0dHJpYnV0ZXxCb3VuZEV2ZW50fFRleHRBdHRyaWJ1dGUsIERpcmVjdGl2ZVR8RWxlbWVudHxUZW1wbGF0ZT4sXG4gICAgICBwcml2YXRlIHJlZmVyZW5jZXM6XG4gICAgICAgICAgTWFwPFJlZmVyZW5jZSwge2RpcmVjdGl2ZTogRGlyZWN0aXZlVCwgbm9kZTogRWxlbWVudHxUZW1wbGF0ZX18RWxlbWVudHxUZW1wbGF0ZT4pIHt9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3MgYSB0ZW1wbGF0ZSAobGlzdCBvZiBgTm9kZWBzKSBhbmQgcGVyZm9ybSBkaXJlY3RpdmUgbWF0Y2hpbmcgYWdhaW5zdCBlYWNoIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB0ZW1wbGF0ZSB0aGUgbGlzdCBvZiB0ZW1wbGF0ZSBgTm9kZWBzIHRvIG1hdGNoIChyZWN1cnNpdmVseSkuXG4gICAqIEBwYXJhbSBzZWxlY3Rvck1hdGNoZXIgYSBgU2VsZWN0b3JNYXRjaGVyYCBjb250YWluaW5nIHRoZSBkaXJlY3RpdmVzIHRoYXQgYXJlIGluIHNjb3BlIGZvclxuICAgKiB0aGlzIHRlbXBsYXRlLlxuICAgKiBAcmV0dXJucyB0aHJlZSBtYXBzIHdoaWNoIGNvbnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgZGlyZWN0aXZlcyBpbiB0aGUgdGVtcGxhdGU6IHRoZVxuICAgKiBgZGlyZWN0aXZlc2AgbWFwIHdoaWNoIGxpc3RzIGRpcmVjdGl2ZXMgbWF0Y2hlZCBvbiBlYWNoIG5vZGUsIHRoZSBgYmluZGluZ3NgIG1hcCB3aGljaFxuICAgKiBpbmRpY2F0ZXMgd2hpY2ggZGlyZWN0aXZlcyBjbGFpbWVkIHdoaWNoIGJpbmRpbmdzIChpbnB1dHMsIG91dHB1dHMsIGV0YyksIGFuZCB0aGUgYHJlZmVyZW5jZXNgXG4gICAqIG1hcCB3aGljaCByZXNvbHZlcyAjcmVmZXJlbmNlcyAoYFJlZmVyZW5jZWBzKSB3aXRoaW4gdGhlIHRlbXBsYXRlIHRvIHRoZSBuYW1lZCBkaXJlY3RpdmUgb3JcbiAgICogdGVtcGxhdGUgbm9kZS5cbiAgICovXG4gIHN0YXRpYyBhcHBseTxEaXJlY3RpdmVUIGV4dGVuZHMgRGlyZWN0aXZlTWV0YT4oXG4gICAgICB0ZW1wbGF0ZTogTm9kZVtdLCBzZWxlY3Rvck1hdGNoZXI6IFNlbGVjdG9yTWF0Y2hlcjxEaXJlY3RpdmVUW10+KToge1xuICAgIGRpcmVjdGl2ZXM6IE1hcDxFbGVtZW50fFRlbXBsYXRlLCBEaXJlY3RpdmVUW10+LFxuICAgIGVhZ2VyRGlyZWN0aXZlczogRGlyZWN0aXZlVFtdLFxuICAgIGJpbmRpbmdzOiBNYXA8Qm91bmRBdHRyaWJ1dGV8Qm91bmRFdmVudHxUZXh0QXR0cmlidXRlLCBEaXJlY3RpdmVUfEVsZW1lbnR8VGVtcGxhdGU+LFxuICAgIHJlZmVyZW5jZXM6IE1hcDxSZWZlcmVuY2UsIHtkaXJlY3RpdmU6IERpcmVjdGl2ZVQsIG5vZGU6IEVsZW1lbnR8VGVtcGxhdGV9fEVsZW1lbnR8VGVtcGxhdGU+LFxuICB9IHtcbiAgICBjb25zdCBkaXJlY3RpdmVzID0gbmV3IE1hcDxFbGVtZW50fFRlbXBsYXRlLCBEaXJlY3RpdmVUW10+KCk7XG4gICAgY29uc3QgYmluZGluZ3MgPVxuICAgICAgICBuZXcgTWFwPEJvdW5kQXR0cmlidXRlfEJvdW5kRXZlbnR8VGV4dEF0dHJpYnV0ZSwgRGlyZWN0aXZlVHxFbGVtZW50fFRlbXBsYXRlPigpO1xuICAgIGNvbnN0IHJlZmVyZW5jZXMgPVxuICAgICAgICBuZXcgTWFwPFJlZmVyZW5jZSwge2RpcmVjdGl2ZTogRGlyZWN0aXZlVCwgbm9kZTogRWxlbWVudCB8IFRlbXBsYXRlfXxFbGVtZW50fFRlbXBsYXRlPigpO1xuICAgIGNvbnN0IGVhZ2VyRGlyZWN0aXZlczogRGlyZWN0aXZlVFtdID0gW107XG4gICAgY29uc3QgbWF0Y2hlciA9XG4gICAgICAgIG5ldyBEaXJlY3RpdmVCaW5kZXIoc2VsZWN0b3JNYXRjaGVyLCBkaXJlY3RpdmVzLCBlYWdlckRpcmVjdGl2ZXMsIGJpbmRpbmdzLCByZWZlcmVuY2VzKTtcbiAgICBtYXRjaGVyLmluZ2VzdCh0ZW1wbGF0ZSk7XG4gICAgcmV0dXJuIHtkaXJlY3RpdmVzLCBlYWdlckRpcmVjdGl2ZXMsIGJpbmRpbmdzLCByZWZlcmVuY2VzfTtcbiAgfVxuXG4gIHByaXZhdGUgaW5nZXN0KHRlbXBsYXRlOiBOb2RlW10pOiB2b2lkIHtcbiAgICB0ZW1wbGF0ZS5mb3JFYWNoKG5vZGUgPT4gbm9kZS52aXNpdCh0aGlzKSk7XG4gIH1cblxuICB2aXNpdEVsZW1lbnQoZWxlbWVudDogRWxlbWVudCk6IHZvaWQge1xuICAgIHRoaXMudmlzaXRFbGVtZW50T3JUZW1wbGF0ZShlbGVtZW50Lm5hbWUsIGVsZW1lbnQpO1xuICB9XG5cbiAgdmlzaXRUZW1wbGF0ZSh0ZW1wbGF0ZTogVGVtcGxhdGUpOiB2b2lkIHtcbiAgICB0aGlzLnZpc2l0RWxlbWVudE9yVGVtcGxhdGUoJ25nLXRlbXBsYXRlJywgdGVtcGxhdGUpO1xuICB9XG5cbiAgdmlzaXRFbGVtZW50T3JUZW1wbGF0ZShlbGVtZW50TmFtZTogc3RyaW5nLCBub2RlOiBFbGVtZW50fFRlbXBsYXRlKTogdm9pZCB7XG4gICAgLy8gRmlyc3QsIGRldGVybWluZSB0aGUgSFRNTCBzaGFwZSBvZiB0aGUgbm9kZSBmb3IgdGhlIHB1cnBvc2Ugb2YgZGlyZWN0aXZlIG1hdGNoaW5nLlxuICAgIC8vIERvIHRoaXMgYnkgYnVpbGRpbmcgdXAgYSBgQ3NzU2VsZWN0b3JgIGZvciB0aGUgbm9kZS5cbiAgICBjb25zdCBjc3NTZWxlY3RvciA9IGNyZWF0ZUNzc1NlbGVjdG9yKGVsZW1lbnROYW1lLCBnZXRBdHRyc0ZvckRpcmVjdGl2ZU1hdGNoaW5nKG5vZGUpKTtcblxuICAgIC8vIE5leHQsIHVzZSB0aGUgYFNlbGVjdG9yTWF0Y2hlcmAgdG8gZ2V0IHRoZSBsaXN0IG9mIGRpcmVjdGl2ZXMgb24gdGhlIG5vZGUuXG4gICAgY29uc3QgZGlyZWN0aXZlczogRGlyZWN0aXZlVFtdID0gW107XG4gICAgdGhpcy5tYXRjaGVyLm1hdGNoKGNzc1NlbGVjdG9yLCAoX3NlbGVjdG9yLCByZXN1bHRzKSA9PiBkaXJlY3RpdmVzLnB1c2goLi4ucmVzdWx0cykpO1xuICAgIGlmIChkaXJlY3RpdmVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuZGlyZWN0aXZlcy5zZXQobm9kZSwgZGlyZWN0aXZlcyk7XG4gICAgICBpZiAoIXRoaXMuaXNJbkRlZmVyQmxvY2spIHtcbiAgICAgICAgdGhpcy5lYWdlckRpcmVjdGl2ZXMucHVzaCguLi5kaXJlY3RpdmVzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZXNvbHZlIGFueSByZWZlcmVuY2VzIHRoYXQgYXJlIGNyZWF0ZWQgb24gdGhpcyBub2RlLlxuICAgIG5vZGUucmVmZXJlbmNlcy5mb3JFYWNoKHJlZiA9PiB7XG4gICAgICBsZXQgZGlyVGFyZ2V0OiBEaXJlY3RpdmVUfG51bGwgPSBudWxsO1xuXG4gICAgICAvLyBJZiB0aGUgcmVmZXJlbmNlIGV4cHJlc3Npb24gaXMgZW1wdHksIHRoZW4gaXQgbWF0Y2hlcyB0aGUgXCJwcmltYXJ5XCIgZGlyZWN0aXZlIG9uIHRoZSBub2RlXG4gICAgICAvLyAoaWYgdGhlcmUgaXMgb25lKS4gT3RoZXJ3aXNlIGl0IG1hdGNoZXMgdGhlIGhvc3Qgbm9kZSBpdHNlbGYgKGVpdGhlciBhbiBlbGVtZW50IG9yXG4gICAgICAvLyA8bmctdGVtcGxhdGU+IG5vZGUpLlxuICAgICAgaWYgKHJlZi52YWx1ZS50cmltKCkgPT09ICcnKSB7XG4gICAgICAgIC8vIFRoaXMgY291bGQgYmUgYSByZWZlcmVuY2UgdG8gYSBjb21wb25lbnQgaWYgdGhlcmUgaXMgb25lLlxuICAgICAgICBkaXJUYXJnZXQgPSBkaXJlY3RpdmVzLmZpbmQoZGlyID0+IGRpci5pc0NvbXBvbmVudCkgfHwgbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgc2hvdWxkIGJlIGEgcmVmZXJlbmNlIHRvIGEgZGlyZWN0aXZlIGV4cG9ydGVkIHZpYSBleHBvcnRBcy5cbiAgICAgICAgZGlyVGFyZ2V0ID1cbiAgICAgICAgICAgIGRpcmVjdGl2ZXMuZmluZChcbiAgICAgICAgICAgICAgICBkaXIgPT4gZGlyLmV4cG9ydEFzICE9PSBudWxsICYmIGRpci5leHBvcnRBcy5zb21lKHZhbHVlID0+IHZhbHVlID09PSByZWYudmFsdWUpKSB8fFxuICAgICAgICAgICAgbnVsbDtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYSBtYXRjaGluZyBkaXJlY3RpdmUgd2FzIGZvdW5kLlxuICAgICAgICBpZiAoZGlyVGFyZ2V0ID09PSBudWxsKSB7XG4gICAgICAgICAgLy8gTm8gbWF0Y2hpbmcgZGlyZWN0aXZlIHdhcyBmb3VuZCAtIHRoaXMgcmVmZXJlbmNlIHBvaW50cyB0byBhbiB1bmtub3duIHRhcmdldC4gTGVhdmUgaXRcbiAgICAgICAgICAvLyB1bm1hcHBlZC5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGRpclRhcmdldCAhPT0gbnVsbCkge1xuICAgICAgICAvLyBUaGlzIHJlZmVyZW5jZSBwb2ludHMgdG8gYSBkaXJlY3RpdmUuXG4gICAgICAgIHRoaXMucmVmZXJlbmNlcy5zZXQocmVmLCB7ZGlyZWN0aXZlOiBkaXJUYXJnZXQsIG5vZGV9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgcmVmZXJlbmNlIHBvaW50cyB0byB0aGUgbm9kZSBpdHNlbGYuXG4gICAgICAgIHRoaXMucmVmZXJlbmNlcy5zZXQocmVmLCBub2RlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEFzc29jaWF0ZSBhdHRyaWJ1dGVzL2JpbmRpbmdzIG9uIHRoZSBub2RlIHdpdGggZGlyZWN0aXZlcyBvciB3aXRoIHRoZSBub2RlIGl0c2VsZi5cbiAgICB0eXBlIEJvdW5kTm9kZSA9IEJvdW5kQXR0cmlidXRlfEJvdW5kRXZlbnR8VGV4dEF0dHJpYnV0ZTtcbiAgICBjb25zdCBzZXRBdHRyaWJ1dGVCaW5kaW5nID1cbiAgICAgICAgKGF0dHJpYnV0ZTogQm91bmROb2RlLCBpb1R5cGU6IGtleW9mIFBpY2s8RGlyZWN0aXZlTWV0YSwgJ2lucHV0cyd8J291dHB1dHMnPikgPT4ge1xuICAgICAgICAgIGNvbnN0IGRpciA9IGRpcmVjdGl2ZXMuZmluZChkaXIgPT4gZGlyW2lvVHlwZV0uaGFzQmluZGluZ1Byb3BlcnR5TmFtZShhdHRyaWJ1dGUubmFtZSkpO1xuICAgICAgICAgIGNvbnN0IGJpbmRpbmcgPSBkaXIgIT09IHVuZGVmaW5lZCA/IGRpciA6IG5vZGU7XG4gICAgICAgICAgdGhpcy5iaW5kaW5ncy5zZXQoYXR0cmlidXRlLCBiaW5kaW5nKTtcbiAgICAgICAgfTtcblxuICAgIC8vIE5vZGUgaW5wdXRzIChib3VuZCBhdHRyaWJ1dGVzKSBhbmQgdGV4dCBhdHRyaWJ1dGVzIGNhbiBiZSBib3VuZCB0byBhblxuICAgIC8vIGlucHV0IG9uIGEgZGlyZWN0aXZlLlxuICAgIG5vZGUuaW5wdXRzLmZvckVhY2goaW5wdXQgPT4gc2V0QXR0cmlidXRlQmluZGluZyhpbnB1dCwgJ2lucHV0cycpKTtcbiAgICBub2RlLmF0dHJpYnV0ZXMuZm9yRWFjaChhdHRyID0+IHNldEF0dHJpYnV0ZUJpbmRpbmcoYXR0ciwgJ2lucHV0cycpKTtcbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIFRlbXBsYXRlKSB7XG4gICAgICBub2RlLnRlbXBsYXRlQXR0cnMuZm9yRWFjaChhdHRyID0+IHNldEF0dHJpYnV0ZUJpbmRpbmcoYXR0ciwgJ2lucHV0cycpKTtcbiAgICB9XG4gICAgLy8gTm9kZSBvdXRwdXRzIChib3VuZCBldmVudHMpIGNhbiBiZSBib3VuZCB0byBhbiBvdXRwdXQgb24gYSBkaXJlY3RpdmUuXG4gICAgbm9kZS5vdXRwdXRzLmZvckVhY2gob3V0cHV0ID0+IHNldEF0dHJpYnV0ZUJpbmRpbmcob3V0cHV0LCAnb3V0cHV0cycpKTtcblxuICAgIC8vIFJlY3Vyc2UgaW50byB0aGUgbm9kZSdzIGNoaWxkcmVuLlxuICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiBjaGlsZC52aXNpdCh0aGlzKSk7XG4gIH1cblxuICB2aXNpdERlZmVycmVkQmxvY2soZGVmZXJyZWQ6IERlZmVycmVkQmxvY2spOiB2b2lkIHtcbiAgICB0aGlzLmlzSW5EZWZlckJsb2NrID0gdHJ1ZTtcbiAgICBkZWZlcnJlZC5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IGNoaWxkLnZpc2l0KHRoaXMpKTtcbiAgICB0aGlzLmlzSW5EZWZlckJsb2NrID0gZmFsc2U7XG5cbiAgICBkZWZlcnJlZC5wbGFjZWhvbGRlcj8udmlzaXQodGhpcyk7XG4gICAgZGVmZXJyZWQubG9hZGluZz8udmlzaXQodGhpcyk7XG4gICAgZGVmZXJyZWQuZXJyb3I/LnZpc2l0KHRoaXMpO1xuICB9XG5cbiAgdmlzaXREZWZlcnJlZEJsb2NrUGxhY2Vob2xkZXIoYmxvY2s6IERlZmVycmVkQmxvY2tQbGFjZWhvbGRlcik6IHZvaWQge1xuICAgIGJsb2NrLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4gY2hpbGQudmlzaXQodGhpcykpO1xuICB9XG5cbiAgdmlzaXREZWZlcnJlZEJsb2NrRXJyb3IoYmxvY2s6IERlZmVycmVkQmxvY2tFcnJvcik6IHZvaWQge1xuICAgIGJsb2NrLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4gY2hpbGQudmlzaXQodGhpcykpO1xuICB9XG5cbiAgdmlzaXREZWZlcnJlZEJsb2NrTG9hZGluZyhibG9jazogRGVmZXJyZWRCbG9ja0xvYWRpbmcpOiB2b2lkIHtcbiAgICBibG9jay5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IGNoaWxkLnZpc2l0KHRoaXMpKTtcbiAgfVxuXG4gIC8vIFVudXNlZCB2aXNpdG9ycy5cbiAgdmlzaXRDb250ZW50KGNvbnRlbnQ6IENvbnRlbnQpOiB2b2lkIHt9XG4gIHZpc2l0VmFyaWFibGUodmFyaWFibGU6IFZhcmlhYmxlKTogdm9pZCB7fVxuICB2aXNpdFJlZmVyZW5jZShyZWZlcmVuY2U6IFJlZmVyZW5jZSk6IHZvaWQge31cbiAgdmlzaXRUZXh0QXR0cmlidXRlKGF0dHJpYnV0ZTogVGV4dEF0dHJpYnV0ZSk6IHZvaWQge31cbiAgdmlzaXRCb3VuZEF0dHJpYnV0ZShhdHRyaWJ1dGU6IEJvdW5kQXR0cmlidXRlKTogdm9pZCB7fVxuICB2aXNpdEJvdW5kRXZlbnQoYXR0cmlidXRlOiBCb3VuZEV2ZW50KTogdm9pZCB7fVxuICB2aXNpdEJvdW5kQXR0cmlidXRlT3JFdmVudChub2RlOiBCb3VuZEF0dHJpYnV0ZXxCb3VuZEV2ZW50KSB7fVxuICB2aXNpdFRleHQodGV4dDogVGV4dCk6IHZvaWQge31cbiAgdmlzaXRCb3VuZFRleHQodGV4dDogQm91bmRUZXh0KTogdm9pZCB7fVxuICB2aXNpdEljdShpY3U6IEljdSk6IHZvaWQge31cbiAgdmlzaXREZWZlcnJlZFRyaWdnZXIodHJpZ2dlcjogRGVmZXJyZWRUcmlnZ2VyKTogdm9pZCB7fVxufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBhIHRlbXBsYXRlIGFuZCBleHRyYWN0IG1ldGFkYXRhIGFib3V0IGV4cHJlc3Npb25zIGFuZCBzeW1ib2xzIHdpdGhpbi5cbiAqXG4gKiBUaGlzIGlzIGEgY29tcGFuaW9uIHRvIHRoZSBgRGlyZWN0aXZlQmluZGVyYCB0aGF0IGRvZXNuJ3QgcmVxdWlyZSBrbm93bGVkZ2Ugb2YgZGlyZWN0aXZlcyBtYXRjaGVkXG4gKiB3aXRoaW4gdGhlIHRlbXBsYXRlIGluIG9yZGVyIHRvIG9wZXJhdGUuXG4gKlxuICogRXhwcmVzc2lvbnMgYXJlIHZpc2l0ZWQgYnkgdGhlIHN1cGVyY2xhc3MgYFJlY3Vyc2l2ZUFzdFZpc2l0b3JgLCB3aXRoIGN1c3RvbSBsb2dpYyBwcm92aWRlZFxuICogYnkgb3ZlcnJpZGRlbiBtZXRob2RzIGZyb20gdGhhdCB2aXNpdG9yLlxuICovXG5jbGFzcyBUZW1wbGF0ZUJpbmRlciBleHRlbmRzIFJlY3Vyc2l2ZUFzdFZpc2l0b3IgaW1wbGVtZW50cyBWaXNpdG9yIHtcbiAgcHJpdmF0ZSB2aXNpdE5vZGU6IChub2RlOiBOb2RlKSA9PiB2b2lkO1xuXG4gIC8vIEluZGljYXRlcyB3aGV0aGVyIHdlIGFyZSB2aXNpdGluZyBlbGVtZW50cyB3aXRoaW4gYSB7I2RlZmVyfSBibG9ja1xuICBwcml2YXRlIGlzSW5EZWZlckJsb2NrID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgYmluZGluZ3M6IE1hcDxBU1QsIFJlZmVyZW5jZXxWYXJpYWJsZT4sXG4gICAgICBwcml2YXRlIHN5bWJvbHM6IE1hcDxSZWZlcmVuY2V8VmFyaWFibGUsIFRlbXBsYXRlPiwgcHJpdmF0ZSB1c2VkUGlwZXM6IFNldDxzdHJpbmc+LFxuICAgICAgcHJpdmF0ZSBlYWdlclBpcGVzOiBTZXQ8c3RyaW5nPiwgcHJpdmF0ZSBkZWZlckJsb2NrczogU2V0PERlZmVycmVkQmxvY2s+LFxuICAgICAgcHJpdmF0ZSBuZXN0aW5nTGV2ZWw6IE1hcDxUZW1wbGF0ZSwgbnVtYmVyPiwgcHJpdmF0ZSBzY29wZTogU2NvcGUsXG4gICAgICBwcml2YXRlIHRlbXBsYXRlOiBUZW1wbGF0ZXxudWxsLCBwcml2YXRlIGxldmVsOiBudW1iZXIpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgLy8gU2F2ZSBhIGJpdCBvZiBwcm9jZXNzaW5nIHRpbWUgYnkgY29uc3RydWN0aW5nIHRoaXMgY2xvc3VyZSBpbiBhZHZhbmNlLlxuICAgIHRoaXMudmlzaXROb2RlID0gKG5vZGU6IE5vZGUpID0+IG5vZGUudmlzaXQodGhpcyk7XG4gIH1cblxuICAvLyBUaGlzIG1ldGhvZCBpcyBkZWZpbmVkIHRvIHJlY29uY2lsZSB0aGUgdHlwZSBvZiBUZW1wbGF0ZUJpbmRlciBzaW5jZSBib3RoXG4gIC8vIFJlY3Vyc2l2ZUFzdFZpc2l0b3IgYW5kIFZpc2l0b3IgZGVmaW5lIHRoZSB2aXNpdCgpIG1ldGhvZCBpbiB0aGVpclxuICAvLyBpbnRlcmZhY2VzLlxuICBvdmVycmlkZSB2aXNpdChub2RlOiBBU1R8Tm9kZSwgY29udGV4dD86IGFueSkge1xuICAgIGlmIChub2RlIGluc3RhbmNlb2YgQVNUKSB7XG4gICAgICBub2RlLnZpc2l0KHRoaXMsIGNvbnRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlLnZpc2l0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIGEgdGVtcGxhdGUgYW5kIGV4dHJhY3QgbWV0YWRhdGEgYWJvdXQgZXhwcmVzc2lvbnMgYW5kIHN5bWJvbHMgd2l0aGluLlxuICAgKlxuICAgKiBAcGFyYW0gbm9kZXMgdGhlIG5vZGVzIG9mIHRoZSB0ZW1wbGF0ZSB0byBwcm9jZXNzXG4gICAqIEBwYXJhbSBzY29wZSB0aGUgYFNjb3BlYCBvZiB0aGUgdGVtcGxhdGUgYmVpbmcgcHJvY2Vzc2VkLlxuICAgKiBAcmV0dXJucyB0aHJlZSBtYXBzIHdoaWNoIGNvbnRhaW4gbWV0YWRhdGEgYWJvdXQgdGhlIHRlbXBsYXRlOiBgZXhwcmVzc2lvbnNgIHdoaWNoIGludGVycHJldHNcbiAgICogc3BlY2lhbCBgQVNUYCBub2RlcyBpbiBleHByZXNzaW9ucyBhcyBwb2ludGluZyB0byByZWZlcmVuY2VzIG9yIHZhcmlhYmxlcyBkZWNsYXJlZCB3aXRoaW4gdGhlXG4gICAqIHRlbXBsYXRlLCBgc3ltYm9sc2Agd2hpY2ggbWFwcyB0aG9zZSB2YXJpYWJsZXMgYW5kIHJlZmVyZW5jZXMgdG8gdGhlIG5lc3RlZCBgVGVtcGxhdGVgIHdoaWNoXG4gICAqIGRlY2xhcmVzIHRoZW0sIGlmIGFueSwgYW5kIGBuZXN0aW5nTGV2ZWxgIHdoaWNoIGFzc29jaWF0ZXMgZWFjaCBgVGVtcGxhdGVgIHdpdGggYSBpbnRlZ2VyXG4gICAqIG5lc3RpbmcgbGV2ZWwgKGhvdyBtYW55IGxldmVscyBkZWVwIHdpdGhpbiB0aGUgdGVtcGxhdGUgc3RydWN0dXJlIHRoZSBgVGVtcGxhdGVgIGlzKSwgc3RhcnRpbmdcbiAgICogYXQgMS5cbiAgICovXG4gIHN0YXRpYyBhcHBseVdpdGhTY29wZShub2RlczogTm9kZVtdLCBzY29wZTogU2NvcGUpOiB7XG4gICAgZXhwcmVzc2lvbnM6IE1hcDxBU1QsIFJlZmVyZW5jZXxWYXJpYWJsZT4sXG4gICAgc3ltYm9sczogTWFwPFZhcmlhYmxlfFJlZmVyZW5jZSwgVGVtcGxhdGU+LFxuICAgIG5lc3RpbmdMZXZlbDogTWFwPFRlbXBsYXRlLCBudW1iZXI+LFxuICAgIHVzZWRQaXBlczogU2V0PHN0cmluZz4sXG4gICAgZWFnZXJQaXBlczogU2V0PHN0cmluZz4sXG4gICAgZGVmZXJCbG9ja3M6IFNldDxEZWZlcnJlZEJsb2NrPixcbiAgfSB7XG4gICAgY29uc3QgZXhwcmVzc2lvbnMgPSBuZXcgTWFwPEFTVCwgUmVmZXJlbmNlfFZhcmlhYmxlPigpO1xuICAgIGNvbnN0IHN5bWJvbHMgPSBuZXcgTWFwPFZhcmlhYmxlfFJlZmVyZW5jZSwgVGVtcGxhdGU+KCk7XG4gICAgY29uc3QgbmVzdGluZ0xldmVsID0gbmV3IE1hcDxUZW1wbGF0ZSwgbnVtYmVyPigpO1xuICAgIGNvbnN0IHVzZWRQaXBlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IGVhZ2VyUGlwZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBjb25zdCB0ZW1wbGF0ZSA9IG5vZGVzIGluc3RhbmNlb2YgVGVtcGxhdGUgPyBub2RlcyA6IG51bGw7XG4gICAgY29uc3QgZGVmZXJCbG9ja3MgPSBuZXcgU2V0PERlZmVycmVkQmxvY2s+KCk7XG4gICAgLy8gVGhlIHRvcC1sZXZlbCB0ZW1wbGF0ZSBoYXMgbmVzdGluZyBsZXZlbCAwLlxuICAgIGNvbnN0IGJpbmRlciA9IG5ldyBUZW1wbGF0ZUJpbmRlcihcbiAgICAgICAgZXhwcmVzc2lvbnMsIHN5bWJvbHMsIHVzZWRQaXBlcywgZWFnZXJQaXBlcywgZGVmZXJCbG9ja3MsIG5lc3RpbmdMZXZlbCwgc2NvcGUsIHRlbXBsYXRlLCAwKTtcbiAgICBiaW5kZXIuaW5nZXN0KG5vZGVzKTtcbiAgICByZXR1cm4ge2V4cHJlc3Npb25zLCBzeW1ib2xzLCBuZXN0aW5nTGV2ZWwsIHVzZWRQaXBlcywgZWFnZXJQaXBlcywgZGVmZXJCbG9ja3N9O1xuICB9XG5cbiAgcHJpdmF0ZSBpbmdlc3QodGVtcGxhdGU6IFRlbXBsYXRlfE5vZGVbXSk6IHZvaWQge1xuICAgIGlmICh0ZW1wbGF0ZSBpbnN0YW5jZW9mIFRlbXBsYXRlKSB7XG4gICAgICAvLyBGb3IgPG5nLXRlbXBsYXRlPnMsIHByb2Nlc3Mgb25seSB2YXJpYWJsZXMgYW5kIGNoaWxkIG5vZGVzLiBJbnB1dHMsIG91dHB1dHMsIHRlbXBsYXRlQXR0cnMsXG4gICAgICAvLyBhbmQgcmVmZXJlbmNlcyB3ZXJlIGFsbCBwcm9jZXNzZWQgaW4gdGhlIHNjb3BlIG9mIHRoZSBjb250YWluaW5nIHRlbXBsYXRlLlxuICAgICAgdGVtcGxhdGUudmFyaWFibGVzLmZvckVhY2godGhpcy52aXNpdE5vZGUpO1xuICAgICAgdGVtcGxhdGUuY2hpbGRyZW4uZm9yRWFjaCh0aGlzLnZpc2l0Tm9kZSk7XG5cbiAgICAgIC8vIFNldCB0aGUgbmVzdGluZyBsZXZlbC5cbiAgICAgIHRoaXMubmVzdGluZ0xldmVsLnNldCh0ZW1wbGF0ZSwgdGhpcy5sZXZlbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFZpc2l0IGVhY2ggbm9kZSBmcm9tIHRoZSB0b3AtbGV2ZWwgdGVtcGxhdGUuXG4gICAgICB0ZW1wbGF0ZS5mb3JFYWNoKHRoaXMudmlzaXROb2RlKTtcbiAgICB9XG4gIH1cblxuICB2aXNpdEVsZW1lbnQoZWxlbWVudDogRWxlbWVudCkge1xuICAgIC8vIFZpc2l0IHRoZSBpbnB1dHMsIG91dHB1dHMsIGFuZCBjaGlsZHJlbiBvZiB0aGUgZWxlbWVudC5cbiAgICBlbGVtZW50LmlucHV0cy5mb3JFYWNoKHRoaXMudmlzaXROb2RlKTtcbiAgICBlbGVtZW50Lm91dHB1dHMuZm9yRWFjaCh0aGlzLnZpc2l0Tm9kZSk7XG4gICAgZWxlbWVudC5jaGlsZHJlbi5mb3JFYWNoKHRoaXMudmlzaXROb2RlKTtcbiAgfVxuXG4gIHZpc2l0VGVtcGxhdGUodGVtcGxhdGU6IFRlbXBsYXRlKSB7XG4gICAgLy8gRmlyc3QsIHZpc2l0IGlucHV0cywgb3V0cHV0cyBhbmQgdGVtcGxhdGUgYXR0cmlidXRlcyBvZiB0aGUgdGVtcGxhdGUgbm9kZS5cbiAgICB0ZW1wbGF0ZS5pbnB1dHMuZm9yRWFjaCh0aGlzLnZpc2l0Tm9kZSk7XG4gICAgdGVtcGxhdGUub3V0cHV0cy5mb3JFYWNoKHRoaXMudmlzaXROb2RlKTtcbiAgICB0ZW1wbGF0ZS50ZW1wbGF0ZUF0dHJzLmZvckVhY2godGhpcy52aXNpdE5vZGUpO1xuXG4gICAgLy8gUmVmZXJlbmNlcyBhcmUgYWxzbyBldmFsdWF0ZWQgaW4gdGhlIG91dGVyIGNvbnRleHQuXG4gICAgdGVtcGxhdGUucmVmZXJlbmNlcy5mb3JFYWNoKHRoaXMudmlzaXROb2RlKTtcblxuICAgIC8vIE5leHQsIHJlY3Vyc2UgaW50byB0aGUgdGVtcGxhdGUgdXNpbmcgaXRzIHNjb3BlLCBhbmQgYnVtcGluZyB0aGUgbmVzdGluZyBsZXZlbCB1cCBieSBvbmUuXG4gICAgY29uc3QgY2hpbGRTY29wZSA9IHRoaXMuc2NvcGUuZ2V0Q2hpbGRTY29wZSh0ZW1wbGF0ZSk7XG4gICAgY29uc3QgYmluZGVyID0gbmV3IFRlbXBsYXRlQmluZGVyKFxuICAgICAgICB0aGlzLmJpbmRpbmdzLCB0aGlzLnN5bWJvbHMsIHRoaXMudXNlZFBpcGVzLCB0aGlzLmVhZ2VyUGlwZXMsIHRoaXMuZGVmZXJCbG9ja3MsXG4gICAgICAgIHRoaXMubmVzdGluZ0xldmVsLCBjaGlsZFNjb3BlLCB0ZW1wbGF0ZSwgdGhpcy5sZXZlbCArIDEpO1xuICAgIGJpbmRlci5pbmdlc3QodGVtcGxhdGUpO1xuICB9XG5cbiAgdmlzaXRWYXJpYWJsZSh2YXJpYWJsZTogVmFyaWFibGUpIHtcbiAgICAvLyBSZWdpc3RlciB0aGUgYFZhcmlhYmxlYCBhcyBhIHN5bWJvbCBpbiB0aGUgY3VycmVudCBgVGVtcGxhdGVgLlxuICAgIGlmICh0aGlzLnRlbXBsYXRlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnN5bWJvbHMuc2V0KHZhcmlhYmxlLCB0aGlzLnRlbXBsYXRlKTtcbiAgICB9XG4gIH1cblxuICB2aXNpdFJlZmVyZW5jZShyZWZlcmVuY2U6IFJlZmVyZW5jZSkge1xuICAgIC8vIFJlZ2lzdGVyIHRoZSBgUmVmZXJlbmNlYCBhcyBhIHN5bWJvbCBpbiB0aGUgY3VycmVudCBgVGVtcGxhdGVgLlxuICAgIGlmICh0aGlzLnRlbXBsYXRlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnN5bWJvbHMuc2V0KHJlZmVyZW5jZSwgdGhpcy50ZW1wbGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gVW51c2VkIHRlbXBsYXRlIHZpc2l0b3JzXG5cbiAgdmlzaXRUZXh0KHRleHQ6IFRleHQpIHt9XG4gIHZpc2l0Q29udGVudChjb250ZW50OiBDb250ZW50KSB7fVxuICB2aXNpdFRleHRBdHRyaWJ1dGUoYXR0cmlidXRlOiBUZXh0QXR0cmlidXRlKSB7fVxuICB2aXNpdEljdShpY3U6IEljdSk6IHZvaWQge1xuICAgIE9iamVjdC5rZXlzKGljdS52YXJzKS5mb3JFYWNoKGtleSA9PiBpY3UudmFyc1trZXldLnZpc2l0KHRoaXMpKTtcbiAgICBPYmplY3Qua2V5cyhpY3UucGxhY2Vob2xkZXJzKS5mb3JFYWNoKGtleSA9PiBpY3UucGxhY2Vob2xkZXJzW2tleV0udmlzaXQodGhpcykpO1xuICB9XG5cbiAgLy8gVGhlIHJlbWFpbmluZyB2aXNpdG9ycyBhcmUgY29uY2VybmVkIHdpdGggcHJvY2Vzc2luZyBBU1QgZXhwcmVzc2lvbnMgd2l0aGluIHRlbXBsYXRlIGJpbmRpbmdzXG5cbiAgdmlzaXRCb3VuZEF0dHJpYnV0ZShhdHRyaWJ1dGU6IEJvdW5kQXR0cmlidXRlKSB7XG4gICAgYXR0cmlidXRlLnZhbHVlLnZpc2l0KHRoaXMpO1xuICB9XG5cbiAgdmlzaXRCb3VuZEV2ZW50KGV2ZW50OiBCb3VuZEV2ZW50KSB7XG4gICAgZXZlbnQuaGFuZGxlci52aXNpdCh0aGlzKTtcbiAgfVxuXG4gIHZpc2l0RGVmZXJyZWRCbG9jayhkZWZlcnJlZDogRGVmZXJyZWRCbG9jaykge1xuICAgIHRoaXMuZGVmZXJCbG9ja3MuYWRkKGRlZmVycmVkKTtcblxuICAgIHRoaXMuaXNJbkRlZmVyQmxvY2sgPSB0cnVlO1xuICAgIGRlZmVycmVkLmNoaWxkcmVuLmZvckVhY2godGhpcy52aXNpdE5vZGUpO1xuICAgIHRoaXMuaXNJbkRlZmVyQmxvY2sgPSBmYWxzZTtcblxuICAgIGRlZmVycmVkLnRyaWdnZXJzLmZvckVhY2godGhpcy52aXNpdE5vZGUpO1xuICAgIGRlZmVycmVkLnByZWZldGNoVHJpZ2dlcnMuZm9yRWFjaCh0aGlzLnZpc2l0Tm9kZSk7XG4gICAgZGVmZXJyZWQucGxhY2Vob2xkZXIgJiYgdGhpcy52aXNpdE5vZGUoZGVmZXJyZWQucGxhY2Vob2xkZXIpO1xuICAgIGRlZmVycmVkLmxvYWRpbmcgJiYgdGhpcy52aXNpdE5vZGUoZGVmZXJyZWQubG9hZGluZyk7XG4gICAgZGVmZXJyZWQuZXJyb3IgJiYgdGhpcy52aXNpdE5vZGUoZGVmZXJyZWQuZXJyb3IpO1xuICB9XG5cbiAgdmlzaXREZWZlcnJlZFRyaWdnZXIodHJpZ2dlcjogRGVmZXJyZWRUcmlnZ2VyKTogdm9pZCB7XG4gICAgaWYgKHRyaWdnZXIgaW5zdGFuY2VvZiBCb3VuZERlZmVycmVkVHJpZ2dlcikge1xuICAgICAgdHJpZ2dlci52YWx1ZS52aXNpdCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICB2aXNpdERlZmVycmVkQmxvY2tQbGFjZWhvbGRlcihibG9jazogRGVmZXJyZWRCbG9ja1BsYWNlaG9sZGVyKSB7XG4gICAgYmxvY2suY2hpbGRyZW4uZm9yRWFjaCh0aGlzLnZpc2l0Tm9kZSk7XG4gIH1cblxuICB2aXNpdERlZmVycmVkQmxvY2tFcnJvcihibG9jazogRGVmZXJyZWRCbG9ja0Vycm9yKSB7XG4gICAgYmxvY2suY2hpbGRyZW4uZm9yRWFjaCh0aGlzLnZpc2l0Tm9kZSk7XG4gIH1cblxuICB2aXNpdERlZmVycmVkQmxvY2tMb2FkaW5nKGJsb2NrOiBEZWZlcnJlZEJsb2NrTG9hZGluZykge1xuICAgIGJsb2NrLmNoaWxkcmVuLmZvckVhY2godGhpcy52aXNpdE5vZGUpO1xuICB9XG5cbiAgdmlzaXRCb3VuZFRleHQodGV4dDogQm91bmRUZXh0KSB7XG4gICAgdGV4dC52YWx1ZS52aXNpdCh0aGlzKTtcbiAgfVxuICBvdmVycmlkZSB2aXNpdFBpcGUoYXN0OiBCaW5kaW5nUGlwZSwgY29udGV4dDogYW55KTogYW55IHtcbiAgICB0aGlzLnVzZWRQaXBlcy5hZGQoYXN0Lm5hbWUpO1xuICAgIGlmICghdGhpcy5pc0luRGVmZXJCbG9jaykge1xuICAgICAgdGhpcy5lYWdlclBpcGVzLmFkZChhc3QubmFtZSk7XG4gICAgfVxuICAgIHJldHVybiBzdXBlci52aXNpdFBpcGUoYXN0LCBjb250ZXh0KTtcbiAgfVxuXG4gIC8vIFRoZXNlIGZpdmUgdHlwZXMgb2YgQVNUIGV4cHJlc3Npb25zIGNhbiByZWZlciB0byBleHByZXNzaW9uIHJvb3RzLCB3aGljaCBjb3VsZCBiZSB2YXJpYWJsZXNcbiAgLy8gb3IgcmVmZXJlbmNlcyBpbiB0aGUgY3VycmVudCBzY29wZS5cblxuICBvdmVycmlkZSB2aXNpdFByb3BlcnR5UmVhZChhc3Q6IFByb3BlcnR5UmVhZCwgY29udGV4dDogYW55KTogYW55IHtcbiAgICB0aGlzLm1heWJlTWFwKGNvbnRleHQsIGFzdCwgYXN0Lm5hbWUpO1xuICAgIHJldHVybiBzdXBlci52aXNpdFByb3BlcnR5UmVhZChhc3QsIGNvbnRleHQpO1xuICB9XG5cbiAgb3ZlcnJpZGUgdmlzaXRTYWZlUHJvcGVydHlSZWFkKGFzdDogU2FmZVByb3BlcnR5UmVhZCwgY29udGV4dDogYW55KTogYW55IHtcbiAgICB0aGlzLm1heWJlTWFwKGNvbnRleHQsIGFzdCwgYXN0Lm5hbWUpO1xuICAgIHJldHVybiBzdXBlci52aXNpdFNhZmVQcm9wZXJ0eVJlYWQoYXN0LCBjb250ZXh0KTtcbiAgfVxuXG4gIG92ZXJyaWRlIHZpc2l0UHJvcGVydHlXcml0ZShhc3Q6IFByb3BlcnR5V3JpdGUsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgdGhpcy5tYXliZU1hcChjb250ZXh0LCBhc3QsIGFzdC5uYW1lKTtcbiAgICByZXR1cm4gc3VwZXIudmlzaXRQcm9wZXJ0eVdyaXRlKGFzdCwgY29udGV4dCk7XG4gIH1cblxuICBwcml2YXRlIG1heWJlTWFwKHNjb3BlOiBTY29wZSwgYXN0OiBQcm9wZXJ0eVJlYWR8U2FmZVByb3BlcnR5UmVhZHxQcm9wZXJ0eVdyaXRlLCBuYW1lOiBzdHJpbmcpOlxuICAgICAgdm9pZCB7XG4gICAgLy8gSWYgdGhlIHJlY2VpdmVyIG9mIHRoZSBleHByZXNzaW9uIGlzbid0IHRoZSBgSW1wbGljaXRSZWNlaXZlcmAsIHRoaXMgaXNuJ3QgdGhlIHJvb3Qgb2YgYW5cbiAgICAvLyBgQVNUYCBleHByZXNzaW9uIHRoYXQgbWFwcyB0byBhIGBWYXJpYWJsZWAgb3IgYFJlZmVyZW5jZWAuXG4gICAgaWYgKCEoYXN0LnJlY2VpdmVyIGluc3RhbmNlb2YgSW1wbGljaXRSZWNlaXZlcikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBuYW1lIGV4aXN0cyBpbiB0aGUgY3VycmVudCBzY29wZS4gSWYgc28sIG1hcCBpdC4gT3RoZXJ3aXNlLCB0aGUgbmFtZSBpc1xuICAgIC8vIHByb2JhYmx5IGEgcHJvcGVydHkgb24gdGhlIHRvcC1sZXZlbCBjb21wb25lbnQgY29udGV4dC5cbiAgICBsZXQgdGFyZ2V0ID0gdGhpcy5zY29wZS5sb29rdXAobmFtZSk7XG4gICAgaWYgKHRhcmdldCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5iaW5kaW5ncy5zZXQoYXN0LCB0YXJnZXQpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1ldGFkYXRhIGNvbnRhaW5lciBmb3IgYSBgVGFyZ2V0YCB0aGF0IGFsbG93cyBxdWVyaWVzIGZvciBzcGVjaWZpYyBiaXRzIG9mIG1ldGFkYXRhLlxuICpcbiAqIFNlZSBgQm91bmRUYXJnZXRgIGZvciBkb2N1bWVudGF0aW9uIG9uIHRoZSBpbmRpdmlkdWFsIG1ldGhvZHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBSM0JvdW5kVGFyZ2V0PERpcmVjdGl2ZVQgZXh0ZW5kcyBEaXJlY3RpdmVNZXRhPiBpbXBsZW1lbnRzIEJvdW5kVGFyZ2V0PERpcmVjdGl2ZVQ+IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICByZWFkb25seSB0YXJnZXQ6IFRhcmdldCwgcHJpdmF0ZSBkaXJlY3RpdmVzOiBNYXA8RWxlbWVudHxUZW1wbGF0ZSwgRGlyZWN0aXZlVFtdPixcbiAgICAgIHByaXZhdGUgZWFnZXJEaXJlY3RpdmVzOiBEaXJlY3RpdmVUW10sXG4gICAgICBwcml2YXRlIGJpbmRpbmdzOiBNYXA8Qm91bmRBdHRyaWJ1dGV8Qm91bmRFdmVudHxUZXh0QXR0cmlidXRlLCBEaXJlY3RpdmVUfEVsZW1lbnR8VGVtcGxhdGU+LFxuICAgICAgcHJpdmF0ZSByZWZlcmVuY2VzOlxuICAgICAgICAgIE1hcDxCb3VuZEF0dHJpYnV0ZXxCb3VuZEV2ZW50fFJlZmVyZW5jZXxUZXh0QXR0cmlidXRlLFxuICAgICAgICAgICAgICB7ZGlyZWN0aXZlOiBEaXJlY3RpdmVULCBub2RlOiBFbGVtZW50fFRlbXBsYXRlfXxFbGVtZW50fFRlbXBsYXRlPixcbiAgICAgIHByaXZhdGUgZXhwclRhcmdldHM6IE1hcDxBU1QsIFJlZmVyZW5jZXxWYXJpYWJsZT4sXG4gICAgICBwcml2YXRlIHN5bWJvbHM6IE1hcDxSZWZlcmVuY2V8VmFyaWFibGUsIFRlbXBsYXRlPixcbiAgICAgIHByaXZhdGUgbmVzdGluZ0xldmVsOiBNYXA8VGVtcGxhdGUsIG51bWJlcj4sXG4gICAgICBwcml2YXRlIHRlbXBsYXRlRW50aXRpZXM6IE1hcDxUZW1wbGF0ZXxudWxsLCBSZWFkb25seVNldDxSZWZlcmVuY2V8VmFyaWFibGU+PixcbiAgICAgIHByaXZhdGUgdXNlZFBpcGVzOiBTZXQ8c3RyaW5nPiwgcHJpdmF0ZSBlYWdlclBpcGVzOiBTZXQ8c3RyaW5nPixcbiAgICAgIHByaXZhdGUgZGVmZXJyZWRCbG9ja3M6IFNldDxEZWZlcnJlZEJsb2NrPikge31cblxuICBnZXRFbnRpdGllc0luVGVtcGxhdGVTY29wZSh0ZW1wbGF0ZTogVGVtcGxhdGV8bnVsbCk6IFJlYWRvbmx5U2V0PFJlZmVyZW5jZXxWYXJpYWJsZT4ge1xuICAgIHJldHVybiB0aGlzLnRlbXBsYXRlRW50aXRpZXMuZ2V0KHRlbXBsYXRlKSA/PyBuZXcgU2V0KCk7XG4gIH1cblxuICBnZXREaXJlY3RpdmVzT2ZOb2RlKG5vZGU6IEVsZW1lbnR8VGVtcGxhdGUpOiBEaXJlY3RpdmVUW118bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuZGlyZWN0aXZlcy5nZXQobm9kZSkgfHwgbnVsbDtcbiAgfVxuXG4gIGdldFJlZmVyZW5jZVRhcmdldChyZWY6IFJlZmVyZW5jZSk6IHtkaXJlY3RpdmU6IERpcmVjdGl2ZVQsIG5vZGU6IEVsZW1lbnR8VGVtcGxhdGV9fEVsZW1lbnRcbiAgICAgIHxUZW1wbGF0ZXxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5yZWZlcmVuY2VzLmdldChyZWYpIHx8IG51bGw7XG4gIH1cblxuICBnZXRDb25zdW1lck9mQmluZGluZyhiaW5kaW5nOiBCb3VuZEF0dHJpYnV0ZXxCb3VuZEV2ZW50fFRleHRBdHRyaWJ1dGUpOiBEaXJlY3RpdmVUfEVsZW1lbnRcbiAgICAgIHxUZW1wbGF0ZXxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5iaW5kaW5ncy5nZXQoYmluZGluZykgfHwgbnVsbDtcbiAgfVxuXG4gIGdldEV4cHJlc3Npb25UYXJnZXQoZXhwcjogQVNUKTogUmVmZXJlbmNlfFZhcmlhYmxlfG51bGwge1xuICAgIHJldHVybiB0aGlzLmV4cHJUYXJnZXRzLmdldChleHByKSB8fCBudWxsO1xuICB9XG5cbiAgZ2V0VGVtcGxhdGVPZlN5bWJvbChzeW1ib2w6IFJlZmVyZW5jZXxWYXJpYWJsZSk6IFRlbXBsYXRlfG51bGwge1xuICAgIHJldHVybiB0aGlzLnN5bWJvbHMuZ2V0KHN5bWJvbCkgfHwgbnVsbDtcbiAgfVxuXG4gIGdldE5lc3RpbmdMZXZlbCh0ZW1wbGF0ZTogVGVtcGxhdGUpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLm5lc3RpbmdMZXZlbC5nZXQodGVtcGxhdGUpIHx8IDA7XG4gIH1cblxuICBnZXRVc2VkRGlyZWN0aXZlcygpOiBEaXJlY3RpdmVUW10ge1xuICAgIGNvbnN0IHNldCA9IG5ldyBTZXQ8RGlyZWN0aXZlVD4oKTtcbiAgICB0aGlzLmRpcmVjdGl2ZXMuZm9yRWFjaChkaXJzID0+IGRpcnMuZm9yRWFjaChkaXIgPT4gc2V0LmFkZChkaXIpKSk7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oc2V0LnZhbHVlcygpKTtcbiAgfVxuXG4gIGdldEVhZ2VybHlVc2VkRGlyZWN0aXZlcygpOiBEaXJlY3RpdmVUW10ge1xuICAgIGNvbnN0IHNldCA9IG5ldyBTZXQ8RGlyZWN0aXZlVD4odGhpcy5lYWdlckRpcmVjdGl2ZXMpO1xuICAgIHJldHVybiBBcnJheS5mcm9tKHNldC52YWx1ZXMoKSk7XG4gIH1cblxuICBnZXRVc2VkUGlwZXMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMudXNlZFBpcGVzKTtcbiAgfVxuXG4gIGdldEVhZ2VybHlVc2VkUGlwZXMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuZWFnZXJQaXBlcyk7XG4gIH1cblxuICBnZXREZWZlckJsb2NrcygpOiBEZWZlcnJlZEJsb2NrW10ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuZGVmZXJyZWRCbG9ja3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RUZW1wbGF0ZUVudGl0aWVzKHJvb3RTY29wZTogU2NvcGUpOiBNYXA8VGVtcGxhdGV8bnVsbCwgU2V0PFJlZmVyZW5jZXxWYXJpYWJsZT4+IHtcbiAgY29uc3QgZW50aXR5TWFwID0gbmV3IE1hcDxUZW1wbGF0ZXxudWxsLCBNYXA8c3RyaW5nLCBSZWZlcmVuY2V8VmFyaWFibGU+PigpO1xuXG4gIGZ1bmN0aW9uIGV4dHJhY3RTY29wZUVudGl0aWVzKHNjb3BlOiBTY29wZSk6IE1hcDxzdHJpbmcsIFJlZmVyZW5jZXxWYXJpYWJsZT4ge1xuICAgIGlmIChlbnRpdHlNYXAuaGFzKHNjb3BlLnRlbXBsYXRlKSkge1xuICAgICAgcmV0dXJuIGVudGl0eU1hcC5nZXQoc2NvcGUudGVtcGxhdGUpITtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50RW50aXRpZXMgPSBzY29wZS5uYW1lZEVudGl0aWVzO1xuXG4gICAgbGV0IHRlbXBsYXRlRW50aXRpZXM6IE1hcDxzdHJpbmcsIFJlZmVyZW5jZXxWYXJpYWJsZT47XG4gICAgaWYgKHNjb3BlLnBhcmVudFNjb3BlICE9PSBudWxsKSB7XG4gICAgICB0ZW1wbGF0ZUVudGl0aWVzID0gbmV3IE1hcChbLi4uZXh0cmFjdFNjb3BlRW50aXRpZXMoc2NvcGUucGFyZW50U2NvcGUpLCAuLi5jdXJyZW50RW50aXRpZXNdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGVtcGxhdGVFbnRpdGllcyA9IG5ldyBNYXAoY3VycmVudEVudGl0aWVzKTtcbiAgICB9XG5cbiAgICBlbnRpdHlNYXAuc2V0KHNjb3BlLnRlbXBsYXRlLCB0ZW1wbGF0ZUVudGl0aWVzKTtcbiAgICByZXR1cm4gdGVtcGxhdGVFbnRpdGllcztcbiAgfVxuXG4gIGNvbnN0IHNjb3Blc1RvUHJvY2VzczogU2NvcGVbXSA9IFtyb290U2NvcGVdO1xuICB3aGlsZSAoc2NvcGVzVG9Qcm9jZXNzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBzY29wZSA9IHNjb3Blc1RvUHJvY2Vzcy5wb3AoKSE7XG4gICAgZm9yIChjb25zdCBjaGlsZFNjb3BlIG9mIHNjb3BlLmNoaWxkU2NvcGVzLnZhbHVlcygpKSB7XG4gICAgICBzY29wZXNUb1Byb2Nlc3MucHVzaChjaGlsZFNjb3BlKTtcbiAgICB9XG4gICAgZXh0cmFjdFNjb3BlRW50aXRpZXMoc2NvcGUpO1xuICB9XG5cbiAgY29uc3QgdGVtcGxhdGVFbnRpdGllcyA9IG5ldyBNYXA8VGVtcGxhdGV8bnVsbCwgU2V0PFJlZmVyZW5jZXxWYXJpYWJsZT4+KCk7XG4gIGZvciAoY29uc3QgW3RlbXBsYXRlLCBlbnRpdGllc10gb2YgZW50aXR5TWFwKSB7XG4gICAgdGVtcGxhdGVFbnRpdGllcy5zZXQodGVtcGxhdGUsIG5ldyBTZXQoZW50aXRpZXMudmFsdWVzKCkpKTtcbiAgfVxuICByZXR1cm4gdGVtcGxhdGVFbnRpdGllcztcbn1cbiJdfQ==