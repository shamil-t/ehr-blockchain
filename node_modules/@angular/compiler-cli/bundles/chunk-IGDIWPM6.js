
      import {createRequire as __cjsCompatRequire} from 'module';
      const require = __cjsCompatRequire(import.meta.url);
    
import {
  ImportManager,
  translateExpression,
  translateStatement,
  translateType
} from "./chunk-ZETVX4VH.js";
import {
  ClassMemberKind,
  ErrorCode,
  FatalDiagnosticError,
  ImportFlags,
  Reference,
  assertSuccessfulReferenceEmit,
  attachDefaultImportDeclaration,
  filterToMembersWithDecorator,
  getDefaultImportDeclaration,
  getSourceFile,
  identifierOfNode,
  isDeclaration,
  isFromDtsFile,
  isNamedClassDeclaration,
  makeDiagnostic,
  makeRelatedInformation,
  nodeDebugInfo,
  nodeNameForError,
  reflectObjectLiteral,
  reflectTypeEntityToDeclaration,
  typeNodeToValueExpr
} from "./chunk-CS2FNZXR.js";
import {
  PerfEvent,
  PerfPhase
} from "./chunk-HJOPJLIM.js";
import {
  absoluteFrom,
  absoluteFromSourceFile,
  relative
} from "./chunk-EC5K6QPP.js";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/common/src/util.mjs
import { ExternalExpr, ParseLocation, ParseSourceFile, ParseSourceSpan, ReadPropExpr, WrappedNodeExpr } from "@angular/compiler";
import ts from "typescript";
function valueReferenceToExpression(valueRef) {
  if (valueRef.kind === 2) {
    return null;
  } else if (valueRef.kind === 0) {
    const expr = new WrappedNodeExpr(valueRef.expression);
    if (valueRef.defaultImportStatement !== null) {
      attachDefaultImportDeclaration(expr, valueRef.defaultImportStatement);
    }
    return expr;
  } else {
    let importExpr = new ExternalExpr({ moduleName: valueRef.moduleName, name: valueRef.importedName });
    if (valueRef.nestedPath !== null) {
      for (const property of valueRef.nestedPath) {
        importExpr = new ReadPropExpr(importExpr, property);
      }
    }
    return importExpr;
  }
}
function toR3Reference(origin, ref, context, refEmitter) {
  const emittedValueRef = refEmitter.emit(ref, context);
  assertSuccessfulReferenceEmit(emittedValueRef, origin, "class");
  const emittedTypeRef = refEmitter.emit(ref, context, ImportFlags.ForceNewImport | ImportFlags.AllowTypeImports);
  assertSuccessfulReferenceEmit(emittedTypeRef, origin, "class");
  return {
    value: emittedValueRef.expression,
    type: emittedTypeRef.expression
  };
}
function isAngularCore(decorator) {
  return decorator.import !== null && decorator.import.from === "@angular/core";
}
function isAngularCoreReference(reference, symbolName) {
  return reference.ownedByModuleGuess === "@angular/core" && reference.debugName === symbolName;
}
function findAngularDecorator(decorators, name, isCore) {
  return decorators.find((decorator) => isAngularDecorator(decorator, name, isCore));
}
function isAngularDecorator(decorator, name, isCore) {
  if (isCore) {
    return decorator.name === name;
  } else if (isAngularCore(decorator)) {
    return decorator.import.name === name;
  }
  return false;
}
function unwrapExpression(node) {
  while (ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) {
    node = node.expression;
  }
  return node;
}
function expandForwardRef(arg) {
  arg = unwrapExpression(arg);
  if (!ts.isArrowFunction(arg) && !ts.isFunctionExpression(arg)) {
    return null;
  }
  const body = arg.body;
  if (ts.isBlock(body)) {
    if (body.statements.length !== 1) {
      return null;
    }
    const stmt = body.statements[0];
    if (!ts.isReturnStatement(stmt) || stmt.expression === void 0) {
      return null;
    }
    return stmt.expression;
  } else {
    return body;
  }
}
function tryUnwrapForwardRef(node, reflector) {
  node = unwrapExpression(node);
  if (!ts.isCallExpression(node) || node.arguments.length !== 1) {
    return null;
  }
  const fn = ts.isPropertyAccessExpression(node.expression) ? node.expression.name : node.expression;
  if (!ts.isIdentifier(fn)) {
    return null;
  }
  const expr = expandForwardRef(node.arguments[0]);
  if (expr === null) {
    return null;
  }
  const imp = reflector.getImportOfIdentifier(fn);
  if (imp === null || imp.from !== "@angular/core" || imp.name !== "forwardRef") {
    return null;
  }
  return expr;
}
var forwardRefResolver = (fn, callExpr, resolve, unresolvable) => {
  if (!isAngularCoreReference(fn, "forwardRef") || callExpr.arguments.length !== 1) {
    return unresolvable;
  }
  const expanded = expandForwardRef(callExpr.arguments[0]);
  if (expanded !== null) {
    return resolve(expanded);
  } else {
    return unresolvable;
  }
};
function combineResolvers(resolvers) {
  return (fn, callExpr, resolve, unresolvable) => {
    for (const resolver of resolvers) {
      const resolved = resolver(fn, callExpr, resolve, unresolvable);
      if (resolved !== unresolvable) {
        return resolved;
      }
    }
    return unresolvable;
  };
}
function isExpressionForwardReference(expr, context, contextSource) {
  if (isWrappedTsNodeExpr(expr)) {
    const node = ts.getOriginalNode(expr.node);
    return node.getSourceFile() === contextSource && context.pos < node.pos;
  } else {
    return false;
  }
}
function isWrappedTsNodeExpr(expr) {
  return expr instanceof WrappedNodeExpr;
}
function readBaseClass(node, reflector, evaluator) {
  const baseExpression = reflector.getBaseClassExpression(node);
  if (baseExpression !== null) {
    const baseClass = evaluator.evaluate(baseExpression);
    if (baseClass instanceof Reference && reflector.isClass(baseClass.node)) {
      return baseClass;
    } else {
      return "dynamic";
    }
  }
  return null;
}
var parensWrapperTransformerFactory = (context) => {
  const visitor = (node) => {
    const visited = ts.visitEachChild(node, visitor, context);
    if (ts.isArrowFunction(visited) || ts.isFunctionExpression(visited)) {
      return ts.factory.createParenthesizedExpression(visited);
    }
    return visited;
  };
  return (node) => ts.visitEachChild(node, visitor, context);
};
function wrapFunctionExpressionsInParens(expression) {
  return ts.transform(expression, [parensWrapperTransformerFactory]).transformed[0];
}
function resolveProvidersRequiringFactory(rawProviders, reflector, evaluator) {
  const providers = /* @__PURE__ */ new Set();
  const resolvedProviders = evaluator.evaluate(rawProviders);
  if (!Array.isArray(resolvedProviders)) {
    return providers;
  }
  resolvedProviders.forEach(function processProviders(provider) {
    let tokenClass = null;
    if (Array.isArray(provider)) {
      provider.forEach(processProviders);
    } else if (provider instanceof Reference) {
      tokenClass = provider;
    } else if (provider instanceof Map && provider.has("useClass") && !provider.has("deps")) {
      const useExisting = provider.get("useClass");
      if (useExisting instanceof Reference) {
        tokenClass = useExisting;
      }
    }
    if (tokenClass !== null && !tokenClass.node.getSourceFile().isDeclarationFile && reflector.isClass(tokenClass.node)) {
      const constructorParameters = reflector.getConstructorParameters(tokenClass.node);
      if (constructorParameters !== null && constructorParameters.length > 0) {
        providers.add(tokenClass);
      }
    }
  });
  return providers;
}
function wrapTypeReference(reflector, clazz) {
  const value = new WrappedNodeExpr(clazz.name);
  const type = value;
  return { value, type };
}
function createSourceSpan(node) {
  const sf = node.getSourceFile();
  const [startOffset, endOffset] = [node.getStart(), node.getEnd()];
  const { line: startLine, character: startCol } = sf.getLineAndCharacterOfPosition(startOffset);
  const { line: endLine, character: endCol } = sf.getLineAndCharacterOfPosition(endOffset);
  const parseSf = new ParseSourceFile(sf.getFullText(), sf.fileName);
  return new ParseSourceSpan(new ParseLocation(parseSf, startOffset, startLine + 1, startCol + 1), new ParseLocation(parseSf, endOffset, endLine + 1, endCol + 1));
}
function compileResults(fac, def, metadataStmt, propName, additionalFields, deferrableImports) {
  const statements = def.statements;
  if (metadataStmt !== null) {
    statements.push(metadataStmt);
  }
  const results = [
    fac,
    {
      name: propName,
      initializer: def.expression,
      statements: def.statements,
      type: def.type,
      deferrableImports
    }
  ];
  if (additionalFields !== null) {
    results.push(...additionalFields);
  }
  return results;
}
function toFactoryMetadata(meta, target) {
  return {
    name: meta.name,
    type: meta.type,
    typeArgumentCount: meta.typeArgumentCount,
    deps: meta.deps,
    target
  };
}
function resolveImportedFile(moduleResolver, importedFile, expr, origin) {
  if (importedFile !== "unknown") {
    return importedFile;
  }
  if (!(expr instanceof ExternalExpr)) {
    return null;
  }
  return moduleResolver.resolveModule(expr.value.moduleName, origin.fileName);
}
function getOriginNodeForDiagnostics(expr, container) {
  const nodeSf = expr.getSourceFile();
  const exprSf = container.getSourceFile();
  if (nodeSf === exprSf && expr.pos >= container.pos && expr.end <= container.end) {
    return expr;
  } else {
    return container;
  }
}
function isAbstractClassDeclaration(clazz) {
  return ts.canHaveModifiers(clazz) && clazz.modifiers !== void 0 ? clazz.modifiers.some((mod) => mod.kind === ts.SyntaxKind.AbstractKeyword) : false;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/partial_evaluator/src/dynamic.mjs
var DynamicValue = class {
  constructor(node, reason, code) {
    this.node = node;
    this.reason = reason;
    this.code = code;
  }
  static fromDynamicInput(node, input) {
    return new DynamicValue(node, input, 0);
  }
  static fromDynamicString(node) {
    return new DynamicValue(node, void 0, 1);
  }
  static fromExternalReference(node, ref) {
    return new DynamicValue(node, ref, 2);
  }
  static fromUnsupportedSyntax(node) {
    return new DynamicValue(node, void 0, 3);
  }
  static fromUnknownIdentifier(node) {
    return new DynamicValue(node, void 0, 4);
  }
  static fromInvalidExpressionType(node, value) {
    return new DynamicValue(node, value, 5);
  }
  static fromComplexFunctionCall(node, fn) {
    return new DynamicValue(node, fn, 6);
  }
  static fromDynamicType(node) {
    return new DynamicValue(node, void 0, 7);
  }
  static fromSyntheticInput(node, value) {
    return new DynamicValue(node, value, 8);
  }
  static fromUnknown(node) {
    return new DynamicValue(node, void 0, 9);
  }
  isFromDynamicInput() {
    return this.code === 0;
  }
  isFromDynamicString() {
    return this.code === 1;
  }
  isFromExternalReference() {
    return this.code === 2;
  }
  isFromUnsupportedSyntax() {
    return this.code === 3;
  }
  isFromUnknownIdentifier() {
    return this.code === 4;
  }
  isFromInvalidExpressionType() {
    return this.code === 5;
  }
  isFromComplexFunctionCall() {
    return this.code === 6;
  }
  isFromDynamicType() {
    return this.code === 7;
  }
  isFromUnknown() {
    return this.code === 9;
  }
  accept(visitor) {
    switch (this.code) {
      case 0:
        return visitor.visitDynamicInput(this);
      case 1:
        return visitor.visitDynamicString(this);
      case 2:
        return visitor.visitExternalReference(this);
      case 3:
        return visitor.visitUnsupportedSyntax(this);
      case 4:
        return visitor.visitUnknownIdentifier(this);
      case 5:
        return visitor.visitInvalidExpressionType(this);
      case 6:
        return visitor.visitComplexFunctionCall(this);
      case 7:
        return visitor.visitDynamicType(this);
      case 8:
        return visitor.visitSyntheticInput(this);
      case 9:
        return visitor.visitUnknown(this);
    }
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/partial_evaluator/src/interpreter.mjs
import ts2 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/partial_evaluator/src/result.mjs
var ResolvedModule = class {
  constructor(exports, evaluate) {
    this.exports = exports;
    this.evaluate = evaluate;
  }
  getExport(name) {
    if (!this.exports.has(name)) {
      return void 0;
    }
    return this.evaluate(this.exports.get(name));
  }
  getExports() {
    const map = /* @__PURE__ */ new Map();
    this.exports.forEach((decl, name) => {
      map.set(name, this.evaluate(decl));
    });
    return map;
  }
};
var EnumValue = class {
  constructor(enumRef, name, resolved) {
    this.enumRef = enumRef;
    this.name = name;
    this.resolved = resolved;
  }
};
var KnownFn = class {
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/partial_evaluator/src/builtin.mjs
var ArraySliceBuiltinFn = class extends KnownFn {
  constructor(lhs) {
    super();
    this.lhs = lhs;
  }
  evaluate(node, args) {
    if (args.length === 0) {
      return this.lhs;
    } else {
      return DynamicValue.fromUnknown(node);
    }
  }
};
var ArrayConcatBuiltinFn = class extends KnownFn {
  constructor(lhs) {
    super();
    this.lhs = lhs;
  }
  evaluate(node, args) {
    const result = [...this.lhs];
    for (const arg of args) {
      if (arg instanceof DynamicValue) {
        result.push(DynamicValue.fromDynamicInput(node, arg));
      } else if (Array.isArray(arg)) {
        result.push(...arg);
      } else {
        result.push(arg);
      }
    }
    return result;
  }
};
var StringConcatBuiltinFn = class extends KnownFn {
  constructor(lhs) {
    super();
    this.lhs = lhs;
  }
  evaluate(node, args) {
    let result = this.lhs;
    for (const arg of args) {
      const resolved = arg instanceof EnumValue ? arg.resolved : arg;
      if (typeof resolved === "string" || typeof resolved === "number" || typeof resolved === "boolean" || resolved == null) {
        result = result.concat(resolved);
      } else {
        return DynamicValue.fromUnknown(node);
      }
    }
    return result;
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/partial_evaluator/src/synthetic.mjs
var SyntheticValue = class {
  constructor(value) {
    this.value = value;
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/partial_evaluator/src/interpreter.mjs
function literalBinaryOp(op) {
  return { op, literal: true };
}
function referenceBinaryOp(op) {
  return { op, literal: false };
}
var BINARY_OPERATORS = /* @__PURE__ */ new Map([
  [ts2.SyntaxKind.PlusToken, literalBinaryOp((a, b) => a + b)],
  [ts2.SyntaxKind.MinusToken, literalBinaryOp((a, b) => a - b)],
  [ts2.SyntaxKind.AsteriskToken, literalBinaryOp((a, b) => a * b)],
  [ts2.SyntaxKind.SlashToken, literalBinaryOp((a, b) => a / b)],
  [ts2.SyntaxKind.PercentToken, literalBinaryOp((a, b) => a % b)],
  [ts2.SyntaxKind.AmpersandToken, literalBinaryOp((a, b) => a & b)],
  [ts2.SyntaxKind.BarToken, literalBinaryOp((a, b) => a | b)],
  [ts2.SyntaxKind.CaretToken, literalBinaryOp((a, b) => a ^ b)],
  [ts2.SyntaxKind.LessThanToken, literalBinaryOp((a, b) => a < b)],
  [ts2.SyntaxKind.LessThanEqualsToken, literalBinaryOp((a, b) => a <= b)],
  [ts2.SyntaxKind.GreaterThanToken, literalBinaryOp((a, b) => a > b)],
  [ts2.SyntaxKind.GreaterThanEqualsToken, literalBinaryOp((a, b) => a >= b)],
  [ts2.SyntaxKind.EqualsEqualsToken, literalBinaryOp((a, b) => a == b)],
  [ts2.SyntaxKind.EqualsEqualsEqualsToken, literalBinaryOp((a, b) => a === b)],
  [ts2.SyntaxKind.ExclamationEqualsToken, literalBinaryOp((a, b) => a != b)],
  [ts2.SyntaxKind.ExclamationEqualsEqualsToken, literalBinaryOp((a, b) => a !== b)],
  [ts2.SyntaxKind.LessThanLessThanToken, literalBinaryOp((a, b) => a << b)],
  [ts2.SyntaxKind.GreaterThanGreaterThanToken, literalBinaryOp((a, b) => a >> b)],
  [ts2.SyntaxKind.GreaterThanGreaterThanGreaterThanToken, literalBinaryOp((a, b) => a >>> b)],
  [ts2.SyntaxKind.AsteriskAsteriskToken, literalBinaryOp((a, b) => Math.pow(a, b))],
  [ts2.SyntaxKind.AmpersandAmpersandToken, referenceBinaryOp((a, b) => a && b)],
  [ts2.SyntaxKind.BarBarToken, referenceBinaryOp((a, b) => a || b)]
]);
var UNARY_OPERATORS = /* @__PURE__ */ new Map([
  [ts2.SyntaxKind.TildeToken, (a) => ~a],
  [ts2.SyntaxKind.MinusToken, (a) => -a],
  [ts2.SyntaxKind.PlusToken, (a) => +a],
  [ts2.SyntaxKind.ExclamationToken, (a) => !a]
]);
var StaticInterpreter = class {
  constructor(host, checker, dependencyTracker) {
    this.host = host;
    this.checker = checker;
    this.dependencyTracker = dependencyTracker;
  }
  visit(node, context) {
    return this.visitExpression(node, context);
  }
  visitExpression(node, context) {
    let result;
    if (node.kind === ts2.SyntaxKind.TrueKeyword) {
      return true;
    } else if (node.kind === ts2.SyntaxKind.FalseKeyword) {
      return false;
    } else if (node.kind === ts2.SyntaxKind.NullKeyword) {
      return null;
    } else if (ts2.isStringLiteral(node)) {
      return node.text;
    } else if (ts2.isNoSubstitutionTemplateLiteral(node)) {
      return node.text;
    } else if (ts2.isTemplateExpression(node)) {
      result = this.visitTemplateExpression(node, context);
    } else if (ts2.isNumericLiteral(node)) {
      return parseFloat(node.text);
    } else if (ts2.isObjectLiteralExpression(node)) {
      result = this.visitObjectLiteralExpression(node, context);
    } else if (ts2.isIdentifier(node)) {
      result = this.visitIdentifier(node, context);
    } else if (ts2.isPropertyAccessExpression(node)) {
      result = this.visitPropertyAccessExpression(node, context);
    } else if (ts2.isCallExpression(node)) {
      result = this.visitCallExpression(node, context);
    } else if (ts2.isConditionalExpression(node)) {
      result = this.visitConditionalExpression(node, context);
    } else if (ts2.isPrefixUnaryExpression(node)) {
      result = this.visitPrefixUnaryExpression(node, context);
    } else if (ts2.isBinaryExpression(node)) {
      result = this.visitBinaryExpression(node, context);
    } else if (ts2.isArrayLiteralExpression(node)) {
      result = this.visitArrayLiteralExpression(node, context);
    } else if (ts2.isParenthesizedExpression(node)) {
      result = this.visitParenthesizedExpression(node, context);
    } else if (ts2.isElementAccessExpression(node)) {
      result = this.visitElementAccessExpression(node, context);
    } else if (ts2.isAsExpression(node)) {
      result = this.visitExpression(node.expression, context);
    } else if (ts2.isNonNullExpression(node)) {
      result = this.visitExpression(node.expression, context);
    } else if (this.host.isClass(node)) {
      result = this.visitDeclaration(node, context);
    } else {
      return DynamicValue.fromUnsupportedSyntax(node);
    }
    if (result instanceof DynamicValue && result.node !== node) {
      return DynamicValue.fromDynamicInput(node, result);
    }
    return result;
  }
  visitArrayLiteralExpression(node, context) {
    const array = [];
    for (let i = 0; i < node.elements.length; i++) {
      const element = node.elements[i];
      if (ts2.isSpreadElement(element)) {
        array.push(...this.visitSpreadElement(element, context));
      } else {
        array.push(this.visitExpression(element, context));
      }
    }
    return array;
  }
  visitObjectLiteralExpression(node, context) {
    const map = /* @__PURE__ */ new Map();
    for (let i = 0; i < node.properties.length; i++) {
      const property = node.properties[i];
      if (ts2.isPropertyAssignment(property)) {
        const name = this.stringNameFromPropertyName(property.name, context);
        if (name === void 0) {
          return DynamicValue.fromDynamicInput(node, DynamicValue.fromDynamicString(property.name));
        }
        map.set(name, this.visitExpression(property.initializer, context));
      } else if (ts2.isShorthandPropertyAssignment(property)) {
        const symbol = this.checker.getShorthandAssignmentValueSymbol(property);
        if (symbol === void 0 || symbol.valueDeclaration === void 0) {
          map.set(property.name.text, DynamicValue.fromUnknown(property));
        } else {
          map.set(property.name.text, this.visitDeclaration(symbol.valueDeclaration, context));
        }
      } else if (ts2.isSpreadAssignment(property)) {
        const spread = this.visitExpression(property.expression, context);
        if (spread instanceof DynamicValue) {
          return DynamicValue.fromDynamicInput(node, spread);
        } else if (spread instanceof Map) {
          spread.forEach((value, key) => map.set(key, value));
        } else if (spread instanceof ResolvedModule) {
          spread.getExports().forEach((value, key) => map.set(key, value));
        } else {
          return DynamicValue.fromDynamicInput(node, DynamicValue.fromInvalidExpressionType(property, spread));
        }
      } else {
        return DynamicValue.fromUnknown(node);
      }
    }
    return map;
  }
  visitTemplateExpression(node, context) {
    const pieces = [node.head.text];
    for (let i = 0; i < node.templateSpans.length; i++) {
      const span = node.templateSpans[i];
      const value = literal(this.visit(span.expression, context), () => DynamicValue.fromDynamicString(span.expression));
      if (value instanceof DynamicValue) {
        return DynamicValue.fromDynamicInput(node, value);
      }
      pieces.push(`${value}`, span.literal.text);
    }
    return pieces.join("");
  }
  visitIdentifier(node, context) {
    const decl = this.host.getDeclarationOfIdentifier(node);
    if (decl === null) {
      if (getOriginalKeywordKind(node) === ts2.SyntaxKind.UndefinedKeyword) {
        return void 0;
      } else {
        if (this.dependencyTracker !== null && this.host.getImportOfIdentifier(node) !== null) {
          this.dependencyTracker.recordDependencyAnalysisFailure(context.originatingFile);
        }
        return DynamicValue.fromUnknownIdentifier(node);
      }
    }
    const declContext = { ...context, ...joinModuleContext(context, node, decl) };
    const result = this.visitDeclaration(decl.node, declContext);
    if (result instanceof Reference) {
      if (!result.synthetic) {
        result.addIdentifier(node);
      }
    } else if (result instanceof DynamicValue) {
      return DynamicValue.fromDynamicInput(node, result);
    }
    return result;
  }
  visitDeclaration(node, context) {
    if (this.dependencyTracker !== null) {
      this.dependencyTracker.addDependency(context.originatingFile, node.getSourceFile());
    }
    if (this.host.isClass(node)) {
      return this.getReference(node, context);
    } else if (ts2.isVariableDeclaration(node)) {
      return this.visitVariableDeclaration(node, context);
    } else if (ts2.isParameter(node) && context.scope.has(node)) {
      return context.scope.get(node);
    } else if (ts2.isExportAssignment(node)) {
      return this.visitExpression(node.expression, context);
    } else if (ts2.isEnumDeclaration(node)) {
      return this.visitEnumDeclaration(node, context);
    } else if (ts2.isSourceFile(node)) {
      return this.visitSourceFile(node, context);
    } else if (ts2.isBindingElement(node)) {
      return this.visitBindingElement(node, context);
    } else {
      return this.getReference(node, context);
    }
  }
  visitVariableDeclaration(node, context) {
    const value = this.host.getVariableValue(node);
    if (value !== null) {
      return this.visitExpression(value, context);
    } else if (isVariableDeclarationDeclared(node)) {
      if (node.type !== void 0) {
        const evaluatedType = this.visitType(node.type, context);
        if (!(evaluatedType instanceof DynamicValue)) {
          return evaluatedType;
        }
      }
      return this.getReference(node, context);
    } else {
      return void 0;
    }
  }
  visitEnumDeclaration(node, context) {
    const enumRef = this.getReference(node, context);
    const map = /* @__PURE__ */ new Map();
    node.members.forEach((member) => {
      const name = this.stringNameFromPropertyName(member.name, context);
      if (name !== void 0) {
        const resolved = member.initializer && this.visit(member.initializer, context);
        map.set(name, new EnumValue(enumRef, name, resolved));
      }
    });
    return map;
  }
  visitElementAccessExpression(node, context) {
    const lhs = this.visitExpression(node.expression, context);
    if (lhs instanceof DynamicValue) {
      return DynamicValue.fromDynamicInput(node, lhs);
    }
    const rhs = this.visitExpression(node.argumentExpression, context);
    if (rhs instanceof DynamicValue) {
      return DynamicValue.fromDynamicInput(node, rhs);
    }
    if (typeof rhs !== "string" && typeof rhs !== "number") {
      return DynamicValue.fromInvalidExpressionType(node, rhs);
    }
    return this.accessHelper(node, lhs, rhs, context);
  }
  visitPropertyAccessExpression(node, context) {
    const lhs = this.visitExpression(node.expression, context);
    const rhs = node.name.text;
    if (lhs instanceof DynamicValue) {
      return DynamicValue.fromDynamicInput(node, lhs);
    }
    return this.accessHelper(node, lhs, rhs, context);
  }
  visitSourceFile(node, context) {
    const declarations = this.host.getExportsOfModule(node);
    if (declarations === null) {
      return DynamicValue.fromUnknown(node);
    }
    return new ResolvedModule(declarations, (decl) => {
      const declContext = {
        ...context,
        ...joinModuleContext(context, node, decl)
      };
      return this.visitDeclaration(decl.node, declContext);
    });
  }
  accessHelper(node, lhs, rhs, context) {
    const strIndex = `${rhs}`;
    if (lhs instanceof Map) {
      if (lhs.has(strIndex)) {
        return lhs.get(strIndex);
      } else {
        return void 0;
      }
    } else if (lhs instanceof ResolvedModule) {
      return lhs.getExport(strIndex);
    } else if (Array.isArray(lhs)) {
      if (rhs === "length") {
        return lhs.length;
      } else if (rhs === "slice") {
        return new ArraySliceBuiltinFn(lhs);
      } else if (rhs === "concat") {
        return new ArrayConcatBuiltinFn(lhs);
      }
      if (typeof rhs !== "number" || !Number.isInteger(rhs)) {
        return DynamicValue.fromInvalidExpressionType(node, rhs);
      }
      return lhs[rhs];
    } else if (typeof lhs === "string" && rhs === "concat") {
      return new StringConcatBuiltinFn(lhs);
    } else if (lhs instanceof Reference) {
      const ref = lhs.node;
      if (this.host.isClass(ref)) {
        const module = owningModule(context, lhs.bestGuessOwningModule);
        let value = void 0;
        const member = this.host.getMembersOfClass(ref).find((member2) => member2.isStatic && member2.name === strIndex);
        if (member !== void 0) {
          if (member.value !== null) {
            value = this.visitExpression(member.value, context);
          } else if (member.implementation !== null) {
            value = new Reference(member.implementation, module);
          } else if (member.node) {
            value = new Reference(member.node, module);
          }
        }
        return value;
      } else if (isDeclaration(ref)) {
        return DynamicValue.fromDynamicInput(node, DynamicValue.fromExternalReference(ref, lhs));
      }
    } else if (lhs instanceof DynamicValue) {
      return DynamicValue.fromDynamicInput(node, lhs);
    } else if (lhs instanceof SyntheticValue) {
      return DynamicValue.fromSyntheticInput(node, lhs);
    }
    return DynamicValue.fromUnknown(node);
  }
  visitCallExpression(node, context) {
    const lhs = this.visitExpression(node.expression, context);
    if (lhs instanceof DynamicValue) {
      return DynamicValue.fromDynamicInput(node, lhs);
    }
    if (lhs instanceof KnownFn) {
      return lhs.evaluate(node, this.evaluateFunctionArguments(node, context));
    }
    if (!(lhs instanceof Reference)) {
      return DynamicValue.fromInvalidExpressionType(node.expression, lhs);
    }
    const fn = this.host.getDefinitionOfFunction(lhs.node);
    if (fn === null) {
      return DynamicValue.fromInvalidExpressionType(node.expression, lhs);
    }
    if (!isFunctionOrMethodReference(lhs)) {
      return DynamicValue.fromInvalidExpressionType(node.expression, lhs);
    }
    const resolveFfrExpr = (expr) => {
      let contextExtension = {};
      if (fn.body === null && expr.getSourceFile() !== node.expression.getSourceFile() && lhs.bestGuessOwningModule !== null) {
        contextExtension = {
          absoluteModuleName: lhs.bestGuessOwningModule.specifier,
          resolutionContext: lhs.bestGuessOwningModule.resolutionContext
        };
      }
      return this.visitFfrExpression(expr, { ...context, ...contextExtension });
    };
    if (fn.body === null && context.foreignFunctionResolver !== void 0) {
      const unresolvable = DynamicValue.fromDynamicInput(node, DynamicValue.fromExternalReference(node.expression, lhs));
      return context.foreignFunctionResolver(lhs, node, resolveFfrExpr, unresolvable);
    }
    const res = this.visitFunctionBody(node, fn, context);
    if (res instanceof DynamicValue && context.foreignFunctionResolver !== void 0) {
      const unresolvable = DynamicValue.fromComplexFunctionCall(node, fn);
      return context.foreignFunctionResolver(lhs, node, resolveFfrExpr, unresolvable);
    }
    return res;
  }
  visitFfrExpression(expr, context) {
    const res = this.visitExpression(expr, context);
    if (res instanceof Reference) {
      res.synthetic = true;
    }
    return res;
  }
  visitFunctionBody(node, fn, context) {
    if (fn.body === null) {
      return DynamicValue.fromUnknown(node);
    } else if (fn.body.length !== 1 || !ts2.isReturnStatement(fn.body[0])) {
      return DynamicValue.fromComplexFunctionCall(node, fn);
    }
    const ret = fn.body[0];
    const args = this.evaluateFunctionArguments(node, context);
    const newScope = /* @__PURE__ */ new Map();
    const calleeContext = { ...context, scope: newScope };
    fn.parameters.forEach((param, index) => {
      let arg = args[index];
      if (param.node.dotDotDotToken !== void 0) {
        arg = args.slice(index);
      }
      if (arg === void 0 && param.initializer !== null) {
        arg = this.visitExpression(param.initializer, calleeContext);
      }
      newScope.set(param.node, arg);
    });
    return ret.expression !== void 0 ? this.visitExpression(ret.expression, calleeContext) : void 0;
  }
  visitConditionalExpression(node, context) {
    const condition = this.visitExpression(node.condition, context);
    if (condition instanceof DynamicValue) {
      return DynamicValue.fromDynamicInput(node, condition);
    }
    if (condition) {
      return this.visitExpression(node.whenTrue, context);
    } else {
      return this.visitExpression(node.whenFalse, context);
    }
  }
  visitPrefixUnaryExpression(node, context) {
    const operatorKind = node.operator;
    if (!UNARY_OPERATORS.has(operatorKind)) {
      return DynamicValue.fromUnsupportedSyntax(node);
    }
    const op = UNARY_OPERATORS.get(operatorKind);
    const value = this.visitExpression(node.operand, context);
    if (value instanceof DynamicValue) {
      return DynamicValue.fromDynamicInput(node, value);
    } else {
      return op(value);
    }
  }
  visitBinaryExpression(node, context) {
    const tokenKind = node.operatorToken.kind;
    if (!BINARY_OPERATORS.has(tokenKind)) {
      return DynamicValue.fromUnsupportedSyntax(node);
    }
    const opRecord = BINARY_OPERATORS.get(tokenKind);
    let lhs, rhs;
    if (opRecord.literal) {
      lhs = literal(this.visitExpression(node.left, context), (value) => DynamicValue.fromInvalidExpressionType(node.left, value));
      rhs = literal(this.visitExpression(node.right, context), (value) => DynamicValue.fromInvalidExpressionType(node.right, value));
    } else {
      lhs = this.visitExpression(node.left, context);
      rhs = this.visitExpression(node.right, context);
    }
    if (lhs instanceof DynamicValue) {
      return DynamicValue.fromDynamicInput(node, lhs);
    } else if (rhs instanceof DynamicValue) {
      return DynamicValue.fromDynamicInput(node, rhs);
    } else {
      return opRecord.op(lhs, rhs);
    }
  }
  visitParenthesizedExpression(node, context) {
    return this.visitExpression(node.expression, context);
  }
  evaluateFunctionArguments(node, context) {
    const args = [];
    for (const arg of node.arguments) {
      if (ts2.isSpreadElement(arg)) {
        args.push(...this.visitSpreadElement(arg, context));
      } else {
        args.push(this.visitExpression(arg, context));
      }
    }
    return args;
  }
  visitSpreadElement(node, context) {
    const spread = this.visitExpression(node.expression, context);
    if (spread instanceof DynamicValue) {
      return [DynamicValue.fromDynamicInput(node, spread)];
    } else if (!Array.isArray(spread)) {
      return [DynamicValue.fromInvalidExpressionType(node, spread)];
    } else {
      return spread;
    }
  }
  visitBindingElement(node, context) {
    const path = [];
    let closestDeclaration = node;
    while (ts2.isBindingElement(closestDeclaration) || ts2.isArrayBindingPattern(closestDeclaration) || ts2.isObjectBindingPattern(closestDeclaration)) {
      if (ts2.isBindingElement(closestDeclaration)) {
        path.unshift(closestDeclaration);
      }
      closestDeclaration = closestDeclaration.parent;
    }
    if (!ts2.isVariableDeclaration(closestDeclaration) || closestDeclaration.initializer === void 0) {
      return DynamicValue.fromUnknown(node);
    }
    let value = this.visit(closestDeclaration.initializer, context);
    for (const element of path) {
      let key;
      if (ts2.isArrayBindingPattern(element.parent)) {
        key = element.parent.elements.indexOf(element);
      } else {
        const name = element.propertyName || element.name;
        if (ts2.isIdentifier(name)) {
          key = name.text;
        } else {
          return DynamicValue.fromUnknown(element);
        }
      }
      value = this.accessHelper(element, value, key, context);
      if (value instanceof DynamicValue) {
        return value;
      }
    }
    return value;
  }
  stringNameFromPropertyName(node, context) {
    if (ts2.isIdentifier(node) || ts2.isStringLiteral(node) || ts2.isNumericLiteral(node)) {
      return node.text;
    } else if (ts2.isComputedPropertyName(node)) {
      const literal2 = this.visitExpression(node.expression, context);
      return typeof literal2 === "string" ? literal2 : void 0;
    } else {
      return void 0;
    }
  }
  getReference(node, context) {
    return new Reference(node, owningModule(context));
  }
  visitType(node, context) {
    if (ts2.isLiteralTypeNode(node)) {
      return this.visitExpression(node.literal, context);
    } else if (ts2.isTupleTypeNode(node)) {
      return this.visitTupleType(node, context);
    } else if (ts2.isNamedTupleMember(node)) {
      return this.visitType(node.type, context);
    } else if (ts2.isTypeOperatorNode(node) && node.operator === ts2.SyntaxKind.ReadonlyKeyword) {
      return this.visitType(node.type, context);
    } else if (ts2.isTypeQueryNode(node)) {
      return this.visitTypeQuery(node, context);
    }
    return DynamicValue.fromDynamicType(node);
  }
  visitTupleType(node, context) {
    const res = [];
    for (const elem of node.elements) {
      res.push(this.visitType(elem, context));
    }
    return res;
  }
  visitTypeQuery(node, context) {
    if (!ts2.isIdentifier(node.exprName)) {
      return DynamicValue.fromUnknown(node);
    }
    const decl = this.host.getDeclarationOfIdentifier(node.exprName);
    if (decl === null) {
      return DynamicValue.fromUnknownIdentifier(node.exprName);
    }
    const declContext = { ...context, ...joinModuleContext(context, node, decl) };
    return this.visitDeclaration(decl.node, declContext);
  }
};
function isFunctionOrMethodReference(ref) {
  return ts2.isFunctionDeclaration(ref.node) || ts2.isMethodDeclaration(ref.node) || ts2.isFunctionExpression(ref.node);
}
function literal(value, reject) {
  if (value instanceof EnumValue) {
    value = value.resolved;
  }
  if (value instanceof DynamicValue || value === null || value === void 0 || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return reject(value);
}
function isVariableDeclarationDeclared(node) {
  if (node.parent === void 0 || !ts2.isVariableDeclarationList(node.parent)) {
    return false;
  }
  const declList = node.parent;
  if (declList.parent === void 0 || !ts2.isVariableStatement(declList.parent)) {
    return false;
  }
  const varStmt = declList.parent;
  const modifiers = ts2.getModifiers(varStmt);
  return modifiers !== void 0 && modifiers.some((mod) => mod.kind === ts2.SyntaxKind.DeclareKeyword);
}
var EMPTY = {};
function joinModuleContext(existing, node, decl) {
  if (decl.viaModule !== null && decl.viaModule !== existing.absoluteModuleName) {
    return {
      absoluteModuleName: decl.viaModule,
      resolutionContext: node.getSourceFile().fileName
    };
  } else {
    return EMPTY;
  }
}
function owningModule(context, override = null) {
  let specifier = context.absoluteModuleName;
  if (override !== null) {
    specifier = override.specifier;
  }
  if (specifier !== null) {
    return {
      specifier,
      resolutionContext: context.resolutionContext
    };
  } else {
    return null;
  }
}
function getOriginalKeywordKind(identifier) {
  return typeof ts2.identifierToKeywordKind === "function" ? ts2.identifierToKeywordKind(identifier) : identifier.originalKeywordKind;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/partial_evaluator/src/interface.mjs
var PartialEvaluator = class {
  constructor(host, checker, dependencyTracker) {
    this.host = host;
    this.checker = checker;
    this.dependencyTracker = dependencyTracker;
  }
  evaluate(expr, foreignFunctionResolver) {
    const interpreter = new StaticInterpreter(this.host, this.checker, this.dependencyTracker);
    const sourceFile = expr.getSourceFile();
    return interpreter.visit(expr, {
      originatingFile: sourceFile,
      absoluteModuleName: null,
      resolutionContext: sourceFile.fileName,
      scope: /* @__PURE__ */ new Map(),
      foreignFunctionResolver
    });
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/partial_evaluator/src/diagnostics.mjs
import ts3 from "typescript";
function describeResolvedType(value, maxDepth = 1) {
  var _a, _b;
  if (value === null) {
    return "null";
  } else if (value === void 0) {
    return "undefined";
  } else if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") {
    return typeof value;
  } else if (value instanceof Map) {
    if (maxDepth === 0) {
      return "object";
    }
    const entries = Array.from(value.entries()).map(([key, v]) => {
      return `${quoteKey(key)}: ${describeResolvedType(v, maxDepth - 1)}`;
    });
    return entries.length > 0 ? `{ ${entries.join("; ")} }` : "{}";
  } else if (value instanceof ResolvedModule) {
    return "(module)";
  } else if (value instanceof EnumValue) {
    return (_a = value.enumRef.debugName) != null ? _a : "(anonymous)";
  } else if (value instanceof Reference) {
    return (_b = value.debugName) != null ? _b : "(anonymous)";
  } else if (Array.isArray(value)) {
    if (maxDepth === 0) {
      return "Array";
    }
    return `[${value.map((v) => describeResolvedType(v, maxDepth - 1)).join(", ")}]`;
  } else if (value instanceof DynamicValue) {
    return "(not statically analyzable)";
  } else if (value instanceof KnownFn) {
    return "Function";
  } else {
    return "unknown";
  }
}
function quoteKey(key) {
  if (/^[a-z0-9_]+$/i.test(key)) {
    return key;
  } else {
    return `'${key.replace(/'/g, "\\'")}'`;
  }
}
function traceDynamicValue(node, value) {
  return value.accept(new TraceDynamicValueVisitor(node));
}
var TraceDynamicValueVisitor = class {
  constructor(node) {
    this.node = node;
    this.currentContainerNode = null;
  }
  visitDynamicInput(value) {
    const trace = value.reason.accept(this);
    if (this.shouldTrace(value.node)) {
      const info = makeRelatedInformation(value.node, "Unable to evaluate this expression statically.");
      trace.unshift(info);
    }
    return trace;
  }
  visitSyntheticInput(value) {
    return [makeRelatedInformation(value.node, "Unable to evaluate this expression further.")];
  }
  visitDynamicString(value) {
    return [makeRelatedInformation(value.node, "A string value could not be determined statically.")];
  }
  visitExternalReference(value) {
    const name = value.reason.debugName;
    const description = name !== null ? `'${name}'` : "an anonymous declaration";
    return [makeRelatedInformation(value.node, `A value for ${description} cannot be determined statically, as it is an external declaration.`)];
  }
  visitComplexFunctionCall(value) {
    return [
      makeRelatedInformation(value.node, "Unable to evaluate function call of complex function. A function must have exactly one return statement."),
      makeRelatedInformation(value.reason.node, "Function is declared here.")
    ];
  }
  visitInvalidExpressionType(value) {
    return [makeRelatedInformation(value.node, "Unable to evaluate an invalid expression.")];
  }
  visitUnknown(value) {
    return [makeRelatedInformation(value.node, "Unable to evaluate statically.")];
  }
  visitUnknownIdentifier(value) {
    return [makeRelatedInformation(value.node, "Unknown reference.")];
  }
  visitDynamicType(value) {
    return [makeRelatedInformation(value.node, "Dynamic type.")];
  }
  visitUnsupportedSyntax(value) {
    return [makeRelatedInformation(value.node, "This syntax is not supported.")];
  }
  shouldTrace(node) {
    if (node === this.node) {
      return false;
    }
    const container = getContainerNode(node);
    if (container === this.currentContainerNode) {
      return false;
    }
    this.currentContainerNode = container;
    return true;
  }
};
function getContainerNode(node) {
  let currentNode = node;
  while (currentNode !== void 0) {
    switch (currentNode.kind) {
      case ts3.SyntaxKind.ExpressionStatement:
      case ts3.SyntaxKind.VariableStatement:
      case ts3.SyntaxKind.ReturnStatement:
      case ts3.SyntaxKind.IfStatement:
      case ts3.SyntaxKind.SwitchStatement:
      case ts3.SyntaxKind.DoStatement:
      case ts3.SyntaxKind.WhileStatement:
      case ts3.SyntaxKind.ForStatement:
      case ts3.SyntaxKind.ForInStatement:
      case ts3.SyntaxKind.ForOfStatement:
      case ts3.SyntaxKind.ContinueStatement:
      case ts3.SyntaxKind.BreakStatement:
      case ts3.SyntaxKind.ThrowStatement:
      case ts3.SyntaxKind.ObjectBindingPattern:
      case ts3.SyntaxKind.ArrayBindingPattern:
        return currentNode;
    }
    currentNode = currentNode.parent;
  }
  return node.getSourceFile();
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/common/src/di.mjs
import { LiteralExpr, WrappedNodeExpr as WrappedNodeExpr2 } from "@angular/compiler";
import ts4 from "typescript";
function getConstructorDependencies(clazz, reflector, isCore) {
  const deps = [];
  const errors = [];
  let ctorParams = reflector.getConstructorParameters(clazz);
  if (ctorParams === null) {
    if (reflector.hasBaseClass(clazz)) {
      return null;
    } else {
      ctorParams = [];
    }
  }
  ctorParams.forEach((param, idx) => {
    let token = valueReferenceToExpression(param.typeValueReference);
    let attributeNameType = null;
    let optional = false, self = false, skipSelf = false, host = false;
    (param.decorators || []).filter((dec) => isCore || isAngularCore(dec)).forEach((dec) => {
      const name = isCore || dec.import === null ? dec.name : dec.import.name;
      if (name === "Inject") {
        if (dec.args === null || dec.args.length !== 1) {
          throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, dec.node, `Unexpected number of arguments to @Inject().`);
        }
        token = new WrappedNodeExpr2(dec.args[0]);
      } else if (name === "Optional") {
        optional = true;
      } else if (name === "SkipSelf") {
        skipSelf = true;
      } else if (name === "Self") {
        self = true;
      } else if (name === "Host") {
        host = true;
      } else if (name === "Attribute") {
        if (dec.args === null || dec.args.length !== 1) {
          throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, dec.node, `Unexpected number of arguments to @Attribute().`);
        }
        const attributeName = dec.args[0];
        token = new WrappedNodeExpr2(attributeName);
        if (ts4.isStringLiteralLike(attributeName)) {
          attributeNameType = new LiteralExpr(attributeName.text);
        } else {
          attributeNameType = new WrappedNodeExpr2(ts4.factory.createKeywordTypeNode(ts4.SyntaxKind.UnknownKeyword));
        }
      } else {
        throw new FatalDiagnosticError(ErrorCode.DECORATOR_UNEXPECTED, dec.node, `Unexpected decorator ${name} on parameter.`);
      }
    });
    if (token === null) {
      if (param.typeValueReference.kind !== 2) {
        throw new Error("Illegal state: expected value reference to be unavailable if no token is present");
      }
      errors.push({
        index: idx,
        param,
        reason: param.typeValueReference.reason
      });
    } else {
      deps.push({ token, attributeNameType, optional, self, skipSelf, host });
    }
  });
  if (errors.length === 0) {
    return { deps };
  } else {
    return { deps: null, errors };
  }
}
function unwrapConstructorDependencies(deps) {
  if (deps === null) {
    return null;
  } else if (deps.deps !== null) {
    return deps.deps;
  } else {
    return "invalid";
  }
}
function getValidConstructorDependencies(clazz, reflector, isCore) {
  return validateConstructorDependencies(clazz, getConstructorDependencies(clazz, reflector, isCore));
}
function validateConstructorDependencies(clazz, deps) {
  if (deps === null) {
    return null;
  } else if (deps.deps !== null) {
    return deps.deps;
  } else {
    const error = deps.errors[0];
    throw createUnsuitableInjectionTokenError(clazz, error);
  }
}
function createUnsuitableInjectionTokenError(clazz, error) {
  const { param, index, reason } = error;
  let chainMessage = void 0;
  let hints = void 0;
  switch (reason.kind) {
    case 5:
      chainMessage = "Consider using the @Inject decorator to specify an injection token.";
      hints = [
        makeRelatedInformation(reason.typeNode, "This type is not supported as injection token.")
      ];
      break;
    case 1:
      chainMessage = "Consider using the @Inject decorator to specify an injection token.";
      hints = [
        makeRelatedInformation(reason.typeNode, "This type does not have a value, so it cannot be used as injection token.")
      ];
      if (reason.decl !== null) {
        hints.push(makeRelatedInformation(reason.decl, "The type is declared here."));
      }
      break;
    case 2:
      chainMessage = "Consider changing the type-only import to a regular import, or use the @Inject decorator to specify an injection token.";
      hints = [
        makeRelatedInformation(reason.typeNode, "This type is imported using a type-only import, which prevents it from being usable as an injection token."),
        makeRelatedInformation(reason.node, "The type-only import occurs here.")
      ];
      break;
    case 4:
      chainMessage = "Consider using the @Inject decorator to specify an injection token.";
      hints = [
        makeRelatedInformation(reason.typeNode, "This type corresponds with a namespace, which cannot be used as injection token."),
        makeRelatedInformation(reason.importClause, "The namespace import occurs here.")
      ];
      break;
    case 3:
      chainMessage = "The type should reference a known declaration.";
      hints = [makeRelatedInformation(reason.typeNode, "This type could not be resolved.")];
      break;
    case 0:
      chainMessage = "Consider adding a type to the parameter or use the @Inject decorator to specify an injection token.";
      break;
  }
  const chain = {
    messageText: `No suitable injection token for parameter '${param.name || index}' of class '${clazz.name.text}'.`,
    category: ts4.DiagnosticCategory.Error,
    code: 0,
    next: [{
      messageText: chainMessage,
      category: ts4.DiagnosticCategory.Message,
      code: 0
    }]
  };
  return new FatalDiagnosticError(ErrorCode.PARAM_MISSING_TOKEN, param.nameNode, chain, hints);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/common/src/diagnostics.mjs
import ts7 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/metadata/src/api.mjs
var MetaKind;
(function(MetaKind2) {
  MetaKind2[MetaKind2["Directive"] = 0] = "Directive";
  MetaKind2[MetaKind2["Pipe"] = 1] = "Pipe";
  MetaKind2[MetaKind2["NgModule"] = 2] = "NgModule";
})(MetaKind || (MetaKind = {}));
var MatchSource;
(function(MatchSource2) {
  MatchSource2[MatchSource2["Selector"] = 0] = "Selector";
  MatchSource2[MatchSource2["HostDirective"] = 1] = "HostDirective";
})(MatchSource || (MatchSource = {}));

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/metadata/src/dts.mjs
import ts6 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/metadata/src/property_mapping.mjs
var ClassPropertyMapping = class {
  constructor(forwardMap) {
    this.forwardMap = forwardMap;
    this.reverseMap = reverseMapFromForwardMap(forwardMap);
  }
  static empty() {
    return new ClassPropertyMapping(/* @__PURE__ */ new Map());
  }
  static fromMappedObject(obj) {
    const forwardMap = /* @__PURE__ */ new Map();
    for (const classPropertyName of Object.keys(obj)) {
      const value = obj[classPropertyName];
      let inputOrOutput;
      if (typeof value === "string") {
        inputOrOutput = { classPropertyName, bindingPropertyName: value };
      } else if (Array.isArray(value)) {
        inputOrOutput = { classPropertyName, bindingPropertyName: value[0] };
      } else {
        inputOrOutput = value;
      }
      forwardMap.set(classPropertyName, inputOrOutput);
    }
    return new ClassPropertyMapping(forwardMap);
  }
  static merge(a, b) {
    const forwardMap = new Map(a.forwardMap.entries());
    for (const [classPropertyName, inputOrOutput] of b.forwardMap) {
      forwardMap.set(classPropertyName, inputOrOutput);
    }
    return new ClassPropertyMapping(forwardMap);
  }
  get classPropertyNames() {
    return Array.from(this.forwardMap.keys());
  }
  get propertyNames() {
    return Array.from(this.reverseMap.keys());
  }
  hasBindingPropertyName(propertyName) {
    return this.reverseMap.has(propertyName);
  }
  getByBindingPropertyName(propertyName) {
    return this.reverseMap.has(propertyName) ? this.reverseMap.get(propertyName) : null;
  }
  getByClassPropertyName(classPropertyName) {
    return this.forwardMap.has(classPropertyName) ? this.forwardMap.get(classPropertyName) : null;
  }
  toDirectMappedObject() {
    const obj = {};
    for (const [classPropertyName, inputOrOutput] of this.forwardMap) {
      obj[classPropertyName] = inputOrOutput.bindingPropertyName;
    }
    return obj;
  }
  toJointMappedObject(transform) {
    const obj = {};
    for (const [classPropertyName, inputOrOutput] of this.forwardMap) {
      obj[classPropertyName] = transform(inputOrOutput);
    }
    return obj;
  }
  *[Symbol.iterator]() {
    for (const inputOrOutput of this.forwardMap.values()) {
      yield inputOrOutput;
    }
  }
};
function reverseMapFromForwardMap(forwardMap) {
  const reverseMap = /* @__PURE__ */ new Map();
  for (const [_, inputOrOutput] of forwardMap) {
    if (!reverseMap.has(inputOrOutput.bindingPropertyName)) {
      reverseMap.set(inputOrOutput.bindingPropertyName, []);
    }
    reverseMap.get(inputOrOutput.bindingPropertyName).push(inputOrOutput);
  }
  return reverseMap;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/metadata/src/util.mjs
import ts5 from "typescript";
function extractReferencesFromType(checker, def, bestGuessOwningModule) {
  if (!ts5.isTupleTypeNode(def)) {
    return [];
  }
  return def.elements.map((element) => {
    if (!ts5.isTypeQueryNode(element)) {
      throw new Error(`Expected TypeQueryNode: ${nodeDebugInfo(element)}`);
    }
    return extraReferenceFromTypeQuery(checker, element, def, bestGuessOwningModule);
  });
}
function extraReferenceFromTypeQuery(checker, typeNode, origin, bestGuessOwningModule) {
  const type = typeNode.exprName;
  const { node, from } = reflectTypeEntityToDeclaration(type, checker);
  if (!isNamedClassDeclaration(node)) {
    throw new Error(`Expected named ClassDeclaration: ${nodeDebugInfo(node)}`);
  }
  if (from !== null && !from.startsWith(".")) {
    return new Reference(node, { specifier: from, resolutionContext: origin.getSourceFile().fileName });
  }
  return new Reference(node, bestGuessOwningModule);
}
function readBooleanType(type) {
  if (!ts5.isLiteralTypeNode(type)) {
    return null;
  }
  switch (type.literal.kind) {
    case ts5.SyntaxKind.TrueKeyword:
      return true;
    case ts5.SyntaxKind.FalseKeyword:
      return false;
    default:
      return null;
  }
}
function readStringType(type) {
  if (!ts5.isLiteralTypeNode(type) || !ts5.isStringLiteral(type.literal)) {
    return null;
  }
  return type.literal.text;
}
function readMapType(type, valueTransform) {
  if (!ts5.isTypeLiteralNode(type)) {
    return {};
  }
  const obj = {};
  type.members.forEach((member) => {
    if (!ts5.isPropertySignature(member) || member.type === void 0 || member.name === void 0 || !ts5.isStringLiteral(member.name) && !ts5.isIdentifier(member.name)) {
      return;
    }
    const value = valueTransform(member.type);
    if (value === null) {
      return null;
    }
    obj[member.name.text] = value;
  });
  return obj;
}
function readStringArrayType(type) {
  if (!ts5.isTupleTypeNode(type)) {
    return [];
  }
  const res = [];
  type.elements.forEach((el) => {
    if (!ts5.isLiteralTypeNode(el) || !ts5.isStringLiteral(el.literal)) {
      return;
    }
    res.push(el.literal.text);
  });
  return res;
}
function extractDirectiveTypeCheckMeta(node, inputs, reflector) {
  const members = reflector.getMembersOfClass(node);
  const staticMembers = members.filter((member) => member.isStatic);
  const ngTemplateGuards = staticMembers.map(extractTemplateGuard).filter((guard) => guard !== null);
  const hasNgTemplateContextGuard = staticMembers.some((member) => member.kind === ClassMemberKind.Method && member.name === "ngTemplateContextGuard");
  const coercedInputFields = new Set(staticMembers.map(extractCoercedInput).filter((inputName) => inputName !== null));
  const restrictedInputFields = /* @__PURE__ */ new Set();
  const stringLiteralInputFields = /* @__PURE__ */ new Set();
  const undeclaredInputFields = /* @__PURE__ */ new Set();
  for (const { classPropertyName, transform } of inputs) {
    const field = members.find((member) => member.name === classPropertyName);
    if (field === void 0 || field.node === null) {
      undeclaredInputFields.add(classPropertyName);
      continue;
    }
    if (isRestricted(field.node)) {
      restrictedInputFields.add(classPropertyName);
    }
    if (field.nameNode !== null && ts5.isStringLiteral(field.nameNode)) {
      stringLiteralInputFields.add(classPropertyName);
    }
    if (transform !== null) {
      coercedInputFields.add(classPropertyName);
    }
  }
  const arity = reflector.getGenericArityOfClass(node);
  return {
    hasNgTemplateContextGuard,
    ngTemplateGuards,
    coercedInputFields,
    restrictedInputFields,
    stringLiteralInputFields,
    undeclaredInputFields,
    isGeneric: arity !== null && arity > 0
  };
}
function isRestricted(node) {
  const modifiers = ts5.canHaveModifiers(node) ? ts5.getModifiers(node) : void 0;
  return modifiers !== void 0 && modifiers.some(({ kind }) => {
    return kind === ts5.SyntaxKind.PrivateKeyword || kind === ts5.SyntaxKind.ProtectedKeyword || kind === ts5.SyntaxKind.ReadonlyKeyword;
  });
}
function extractTemplateGuard(member) {
  if (!member.name.startsWith("ngTemplateGuard_")) {
    return null;
  }
  const inputName = afterUnderscore(member.name);
  if (member.kind === ClassMemberKind.Property) {
    let type = null;
    if (member.type !== null && ts5.isLiteralTypeNode(member.type) && ts5.isStringLiteral(member.type.literal)) {
      type = member.type.literal.text;
    }
    if (type !== "binding") {
      return null;
    }
    return { inputName, type };
  } else if (member.kind === ClassMemberKind.Method) {
    return { inputName, type: "invocation" };
  } else {
    return null;
  }
}
function extractCoercedInput(member) {
  if (member.kind !== ClassMemberKind.Property || !member.name.startsWith("ngAcceptInputType_")) {
    return null;
  }
  return afterUnderscore(member.name);
}
var CompoundMetadataReader = class {
  constructor(readers) {
    this.readers = readers;
  }
  getDirectiveMetadata(node) {
    for (const reader of this.readers) {
      const meta = reader.getDirectiveMetadata(node);
      if (meta !== null) {
        return meta;
      }
    }
    return null;
  }
  getNgModuleMetadata(node) {
    for (const reader of this.readers) {
      const meta = reader.getNgModuleMetadata(node);
      if (meta !== null) {
        return meta;
      }
    }
    return null;
  }
  getPipeMetadata(node) {
    for (const reader of this.readers) {
      const meta = reader.getPipeMetadata(node);
      if (meta !== null) {
        return meta;
      }
    }
    return null;
  }
};
function afterUnderscore(str) {
  const pos = str.indexOf("_");
  if (pos === -1) {
    throw new Error(`Expected '${str}' to contain '_'`);
  }
  return str.slice(pos + 1);
}
function hasInjectableFields(clazz, host) {
  const members = host.getMembersOfClass(clazz);
  return members.some(({ isStatic, name }) => isStatic && (name === "\u0275prov" || name === "\u0275fac"));
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/metadata/src/dts.mjs
var DtsMetadataReader = class {
  constructor(checker, reflector) {
    this.checker = checker;
    this.reflector = reflector;
  }
  getNgModuleMetadata(ref) {
    const clazz = ref.node;
    const ngModuleDef = this.reflector.getMembersOfClass(clazz).find((member) => member.name === "\u0275mod" && member.isStatic);
    if (ngModuleDef === void 0) {
      return null;
    } else if (ngModuleDef.type === null || !ts6.isTypeReferenceNode(ngModuleDef.type) || ngModuleDef.type.typeArguments === void 0 || ngModuleDef.type.typeArguments.length !== 4) {
      return null;
    }
    const [_, declarationMetadata, importMetadata, exportMetadata] = ngModuleDef.type.typeArguments;
    return {
      kind: MetaKind.NgModule,
      ref,
      declarations: extractReferencesFromType(this.checker, declarationMetadata, ref.bestGuessOwningModule),
      exports: extractReferencesFromType(this.checker, exportMetadata, ref.bestGuessOwningModule),
      imports: extractReferencesFromType(this.checker, importMetadata, ref.bestGuessOwningModule),
      schemas: [],
      rawDeclarations: null,
      rawImports: null,
      rawExports: null,
      decorator: null,
      mayDeclareProviders: true
    };
  }
  getDirectiveMetadata(ref) {
    var _a, _b;
    const clazz = ref.node;
    const def = this.reflector.getMembersOfClass(clazz).find((field) => field.isStatic && (field.name === "\u0275cmp" || field.name === "\u0275dir"));
    if (def === void 0) {
      return null;
    } else if (def.type === null || !ts6.isTypeReferenceNode(def.type) || def.type.typeArguments === void 0 || def.type.typeArguments.length < 2) {
      return null;
    }
    const isComponent = def.name === "\u0275cmp";
    const ctorParams = this.reflector.getConstructorParameters(clazz);
    const isStructural = !isComponent && ctorParams !== null && ctorParams.some((param) => {
      return param.typeValueReference.kind === 1 && param.typeValueReference.moduleName === "@angular/core" && param.typeValueReference.importedName === "TemplateRef";
    });
    const isStandalone = def.type.typeArguments.length > 7 && ((_a = readBooleanType(def.type.typeArguments[7])) != null ? _a : false);
    const inputs = ClassPropertyMapping.fromMappedObject(readInputsType(def.type.typeArguments[3]));
    const outputs = ClassPropertyMapping.fromMappedObject(readMapType(def.type.typeArguments[4], readStringType));
    const hostDirectives = def.type.typeArguments.length > 8 ? readHostDirectivesType(this.checker, def.type.typeArguments[8], ref.bestGuessOwningModule) : null;
    const isSignal = def.type.typeArguments.length > 9 && ((_b = readBooleanType(def.type.typeArguments[9])) != null ? _b : false);
    return {
      kind: MetaKind.Directive,
      matchSource: MatchSource.Selector,
      ref,
      name: clazz.name.text,
      isComponent,
      selector: readStringType(def.type.typeArguments[1]),
      exportAs: readStringArrayType(def.type.typeArguments[2]),
      inputs,
      outputs,
      hostDirectives,
      queries: readStringArrayType(def.type.typeArguments[5]),
      ...extractDirectiveTypeCheckMeta(clazz, inputs, this.reflector),
      baseClass: readBaseClass2(clazz, this.checker, this.reflector),
      isPoisoned: false,
      isStructural,
      animationTriggerNames: null,
      isStandalone,
      isSignal,
      imports: null,
      schemas: null,
      decorator: null,
      assumedToExportProviders: isComponent && isStandalone
    };
  }
  getPipeMetadata(ref) {
    var _a;
    const def = this.reflector.getMembersOfClass(ref.node).find((field) => field.isStatic && field.name === "\u0275pipe");
    if (def === void 0) {
      return null;
    } else if (def.type === null || !ts6.isTypeReferenceNode(def.type) || def.type.typeArguments === void 0 || def.type.typeArguments.length < 2) {
      return null;
    }
    const type = def.type.typeArguments[1];
    if (!ts6.isLiteralTypeNode(type) || !ts6.isStringLiteral(type.literal)) {
      return null;
    }
    const name = type.literal.text;
    const isStandalone = def.type.typeArguments.length > 2 && ((_a = readBooleanType(def.type.typeArguments[2])) != null ? _a : false);
    return {
      kind: MetaKind.Pipe,
      ref,
      name,
      nameExpr: null,
      isStandalone,
      decorator: null
    };
  }
};
function readInputsType(type) {
  const inputsMap = {};
  if (ts6.isTypeLiteralNode(type)) {
    for (const member of type.members) {
      if (!ts6.isPropertySignature(member) || member.type === void 0 || member.name === void 0 || !ts6.isStringLiteral(member.name) && !ts6.isIdentifier(member.name)) {
        continue;
      }
      const stringValue = readStringType(member.type);
      const classPropertyName = member.name.text;
      if (stringValue != null) {
        inputsMap[classPropertyName] = {
          bindingPropertyName: stringValue,
          classPropertyName,
          required: false,
          transform: null
        };
      } else {
        const config = readMapType(member.type, (innerValue) => {
          var _a;
          return (_a = readStringType(innerValue)) != null ? _a : readBooleanType(innerValue);
        });
        inputsMap[classPropertyName] = {
          classPropertyName,
          bindingPropertyName: config.alias,
          required: config.required,
          transform: null
        };
      }
    }
  }
  return inputsMap;
}
function readBaseClass2(clazz, checker, reflector) {
  if (!isNamedClassDeclaration(clazz)) {
    return reflector.hasBaseClass(clazz) ? "dynamic" : null;
  }
  if (clazz.heritageClauses !== void 0) {
    for (const clause of clazz.heritageClauses) {
      if (clause.token === ts6.SyntaxKind.ExtendsKeyword) {
        const baseExpr = clause.types[0].expression;
        let symbol = checker.getSymbolAtLocation(baseExpr);
        if (symbol === void 0) {
          return "dynamic";
        } else if (symbol.flags & ts6.SymbolFlags.Alias) {
          symbol = checker.getAliasedSymbol(symbol);
        }
        if (symbol.valueDeclaration !== void 0 && isNamedClassDeclaration(symbol.valueDeclaration)) {
          return new Reference(symbol.valueDeclaration);
        } else {
          return "dynamic";
        }
      }
    }
  }
  return null;
}
function readHostDirectivesType(checker, type, bestGuessOwningModule) {
  if (!ts6.isTupleTypeNode(type) || type.elements.length === 0) {
    return null;
  }
  const result = [];
  for (const hostDirectiveType of type.elements) {
    const { directive, inputs, outputs } = readMapType(hostDirectiveType, (type2) => type2);
    if (directive) {
      if (!ts6.isTypeQueryNode(directive)) {
        throw new Error(`Expected TypeQueryNode: ${nodeDebugInfo(directive)}`);
      }
      result.push({
        directive: extraReferenceFromTypeQuery(checker, directive, type, bestGuessOwningModule),
        isForwardReference: false,
        inputs: readMapType(inputs, readStringType),
        outputs: readMapType(outputs, readStringType)
      });
    }
  }
  return result.length > 0 ? result : null;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/metadata/src/inheritance.mjs
function flattenInheritedDirectiveMetadata(reader, dir) {
  const topMeta = reader.getDirectiveMetadata(dir);
  if (topMeta === null) {
    return null;
  }
  if (topMeta.baseClass === null) {
    return topMeta;
  }
  const coercedInputFields = /* @__PURE__ */ new Set();
  const undeclaredInputFields = /* @__PURE__ */ new Set();
  const restrictedInputFields = /* @__PURE__ */ new Set();
  const stringLiteralInputFields = /* @__PURE__ */ new Set();
  let isDynamic = false;
  let inputs = ClassPropertyMapping.empty();
  let outputs = ClassPropertyMapping.empty();
  let isStructural = false;
  const addMetadata = (meta) => {
    if (meta.baseClass === "dynamic") {
      isDynamic = true;
    } else if (meta.baseClass !== null) {
      const baseMeta = reader.getDirectiveMetadata(meta.baseClass);
      if (baseMeta !== null) {
        addMetadata(baseMeta);
      } else {
        isDynamic = true;
      }
    }
    isStructural = isStructural || meta.isStructural;
    inputs = ClassPropertyMapping.merge(inputs, meta.inputs);
    outputs = ClassPropertyMapping.merge(outputs, meta.outputs);
    for (const coercedInputField of meta.coercedInputFields) {
      coercedInputFields.add(coercedInputField);
    }
    for (const undeclaredInputField of meta.undeclaredInputFields) {
      undeclaredInputFields.add(undeclaredInputField);
    }
    for (const restrictedInputField of meta.restrictedInputFields) {
      restrictedInputFields.add(restrictedInputField);
    }
    for (const field of meta.stringLiteralInputFields) {
      stringLiteralInputFields.add(field);
    }
  };
  addMetadata(topMeta);
  return {
    ...topMeta,
    inputs,
    outputs,
    coercedInputFields,
    undeclaredInputFields,
    restrictedInputFields,
    stringLiteralInputFields,
    baseClass: isDynamic ? "dynamic" : null,
    isStructural
  };
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/metadata/src/registry.mjs
var LocalMetadataRegistry = class {
  constructor() {
    this.directives = /* @__PURE__ */ new Map();
    this.ngModules = /* @__PURE__ */ new Map();
    this.pipes = /* @__PURE__ */ new Map();
  }
  getDirectiveMetadata(ref) {
    return this.directives.has(ref.node) ? this.directives.get(ref.node) : null;
  }
  getNgModuleMetadata(ref) {
    return this.ngModules.has(ref.node) ? this.ngModules.get(ref.node) : null;
  }
  getPipeMetadata(ref) {
    return this.pipes.has(ref.node) ? this.pipes.get(ref.node) : null;
  }
  registerDirectiveMetadata(meta) {
    this.directives.set(meta.ref.node, meta);
  }
  registerNgModuleMetadata(meta) {
    this.ngModules.set(meta.ref.node, meta);
  }
  registerPipeMetadata(meta) {
    this.pipes.set(meta.ref.node, meta);
  }
  getKnown(kind) {
    switch (kind) {
      case MetaKind.Directive:
        return Array.from(this.directives.values()).map((v) => v.ref.node);
      case MetaKind.Pipe:
        return Array.from(this.pipes.values()).map((v) => v.ref.node);
      case MetaKind.NgModule:
        return Array.from(this.ngModules.values()).map((v) => v.ref.node);
    }
  }
};
var CompoundMetadataRegistry = class {
  constructor(registries) {
    this.registries = registries;
  }
  registerDirectiveMetadata(meta) {
    for (const registry of this.registries) {
      registry.registerDirectiveMetadata(meta);
    }
  }
  registerNgModuleMetadata(meta) {
    for (const registry of this.registries) {
      registry.registerNgModuleMetadata(meta);
    }
  }
  registerPipeMetadata(meta) {
    for (const registry of this.registries) {
      registry.registerPipeMetadata(meta);
    }
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/metadata/src/resource_registry.mjs
var ResourceRegistry = class {
  constructor() {
    this.externalTemplateToComponentsMap = /* @__PURE__ */ new Map();
    this.componentToTemplateMap = /* @__PURE__ */ new Map();
    this.componentToStylesMap = /* @__PURE__ */ new Map();
    this.externalStyleToComponentsMap = /* @__PURE__ */ new Map();
  }
  getComponentsWithTemplate(template) {
    if (!this.externalTemplateToComponentsMap.has(template)) {
      return /* @__PURE__ */ new Set();
    }
    return this.externalTemplateToComponentsMap.get(template);
  }
  registerResources(resources, component) {
    if (resources.template !== null) {
      this.registerTemplate(resources.template, component);
    }
    for (const style of resources.styles) {
      this.registerStyle(style, component);
    }
  }
  registerTemplate(templateResource, component) {
    const { path } = templateResource;
    if (path !== null) {
      if (!this.externalTemplateToComponentsMap.has(path)) {
        this.externalTemplateToComponentsMap.set(path, /* @__PURE__ */ new Set());
      }
      this.externalTemplateToComponentsMap.get(path).add(component);
    }
    this.componentToTemplateMap.set(component, templateResource);
  }
  getTemplate(component) {
    if (!this.componentToTemplateMap.has(component)) {
      return null;
    }
    return this.componentToTemplateMap.get(component);
  }
  registerStyle(styleResource, component) {
    const { path } = styleResource;
    if (!this.componentToStylesMap.has(component)) {
      this.componentToStylesMap.set(component, /* @__PURE__ */ new Set());
    }
    if (path !== null) {
      if (!this.externalStyleToComponentsMap.has(path)) {
        this.externalStyleToComponentsMap.set(path, /* @__PURE__ */ new Set());
      }
      this.externalStyleToComponentsMap.get(path).add(component);
    }
    this.componentToStylesMap.get(component).add(styleResource);
  }
  getStyles(component) {
    if (!this.componentToStylesMap.has(component)) {
      return /* @__PURE__ */ new Set();
    }
    return this.componentToStylesMap.get(component);
  }
  getComponentsWithStyle(styleUrl) {
    if (!this.externalStyleToComponentsMap.has(styleUrl)) {
      return /* @__PURE__ */ new Set();
    }
    return this.externalStyleToComponentsMap.get(styleUrl);
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/metadata/src/providers.mjs
var ExportedProviderStatusResolver = class {
  constructor(metaReader) {
    this.metaReader = metaReader;
    this.calculating = /* @__PURE__ */ new Set();
  }
  mayExportProviders(ref, dependencyCallback) {
    var _a;
    if (this.calculating.has(ref.node)) {
      return false;
    }
    this.calculating.add(ref.node);
    if (dependencyCallback !== void 0) {
      dependencyCallback(ref);
    }
    try {
      const dirMeta = this.metaReader.getDirectiveMetadata(ref);
      if (dirMeta !== null) {
        if (!dirMeta.isComponent || !dirMeta.isStandalone) {
          return false;
        }
        if (dirMeta.assumedToExportProviders) {
          return true;
        }
        return ((_a = dirMeta.imports) != null ? _a : []).some((importRef) => this.mayExportProviders(importRef, dependencyCallback));
      }
      const pipeMeta = this.metaReader.getPipeMetadata(ref);
      if (pipeMeta !== null) {
        return false;
      }
      const ngModuleMeta = this.metaReader.getNgModuleMetadata(ref);
      if (ngModuleMeta !== null) {
        if (ngModuleMeta.mayDeclareProviders) {
          return true;
        }
        return ngModuleMeta.imports.some((importRef) => this.mayExportProviders(importRef, dependencyCallback));
      }
      return false;
    } finally {
      this.calculating.delete(ref.node);
    }
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/metadata/src/host_directives_resolver.mjs
var EMPTY_ARRAY = [];
var HostDirectivesResolver = class {
  constructor(metaReader) {
    this.metaReader = metaReader;
    this.cache = /* @__PURE__ */ new Map();
  }
  resolve(metadata) {
    if (this.cache.has(metadata.ref.node)) {
      return this.cache.get(metadata.ref.node);
    }
    const results = metadata.hostDirectives && metadata.hostDirectives.length > 0 ? this.walkHostDirectives(metadata.hostDirectives, []) : EMPTY_ARRAY;
    this.cache.set(metadata.ref.node, results);
    return results;
  }
  walkHostDirectives(directives, results) {
    for (const current of directives) {
      const hostMeta = flattenInheritedDirectiveMetadata(this.metaReader, current.directive);
      if (hostMeta === null) {
        continue;
      }
      if (hostMeta.hostDirectives) {
        this.walkHostDirectives(hostMeta.hostDirectives, results);
      }
      results.push({
        ...hostMeta,
        matchSource: MatchSource.HostDirective,
        inputs: ClassPropertyMapping.fromMappedObject(this.filterMappings(hostMeta.inputs, current.inputs, resolveInput)),
        outputs: ClassPropertyMapping.fromMappedObject(this.filterMappings(hostMeta.outputs, current.outputs, resolveOutput))
      });
    }
    return results;
  }
  filterMappings(source, allowedProperties, valueResolver) {
    const result = {};
    if (allowedProperties !== null) {
      for (const publicName in allowedProperties) {
        if (allowedProperties.hasOwnProperty(publicName)) {
          const bindings = source.getByBindingPropertyName(publicName);
          if (bindings !== null) {
            for (const binding of bindings) {
              result[binding.classPropertyName] = valueResolver(allowedProperties[publicName], binding);
            }
          }
        }
      }
    }
    return result;
  }
};
function resolveInput(bindingName, binding) {
  return {
    bindingPropertyName: bindingName,
    classPropertyName: binding.classPropertyName,
    required: binding.required,
    transform: binding.transform
  };
}
function resolveOutput(bindingName) {
  return bindingName;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/common/src/diagnostics.mjs
function makeDuplicateDeclarationError(node, data, kind) {
  const context = [];
  for (const decl of data) {
    if (decl.rawDeclarations === null) {
      continue;
    }
    const contextNode = decl.ref.getOriginForDiagnostics(decl.rawDeclarations, decl.ngModule.name);
    context.push(makeRelatedInformation(contextNode, `'${node.name.text}' is listed in the declarations of the NgModule '${decl.ngModule.name.text}'.`));
  }
  return makeDiagnostic(ErrorCode.NGMODULE_DECLARATION_NOT_UNIQUE, node.name, `The ${kind} '${node.name.text}' is declared by more than one NgModule.`, context);
}
function createValueHasWrongTypeError(node, value, messageText) {
  var _a;
  let chainedMessage;
  let relatedInformation;
  if (value instanceof DynamicValue) {
    chainedMessage = "Value could not be determined statically.";
    relatedInformation = traceDynamicValue(node, value);
  } else if (value instanceof Reference) {
    const target = value.debugName !== null ? `'${value.debugName}'` : "an anonymous declaration";
    chainedMessage = `Value is a reference to ${target}.`;
    const referenceNode = (_a = identifierOfNode(value.node)) != null ? _a : value.node;
    relatedInformation = [makeRelatedInformation(referenceNode, "Reference is declared here.")];
  } else {
    chainedMessage = `Value is of type '${describeResolvedType(value)}'.`;
  }
  const chain = {
    messageText,
    category: ts7.DiagnosticCategory.Error,
    code: 0,
    next: [{
      messageText: chainedMessage,
      category: ts7.DiagnosticCategory.Message,
      code: 0
    }]
  };
  return new FatalDiagnosticError(ErrorCode.VALUE_HAS_WRONG_TYPE, node, chain, relatedInformation);
}
function getProviderDiagnostics(providerClasses, providersDeclaration, registry) {
  const diagnostics = [];
  for (const provider of providerClasses) {
    const injectableMeta = registry.getInjectableMeta(provider.node);
    if (injectableMeta !== null) {
      continue;
    }
    const contextNode = provider.getOriginForDiagnostics(providersDeclaration);
    diagnostics.push(makeDiagnostic(ErrorCode.UNDECORATED_PROVIDER, contextNode, `The class '${provider.node.name.text}' cannot be created via dependency injection, as it does not have an Angular decorator. This will result in an error at runtime.

Either add the @Injectable() decorator to '${provider.node.name.text}', or configure a different provider (such as a provider with 'useFactory').
`, [makeRelatedInformation(provider.node, `'${provider.node.name.text}' is declared here.`)]));
  }
  return diagnostics;
}
function getDirectiveDiagnostics(node, injectableRegistry, evaluator, reflector, scopeRegistry, strictInjectionParameters, kind) {
  let diagnostics = [];
  const addDiagnostics = (more) => {
    if (more === null) {
      return;
    } else if (diagnostics === null) {
      diagnostics = Array.isArray(more) ? more : [more];
    } else if (Array.isArray(more)) {
      diagnostics.push(...more);
    } else {
      diagnostics.push(more);
    }
  };
  const duplicateDeclarations = scopeRegistry.getDuplicateDeclarations(node);
  if (duplicateDeclarations !== null) {
    addDiagnostics(makeDuplicateDeclarationError(node, duplicateDeclarations, kind));
  }
  addDiagnostics(checkInheritanceOfInjectable(node, injectableRegistry, reflector, evaluator, strictInjectionParameters, kind));
  return diagnostics;
}
function validateHostDirectives(origin, hostDirectives, metaReader) {
  const diagnostics = [];
  for (const current of hostDirectives) {
    const hostMeta = flattenInheritedDirectiveMetadata(metaReader, current.directive);
    if (hostMeta === null) {
      diagnostics.push(makeDiagnostic(ErrorCode.HOST_DIRECTIVE_INVALID, current.directive.getOriginForDiagnostics(origin), `${current.directive.debugName} must be a standalone directive to be used as a host directive`));
      continue;
    }
    if (!hostMeta.isStandalone) {
      diagnostics.push(makeDiagnostic(ErrorCode.HOST_DIRECTIVE_NOT_STANDALONE, current.directive.getOriginForDiagnostics(origin), `Host directive ${hostMeta.name} must be standalone`));
    }
    if (hostMeta.isComponent) {
      diagnostics.push(makeDiagnostic(ErrorCode.HOST_DIRECTIVE_COMPONENT, current.directive.getOriginForDiagnostics(origin), `Host directive ${hostMeta.name} cannot be a component`));
    }
    const requiredInputNames = Array.from(hostMeta.inputs).filter((input) => input.required).map((input) => input.classPropertyName);
    validateHostDirectiveMappings("input", current, hostMeta, origin, diagnostics, requiredInputNames.length > 0 ? new Set(requiredInputNames) : null);
    validateHostDirectiveMappings("output", current, hostMeta, origin, diagnostics, null);
  }
  return diagnostics;
}
function validateHostDirectiveMappings(bindingType, hostDirectiveMeta, meta, origin, diagnostics, requiredBindings) {
  const className = meta.name;
  const hostDirectiveMappings = bindingType === "input" ? hostDirectiveMeta.inputs : hostDirectiveMeta.outputs;
  const existingBindings = bindingType === "input" ? meta.inputs : meta.outputs;
  const exposedRequiredBindings = /* @__PURE__ */ new Set();
  for (const publicName in hostDirectiveMappings) {
    if (hostDirectiveMappings.hasOwnProperty(publicName)) {
      const bindings = existingBindings.getByBindingPropertyName(publicName);
      if (bindings === null) {
        diagnostics.push(makeDiagnostic(ErrorCode.HOST_DIRECTIVE_UNDEFINED_BINDING, hostDirectiveMeta.directive.getOriginForDiagnostics(origin), `Directive ${className} does not have an ${bindingType} with a public name of ${publicName}.`));
      } else if (requiredBindings !== null) {
        for (const field of bindings) {
          if (requiredBindings.has(field.classPropertyName)) {
            exposedRequiredBindings.add(field.classPropertyName);
          }
        }
      }
      const remappedPublicName = hostDirectiveMappings[publicName];
      const bindingsForPublicName = existingBindings.getByBindingPropertyName(remappedPublicName);
      if (bindingsForPublicName !== null) {
        for (const binding of bindingsForPublicName) {
          if (binding.bindingPropertyName !== publicName) {
            diagnostics.push(makeDiagnostic(ErrorCode.HOST_DIRECTIVE_CONFLICTING_ALIAS, hostDirectiveMeta.directive.getOriginForDiagnostics(origin), `Cannot alias ${bindingType} ${publicName} of host directive ${className} to ${remappedPublicName}, because it already has a different ${bindingType} with the same public name.`));
          }
        }
      }
    }
  }
  if (requiredBindings !== null && requiredBindings.size !== exposedRequiredBindings.size) {
    const missingBindings = [];
    for (const publicName of requiredBindings) {
      if (!exposedRequiredBindings.has(publicName)) {
        const name = existingBindings.getByClassPropertyName(publicName);
        if (name) {
          missingBindings.push(`'${name.bindingPropertyName}'`);
        }
      }
    }
    diagnostics.push(makeDiagnostic(ErrorCode.HOST_DIRECTIVE_MISSING_REQUIRED_BINDING, hostDirectiveMeta.directive.getOriginForDiagnostics(origin), `Required ${bindingType}${missingBindings.length === 1 ? "" : "s"} ${missingBindings.join(", ")} from host directive ${className} must be exposed.`));
  }
}
function getUndecoratedClassWithAngularFeaturesDiagnostic(node) {
  return makeDiagnostic(ErrorCode.UNDECORATED_CLASS_USING_ANGULAR_FEATURES, node.name, `Class is using Angular features but is not decorated. Please add an explicit Angular decorator.`);
}
function checkInheritanceOfInjectable(node, injectableRegistry, reflector, evaluator, strictInjectionParameters, kind) {
  const classWithCtor = findInheritedCtor(node, injectableRegistry, reflector, evaluator);
  if (classWithCtor === null || classWithCtor.isCtorValid) {
    return null;
  }
  if (!classWithCtor.isDecorated) {
    return getInheritedUndecoratedCtorDiagnostic(node, classWithCtor.ref, kind);
  }
  if (isFromDtsFile(classWithCtor.ref.node)) {
    return null;
  }
  if (!strictInjectionParameters || isAbstractClassDeclaration(node)) {
    return null;
  }
  return getInheritedInvalidCtorDiagnostic(node, classWithCtor.ref, kind);
}
function findInheritedCtor(node, injectableRegistry, reflector, evaluator) {
  if (!reflector.isClass(node) || reflector.getConstructorParameters(node) !== null) {
    return null;
  }
  let baseClass = readBaseClass(node, reflector, evaluator);
  while (baseClass !== null) {
    if (baseClass === "dynamic") {
      return null;
    }
    const injectableMeta = injectableRegistry.getInjectableMeta(baseClass.node);
    if (injectableMeta !== null) {
      if (injectableMeta.ctorDeps !== null) {
        return {
          ref: baseClass,
          isCtorValid: injectableMeta.ctorDeps !== "invalid",
          isDecorated: true
        };
      }
    } else {
      const baseClassConstructorParams = reflector.getConstructorParameters(baseClass.node);
      if (baseClassConstructorParams !== null) {
        return {
          ref: baseClass,
          isCtorValid: baseClassConstructorParams.length === 0,
          isDecorated: false
        };
      }
    }
    baseClass = readBaseClass(baseClass.node, reflector, evaluator);
  }
  return null;
}
function getInheritedInvalidCtorDiagnostic(node, baseClass, kind) {
  const baseClassName = baseClass.debugName;
  return makeDiagnostic(ErrorCode.INJECTABLE_INHERITS_INVALID_CONSTRUCTOR, node.name, `The ${kind.toLowerCase()} ${node.name.text} inherits its constructor from ${baseClassName}, but the latter has a constructor parameter that is not compatible with dependency injection. Either add an explicit constructor to ${node.name.text} or change ${baseClassName}'s constructor to use parameters that are valid for DI.`);
}
function getInheritedUndecoratedCtorDiagnostic(node, baseClass, kind) {
  const baseClassName = baseClass.debugName;
  const baseNeedsDecorator = kind === "Component" || kind === "Directive" ? "Directive" : "Injectable";
  return makeDiagnostic(ErrorCode.DIRECTIVE_INHERITS_UNDECORATED_CTOR, node.name, `The ${kind.toLowerCase()} ${node.name.text} inherits its constructor from ${baseClassName}, but the latter does not have an Angular decorator of its own. Dependency injection will not be able to resolve the parameters of ${baseClassName}'s constructor. Either add a @${baseNeedsDecorator} decorator to ${baseClassName}, or add an explicit constructor to ${node.name.text}.`);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/common/src/evaluation.mjs
import ts8 from "typescript";
function resolveEnumValue(evaluator, metadata, field, enumSymbolName) {
  let resolved = null;
  if (metadata.has(field)) {
    const expr = metadata.get(field);
    const value = evaluator.evaluate(expr);
    if (value instanceof EnumValue && isAngularCoreReference(value.enumRef, enumSymbolName)) {
      resolved = value.resolved;
    } else {
      throw createValueHasWrongTypeError(expr, value, `${field} must be a member of ${enumSymbolName} enum from @angular/core`);
    }
  }
  return resolved;
}
function isStringArray(resolvedValue) {
  return Array.isArray(resolvedValue) && resolvedValue.every((elem) => typeof elem === "string");
}
function resolveLiteral(decorator, literalCache) {
  if (literalCache.has(decorator)) {
    return literalCache.get(decorator);
  }
  if (decorator.args === null || decorator.args.length !== 1) {
    throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, `Incorrect number of arguments to @${decorator.name} decorator`);
  }
  const meta = unwrapExpression(decorator.args[0]);
  if (!ts8.isObjectLiteralExpression(meta)) {
    throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARG_NOT_LITERAL, meta, `Decorator argument must be literal.`);
  }
  literalCache.set(decorator, meta);
  return meta;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/common/src/factory.mjs
import { compileDeclareFactoryFunction, compileFactoryFunction } from "@angular/compiler";
function compileNgFactoryDefField(metadata) {
  const res = compileFactoryFunction(metadata);
  return {
    name: "\u0275fac",
    initializer: res.expression,
    statements: res.statements,
    type: res.type,
    deferrableImports: null
  };
}
function compileDeclareFactory(metadata) {
  const res = compileDeclareFactoryFunction(metadata);
  return {
    name: "\u0275fac",
    initializer: res.expression,
    statements: res.statements,
    type: res.type,
    deferrableImports: null
  };
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/common/src/injectable_registry.mjs
var InjectableClassRegistry = class {
  constructor(host, isCore) {
    this.host = host;
    this.isCore = isCore;
    this.classes = /* @__PURE__ */ new Map();
  }
  registerInjectable(declaration, meta) {
    this.classes.set(declaration, meta);
  }
  getInjectableMeta(declaration) {
    if (this.classes.has(declaration)) {
      return this.classes.get(declaration);
    }
    if (!hasInjectableFields(declaration, this.host)) {
      return null;
    }
    const ctorDeps = getConstructorDependencies(declaration, this.host, this.isCore);
    const meta = {
      ctorDeps: unwrapConstructorDependencies(ctorDeps)
    };
    this.classes.set(declaration, meta);
    return meta;
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/common/src/metadata.mjs
import { FunctionExpr, LiteralArrayExpr, LiteralExpr as LiteralExpr2, literalMap, ReturnStatement, WrappedNodeExpr as WrappedNodeExpr3 } from "@angular/compiler";
import ts9 from "typescript";
function extractClassMetadata(clazz, reflection, isCore, annotateForClosureCompiler, angularDecoratorTransform = (dec) => dec) {
  if (!reflection.isClass(clazz)) {
    return null;
  }
  const id = clazz.name;
  const classDecorators = reflection.getDecoratorsOfDeclaration(clazz);
  if (classDecorators === null) {
    return null;
  }
  const ngClassDecorators = classDecorators.filter((dec) => isAngularDecorator2(dec, isCore)).map((decorator) => decoratorToMetadata(angularDecoratorTransform(decorator), annotateForClosureCompiler)).map((decorator) => removeIdentifierReferences(decorator, id.text));
  if (ngClassDecorators.length === 0) {
    return null;
  }
  const metaDecorators = new WrappedNodeExpr3(ts9.factory.createArrayLiteralExpression(ngClassDecorators));
  let metaCtorParameters = null;
  const classCtorParameters = reflection.getConstructorParameters(clazz);
  if (classCtorParameters !== null) {
    const ctorParameters = classCtorParameters.map((param) => ctorParameterToMetadata(param, isCore));
    metaCtorParameters = new FunctionExpr([], [
      new ReturnStatement(new LiteralArrayExpr(ctorParameters))
    ]);
  }
  let metaPropDecorators = null;
  const classMembers = reflection.getMembersOfClass(clazz).filter((member) => !member.isStatic && member.decorators !== null && member.decorators.length > 0);
  const duplicateDecoratedMemberNames = classMembers.map((member) => member.name).filter((name, i, arr) => arr.indexOf(name) < i);
  if (duplicateDecoratedMemberNames.length > 0) {
    throw new Error(`Duplicate decorated properties found on class '${clazz.name.text}': ` + duplicateDecoratedMemberNames.join(", "));
  }
  const decoratedMembers = classMembers.map((member) => {
    var _a;
    return classMemberToMetadata((_a = member.nameNode) != null ? _a : member.name, member.decorators, isCore);
  });
  if (decoratedMembers.length > 0) {
    metaPropDecorators = new WrappedNodeExpr3(ts9.factory.createObjectLiteralExpression(decoratedMembers));
  }
  return {
    type: new WrappedNodeExpr3(id),
    decorators: metaDecorators,
    ctorParameters: metaCtorParameters,
    propDecorators: metaPropDecorators
  };
}
function ctorParameterToMetadata(param, isCore) {
  const type = param.typeValueReference.kind !== 2 ? valueReferenceToExpression(param.typeValueReference) : new LiteralExpr2(void 0);
  const mapEntries = [
    { key: "type", value: type, quoted: false }
  ];
  if (param.decorators !== null) {
    const ngDecorators = param.decorators.filter((dec) => isAngularDecorator2(dec, isCore)).map((decorator) => decoratorToMetadata(decorator));
    const value = new WrappedNodeExpr3(ts9.factory.createArrayLiteralExpression(ngDecorators));
    mapEntries.push({ key: "decorators", value, quoted: false });
  }
  return literalMap(mapEntries);
}
function classMemberToMetadata(name, decorators, isCore) {
  const ngDecorators = decorators.filter((dec) => isAngularDecorator2(dec, isCore)).map((decorator) => decoratorToMetadata(decorator));
  const decoratorMeta = ts9.factory.createArrayLiteralExpression(ngDecorators);
  return ts9.factory.createPropertyAssignment(name, decoratorMeta);
}
function decoratorToMetadata(decorator, wrapFunctionsInParens) {
  if (decorator.identifier === null) {
    throw new Error("Illegal state: synthesized decorator cannot be emitted in class metadata.");
  }
  const properties = [
    ts9.factory.createPropertyAssignment("type", decorator.identifier)
  ];
  if (decorator.args !== null && decorator.args.length > 0) {
    const args = decorator.args.map((arg) => {
      return wrapFunctionsInParens ? wrapFunctionExpressionsInParens(arg) : arg;
    });
    properties.push(ts9.factory.createPropertyAssignment("args", ts9.factory.createArrayLiteralExpression(args)));
  }
  return ts9.factory.createObjectLiteralExpression(properties, true);
}
function isAngularDecorator2(decorator, isCore) {
  return isCore || decorator.import !== null && decorator.import.from === "@angular/core";
}
function removeIdentifierReferences(node, name) {
  const result = ts9.transform(node, [(context) => (root) => ts9.visitNode(root, function walk(current) {
    return ts9.isIdentifier(current) && current.text === name ? ts9.factory.createIdentifier(current.text) : ts9.visitEachChild(current, walk, context);
  })]);
  return result.transformed[0];
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/common/src/references_registry.mjs
var NoopReferencesRegistry = class {
  add(source, ...references) {
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/common/src/schema.mjs
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/compiler";
function extractSchemas(rawExpr, evaluator, context) {
  const schemas = [];
  const result = evaluator.evaluate(rawExpr);
  if (!Array.isArray(result)) {
    throw createValueHasWrongTypeError(rawExpr, result, `${context}.schemas must be an array`);
  }
  for (const schemaRef of result) {
    if (!(schemaRef instanceof Reference)) {
      throw createValueHasWrongTypeError(rawExpr, result, `${context}.schemas must be an array of schemas`);
    }
    const id = schemaRef.getIdentityIn(schemaRef.node.getSourceFile());
    if (id === null || schemaRef.ownedByModuleGuess !== "@angular/core") {
      throw createValueHasWrongTypeError(rawExpr, result, `${context}.schemas must be an array of schemas`);
    }
    switch (id.text) {
      case "CUSTOM_ELEMENTS_SCHEMA":
        schemas.push(CUSTOM_ELEMENTS_SCHEMA);
        break;
      case "NO_ERRORS_SCHEMA":
        schemas.push(NO_ERRORS_SCHEMA);
        break;
      default:
        throw createValueHasWrongTypeError(rawExpr, schemaRef, `'${schemaRef.debugName}' is not a valid ${context} schema`);
    }
  }
  return schemas;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/common/src/input_transforms.mjs
import { outputAst } from "@angular/compiler";
function compileInputTransformFields(inputs) {
  const extraFields = [];
  for (const input of inputs) {
    if (input.transform) {
      extraFields.push({
        name: `ngAcceptInputType_${input.classPropertyName}`,
        type: outputAst.transplantedType(input.transform.type),
        statements: [],
        initializer: null,
        deferrableImports: null
      });
    }
  }
  return extraFields;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/component/src/handler.mjs
import { compileClassMetadata as compileClassMetadata3, compileComponentFromMetadata, compileDeclareClassMetadata as compileDeclareClassMetadata3, compileDeclareComponentFromMetadata, CssSelector as CssSelector2, DEFAULT_INTERPOLATION_CONFIG as DEFAULT_INTERPOLATION_CONFIG2, DomElementSchemaRegistry, FactoryTarget as FactoryTarget3, makeBindingParser as makeBindingParser2, R3TargetBinder, R3TemplateDependencyKind, SelectorMatcher as SelectorMatcher2, ViewEncapsulation, WrappedNodeExpr as WrappedNodeExpr7 } from "@angular/compiler";
import ts24 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/incremental/semantic_graph/src/api.mjs
import ts10 from "typescript";
var SemanticSymbol = class {
  constructor(decl) {
    this.decl = decl;
    this.path = absoluteFromSourceFile(decl.getSourceFile());
    this.identifier = getSymbolIdentifier(decl);
  }
};
function getSymbolIdentifier(decl) {
  if (!ts10.isSourceFile(decl.parent)) {
    return null;
  }
  return decl.name.text;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/incremental/semantic_graph/src/graph.mjs
import { ExternalExpr as ExternalExpr2 } from "@angular/compiler";
var OpaqueSymbol = class extends SemanticSymbol {
  isPublicApiAffected() {
    return false;
  }
  isTypeCheckApiAffected() {
    return false;
  }
};
var SemanticDepGraph = class {
  constructor() {
    this.files = /* @__PURE__ */ new Map();
    this.symbolByDecl = /* @__PURE__ */ new Map();
  }
  registerSymbol(symbol) {
    this.symbolByDecl.set(symbol.decl, symbol);
    if (symbol.identifier !== null) {
      if (!this.files.has(symbol.path)) {
        this.files.set(symbol.path, /* @__PURE__ */ new Map());
      }
      this.files.get(symbol.path).set(symbol.identifier, symbol);
    }
  }
  getEquivalentSymbol(symbol) {
    let previousSymbol = this.getSymbolByDecl(symbol.decl);
    if (previousSymbol === null && symbol.identifier !== null) {
      previousSymbol = this.getSymbolByName(symbol.path, symbol.identifier);
    }
    return previousSymbol;
  }
  getSymbolByName(path, identifier) {
    if (!this.files.has(path)) {
      return null;
    }
    const file = this.files.get(path);
    if (!file.has(identifier)) {
      return null;
    }
    return file.get(identifier);
  }
  getSymbolByDecl(decl) {
    if (!this.symbolByDecl.has(decl)) {
      return null;
    }
    return this.symbolByDecl.get(decl);
  }
};
var SemanticDepGraphUpdater = class {
  constructor(priorGraph) {
    this.priorGraph = priorGraph;
    this.newGraph = new SemanticDepGraph();
    this.opaqueSymbols = /* @__PURE__ */ new Map();
  }
  registerSymbol(symbol) {
    this.newGraph.registerSymbol(symbol);
  }
  finalize() {
    if (this.priorGraph === null) {
      return {
        needsEmit: /* @__PURE__ */ new Set(),
        needsTypeCheckEmit: /* @__PURE__ */ new Set(),
        newGraph: this.newGraph
      };
    }
    const needsEmit = this.determineInvalidatedFiles(this.priorGraph);
    const needsTypeCheckEmit = this.determineInvalidatedTypeCheckFiles(this.priorGraph);
    return {
      needsEmit,
      needsTypeCheckEmit,
      newGraph: this.newGraph
    };
  }
  determineInvalidatedFiles(priorGraph) {
    const isPublicApiAffected = /* @__PURE__ */ new Set();
    for (const symbol of this.newGraph.symbolByDecl.values()) {
      const previousSymbol = priorGraph.getEquivalentSymbol(symbol);
      if (previousSymbol === null || symbol.isPublicApiAffected(previousSymbol)) {
        isPublicApiAffected.add(symbol);
      }
    }
    const needsEmit = /* @__PURE__ */ new Set();
    for (const symbol of this.newGraph.symbolByDecl.values()) {
      if (symbol.isEmitAffected === void 0) {
        continue;
      }
      const previousSymbol = priorGraph.getEquivalentSymbol(symbol);
      if (previousSymbol === null || symbol.isEmitAffected(previousSymbol, isPublicApiAffected)) {
        needsEmit.add(symbol.path);
      }
    }
    return needsEmit;
  }
  determineInvalidatedTypeCheckFiles(priorGraph) {
    const isTypeCheckApiAffected = /* @__PURE__ */ new Set();
    for (const symbol of this.newGraph.symbolByDecl.values()) {
      const previousSymbol = priorGraph.getEquivalentSymbol(symbol);
      if (previousSymbol === null || symbol.isTypeCheckApiAffected(previousSymbol)) {
        isTypeCheckApiAffected.add(symbol);
      }
    }
    const needsTypeCheckEmit = /* @__PURE__ */ new Set();
    for (const symbol of this.newGraph.symbolByDecl.values()) {
      if (symbol.isTypeCheckBlockAffected === void 0) {
        continue;
      }
      const previousSymbol = priorGraph.getEquivalentSymbol(symbol);
      if (previousSymbol === null || symbol.isTypeCheckBlockAffected(previousSymbol, isTypeCheckApiAffected)) {
        needsTypeCheckEmit.add(symbol.path);
      }
    }
    return needsTypeCheckEmit;
  }
  getSemanticReference(decl, expr) {
    return {
      symbol: this.getSymbol(decl),
      importPath: getImportPath(expr)
    };
  }
  getSymbol(decl) {
    const symbol = this.newGraph.getSymbolByDecl(decl);
    if (symbol === null) {
      return this.getOpaqueSymbol(decl);
    }
    return symbol;
  }
  getOpaqueSymbol(decl) {
    if (this.opaqueSymbols.has(decl)) {
      return this.opaqueSymbols.get(decl);
    }
    const symbol = new OpaqueSymbol(decl);
    this.opaqueSymbols.set(decl, symbol);
    return symbol;
  }
};
function getImportPath(expr) {
  if (expr instanceof ExternalExpr2) {
    return `${expr.value.moduleName}$${expr.value.name}`;
  } else {
    return null;
  }
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/incremental/semantic_graph/src/type_parameters.mjs
import ts11 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/incremental/semantic_graph/src/util.mjs
function isSymbolEqual(a, b) {
  if (a.decl === b.decl) {
    return true;
  }
  if (a.identifier === null || b.identifier === null) {
    return false;
  }
  return a.path === b.path && a.identifier === b.identifier;
}
function isReferenceEqual(a, b) {
  if (!isSymbolEqual(a.symbol, b.symbol)) {
    return false;
  }
  return a.importPath === b.importPath;
}
function referenceEquality(a, b) {
  return a === b;
}
function isArrayEqual(a, b, equalityTester = referenceEquality) {
  if (a === null || b === null) {
    return a === b;
  }
  if (a.length !== b.length) {
    return false;
  }
  return !a.some((item, index) => !equalityTester(item, b[index]));
}
function isSetEqual(a, b, equalityTester = referenceEquality) {
  if (a === null || b === null) {
    return a === b;
  }
  if (a.size !== b.size) {
    return false;
  }
  for (const itemA of a) {
    let found = false;
    for (const itemB of b) {
      if (equalityTester(itemA, itemB)) {
        found = true;
        break;
      }
    }
    if (!found) {
      return false;
    }
  }
  return true;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/incremental/semantic_graph/src/type_parameters.mjs
function extractSemanticTypeParameters(node) {
  if (!ts11.isClassDeclaration(node) || node.typeParameters === void 0) {
    return null;
  }
  return node.typeParameters.map((typeParam) => ({ hasGenericTypeBound: typeParam.constraint !== void 0 }));
}
function areTypeParametersEqual(current, previous) {
  if (!isArrayEqual(current, previous, isTypeParameterEqual)) {
    return false;
  }
  if (current !== null && current.some((typeParam) => typeParam.hasGenericTypeBound)) {
    return false;
  }
  return true;
}
function isTypeParameterEqual(a, b) {
  return a.hasGenericTypeBound === b.hasGenericTypeBound;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/scope/src/api.mjs
var ComponentScopeKind;
(function(ComponentScopeKind2) {
  ComponentScopeKind2[ComponentScopeKind2["NgModule"] = 0] = "NgModule";
  ComponentScopeKind2[ComponentScopeKind2["Standalone"] = 1] = "Standalone";
})(ComponentScopeKind || (ComponentScopeKind = {}));

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/scope/src/component_scope.mjs
var CompoundComponentScopeReader = class {
  constructor(readers) {
    this.readers = readers;
  }
  getScopeForComponent(clazz) {
    for (const reader of this.readers) {
      const meta = reader.getScopeForComponent(clazz);
      if (meta !== null) {
        return meta;
      }
    }
    return null;
  }
  getRemoteScope(clazz) {
    for (const reader of this.readers) {
      const remoteScope = reader.getRemoteScope(clazz);
      if (remoteScope !== null) {
        return remoteScope;
      }
    }
    return null;
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/scope/src/dependency.mjs
var MetadataDtsModuleScopeResolver = class {
  constructor(dtsMetaReader, aliasingHost) {
    this.dtsMetaReader = dtsMetaReader;
    this.aliasingHost = aliasingHost;
    this.cache = /* @__PURE__ */ new Map();
  }
  resolve(ref) {
    const clazz = ref.node;
    const sourceFile = clazz.getSourceFile();
    if (!sourceFile.isDeclarationFile) {
      throw new Error(`Debug error: DtsModuleScopeResolver.read(${ref.debugName} from ${sourceFile.fileName}), but not a .d.ts file`);
    }
    if (this.cache.has(clazz)) {
      return this.cache.get(clazz);
    }
    const dependencies = [];
    const meta = this.dtsMetaReader.getNgModuleMetadata(ref);
    if (meta === null) {
      this.cache.set(clazz, null);
      return null;
    }
    const declarations = /* @__PURE__ */ new Set();
    for (const declRef of meta.declarations) {
      declarations.add(declRef.node);
    }
    for (const exportRef of meta.exports) {
      const directive = this.dtsMetaReader.getDirectiveMetadata(exportRef);
      if (directive !== null) {
        const isReExport = !declarations.has(exportRef.node);
        dependencies.push(this.maybeAlias(directive, sourceFile, isReExport));
        continue;
      }
      const pipe = this.dtsMetaReader.getPipeMetadata(exportRef);
      if (pipe !== null) {
        const isReExport = !declarations.has(exportRef.node);
        dependencies.push(this.maybeAlias(pipe, sourceFile, isReExport));
        continue;
      }
      const exportScope2 = this.resolve(exportRef);
      if (exportScope2 !== null) {
        if (this.aliasingHost === null) {
          dependencies.push(...exportScope2.exported.dependencies);
        } else {
          for (const dep of exportScope2.exported.dependencies) {
            dependencies.push(this.maybeAlias(dep, sourceFile, true));
          }
        }
      }
      continue;
    }
    const exportScope = {
      exported: {
        dependencies,
        isPoisoned: false
      }
    };
    this.cache.set(clazz, exportScope);
    return exportScope;
  }
  maybeAlias(dirOrPipe, maybeAliasFrom, isReExport) {
    const ref = dirOrPipe.ref;
    if (this.aliasingHost === null || ref.node.getSourceFile() === maybeAliasFrom) {
      return dirOrPipe;
    }
    const alias = this.aliasingHost.getAliasIn(ref.node, maybeAliasFrom, isReExport);
    if (alias === null) {
      return dirOrPipe;
    }
    return {
      ...dirOrPipe,
      ref: ref.cloneWithAlias(alias)
    };
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/scope/src/local.mjs
import { ExternalExpr as ExternalExpr3 } from "@angular/compiler";
import ts12 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/scope/src/util.mjs
function getDiagnosticNode(ref, rawExpr) {
  return rawExpr !== null ? ref.getOriginForDiagnostics(rawExpr) : ref.node.name;
}
function makeNotStandaloneDiagnostic(scopeReader, ref, rawExpr, kind) {
  const scope = scopeReader.getScopeForComponent(ref.node);
  let message = `The ${kind} '${ref.node.name.text}' appears in 'imports', but is not standalone and cannot be imported directly.`;
  let relatedInformation = void 0;
  if (scope !== null && scope.kind === ComponentScopeKind.NgModule) {
    const isExported = scope.exported.dependencies.some((dep) => dep.ref.node === ref.node);
    const relatedInfoMessageText = isExported ? `It can be imported using its '${scope.ngModule.name.text}' NgModule instead.` : `It's declared in the '${scope.ngModule.name.text}' NgModule, but is not exported. Consider exporting it and importing the NgModule instead.`;
    relatedInformation = [makeRelatedInformation(scope.ngModule.name, relatedInfoMessageText)];
  } else {
  }
  if (relatedInformation === void 0) {
    message += " It must be imported via an NgModule.";
  }
  return makeDiagnostic(ErrorCode.COMPONENT_IMPORT_NOT_STANDALONE, getDiagnosticNode(ref, rawExpr), message, relatedInformation);
}
function makeUnknownComponentImportDiagnostic(ref, rawExpr) {
  return makeDiagnostic(ErrorCode.COMPONENT_UNKNOWN_IMPORT, getDiagnosticNode(ref, rawExpr), `Component imports must be standalone components, directives, pipes, or must be NgModules.`);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/scope/src/local.mjs
var LocalModuleScopeRegistry = class {
  constructor(localReader, fullReader, dependencyScopeReader, refEmitter, aliasingHost) {
    this.localReader = localReader;
    this.fullReader = fullReader;
    this.dependencyScopeReader = dependencyScopeReader;
    this.refEmitter = refEmitter;
    this.aliasingHost = aliasingHost;
    this.sealed = false;
    this.declarationToModule = /* @__PURE__ */ new Map();
    this.duplicateDeclarations = /* @__PURE__ */ new Map();
    this.moduleToRef = /* @__PURE__ */ new Map();
    this.cache = /* @__PURE__ */ new Map();
    this.remoteScoping = /* @__PURE__ */ new Map();
    this.scopeErrors = /* @__PURE__ */ new Map();
    this.modulesWithStructuralErrors = /* @__PURE__ */ new Set();
  }
  registerNgModuleMetadata(data) {
    this.assertCollecting();
    const ngModule = data.ref.node;
    this.moduleToRef.set(data.ref.node, data.ref);
    for (const decl of data.declarations) {
      this.registerDeclarationOfModule(ngModule, decl, data.rawDeclarations);
    }
  }
  registerDirectiveMetadata(directive) {
  }
  registerPipeMetadata(pipe) {
  }
  getScopeForComponent(clazz) {
    const scope = !this.declarationToModule.has(clazz) ? null : this.getScopeOfModule(this.declarationToModule.get(clazz).ngModule);
    return scope;
  }
  getDuplicateDeclarations(node) {
    if (!this.duplicateDeclarations.has(node)) {
      return null;
    }
    return Array.from(this.duplicateDeclarations.get(node).values());
  }
  getScopeOfModule(clazz) {
    return this.moduleToRef.has(clazz) ? this.getScopeOfModuleReference(this.moduleToRef.get(clazz)) : null;
  }
  getDiagnosticsOfModule(clazz) {
    this.getScopeOfModule(clazz);
    if (this.scopeErrors.has(clazz)) {
      return this.scopeErrors.get(clazz);
    } else {
      return null;
    }
  }
  registerDeclarationOfModule(ngModule, decl, rawDeclarations) {
    const declData = {
      ngModule,
      ref: decl,
      rawDeclarations
    };
    if (this.duplicateDeclarations.has(decl.node)) {
      this.duplicateDeclarations.get(decl.node).set(ngModule, declData);
    } else if (this.declarationToModule.has(decl.node) && this.declarationToModule.get(decl.node).ngModule !== ngModule) {
      const duplicateDeclMap = /* @__PURE__ */ new Map();
      const firstDeclData = this.declarationToModule.get(decl.node);
      this.modulesWithStructuralErrors.add(firstDeclData.ngModule);
      this.modulesWithStructuralErrors.add(ngModule);
      duplicateDeclMap.set(firstDeclData.ngModule, firstDeclData);
      duplicateDeclMap.set(ngModule, declData);
      this.duplicateDeclarations.set(decl.node, duplicateDeclMap);
      this.declarationToModule.delete(decl.node);
    } else {
      this.declarationToModule.set(decl.node, declData);
    }
  }
  getScopeOfModuleReference(ref) {
    if (this.cache.has(ref.node)) {
      return this.cache.get(ref.node);
    }
    this.sealed = true;
    const ngModule = this.localReader.getNgModuleMetadata(ref);
    if (ngModule === null) {
      this.cache.set(ref.node, null);
      return null;
    }
    const diagnostics = [];
    const compilationDirectives = /* @__PURE__ */ new Map();
    const compilationPipes = /* @__PURE__ */ new Map();
    const declared = /* @__PURE__ */ new Set();
    const exportDirectives = /* @__PURE__ */ new Map();
    const exportPipes = /* @__PURE__ */ new Map();
    let isPoisoned = false;
    if (this.modulesWithStructuralErrors.has(ngModule.ref.node)) {
      isPoisoned = true;
    }
    for (const decl of ngModule.imports) {
      const importScope = this.getExportedScope(decl, diagnostics, ref.node, "import");
      if (importScope !== null) {
        if (importScope === "invalid" || importScope.exported.isPoisoned) {
          diagnostics.push(invalidTransitiveNgModuleRef(decl, ngModule.rawImports, "import"));
          isPoisoned = true;
          if (importScope === "invalid") {
            continue;
          }
        }
        for (const dep of importScope.exported.dependencies) {
          if (dep.kind === MetaKind.Directive) {
            compilationDirectives.set(dep.ref.node, dep);
          } else if (dep.kind === MetaKind.Pipe) {
            compilationPipes.set(dep.ref.node, dep);
          }
        }
        continue;
      }
      const directive = this.fullReader.getDirectiveMetadata(decl);
      if (directive !== null) {
        if (directive.isStandalone) {
          compilationDirectives.set(directive.ref.node, directive);
        } else {
          diagnostics.push(makeNotStandaloneDiagnostic(this, decl, ngModule.rawImports, directive.isComponent ? "component" : "directive"));
          isPoisoned = true;
        }
        continue;
      }
      const pipe = this.fullReader.getPipeMetadata(decl);
      if (pipe !== null) {
        if (pipe.isStandalone) {
          compilationPipes.set(pipe.ref.node, pipe);
        } else {
          diagnostics.push(makeNotStandaloneDiagnostic(this, decl, ngModule.rawImports, "pipe"));
          isPoisoned = true;
        }
        continue;
      }
      diagnostics.push(invalidRef(decl, ngModule.rawImports, "import"));
      isPoisoned = true;
    }
    for (const decl of ngModule.declarations) {
      const directive = this.localReader.getDirectiveMetadata(decl);
      const pipe = this.localReader.getPipeMetadata(decl);
      if (directive !== null) {
        if (directive.isStandalone) {
          const refType = directive.isComponent ? "Component" : "Directive";
          diagnostics.push(makeDiagnostic(ErrorCode.NGMODULE_DECLARATION_IS_STANDALONE, decl.getOriginForDiagnostics(ngModule.rawDeclarations), `${refType} ${decl.node.name.text} is standalone, and cannot be declared in an NgModule. Did you mean to import it instead?`));
          isPoisoned = true;
          continue;
        }
        compilationDirectives.set(decl.node, { ...directive, ref: decl });
        if (directive.isPoisoned) {
          isPoisoned = true;
        }
      } else if (pipe !== null) {
        if (pipe.isStandalone) {
          diagnostics.push(makeDiagnostic(ErrorCode.NGMODULE_DECLARATION_IS_STANDALONE, decl.getOriginForDiagnostics(ngModule.rawDeclarations), `Pipe ${decl.node.name.text} is standalone, and cannot be declared in an NgModule. Did you mean to import it instead?`));
          isPoisoned = true;
          continue;
        }
        compilationPipes.set(decl.node, { ...pipe, ref: decl });
      } else {
        const errorNode = decl.getOriginForDiagnostics(ngModule.rawDeclarations);
        diagnostics.push(makeDiagnostic(ErrorCode.NGMODULE_INVALID_DECLARATION, errorNode, `The class '${decl.node.name.text}' is listed in the declarations of the NgModule '${ngModule.ref.node.name.text}', but is not a directive, a component, or a pipe. Either remove it from the NgModule's declarations, or add an appropriate Angular decorator.`, [makeRelatedInformation(decl.node.name, `'${decl.node.name.text}' is declared here.`)]));
        isPoisoned = true;
        continue;
      }
      declared.add(decl.node);
    }
    for (const decl of ngModule.exports) {
      const exportScope = this.getExportedScope(decl, diagnostics, ref.node, "export");
      if (exportScope === "invalid" || exportScope !== null && exportScope.exported.isPoisoned) {
        diagnostics.push(invalidTransitiveNgModuleRef(decl, ngModule.rawExports, "export"));
        isPoisoned = true;
        if (exportScope === "invalid") {
          continue;
        }
      } else if (exportScope !== null) {
        for (const dep of exportScope.exported.dependencies) {
          if (dep.kind == MetaKind.Directive) {
            exportDirectives.set(dep.ref.node, dep);
          } else if (dep.kind === MetaKind.Pipe) {
            exportPipes.set(dep.ref.node, dep);
          }
        }
      } else if (compilationDirectives.has(decl.node)) {
        const directive = compilationDirectives.get(decl.node);
        exportDirectives.set(decl.node, directive);
      } else if (compilationPipes.has(decl.node)) {
        const pipe = compilationPipes.get(decl.node);
        exportPipes.set(decl.node, pipe);
      } else {
        const dirMeta = this.fullReader.getDirectiveMetadata(decl);
        const pipeMeta = this.fullReader.getPipeMetadata(decl);
        if (dirMeta !== null || pipeMeta !== null) {
          const isStandalone = dirMeta !== null ? dirMeta.isStandalone : pipeMeta.isStandalone;
          diagnostics.push(invalidReexport(decl, ngModule.rawExports, isStandalone));
        } else {
          diagnostics.push(invalidRef(decl, ngModule.rawExports, "export"));
        }
        isPoisoned = true;
        continue;
      }
    }
    const exported = {
      dependencies: [...exportDirectives.values(), ...exportPipes.values()],
      isPoisoned
    };
    const reexports = this.getReexports(ngModule, ref, declared, exported.dependencies, diagnostics);
    const scope = {
      kind: ComponentScopeKind.NgModule,
      ngModule: ngModule.ref.node,
      compilation: {
        dependencies: [...compilationDirectives.values(), ...compilationPipes.values()],
        isPoisoned
      },
      exported,
      reexports,
      schemas: ngModule.schemas
    };
    if (diagnostics.length > 0) {
      this.scopeErrors.set(ref.node, diagnostics);
      this.modulesWithStructuralErrors.add(ref.node);
    }
    this.cache.set(ref.node, scope);
    return scope;
  }
  getRemoteScope(node) {
    return this.remoteScoping.has(node) ? this.remoteScoping.get(node) : null;
  }
  setComponentRemoteScope(node, directives, pipes) {
    this.remoteScoping.set(node, { directives, pipes });
  }
  getExportedScope(ref, diagnostics, ownerForErrors, type) {
    if (ref.node.getSourceFile().isDeclarationFile) {
      if (!ts12.isClassDeclaration(ref.node)) {
        const code = type === "import" ? ErrorCode.NGMODULE_INVALID_IMPORT : ErrorCode.NGMODULE_INVALID_EXPORT;
        diagnostics.push(makeDiagnostic(code, identifierOfNode(ref.node) || ref.node, `Appears in the NgModule.${type}s of ${nodeNameForError(ownerForErrors)}, but could not be resolved to an NgModule`));
        return "invalid";
      }
      return this.dependencyScopeReader.resolve(ref);
    } else {
      return this.getScopeOfModuleReference(ref);
    }
  }
  getReexports(ngModule, ref, declared, exported, diagnostics) {
    let reexports = null;
    const sourceFile = ref.node.getSourceFile();
    if (this.aliasingHost === null) {
      return null;
    }
    reexports = [];
    const reexportMap = /* @__PURE__ */ new Map();
    const ngModuleRef = ref;
    const addReexport = (exportRef) => {
      if (exportRef.node.getSourceFile() === sourceFile) {
        return;
      }
      const isReExport = !declared.has(exportRef.node);
      const exportName = this.aliasingHost.maybeAliasSymbolAs(exportRef, sourceFile, ngModule.ref.node.name.text, isReExport);
      if (exportName === null) {
        return;
      }
      if (!reexportMap.has(exportName)) {
        if (exportRef.alias && exportRef.alias instanceof ExternalExpr3) {
          reexports.push({
            fromModule: exportRef.alias.value.moduleName,
            symbolName: exportRef.alias.value.name,
            asAlias: exportName
          });
        } else {
          const emittedRef = this.refEmitter.emit(exportRef.cloneWithNoIdentifiers(), sourceFile);
          assertSuccessfulReferenceEmit(emittedRef, ngModuleRef.node.name, "class");
          const expr = emittedRef.expression;
          if (!(expr instanceof ExternalExpr3) || expr.value.moduleName === null || expr.value.name === null) {
            throw new Error("Expected ExternalExpr");
          }
          reexports.push({
            fromModule: expr.value.moduleName,
            symbolName: expr.value.name,
            asAlias: exportName
          });
        }
        reexportMap.set(exportName, exportRef);
      } else {
        const prevRef = reexportMap.get(exportName);
        diagnostics.push(reexportCollision(ngModuleRef.node, prevRef, exportRef));
      }
    };
    for (const { ref: ref2 } of exported) {
      addReexport(ref2);
    }
    return reexports;
  }
  assertCollecting() {
    if (this.sealed) {
      throw new Error(`Assertion: LocalModuleScopeRegistry is not COLLECTING`);
    }
  }
};
function invalidRef(decl, rawExpr, type) {
  const code = type === "import" ? ErrorCode.NGMODULE_INVALID_IMPORT : ErrorCode.NGMODULE_INVALID_EXPORT;
  const resolveTarget = type === "import" ? "NgModule" : "NgModule, Component, Directive, or Pipe";
  const message = `'${decl.node.name.text}' does not appear to be an ${resolveTarget} class.`;
  const library = decl.ownedByModuleGuess !== null ? ` (${decl.ownedByModuleGuess})` : "";
  const sf = decl.node.getSourceFile();
  let relatedMessage;
  if (!sf.isDeclarationFile) {
    const annotationType = type === "import" ? "@NgModule" : "Angular";
    relatedMessage = `Is it missing an ${annotationType} annotation?`;
  } else if (sf.fileName.indexOf("node_modules") !== -1) {
    relatedMessage = `This likely means that the library${library} which declares ${decl.debugName} is not compatible with Angular Ivy. Check if a newer version of the library is available, and update if so. Also consider checking with the library's authors to see if the library is expected to be compatible with Ivy.`;
  } else {
    relatedMessage = `This likely means that the dependency${library} which declares ${decl.debugName} is not compatible with Angular Ivy.`;
  }
  return makeDiagnostic(code, getDiagnosticNode(decl, rawExpr), message, [makeRelatedInformation(decl.node.name, relatedMessage)]);
}
function invalidTransitiveNgModuleRef(decl, rawExpr, type) {
  const code = type === "import" ? ErrorCode.NGMODULE_INVALID_IMPORT : ErrorCode.NGMODULE_INVALID_EXPORT;
  return makeDiagnostic(code, getDiagnosticNode(decl, rawExpr), `This ${type} contains errors, which may affect components that depend on this NgModule.`);
}
function invalidReexport(decl, rawExpr, isStandalone) {
  let message = `Can't be exported from this NgModule, as `;
  if (isStandalone) {
    message += "it must be imported first";
  } else if (decl.node.getSourceFile().isDeclarationFile) {
    message += "it must be imported via its NgModule first";
  } else {
    message += "it must be either declared by this NgModule, or imported here via its NgModule first";
  }
  return makeDiagnostic(ErrorCode.NGMODULE_INVALID_REEXPORT, getDiagnosticNode(decl, rawExpr), message);
}
function reexportCollision(module, refA, refB) {
  const childMessageText = `This directive/pipe is part of the exports of '${module.name.text}' and shares the same name as another exported directive/pipe.`;
  return makeDiagnostic(ErrorCode.NGMODULE_REEXPORT_NAME_COLLISION, module.name, `
    There was a name collision between two classes named '${refA.node.name.text}', which are both part of the exports of '${module.name.text}'.

    Angular generates re-exports of an NgModule's exported directives/pipes from the module's source file in certain cases, using the declared name of the class. If two classes of the same name are exported, this automatic naming does not work.

    To fix this problem please re-export one or both classes directly from this file.
  `.trim(), [
    makeRelatedInformation(refA.node.name, childMessageText),
    makeRelatedInformation(refB.node.name, childMessageText)
  ]);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/scope/src/typecheck.mjs
import { CssSelector, SelectorMatcher } from "@angular/compiler";
import ts13 from "typescript";
var TypeCheckScopeRegistry = class {
  constructor(scopeReader, metaReader, hostDirectivesResolver) {
    this.scopeReader = scopeReader;
    this.metaReader = metaReader;
    this.hostDirectivesResolver = hostDirectivesResolver;
    this.flattenedDirectiveMetaCache = /* @__PURE__ */ new Map();
    this.scopeCache = /* @__PURE__ */ new Map();
  }
  getTypeCheckScope(node) {
    const matcher = new SelectorMatcher();
    const directives = [];
    const pipes = /* @__PURE__ */ new Map();
    const scope = this.scopeReader.getScopeForComponent(node);
    if (scope === null) {
      return {
        matcher,
        directives,
        pipes,
        schemas: [],
        isPoisoned: false
      };
    }
    const cacheKey = scope.kind === ComponentScopeKind.NgModule ? scope.ngModule : scope.component;
    const dependencies = scope.kind === ComponentScopeKind.NgModule ? scope.compilation.dependencies : scope.dependencies;
    if (this.scopeCache.has(cacheKey)) {
      return this.scopeCache.get(cacheKey);
    }
    for (const meta of dependencies) {
      if (meta.kind === MetaKind.Directive && meta.selector !== null) {
        const extMeta = this.getTypeCheckDirectiveMetadata(meta.ref);
        if (extMeta === null) {
          continue;
        }
        matcher.addSelectables(CssSelector.parse(meta.selector), [...this.hostDirectivesResolver.resolve(extMeta), extMeta]);
        directives.push(extMeta);
      } else if (meta.kind === MetaKind.Pipe) {
        if (!ts13.isClassDeclaration(meta.ref.node)) {
          throw new Error(`Unexpected non-class declaration ${ts13.SyntaxKind[meta.ref.node.kind]} for pipe ${meta.ref.debugName}`);
        }
        pipes.set(meta.name, meta.ref);
      }
    }
    const typeCheckScope = {
      matcher,
      directives,
      pipes,
      schemas: scope.schemas,
      isPoisoned: scope.kind === ComponentScopeKind.NgModule ? scope.compilation.isPoisoned || scope.exported.isPoisoned : scope.isPoisoned
    };
    this.scopeCache.set(cacheKey, typeCheckScope);
    return typeCheckScope;
  }
  getTypeCheckDirectiveMetadata(ref) {
    const clazz = ref.node;
    if (this.flattenedDirectiveMetaCache.has(clazz)) {
      return this.flattenedDirectiveMetaCache.get(clazz);
    }
    const meta = flattenInheritedDirectiveMetadata(this.metaReader, ref);
    if (meta === null) {
      return null;
    }
    this.flattenedDirectiveMetaCache.set(clazz, meta);
    return meta;
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/transform/src/api.mjs
var CompilationMode;
(function(CompilationMode2) {
  CompilationMode2[CompilationMode2["FULL"] = 0] = "FULL";
  CompilationMode2[CompilationMode2["PARTIAL"] = 1] = "PARTIAL";
  CompilationMode2[CompilationMode2["LOCAL"] = 2] = "LOCAL";
})(CompilationMode || (CompilationMode = {}));
var HandlerPrecedence;
(function(HandlerPrecedence2) {
  HandlerPrecedence2[HandlerPrecedence2["PRIMARY"] = 0] = "PRIMARY";
  HandlerPrecedence2[HandlerPrecedence2["SHARED"] = 1] = "SHARED";
  HandlerPrecedence2[HandlerPrecedence2["WEAK"] = 2] = "WEAK";
})(HandlerPrecedence || (HandlerPrecedence = {}));

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/transform/src/alias.mjs
import ts14 from "typescript";
function aliasTransformFactory(exportStatements) {
  return () => {
    return (file) => {
      if (ts14.isBundle(file) || !exportStatements.has(file.fileName)) {
        return file;
      }
      const statements = [...file.statements];
      exportStatements.get(file.fileName).forEach(([moduleName, symbolName], aliasName) => {
        const stmt = ts14.factory.createExportDeclaration(
          void 0,
          false,
          ts14.factory.createNamedExports([ts14.factory.createExportSpecifier(false, symbolName, aliasName)]),
          ts14.factory.createStringLiteral(moduleName)
        );
        statements.push(stmt);
      });
      return ts14.factory.updateSourceFile(file, statements);
    };
  };
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/transform/src/compilation.mjs
import ts15 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/transform/src/trait.mjs
var TraitState;
(function(TraitState2) {
  TraitState2[TraitState2["Pending"] = 0] = "Pending";
  TraitState2[TraitState2["Analyzed"] = 1] = "Analyzed";
  TraitState2[TraitState2["Resolved"] = 2] = "Resolved";
  TraitState2[TraitState2["Skipped"] = 3] = "Skipped";
})(TraitState || (TraitState = {}));
var Trait = {
  pending: (handler, detected) => TraitImpl.pending(handler, detected)
};
var TraitImpl = class {
  constructor(handler, detected) {
    this.state = TraitState.Pending;
    this.analysis = null;
    this.symbol = null;
    this.resolution = null;
    this.analysisDiagnostics = null;
    this.resolveDiagnostics = null;
    this.typeCheckDiagnostics = null;
    this.handler = handler;
    this.detected = detected;
  }
  toAnalyzed(analysis, diagnostics, symbol) {
    this.assertTransitionLegal(TraitState.Pending, TraitState.Analyzed);
    this.analysis = analysis;
    this.analysisDiagnostics = diagnostics;
    this.symbol = symbol;
    this.state = TraitState.Analyzed;
    return this;
  }
  toResolved(resolution, diagnostics) {
    this.assertTransitionLegal(TraitState.Analyzed, TraitState.Resolved);
    if (this.analysis === null) {
      throw new Error(`Cannot transition an Analyzed trait with a null analysis to Resolved`);
    }
    this.resolution = resolution;
    this.state = TraitState.Resolved;
    this.resolveDiagnostics = diagnostics;
    this.typeCheckDiagnostics = null;
    return this;
  }
  toSkipped() {
    this.assertTransitionLegal(TraitState.Pending, TraitState.Skipped);
    this.state = TraitState.Skipped;
    return this;
  }
  assertTransitionLegal(allowedState, transitionTo) {
    if (!(this.state === allowedState)) {
      throw new Error(`Assertion failure: cannot transition from ${TraitState[this.state]} to ${TraitState[transitionTo]}.`);
    }
  }
  static pending(handler, detected) {
    return new TraitImpl(handler, detected);
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/transform/src/compilation.mjs
var TraitCompiler = class {
  constructor(handlers, reflector, perf, incrementalBuild, compileNonExportedClasses, compilationMode, dtsTransforms, semanticDepGraphUpdater, sourceFileTypeIdentifier) {
    this.handlers = handlers;
    this.reflector = reflector;
    this.perf = perf;
    this.incrementalBuild = incrementalBuild;
    this.compileNonExportedClasses = compileNonExportedClasses;
    this.compilationMode = compilationMode;
    this.dtsTransforms = dtsTransforms;
    this.semanticDepGraphUpdater = semanticDepGraphUpdater;
    this.sourceFileTypeIdentifier = sourceFileTypeIdentifier;
    this.classes = /* @__PURE__ */ new Map();
    this.fileToClasses = /* @__PURE__ */ new Map();
    this.filesWithoutTraits = /* @__PURE__ */ new Set();
    this.reexportMap = /* @__PURE__ */ new Map();
    this.handlersByName = /* @__PURE__ */ new Map();
    for (const handler of handlers) {
      this.handlersByName.set(handler.name, handler);
    }
  }
  analyzeSync(sf) {
    this.analyze(sf, false);
  }
  analyzeAsync(sf) {
    return this.analyze(sf, true);
  }
  analyze(sf, preanalyze) {
    if (sf.isDeclarationFile || this.sourceFileTypeIdentifier.isShim(sf) || this.sourceFileTypeIdentifier.isResource(sf)) {
      return void 0;
    }
    const promises = [];
    const priorWork = this.compilationMode !== CompilationMode.LOCAL ? this.incrementalBuild.priorAnalysisFor(sf) : null;
    if (priorWork !== null) {
      this.perf.eventCount(PerfEvent.SourceFileReuseAnalysis);
      if (priorWork.length > 0) {
        for (const priorRecord of priorWork) {
          this.adopt(priorRecord);
        }
        this.perf.eventCount(PerfEvent.TraitReuseAnalysis, priorWork.length);
      } else {
        this.filesWithoutTraits.add(sf);
      }
      return;
    }
    const visit2 = (node) => {
      if (this.reflector.isClass(node)) {
        this.analyzeClass(node, preanalyze ? promises : null);
      }
      ts15.forEachChild(node, visit2);
    };
    visit2(sf);
    if (!this.fileToClasses.has(sf)) {
      this.filesWithoutTraits.add(sf);
    }
    if (preanalyze && promises.length > 0) {
      return Promise.all(promises).then(() => void 0);
    } else {
      return void 0;
    }
  }
  recordFor(clazz) {
    if (this.classes.has(clazz)) {
      return this.classes.get(clazz);
    } else {
      return null;
    }
  }
  getAnalyzedRecords() {
    const result = /* @__PURE__ */ new Map();
    for (const [sf, classes] of this.fileToClasses) {
      const records = [];
      for (const clazz of classes) {
        records.push(this.classes.get(clazz));
      }
      result.set(sf, records);
    }
    for (const sf of this.filesWithoutTraits) {
      result.set(sf, []);
    }
    return result;
  }
  adopt(priorRecord) {
    const record = {
      hasPrimaryHandler: priorRecord.hasPrimaryHandler,
      hasWeakHandlers: priorRecord.hasWeakHandlers,
      metaDiagnostics: priorRecord.metaDiagnostics,
      node: priorRecord.node,
      traits: []
    };
    for (const priorTrait of priorRecord.traits) {
      const handler = this.handlersByName.get(priorTrait.handler.name);
      let trait = Trait.pending(handler, priorTrait.detected);
      if (priorTrait.state === TraitState.Analyzed || priorTrait.state === TraitState.Resolved) {
        const symbol = this.makeSymbolForTrait(handler, record.node, priorTrait.analysis);
        trait = trait.toAnalyzed(priorTrait.analysis, priorTrait.analysisDiagnostics, symbol);
        if (trait.analysis !== null && trait.handler.register !== void 0) {
          trait.handler.register(record.node, trait.analysis);
        }
      } else if (priorTrait.state === TraitState.Skipped) {
        trait = trait.toSkipped();
      }
      record.traits.push(trait);
    }
    this.classes.set(record.node, record);
    const sf = record.node.getSourceFile();
    if (!this.fileToClasses.has(sf)) {
      this.fileToClasses.set(sf, /* @__PURE__ */ new Set());
    }
    this.fileToClasses.get(sf).add(record.node);
  }
  scanClassForTraits(clazz) {
    if (!this.compileNonExportedClasses && !this.reflector.isStaticallyExported(clazz)) {
      return null;
    }
    const decorators = this.reflector.getDecoratorsOfDeclaration(clazz);
    return this.detectTraits(clazz, decorators);
  }
  detectTraits(clazz, decorators) {
    let record = this.recordFor(clazz);
    let foundTraits = [];
    for (const handler of this.handlers) {
      const result = handler.detect(clazz, decorators);
      if (result === void 0) {
        continue;
      }
      const isPrimaryHandler = handler.precedence === HandlerPrecedence.PRIMARY;
      const isWeakHandler = handler.precedence === HandlerPrecedence.WEAK;
      const trait = Trait.pending(handler, result);
      foundTraits.push(trait);
      if (record === null) {
        record = {
          node: clazz,
          traits: [trait],
          metaDiagnostics: null,
          hasPrimaryHandler: isPrimaryHandler,
          hasWeakHandlers: isWeakHandler
        };
        this.classes.set(clazz, record);
        const sf = clazz.getSourceFile();
        if (!this.fileToClasses.has(sf)) {
          this.fileToClasses.set(sf, /* @__PURE__ */ new Set());
        }
        this.fileToClasses.get(sf).add(clazz);
      } else {
        if (!isWeakHandler && record.hasWeakHandlers) {
          record.traits = record.traits.filter((field) => field.handler.precedence !== HandlerPrecedence.WEAK);
          record.hasWeakHandlers = false;
        } else if (isWeakHandler && !record.hasWeakHandlers) {
          continue;
        }
        if (isPrimaryHandler && record.hasPrimaryHandler) {
          record.metaDiagnostics = [{
            category: ts15.DiagnosticCategory.Error,
            code: Number("-99" + ErrorCode.DECORATOR_COLLISION),
            file: getSourceFile(clazz),
            start: clazz.getStart(void 0, false),
            length: clazz.getWidth(),
            messageText: "Two incompatible decorators on class"
          }];
          record.traits = foundTraits = [];
          break;
        }
        record.traits.push(trait);
        record.hasPrimaryHandler = record.hasPrimaryHandler || isPrimaryHandler;
      }
    }
    return foundTraits.length > 0 ? foundTraits : null;
  }
  makeSymbolForTrait(handler, decl, analysis) {
    if (analysis === null) {
      return null;
    }
    const symbol = handler.symbol(decl, analysis);
    if (symbol !== null && this.semanticDepGraphUpdater !== null) {
      const isPrimary = handler.precedence === HandlerPrecedence.PRIMARY;
      if (!isPrimary) {
        throw new Error(`AssertionError: ${handler.name} returned a symbol but is not a primary handler.`);
      }
      this.semanticDepGraphUpdater.registerSymbol(symbol);
    }
    return symbol;
  }
  analyzeClass(clazz, preanalyzeQueue) {
    const traits = this.scanClassForTraits(clazz);
    if (traits === null) {
      return;
    }
    for (const trait of traits) {
      const analyze = () => this.analyzeTrait(clazz, trait);
      let preanalysis = null;
      if (preanalyzeQueue !== null && trait.handler.preanalyze !== void 0) {
        try {
          preanalysis = trait.handler.preanalyze(clazz, trait.detected.metadata) || null;
        } catch (err) {
          if (err instanceof FatalDiagnosticError) {
            trait.toAnalyzed(null, [err.toDiagnostic()], null);
            return;
          } else {
            throw err;
          }
        }
      }
      if (preanalysis !== null) {
        preanalyzeQueue.push(preanalysis.then(analyze));
      } else {
        analyze();
      }
    }
  }
  analyzeTrait(clazz, trait) {
    var _a, _b, _c;
    if (trait.state !== TraitState.Pending) {
      throw new Error(`Attempt to analyze trait of ${clazz.name.text} in state ${TraitState[trait.state]} (expected DETECTED)`);
    }
    this.perf.eventCount(PerfEvent.TraitAnalyze);
    let result;
    try {
      result = trait.handler.analyze(clazz, trait.detected.metadata);
    } catch (err) {
      if (err instanceof FatalDiagnosticError) {
        trait.toAnalyzed(null, [err.toDiagnostic()], null);
        return;
      } else {
        throw err;
      }
    }
    const symbol = this.makeSymbolForTrait(trait.handler, clazz, (_a = result.analysis) != null ? _a : null);
    if (this.compilationMode !== CompilationMode.LOCAL && result.analysis !== void 0 && trait.handler.register !== void 0) {
      trait.handler.register(clazz, result.analysis);
    }
    trait = trait.toAnalyzed((_b = result.analysis) != null ? _b : null, (_c = result.diagnostics) != null ? _c : null, symbol);
  }
  resolve() {
    var _a, _b;
    if (this.compilationMode === CompilationMode.LOCAL) {
      return;
    }
    const classes = this.classes.keys();
    for (const clazz of classes) {
      const record = this.classes.get(clazz);
      for (let trait of record.traits) {
        const handler = trait.handler;
        switch (trait.state) {
          case TraitState.Skipped:
            continue;
          case TraitState.Pending:
            throw new Error(`Resolving a trait that hasn't been analyzed: ${clazz.name.text} / ${trait.handler.name}`);
          case TraitState.Resolved:
            throw new Error(`Resolving an already resolved trait`);
        }
        if (trait.analysis === null) {
          continue;
        }
        if (handler.resolve === void 0) {
          trait = trait.toResolved(null, null);
          continue;
        }
        let result;
        try {
          result = handler.resolve(clazz, trait.analysis, trait.symbol);
        } catch (err) {
          if (err instanceof FatalDiagnosticError) {
            trait = trait.toResolved(null, [err.toDiagnostic()]);
            continue;
          } else {
            throw err;
          }
        }
        trait = trait.toResolved((_a = result.data) != null ? _a : null, (_b = result.diagnostics) != null ? _b : null);
        if (result.reexports !== void 0) {
          const fileName = clazz.getSourceFile().fileName;
          if (!this.reexportMap.has(fileName)) {
            this.reexportMap.set(fileName, /* @__PURE__ */ new Map());
          }
          const fileReexports = this.reexportMap.get(fileName);
          for (const reexport of result.reexports) {
            fileReexports.set(reexport.asAlias, [reexport.fromModule, reexport.symbolName]);
          }
        }
      }
    }
  }
  typeCheck(sf, ctx) {
    if (!this.fileToClasses.has(sf)) {
      return;
    }
    for (const clazz of this.fileToClasses.get(sf)) {
      const record = this.classes.get(clazz);
      for (const trait of record.traits) {
        if (trait.state !== TraitState.Resolved) {
          continue;
        } else if (trait.handler.typeCheck === void 0) {
          continue;
        }
        if (trait.resolution !== null) {
          trait.handler.typeCheck(ctx, clazz, trait.analysis, trait.resolution);
        }
      }
    }
  }
  extendedTemplateCheck(sf, extendedTemplateChecker) {
    if (this.compilationMode === CompilationMode.LOCAL) {
      return [];
    }
    const classes = this.fileToClasses.get(sf);
    if (classes === void 0) {
      return [];
    }
    const diagnostics = [];
    for (const clazz of classes) {
      if (!isNamedClassDeclaration(clazz)) {
        continue;
      }
      const record = this.classes.get(clazz);
      for (const trait of record.traits) {
        if (trait.handler.extendedTemplateCheck === void 0) {
          continue;
        }
        diagnostics.push(...trait.handler.extendedTemplateCheck(clazz, extendedTemplateChecker));
      }
    }
    return diagnostics;
  }
  index(ctx) {
    for (const clazz of this.classes.keys()) {
      const record = this.classes.get(clazz);
      for (const trait of record.traits) {
        if (trait.state !== TraitState.Resolved) {
          continue;
        } else if (trait.handler.index === void 0) {
          continue;
        }
        if (trait.resolution !== null) {
          trait.handler.index(ctx, clazz, trait.analysis, trait.resolution);
        }
      }
    }
  }
  xi18n(bundle) {
    for (const clazz of this.classes.keys()) {
      const record = this.classes.get(clazz);
      for (const trait of record.traits) {
        if (trait.state !== TraitState.Analyzed && trait.state !== TraitState.Resolved) {
          continue;
        } else if (trait.handler.xi18n === void 0) {
          continue;
        }
        if (trait.analysis !== null) {
          trait.handler.xi18n(bundle, clazz, trait.analysis);
        }
      }
    }
  }
  updateResources(clazz) {
    if (this.compilationMode === CompilationMode.LOCAL || !this.reflector.isClass(clazz) || !this.classes.has(clazz)) {
      return;
    }
    const record = this.classes.get(clazz);
    for (const trait of record.traits) {
      if (trait.state !== TraitState.Resolved || trait.handler.updateResources === void 0) {
        continue;
      }
      trait.handler.updateResources(clazz, trait.analysis, trait.resolution);
    }
  }
  compile(clazz, constantPool) {
    const original = ts15.getOriginalNode(clazz);
    if (!this.reflector.isClass(clazz) || !this.reflector.isClass(original) || !this.classes.has(original)) {
      return null;
    }
    const record = this.classes.get(original);
    let res = [];
    for (const trait of record.traits) {
      let compileRes;
      if (this.compilationMode === CompilationMode.LOCAL) {
        if (trait.state !== TraitState.Analyzed || trait.analysis === null || containsErrors(trait.analysisDiagnostics)) {
          continue;
        }
        compileRes = trait.handler.compileLocal(clazz, trait.analysis, constantPool);
      } else {
        if (trait.state !== TraitState.Resolved || containsErrors(trait.analysisDiagnostics) || containsErrors(trait.resolveDiagnostics)) {
          continue;
        }
        if (this.compilationMode === CompilationMode.PARTIAL && trait.handler.compilePartial !== void 0) {
          compileRes = trait.handler.compilePartial(clazz, trait.analysis, trait.resolution);
        } else {
          compileRes = trait.handler.compileFull(clazz, trait.analysis, trait.resolution, constantPool);
        }
      }
      const compileMatchRes = compileRes;
      if (Array.isArray(compileMatchRes)) {
        for (const result of compileMatchRes) {
          if (!res.some((r) => r.name === result.name)) {
            res.push(result);
          }
        }
      } else if (!res.some((result) => result.name === compileMatchRes.name)) {
        res.push(compileMatchRes);
      }
    }
    this.dtsTransforms.getIvyDeclarationTransform(original.getSourceFile()).addFields(original, res);
    return res.length > 0 ? res : null;
  }
  decoratorsFor(node) {
    const original = ts15.getOriginalNode(node);
    if (!this.reflector.isClass(original) || !this.classes.has(original)) {
      return [];
    }
    const record = this.classes.get(original);
    const decorators = [];
    for (const trait of record.traits) {
      if (this.compilationMode !== CompilationMode.LOCAL && trait.state !== TraitState.Resolved) {
        continue;
      }
      if (trait.detected.trigger !== null && ts15.isDecorator(trait.detected.trigger)) {
        decorators.push(trait.detected.trigger);
      }
    }
    return decorators;
  }
  get diagnostics() {
    var _a;
    const diagnostics = [];
    for (const clazz of this.classes.keys()) {
      const record = this.classes.get(clazz);
      if (record.metaDiagnostics !== null) {
        diagnostics.push(...record.metaDiagnostics);
      }
      for (const trait of record.traits) {
        if ((trait.state === TraitState.Analyzed || trait.state === TraitState.Resolved) && trait.analysisDiagnostics !== null) {
          diagnostics.push(...trait.analysisDiagnostics);
        }
        if (trait.state === TraitState.Resolved) {
          diagnostics.push(...(_a = trait.resolveDiagnostics) != null ? _a : []);
        }
      }
    }
    return diagnostics;
  }
  get exportStatements() {
    return this.reexportMap;
  }
};
function containsErrors(diagnostics) {
  return diagnostics !== null && diagnostics.some((diag) => diag.category === ts15.DiagnosticCategory.Error);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/transform/src/declaration.mjs
import ts17 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/transform/src/utils.mjs
import ts16 from "typescript";
function addImports(importManager, sf, extraStatements = []) {
  const addedImports = importManager.getAllImports(sf.fileName).map((i) => {
    const qualifier = ts16.factory.createIdentifier(i.qualifier.text);
    const importClause = ts16.factory.createImportClause(
      false,
      void 0,
      ts16.factory.createNamespaceImport(qualifier)
    );
    const decl = ts16.factory.createImportDeclaration(
      void 0,
      importClause,
      ts16.factory.createStringLiteral(i.specifier)
    );
    ts16.setOriginalNode(i.qualifier, decl);
    return decl;
  });
  const existingImports = sf.statements.filter((stmt) => isImportStatement(stmt));
  const body = sf.statements.filter((stmt) => !isImportStatement(stmt));
  if (addedImports.length > 0) {
    const fileoverviewAnchorStmt = ts16.factory.createNotEmittedStatement(sf);
    return ts16.factory.updateSourceFile(sf, ts16.factory.createNodeArray([
      fileoverviewAnchorStmt,
      ...existingImports,
      ...addedImports,
      ...extraStatements,
      ...body
    ]));
  }
  return sf;
}
function isImportStatement(stmt) {
  return ts16.isImportDeclaration(stmt) || ts16.isImportEqualsDeclaration(stmt) || ts16.isNamespaceImport(stmt);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/transform/src/declaration.mjs
var DtsTransformRegistry = class {
  constructor() {
    this.ivyDeclarationTransforms = /* @__PURE__ */ new Map();
  }
  getIvyDeclarationTransform(sf) {
    if (!this.ivyDeclarationTransforms.has(sf)) {
      this.ivyDeclarationTransforms.set(sf, new IvyDeclarationDtsTransform());
    }
    return this.ivyDeclarationTransforms.get(sf);
  }
  getAllTransforms(sf) {
    if (!sf.isDeclarationFile) {
      return null;
    }
    const originalSf = ts17.getOriginalNode(sf);
    let transforms = null;
    if (this.ivyDeclarationTransforms.has(originalSf)) {
      transforms = [];
      transforms.push(this.ivyDeclarationTransforms.get(originalSf));
    }
    return transforms;
  }
};
function declarationTransformFactory(transformRegistry, reflector, refEmitter, importRewriter, importPrefix) {
  return (context) => {
    const transformer = new DtsTransformer(context, reflector, refEmitter, importRewriter, importPrefix);
    return (fileOrBundle) => {
      if (ts17.isBundle(fileOrBundle)) {
        return fileOrBundle;
      }
      const transforms = transformRegistry.getAllTransforms(fileOrBundle);
      if (transforms === null) {
        return fileOrBundle;
      }
      return transformer.transform(fileOrBundle, transforms);
    };
  };
}
var DtsTransformer = class {
  constructor(ctx, reflector, refEmitter, importRewriter, importPrefix) {
    this.ctx = ctx;
    this.reflector = reflector;
    this.refEmitter = refEmitter;
    this.importRewriter = importRewriter;
    this.importPrefix = importPrefix;
  }
  transform(sf, transforms) {
    const imports = new ImportManager(this.importRewriter, this.importPrefix);
    const visitor = (node) => {
      if (ts17.isClassDeclaration(node)) {
        return this.transformClassDeclaration(node, transforms, imports);
      } else if (ts17.isFunctionDeclaration(node)) {
        return this.transformFunctionDeclaration(node, transforms, imports);
      } else {
        return ts17.visitEachChild(node, visitor, this.ctx);
      }
    };
    sf = ts17.visitNode(sf, visitor, ts17.isSourceFile) || sf;
    return addImports(imports, sf);
  }
  transformClassDeclaration(clazz, transforms, imports) {
    let elements = clazz.members;
    let elementsChanged = false;
    for (const transform of transforms) {
      if (transform.transformClassElement !== void 0) {
        for (let i = 0; i < elements.length; i++) {
          const res = transform.transformClassElement(elements[i], imports);
          if (res !== elements[i]) {
            if (!elementsChanged) {
              elements = [...elements];
              elementsChanged = true;
            }
            elements[i] = res;
          }
        }
      }
    }
    let newClazz = clazz;
    for (const transform of transforms) {
      if (transform.transformClass !== void 0) {
        const inputMembers = clazz === newClazz ? elements : newClazz.members;
        newClazz = transform.transformClass(newClazz, inputMembers, this.reflector, this.refEmitter, imports);
      }
    }
    if (elementsChanged && clazz === newClazz) {
      newClazz = ts17.factory.updateClassDeclaration(
        clazz,
        clazz.modifiers,
        clazz.name,
        clazz.typeParameters,
        clazz.heritageClauses,
        elements
      );
    }
    return newClazz;
  }
  transformFunctionDeclaration(declaration, transforms, imports) {
    let newDecl = declaration;
    for (const transform of transforms) {
      if (transform.transformFunctionDeclaration !== void 0) {
        newDecl = transform.transformFunctionDeclaration(newDecl, imports);
      }
    }
    return newDecl;
  }
};
var IvyDeclarationDtsTransform = class {
  constructor() {
    this.declarationFields = /* @__PURE__ */ new Map();
  }
  addFields(decl, fields) {
    this.declarationFields.set(decl, fields);
  }
  transformClass(clazz, members, reflector, refEmitter, imports) {
    const original = ts17.getOriginalNode(clazz);
    if (!this.declarationFields.has(original)) {
      return clazz;
    }
    const fields = this.declarationFields.get(original);
    const newMembers = fields.map((decl) => {
      const modifiers = [ts17.factory.createModifier(ts17.SyntaxKind.StaticKeyword)];
      const typeRef = translateType(decl.type, original.getSourceFile(), reflector, refEmitter, imports);
      markForEmitAsSingleLine(typeRef);
      return ts17.factory.createPropertyDeclaration(
        modifiers,
        decl.name,
        void 0,
        typeRef,
        void 0
      );
    });
    return ts17.factory.updateClassDeclaration(
      clazz,
      clazz.modifiers,
      clazz.name,
      clazz.typeParameters,
      clazz.heritageClauses,
      [...members, ...newMembers]
    );
  }
};
function markForEmitAsSingleLine(node) {
  ts17.setEmitFlags(node, ts17.EmitFlags.SingleLine);
  ts17.forEachChild(node, markForEmitAsSingleLine);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/transform/src/transform.mjs
import { ConstantPool } from "@angular/compiler";
import ts19 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/util/src/visitor.mjs
import ts18 from "typescript";
function visit(node, visitor, context) {
  return visitor._visit(node, context);
}
var Visitor = class {
  constructor() {
    this._before = /* @__PURE__ */ new Map();
    this._after = /* @__PURE__ */ new Map();
  }
  _visitListEntryNode(node, visitor) {
    const result = visitor(node);
    if (result.before !== void 0) {
      this._before.set(result.node, result.before);
    }
    if (result.after !== void 0) {
      this._after.set(result.node, result.after);
    }
    return result.node;
  }
  visitOtherNode(node) {
    return node;
  }
  _visit(node, context) {
    let visitedNode = null;
    node = ts18.visitEachChild(node, (child) => child && this._visit(child, context), context);
    if (ts18.isClassDeclaration(node)) {
      visitedNode = this._visitListEntryNode(node, (node2) => this.visitClassDeclaration(node2));
    } else {
      visitedNode = this.visitOtherNode(node);
    }
    if (visitedNode && (ts18.isBlock(visitedNode) || ts18.isSourceFile(visitedNode))) {
      visitedNode = this._maybeProcessStatements(visitedNode);
    }
    return visitedNode;
  }
  _maybeProcessStatements(node) {
    if (node.statements.every((stmt) => !this._before.has(stmt) && !this._after.has(stmt))) {
      return node;
    }
    const newStatements = [];
    node.statements.forEach((stmt) => {
      if (this._before.has(stmt)) {
        newStatements.push(...this._before.get(stmt));
        this._before.delete(stmt);
      }
      newStatements.push(stmt);
      if (this._after.has(stmt)) {
        newStatements.push(...this._after.get(stmt));
        this._after.delete(stmt);
      }
    });
    const statementsArray = ts18.factory.createNodeArray(newStatements, node.statements.hasTrailingComma);
    if (ts18.isBlock(node)) {
      return ts18.factory.updateBlock(node, statementsArray);
    } else {
      return ts18.factory.updateSourceFile(node, statementsArray, node.isDeclarationFile, node.referencedFiles, node.typeReferenceDirectives, node.hasNoDefaultLib, node.libReferenceDirectives);
    }
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/transform/src/transform.mjs
var NO_DECORATORS = /* @__PURE__ */ new Set();
var CLOSURE_FILE_OVERVIEW_REGEXP = /\s+@fileoverview\s+/i;
function ivyTransformFactory(compilation, reflector, importRewriter, defaultImportTracker, perf, isCore, isClosureCompilerEnabled) {
  const recordWrappedNode = createRecorderFn(defaultImportTracker);
  return (context) => {
    return (file) => {
      return perf.inPhase(PerfPhase.Compile, () => transformIvySourceFile(compilation, context, reflector, importRewriter, file, isCore, isClosureCompilerEnabled, recordWrappedNode));
    };
  };
}
var IvyCompilationVisitor = class extends Visitor {
  constructor(compilation, constantPool) {
    super();
    this.compilation = compilation;
    this.constantPool = constantPool;
    this.classCompilationMap = /* @__PURE__ */ new Map();
    this.deferrableImports = /* @__PURE__ */ new Set();
  }
  visitClassDeclaration(node) {
    const result = this.compilation.compile(node, this.constantPool);
    if (result !== null) {
      this.classCompilationMap.set(node, result);
      for (const classResult of result) {
        if (classResult.deferrableImports !== null && classResult.deferrableImports.size > 0) {
          classResult.deferrableImports.forEach((importDecl) => this.deferrableImports.add(importDecl));
        }
      }
    }
    return { node };
  }
};
var IvyTransformationVisitor = class extends Visitor {
  constructor(compilation, classCompilationMap, reflector, importManager, recordWrappedNodeExpr, isClosureCompilerEnabled, isCore, deferrableImports) {
    super();
    this.compilation = compilation;
    this.classCompilationMap = classCompilationMap;
    this.reflector = reflector;
    this.importManager = importManager;
    this.recordWrappedNodeExpr = recordWrappedNodeExpr;
    this.isClosureCompilerEnabled = isClosureCompilerEnabled;
    this.isCore = isCore;
    this.deferrableImports = deferrableImports;
  }
  visitClassDeclaration(node) {
    if (!this.classCompilationMap.has(node)) {
      return { node };
    }
    const translateOptions = {
      recordWrappedNode: this.recordWrappedNodeExpr,
      annotateForClosureCompiler: this.isClosureCompilerEnabled
    };
    const statements = [];
    const members = [...node.members];
    for (const field of this.classCompilationMap.get(node)) {
      if (field.initializer === null) {
        continue;
      }
      const exprNode = translateExpression(field.initializer, this.importManager, translateOptions);
      const property = ts19.factory.createPropertyDeclaration([ts19.factory.createToken(ts19.SyntaxKind.StaticKeyword)], field.name, void 0, void 0, exprNode);
      if (this.isClosureCompilerEnabled) {
        ts19.addSyntheticLeadingComment(
          property,
          ts19.SyntaxKind.MultiLineCommentTrivia,
          "* @nocollapse ",
          false
        );
      }
      field.statements.map((stmt) => translateStatement(stmt, this.importManager, translateOptions)).forEach((stmt) => statements.push(stmt));
      members.push(property);
    }
    const filteredDecorators = maybeFilterDecorator(ts19.getDecorators(node), this.compilation.decoratorsFor(node));
    const nodeModifiers = ts19.getModifiers(node);
    let updatedModifiers;
    if ((filteredDecorators == null ? void 0 : filteredDecorators.length) || (nodeModifiers == null ? void 0 : nodeModifiers.length)) {
      updatedModifiers = [...filteredDecorators || [], ...nodeModifiers || []];
    }
    node = ts19.factory.updateClassDeclaration(
      node,
      updatedModifiers,
      node.name,
      node.typeParameters,
      node.heritageClauses || [],
      members.map((member) => this._stripAngularDecorators(member))
    );
    return { node, after: statements };
  }
  visitOtherNode(node) {
    if (ts19.isImportDeclaration(node) && this.deferrableImports.has(node)) {
      return null;
    }
    return node;
  }
  _angularCoreDecorators(decl) {
    const decorators = this.reflector.getDecoratorsOfDeclaration(decl);
    if (decorators === null) {
      return NO_DECORATORS;
    }
    const coreDecorators = decorators.filter((dec) => this.isCore || isFromAngularCore(dec)).map((dec) => dec.node);
    if (coreDecorators.length > 0) {
      return new Set(coreDecorators);
    } else {
      return NO_DECORATORS;
    }
  }
  _nonCoreDecoratorsOnly(node) {
    const decorators = ts19.getDecorators(node);
    if (decorators === void 0) {
      return void 0;
    }
    const coreDecorators = this._angularCoreDecorators(node);
    if (coreDecorators.size === decorators.length) {
      return void 0;
    } else if (coreDecorators.size === 0) {
      return nodeArrayFromDecoratorsArray(decorators);
    }
    const filtered = decorators.filter((dec) => !coreDecorators.has(dec));
    if (filtered.length === 0) {
      return void 0;
    }
    return nodeArrayFromDecoratorsArray(filtered);
  }
  _stripAngularDecorators(node) {
    const modifiers = ts19.canHaveModifiers(node) ? ts19.getModifiers(node) : void 0;
    const nonCoreDecorators = ts19.canHaveDecorators(node) ? this._nonCoreDecoratorsOnly(node) : void 0;
    const combinedModifiers = [...nonCoreDecorators || [], ...modifiers || []];
    if (ts19.isParameter(node)) {
      node = ts19.factory.updateParameterDeclaration(node, combinedModifiers, node.dotDotDotToken, node.name, node.questionToken, node.type, node.initializer);
    } else if (ts19.isMethodDeclaration(node)) {
      node = ts19.factory.updateMethodDeclaration(node, combinedModifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters, node.parameters, node.type, node.body);
    } else if (ts19.isPropertyDeclaration(node)) {
      node = ts19.factory.updatePropertyDeclaration(node, combinedModifiers, node.name, node.questionToken, node.type, node.initializer);
    } else if (ts19.isGetAccessor(node)) {
      node = ts19.factory.updateGetAccessorDeclaration(node, combinedModifiers, node.name, node.parameters, node.type, node.body);
    } else if (ts19.isSetAccessor(node)) {
      node = ts19.factory.updateSetAccessorDeclaration(node, combinedModifiers, node.name, node.parameters, node.body);
    } else if (ts19.isConstructorDeclaration(node)) {
      const parameters = node.parameters.map((param) => this._stripAngularDecorators(param));
      node = ts19.factory.updateConstructorDeclaration(node, modifiers, parameters, node.body);
    }
    return node;
  }
};
function transformIvySourceFile(compilation, context, reflector, importRewriter, file, isCore, isClosureCompilerEnabled, recordWrappedNode) {
  const constantPool = new ConstantPool(isClosureCompilerEnabled);
  const importManager = new ImportManager(importRewriter);
  const compilationVisitor = new IvyCompilationVisitor(compilation, constantPool);
  visit(file, compilationVisitor, context);
  const transformationVisitor = new IvyTransformationVisitor(compilation, compilationVisitor.classCompilationMap, reflector, importManager, recordWrappedNode, isClosureCompilerEnabled, isCore, compilationVisitor.deferrableImports);
  let sf = visit(file, transformationVisitor, context);
  const downlevelTranslatedCode = getLocalizeCompileTarget(context) < ts19.ScriptTarget.ES2015;
  const constants = constantPool.statements.map((stmt) => translateStatement(stmt, importManager, {
    recordWrappedNode,
    downlevelTaggedTemplates: downlevelTranslatedCode,
    downlevelVariableDeclarations: downlevelTranslatedCode,
    annotateForClosureCompiler: isClosureCompilerEnabled
  }));
  const fileOverviewMeta = isClosureCompilerEnabled ? getFileOverviewComment(sf.statements) : null;
  sf = addImports(importManager, sf, constants);
  if (fileOverviewMeta !== null) {
    setFileOverviewComment(sf, fileOverviewMeta);
  }
  return sf;
}
function getLocalizeCompileTarget(context) {
  const target = context.getCompilerOptions().target || ts19.ScriptTarget.ES2015;
  return target !== ts19.ScriptTarget.JSON ? target : ts19.ScriptTarget.ES2015;
}
function getFileOverviewComment(statements) {
  if (statements.length > 0) {
    const host = statements[0];
    let trailing = false;
    let comments = ts19.getSyntheticLeadingComments(host);
    if (!comments || comments.length === 0) {
      trailing = true;
      comments = ts19.getSyntheticTrailingComments(host);
    }
    if (comments && comments.length > 0 && CLOSURE_FILE_OVERVIEW_REGEXP.test(comments[0].text)) {
      return { comments, host, trailing };
    }
  }
  return null;
}
function setFileOverviewComment(sf, fileoverview) {
  const { comments, host, trailing } = fileoverview;
  if (sf.statements.length > 0 && host !== sf.statements[0]) {
    if (trailing) {
      ts19.setSyntheticTrailingComments(host, void 0);
    } else {
      ts19.setSyntheticLeadingComments(host, void 0);
    }
    ts19.setSyntheticLeadingComments(sf.statements[0], comments);
  }
}
function maybeFilterDecorator(decorators, toRemove) {
  if (decorators === void 0) {
    return void 0;
  }
  const filtered = decorators.filter((dec) => toRemove.find((decToRemove) => ts19.getOriginalNode(dec) === decToRemove) === void 0);
  if (filtered.length === 0) {
    return void 0;
  }
  return ts19.factory.createNodeArray(filtered);
}
function isFromAngularCore(decorator) {
  return decorator.import !== null && decorator.import.from === "@angular/core";
}
function createRecorderFn(defaultImportTracker) {
  return (node) => {
    const importDecl = getDefaultImportDeclaration(node);
    if (importDecl !== null) {
      defaultImportTracker.recordUsedImport(importDecl);
    }
  };
}
function nodeArrayFromDecoratorsArray(decorators) {
  const array = ts19.factory.createNodeArray(decorators);
  if (array.length > 0) {
    array.pos = decorators[0].pos;
    array.end = decorators[decorators.length - 1].end;
  }
  return array;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/directive/src/handler.mjs
import { compileClassMetadata, compileDeclareClassMetadata, compileDeclareDirectiveFromMetadata, compileDirectiveFromMetadata, FactoryTarget, makeBindingParser, WrappedNodeExpr as WrappedNodeExpr5 } from "@angular/compiler";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/directive/src/shared.mjs
import { createMayBeForwardRefExpression, emitDistinctChangesOnlyDefaultValue, ExternalExpr as ExternalExpr4, getSafePropertyAccessString, parseHostBindings, verifyHostBindings, WrappedNodeExpr as WrappedNodeExpr4 } from "@angular/compiler";
import ts20 from "typescript";
var EMPTY_OBJECT = {};
var QUERY_TYPES = /* @__PURE__ */ new Set([
  "ContentChild",
  "ContentChildren",
  "ViewChild",
  "ViewChildren"
]);
function extractDirectiveMetadata(clazz, decorator, reflector, evaluator, refEmitter, referencesRegistry, isCore, annotateForClosureCompiler, defaultSelector = null) {
  let directive;
  if (decorator === null || decorator.args === null || decorator.args.length === 0) {
    directive = /* @__PURE__ */ new Map();
  } else if (decorator.args.length !== 1) {
    throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, `Incorrect number of arguments to @${decorator.name} decorator`);
  } else {
    const meta = unwrapExpression(decorator.args[0]);
    if (!ts20.isObjectLiteralExpression(meta)) {
      throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARG_NOT_LITERAL, meta, `@${decorator.name} argument must be an object literal`);
    }
    directive = reflectObjectLiteral(meta);
  }
  if (directive.has("jit")) {
    return void 0;
  }
  const members = reflector.getMembersOfClass(clazz);
  const decoratedElements = members.filter((member) => !member.isStatic && member.decorators !== null);
  const coreModule = isCore ? void 0 : "@angular/core";
  const inputsFromMeta = parseInputsArray(clazz, directive, evaluator, reflector, refEmitter);
  const inputsFromFields = parseInputFields(clazz, filterToMembersWithDecorator(decoratedElements, "Input", coreModule), evaluator, reflector, refEmitter);
  const inputs = ClassPropertyMapping.fromMappedObject({ ...inputsFromMeta, ...inputsFromFields });
  const outputsFromMeta = parseOutputsArray(directive, evaluator);
  const outputsFromFields = parseOutputFields(filterToMembersWithDecorator(decoratedElements, "Output", coreModule), evaluator);
  const outputs = ClassPropertyMapping.fromMappedObject({ ...outputsFromMeta, ...outputsFromFields });
  const contentChildFromFields = queriesFromFields(filterToMembersWithDecorator(decoratedElements, "ContentChild", coreModule), reflector, evaluator);
  const contentChildrenFromFields = queriesFromFields(filterToMembersWithDecorator(decoratedElements, "ContentChildren", coreModule), reflector, evaluator);
  const queries = [...contentChildFromFields, ...contentChildrenFromFields];
  const viewChildFromFields = queriesFromFields(filterToMembersWithDecorator(decoratedElements, "ViewChild", coreModule), reflector, evaluator);
  const viewChildrenFromFields = queriesFromFields(filterToMembersWithDecorator(decoratedElements, "ViewChildren", coreModule), reflector, evaluator);
  const viewQueries = [...viewChildFromFields, ...viewChildrenFromFields];
  if (directive.has("queries")) {
    const queriesFromDecorator = extractQueriesFromDecorator(directive.get("queries"), reflector, evaluator, isCore);
    queries.push(...queriesFromDecorator.content);
    viewQueries.push(...queriesFromDecorator.view);
  }
  let selector = defaultSelector;
  if (directive.has("selector")) {
    const expr = directive.get("selector");
    const resolved = evaluator.evaluate(expr);
    if (typeof resolved !== "string") {
      throw createValueHasWrongTypeError(expr, resolved, `selector must be a string`);
    }
    selector = resolved === "" ? defaultSelector : resolved;
    if (!selector) {
      throw new FatalDiagnosticError(ErrorCode.DIRECTIVE_MISSING_SELECTOR, expr, `Directive ${clazz.name.text} has no selector, please add it!`);
    }
  }
  const host = extractHostBindings(decoratedElements, evaluator, coreModule, directive);
  const providers = directive.has("providers") ? new WrappedNodeExpr4(annotateForClosureCompiler ? wrapFunctionExpressionsInParens(directive.get("providers")) : directive.get("providers")) : null;
  const usesOnChanges = members.some((member) => !member.isStatic && member.kind === ClassMemberKind.Method && member.name === "ngOnChanges");
  let exportAs = null;
  if (directive.has("exportAs")) {
    const expr = directive.get("exportAs");
    const resolved = evaluator.evaluate(expr);
    if (typeof resolved !== "string") {
      throw createValueHasWrongTypeError(expr, resolved, `exportAs must be a string`);
    }
    exportAs = resolved.split(",").map((part) => part.trim());
  }
  const rawCtorDeps = getConstructorDependencies(clazz, reflector, isCore);
  const ctorDeps = selector !== null ? validateConstructorDependencies(clazz, rawCtorDeps) : unwrapConstructorDependencies(rawCtorDeps);
  const isStructural = ctorDeps !== null && ctorDeps !== "invalid" && ctorDeps.some((dep) => dep.token instanceof ExternalExpr4 && dep.token.value.moduleName === "@angular/core" && dep.token.value.name === "TemplateRef");
  let isStandalone = false;
  if (directive.has("standalone")) {
    const expr = directive.get("standalone");
    const resolved = evaluator.evaluate(expr);
    if (typeof resolved !== "boolean") {
      throw createValueHasWrongTypeError(expr, resolved, `standalone flag must be a boolean`);
    }
    isStandalone = resolved;
  }
  let isSignal = false;
  if (directive.has("signals")) {
    const expr = directive.get("signals");
    const resolved = evaluator.evaluate(expr);
    if (typeof resolved !== "boolean") {
      throw createValueHasWrongTypeError(expr, resolved, `signals flag must be a boolean`);
    }
    isSignal = resolved;
  }
  const usesInheritance = reflector.hasBaseClass(clazz);
  const sourceFile = clazz.getSourceFile();
  const type = wrapTypeReference(reflector, clazz);
  const rawHostDirectives = directive.get("hostDirectives") || null;
  const hostDirectives = rawHostDirectives === null ? null : extractHostDirectives(rawHostDirectives, evaluator);
  if (hostDirectives !== null) {
    referencesRegistry.add(clazz, ...hostDirectives.map((hostDir) => hostDir.directive));
  }
  const metadata = {
    name: clazz.name.text,
    deps: ctorDeps,
    host,
    lifecycle: {
      usesOnChanges
    },
    inputs: inputs.toJointMappedObject(toR3InputMetadata),
    outputs: outputs.toDirectMappedObject(),
    queries,
    viewQueries,
    selector,
    fullInheritance: false,
    type,
    typeArgumentCount: reflector.getGenericArityOfClass(clazz) || 0,
    typeSourceSpan: createSourceSpan(clazz.name),
    usesInheritance,
    exportAs,
    providers,
    isStandalone,
    isSignal,
    hostDirectives: (hostDirectives == null ? void 0 : hostDirectives.map((hostDir) => toHostDirectiveMetadata(hostDir, sourceFile, refEmitter))) || null
  };
  return {
    decorator: directive,
    metadata,
    inputs,
    outputs,
    isStructural,
    hostDirectives,
    rawHostDirectives
  };
}
function extractQueryMetadata(exprNode, name, args, propertyName, reflector, evaluator) {
  if (args.length === 0) {
    throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, exprNode, `@${name} must have arguments`);
  }
  const first = name === "ViewChild" || name === "ContentChild";
  const forwardReferenceTarget = tryUnwrapForwardRef(args[0], reflector);
  const node = forwardReferenceTarget != null ? forwardReferenceTarget : args[0];
  const arg = evaluator.evaluate(node);
  let isStatic = false;
  let predicate = null;
  if (arg instanceof Reference || arg instanceof DynamicValue) {
    predicate = createMayBeForwardRefExpression(new WrappedNodeExpr4(node), forwardReferenceTarget !== null ? 2 : 0);
  } else if (typeof arg === "string") {
    predicate = [arg];
  } else if (isStringArrayOrDie(arg, `@${name} predicate`, node)) {
    predicate = arg;
  } else {
    throw createValueHasWrongTypeError(node, arg, `@${name} predicate cannot be interpreted`);
  }
  let read = null;
  let descendants = name !== "ContentChildren";
  let emitDistinctChangesOnly = emitDistinctChangesOnlyDefaultValue;
  if (args.length === 2) {
    const optionsExpr = unwrapExpression(args[1]);
    if (!ts20.isObjectLiteralExpression(optionsExpr)) {
      throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARG_NOT_LITERAL, optionsExpr, `@${name} options must be an object literal`);
    }
    const options = reflectObjectLiteral(optionsExpr);
    if (options.has("read")) {
      read = new WrappedNodeExpr4(options.get("read"));
    }
    if (options.has("descendants")) {
      const descendantsExpr = options.get("descendants");
      const descendantsValue = evaluator.evaluate(descendantsExpr);
      if (typeof descendantsValue !== "boolean") {
        throw createValueHasWrongTypeError(descendantsExpr, descendantsValue, `@${name} options.descendants must be a boolean`);
      }
      descendants = descendantsValue;
    }
    if (options.has("emitDistinctChangesOnly")) {
      const emitDistinctChangesOnlyExpr = options.get("emitDistinctChangesOnly");
      const emitDistinctChangesOnlyValue = evaluator.evaluate(emitDistinctChangesOnlyExpr);
      if (typeof emitDistinctChangesOnlyValue !== "boolean") {
        throw createValueHasWrongTypeError(emitDistinctChangesOnlyExpr, emitDistinctChangesOnlyValue, `@${name} options.emitDistinctChangesOnly must be a boolean`);
      }
      emitDistinctChangesOnly = emitDistinctChangesOnlyValue;
    }
    if (options.has("static")) {
      const staticValue = evaluator.evaluate(options.get("static"));
      if (typeof staticValue !== "boolean") {
        throw createValueHasWrongTypeError(node, staticValue, `@${name} options.static must be a boolean`);
      }
      isStatic = staticValue;
    }
  } else if (args.length > 2) {
    throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, node, `@${name} has too many arguments`);
  }
  return {
    propertyName,
    predicate,
    first,
    descendants,
    read,
    static: isStatic,
    emitDistinctChangesOnly
  };
}
function extractHostBindings(members, evaluator, coreModule, metadata) {
  let bindings;
  if (metadata && metadata.has("host")) {
    bindings = evaluateHostExpressionBindings(metadata.get("host"), evaluator);
  } else {
    bindings = parseHostBindings({});
  }
  filterToMembersWithDecorator(members, "HostBinding", coreModule).forEach(({ member, decorators }) => {
    decorators.forEach((decorator) => {
      let hostPropertyName = member.name;
      if (decorator.args !== null && decorator.args.length > 0) {
        if (decorator.args.length !== 1) {
          throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, `@HostBinding can have at most one argument, got ${decorator.args.length} argument(s)`);
        }
        const resolved = evaluator.evaluate(decorator.args[0]);
        if (typeof resolved !== "string") {
          throw createValueHasWrongTypeError(decorator.node, resolved, `@HostBinding's argument must be a string`);
        }
        hostPropertyName = resolved;
      }
      bindings.properties[hostPropertyName] = getSafePropertyAccessString("this", member.name);
    });
  });
  filterToMembersWithDecorator(members, "HostListener", coreModule).forEach(({ member, decorators }) => {
    decorators.forEach((decorator) => {
      let eventName = member.name;
      let args = [];
      if (decorator.args !== null && decorator.args.length > 0) {
        if (decorator.args.length > 2) {
          throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, decorator.args[2], `@HostListener can have at most two arguments`);
        }
        const resolved = evaluator.evaluate(decorator.args[0]);
        if (typeof resolved !== "string") {
          throw createValueHasWrongTypeError(decorator.args[0], resolved, `@HostListener's event name argument must be a string`);
        }
        eventName = resolved;
        if (decorator.args.length === 2) {
          const expression = decorator.args[1];
          const resolvedArgs = evaluator.evaluate(decorator.args[1]);
          if (!isStringArrayOrDie(resolvedArgs, "@HostListener.args", expression)) {
            throw createValueHasWrongTypeError(decorator.args[1], resolvedArgs, `@HostListener's second argument must be a string array`);
          }
          args = resolvedArgs;
        }
      }
      bindings.listeners[eventName] = `${member.name}(${args.join(",")})`;
    });
  });
  return bindings;
}
function extractQueriesFromDecorator(queryData, reflector, evaluator, isCore) {
  const content = [], view = [];
  if (!ts20.isObjectLiteralExpression(queryData)) {
    throw new FatalDiagnosticError(ErrorCode.VALUE_HAS_WRONG_TYPE, queryData, "Decorator queries metadata must be an object literal");
  }
  reflectObjectLiteral(queryData).forEach((queryExpr, propertyName) => {
    queryExpr = unwrapExpression(queryExpr);
    if (!ts20.isNewExpression(queryExpr)) {
      throw new FatalDiagnosticError(ErrorCode.VALUE_HAS_WRONG_TYPE, queryData, "Decorator query metadata must be an instance of a query type");
    }
    const queryType = ts20.isPropertyAccessExpression(queryExpr.expression) ? queryExpr.expression.name : queryExpr.expression;
    if (!ts20.isIdentifier(queryType)) {
      throw new FatalDiagnosticError(ErrorCode.VALUE_HAS_WRONG_TYPE, queryData, "Decorator query metadata must be an instance of a query type");
    }
    const type = reflector.getImportOfIdentifier(queryType);
    if (type === null || !isCore && type.from !== "@angular/core" || !QUERY_TYPES.has(type.name)) {
      throw new FatalDiagnosticError(ErrorCode.VALUE_HAS_WRONG_TYPE, queryData, "Decorator query metadata must be an instance of a query type");
    }
    const query = extractQueryMetadata(queryExpr, type.name, queryExpr.arguments || [], propertyName, reflector, evaluator);
    if (type.name.startsWith("Content")) {
      content.push(query);
    } else {
      view.push(query);
    }
  });
  return { content, view };
}
function parseFieldStringArrayValue(directive, field, evaluator) {
  if (!directive.has(field)) {
    return null;
  }
  const expression = directive.get(field);
  const value = evaluator.evaluate(expression);
  if (!isStringArrayOrDie(value, field, expression)) {
    throw createValueHasWrongTypeError(expression, value, `Failed to resolve @Directive.${field} to a string array`);
  }
  return value;
}
function isStringArrayOrDie(value, name, node) {
  if (!Array.isArray(value)) {
    return false;
  }
  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== "string") {
      throw createValueHasWrongTypeError(node, value[i], `Failed to resolve ${name} at position ${i} to a string`);
    }
  }
  return true;
}
function queriesFromFields(fields, reflector, evaluator) {
  return fields.map(({ member, decorators }) => {
    const decorator = decorators[0];
    const node = member.node || decorator.node;
    if (member.decorators.some((v) => v.name === "Input")) {
      throw new FatalDiagnosticError(ErrorCode.DECORATOR_COLLISION, node, "Cannot combine @Input decorators with query decorators");
    }
    if (decorators.length !== 1) {
      throw new FatalDiagnosticError(ErrorCode.DECORATOR_COLLISION, node, "Cannot have multiple query decorators on the same class member");
    } else if (!isPropertyTypeMember(member)) {
      throw new FatalDiagnosticError(ErrorCode.DECORATOR_UNEXPECTED, node, "Query decorator must go on a property-type member");
    }
    return extractQueryMetadata(node, decorator.name, decorator.args || [], member.name, reflector, evaluator);
  });
}
function isPropertyTypeMember(member) {
  return member.kind === ClassMemberKind.Getter || member.kind === ClassMemberKind.Setter || member.kind === ClassMemberKind.Property;
}
function parseMappingStringArray(values) {
  return values.reduce((results, value) => {
    if (typeof value !== "string") {
      throw new Error("Mapping value must be a string");
    }
    const [bindingPropertyName, fieldName] = parseMappingString(value);
    results[fieldName] = bindingPropertyName;
    return results;
  }, {});
}
function parseMappingString(value) {
  const [fieldName, bindingPropertyName] = value.split(":", 2).map((str) => str.trim());
  return [bindingPropertyName != null ? bindingPropertyName : fieldName, fieldName];
}
function parseDecoratedFields(fields, evaluator, callback) {
  for (const field of fields) {
    const fieldName = field.member.name;
    for (const decorator of field.decorators) {
      if (decorator.args != null && decorator.args.length > 1) {
        throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, `@${decorator.name} can have at most one argument, got ${decorator.args.length} argument(s)`);
      }
      const value = decorator.args != null && decorator.args.length > 0 ? evaluator.evaluate(decorator.args[0]) : null;
      callback(fieldName, value, decorator);
    }
  }
}
function parseInputsArray(clazz, decoratorMetadata, evaluator, reflector, refEmitter) {
  const inputsField = decoratorMetadata.get("inputs");
  if (inputsField === void 0) {
    return {};
  }
  const inputs = {};
  const inputsArray = evaluator.evaluate(inputsField);
  if (!Array.isArray(inputsArray)) {
    throw createValueHasWrongTypeError(inputsField, inputsArray, `Failed to resolve @Directive.inputs to an array`);
  }
  for (let i = 0; i < inputsArray.length; i++) {
    const value = inputsArray[i];
    if (typeof value === "string") {
      const [bindingPropertyName, classPropertyName] = parseMappingString(value);
      inputs[classPropertyName] = {
        bindingPropertyName,
        classPropertyName,
        required: false,
        transform: null
      };
    } else if (value instanceof Map) {
      const name = value.get("name");
      const alias = value.get("alias");
      const required = value.get("required");
      let transform = null;
      if (typeof name !== "string") {
        throw createValueHasWrongTypeError(inputsField, name, `Value at position ${i} of @Directive.inputs array must have a "name" property`);
      }
      if (value.has("transform")) {
        const transformValue = value.get("transform");
        if (!(transformValue instanceof DynamicValue) && !(transformValue instanceof Reference)) {
          throw createValueHasWrongTypeError(inputsField, transformValue, `Transform of value at position ${i} of @Directive.inputs array must be a function`);
        }
        transform = parseInputTransformFunction(clazz, name, transformValue, reflector, refEmitter);
      }
      inputs[name] = {
        classPropertyName: name,
        bindingPropertyName: typeof alias === "string" ? alias : name,
        required: required === true,
        transform
      };
    } else {
      throw createValueHasWrongTypeError(inputsField, value, `@Directive.inputs array can only contain strings or object literals`);
    }
  }
  return inputs;
}
function parseInputFields(clazz, inputMembers, evaluator, reflector, refEmitter) {
  const inputs = {};
  parseDecoratedFields(inputMembers, evaluator, (classPropertyName, options, decorator) => {
    let bindingPropertyName;
    let required = false;
    let transform = null;
    if (options === null) {
      bindingPropertyName = classPropertyName;
    } else if (typeof options === "string") {
      bindingPropertyName = options;
    } else if (options instanceof Map) {
      const aliasInConfig = options.get("alias");
      bindingPropertyName = typeof aliasInConfig === "string" ? aliasInConfig : classPropertyName;
      required = options.get("required") === true;
      if (options.has("transform")) {
        const transformValue = options.get("transform");
        if (!(transformValue instanceof DynamicValue) && !(transformValue instanceof Reference)) {
          throw createValueHasWrongTypeError(decorator.node, transformValue, `Input transform must be a function`);
        }
        transform = parseInputTransformFunction(clazz, classPropertyName, transformValue, reflector, refEmitter);
      }
    } else {
      throw createValueHasWrongTypeError(decorator.node, options, `@${decorator.name} decorator argument must resolve to a string or an object literal`);
    }
    inputs[classPropertyName] = { bindingPropertyName, classPropertyName, required, transform };
  });
  return inputs;
}
function parseInputTransformFunction(clazz, classPropertyName, value, reflector, refEmitter) {
  var _a;
  const definition = reflector.getDefinitionOfFunction(value.node);
  if (definition === null) {
    throw createValueHasWrongTypeError(value.node, value, "Input transform must be a function");
  }
  if (definition.typeParameters !== null && definition.typeParameters.length > 0) {
    throw createValueHasWrongTypeError(value.node, value, "Input transform function cannot be generic");
  }
  if (definition.signatureCount > 1) {
    throw createValueHasWrongTypeError(value.node, value, "Input transform function cannot have multiple signatures");
  }
  const members = reflector.getMembersOfClass(clazz);
  for (const member of members) {
    const conflictingName = `ngAcceptInputType_${classPropertyName}`;
    if (member.name === conflictingName && member.isStatic) {
      throw new FatalDiagnosticError(ErrorCode.CONFLICTING_INPUT_TRANSFORM, value.node, `Class cannot have both a transform function on Input ${classPropertyName} and a static member called ${conflictingName}`);
    }
  }
  const node = value instanceof Reference ? value.getIdentityIn(clazz.getSourceFile()) : value.node;
  if (node === null) {
    throw createValueHasWrongTypeError(value.node, value, "Input transform function could not be referenced");
  }
  const firstParam = ((_a = definition.parameters[0]) == null ? void 0 : _a.name) === "this" ? definition.parameters[1] : definition.parameters[0];
  if (!firstParam) {
    return {
      node,
      type: new Reference(ts20.factory.createKeywordTypeNode(ts20.SyntaxKind.UnknownKeyword))
    };
  }
  if (!firstParam.type) {
    throw createValueHasWrongTypeError(value.node, value, "Input transform function first parameter must have a type");
  }
  if (firstParam.node.dotDotDotToken) {
    throw createValueHasWrongTypeError(value.node, value, "Input transform function first parameter cannot be a spread parameter");
  }
  assertEmittableInputType(firstParam.type, clazz.getSourceFile(), reflector, refEmitter);
  const viaModule = value instanceof Reference ? value.bestGuessOwningModule : null;
  return { node, type: new Reference(firstParam.type, viaModule) };
}
function assertEmittableInputType(type, contextFile, reflector, refEmitter) {
  (function walk(node) {
    if (ts20.isTypeReferenceNode(node) && ts20.isIdentifier(node.typeName)) {
      const declaration = reflector.getDeclarationOfIdentifier(node.typeName);
      if (declaration !== null) {
        if (declaration.node.getSourceFile() !== contextFile) {
          const emittedType = refEmitter.emit(new Reference(declaration.node), contextFile, ImportFlags.NoAliasing | ImportFlags.AllowTypeImports | ImportFlags.AllowRelativeDtsImports);
          assertSuccessfulReferenceEmit(emittedType, node, "type");
        } else if (!reflector.isStaticallyExported(declaration.node)) {
          throw new FatalDiagnosticError(ErrorCode.SYMBOL_NOT_EXPORTED, type, `Symbol must be exported in order to be used as the type of an Input transform function`, [makeRelatedInformation(declaration.node, `The symbol is declared here.`)]);
        }
      }
    }
    node.forEachChild(walk);
  })(type);
}
function parseOutputsArray(directive, evaluator) {
  const metaValues = parseFieldStringArrayValue(directive, "outputs", evaluator);
  return metaValues ? parseMappingStringArray(metaValues) : EMPTY_OBJECT;
}
function parseOutputFields(outputMembers, evaluator) {
  const outputs = {};
  parseDecoratedFields(outputMembers, evaluator, (fieldName, bindingPropertyName, decorator) => {
    if (bindingPropertyName != null && typeof bindingPropertyName !== "string") {
      throw createValueHasWrongTypeError(decorator.node, bindingPropertyName, `@${decorator.name} decorator argument must resolve to a string`);
    }
    outputs[fieldName] = bindingPropertyName != null ? bindingPropertyName : fieldName;
  });
  return outputs;
}
function evaluateHostExpressionBindings(hostExpr, evaluator) {
  const hostMetaMap = evaluator.evaluate(hostExpr);
  if (!(hostMetaMap instanceof Map)) {
    throw createValueHasWrongTypeError(hostExpr, hostMetaMap, `Decorator host metadata must be an object`);
  }
  const hostMetadata = {};
  hostMetaMap.forEach((value, key) => {
    if (value instanceof EnumValue) {
      value = value.resolved;
    }
    if (typeof key !== "string") {
      throw createValueHasWrongTypeError(hostExpr, key, `Decorator host metadata must be a string -> string object, but found unparseable key`);
    }
    if (typeof value == "string") {
      hostMetadata[key] = value;
    } else if (value instanceof DynamicValue) {
      hostMetadata[key] = new WrappedNodeExpr4(value.node);
    } else {
      throw createValueHasWrongTypeError(hostExpr, value, `Decorator host metadata must be a string -> string object, but found unparseable value`);
    }
  });
  const bindings = parseHostBindings(hostMetadata);
  const errors = verifyHostBindings(bindings, createSourceSpan(hostExpr));
  if (errors.length > 0) {
    throw new FatalDiagnosticError(
      ErrorCode.HOST_BINDING_PARSE_ERROR,
      hostExpr,
      errors.map((error) => error.msg).join("\n")
    );
  }
  return bindings;
}
function extractHostDirectives(rawHostDirectives, evaluator) {
  const resolved = evaluator.evaluate(rawHostDirectives, forwardRefResolver);
  if (!Array.isArray(resolved)) {
    throw createValueHasWrongTypeError(rawHostDirectives, resolved, "hostDirectives must be an array");
  }
  return resolved.map((value) => {
    const hostReference = value instanceof Map ? value.get("directive") : value;
    if (!(hostReference instanceof Reference)) {
      throw createValueHasWrongTypeError(rawHostDirectives, hostReference, "Host directive must be a reference");
    }
    if (!isNamedClassDeclaration(hostReference.node)) {
      throw createValueHasWrongTypeError(rawHostDirectives, hostReference, "Host directive reference must be a class");
    }
    const meta = {
      directive: hostReference,
      isForwardReference: hostReference.synthetic,
      inputs: parseHostDirectivesMapping("inputs", value, hostReference.node, rawHostDirectives),
      outputs: parseHostDirectivesMapping("outputs", value, hostReference.node, rawHostDirectives)
    };
    return meta;
  });
}
function parseHostDirectivesMapping(field, resolvedValue, classReference, sourceExpression) {
  if (resolvedValue instanceof Map && resolvedValue.has(field)) {
    const nameForErrors = `@Directive.hostDirectives.${classReference.name.text}.${field}`;
    const rawInputs = resolvedValue.get(field);
    if (isStringArrayOrDie(rawInputs, nameForErrors, sourceExpression)) {
      return parseMappingStringArray(rawInputs);
    }
  }
  return null;
}
function toHostDirectiveMetadata(hostDirective, context, refEmitter) {
  return {
    directive: toR3Reference(hostDirective.directive.node, hostDirective.directive, context, refEmitter),
    isForwardReference: hostDirective.isForwardReference,
    inputs: hostDirective.inputs || null,
    outputs: hostDirective.outputs || null
  };
}
function toR3InputMetadata(mapping) {
  return {
    classPropertyName: mapping.classPropertyName,
    bindingPropertyName: mapping.bindingPropertyName,
    required: mapping.required,
    transformFunction: mapping.transform !== null ? new WrappedNodeExpr4(mapping.transform.node) : null
  };
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/directive/src/symbol.mjs
var DirectiveSymbol = class extends SemanticSymbol {
  constructor(decl, selector, inputs, outputs, exportAs, typeCheckMeta, typeParameters) {
    super(decl);
    this.selector = selector;
    this.inputs = inputs;
    this.outputs = outputs;
    this.exportAs = exportAs;
    this.typeCheckMeta = typeCheckMeta;
    this.typeParameters = typeParameters;
    this.baseClass = null;
  }
  isPublicApiAffected(previousSymbol) {
    if (!(previousSymbol instanceof DirectiveSymbol)) {
      return true;
    }
    return this.selector !== previousSymbol.selector || !isArrayEqual(this.inputs.propertyNames, previousSymbol.inputs.propertyNames) || !isArrayEqual(this.outputs.propertyNames, previousSymbol.outputs.propertyNames) || !isArrayEqual(this.exportAs, previousSymbol.exportAs);
  }
  isTypeCheckApiAffected(previousSymbol) {
    if (this.isPublicApiAffected(previousSymbol)) {
      return true;
    }
    if (!(previousSymbol instanceof DirectiveSymbol)) {
      return true;
    }
    if (!isArrayEqual(Array.from(this.inputs), Array.from(previousSymbol.inputs), isInputMappingEqual) || !isArrayEqual(Array.from(this.outputs), Array.from(previousSymbol.outputs), isInputOrOutputEqual)) {
      return true;
    }
    if (!areTypeParametersEqual(this.typeParameters, previousSymbol.typeParameters)) {
      return true;
    }
    if (!isTypeCheckMetaEqual(this.typeCheckMeta, previousSymbol.typeCheckMeta)) {
      return true;
    }
    if (!isBaseClassEqual(this.baseClass, previousSymbol.baseClass)) {
      return true;
    }
    return false;
  }
};
function isInputMappingEqual(current, previous) {
  return isInputOrOutputEqual(current, previous) && current.required === previous.required;
}
function isInputOrOutputEqual(current, previous) {
  return current.classPropertyName === previous.classPropertyName && current.bindingPropertyName === previous.bindingPropertyName;
}
function isTypeCheckMetaEqual(current, previous) {
  if (current.hasNgTemplateContextGuard !== previous.hasNgTemplateContextGuard) {
    return false;
  }
  if (current.isGeneric !== previous.isGeneric) {
    return false;
  }
  if (!isArrayEqual(current.ngTemplateGuards, previous.ngTemplateGuards, isTemplateGuardEqual)) {
    return false;
  }
  if (!isSetEqual(current.coercedInputFields, previous.coercedInputFields)) {
    return false;
  }
  if (!isSetEqual(current.restrictedInputFields, previous.restrictedInputFields)) {
    return false;
  }
  if (!isSetEqual(current.stringLiteralInputFields, previous.stringLiteralInputFields)) {
    return false;
  }
  if (!isSetEqual(current.undeclaredInputFields, previous.undeclaredInputFields)) {
    return false;
  }
  return true;
}
function isTemplateGuardEqual(current, previous) {
  return current.inputName === previous.inputName && current.type === previous.type;
}
function isBaseClassEqual(current, previous) {
  if (current === null || previous === null) {
    return current === previous;
  }
  return isSymbolEqual(current, previous);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/directive/src/handler.mjs
var FIELD_DECORATORS = [
  "Input",
  "Output",
  "ViewChild",
  "ViewChildren",
  "ContentChild",
  "ContentChildren",
  "HostBinding",
  "HostListener"
];
var LIFECYCLE_HOOKS = /* @__PURE__ */ new Set([
  "ngOnChanges",
  "ngOnInit",
  "ngOnDestroy",
  "ngDoCheck",
  "ngAfterViewInit",
  "ngAfterViewChecked",
  "ngAfterContentInit",
  "ngAfterContentChecked"
]);
var DirectiveDecoratorHandler = class {
  constructor(reflector, evaluator, metaRegistry, scopeRegistry, metaReader, injectableRegistry, refEmitter, referencesRegistry, isCore, strictCtorDeps, semanticDepGraphUpdater, annotateForClosureCompiler, perf, includeClassMetadata) {
    this.reflector = reflector;
    this.evaluator = evaluator;
    this.metaRegistry = metaRegistry;
    this.scopeRegistry = scopeRegistry;
    this.metaReader = metaReader;
    this.injectableRegistry = injectableRegistry;
    this.refEmitter = refEmitter;
    this.referencesRegistry = referencesRegistry;
    this.isCore = isCore;
    this.strictCtorDeps = strictCtorDeps;
    this.semanticDepGraphUpdater = semanticDepGraphUpdater;
    this.annotateForClosureCompiler = annotateForClosureCompiler;
    this.perf = perf;
    this.includeClassMetadata = includeClassMetadata;
    this.precedence = HandlerPrecedence.PRIMARY;
    this.name = "DirectiveDecoratorHandler";
  }
  detect(node, decorators) {
    if (!decorators) {
      const angularField = this.findClassFieldWithAngularFeatures(node);
      return angularField ? { trigger: angularField.node, decorator: null, metadata: null } : void 0;
    } else {
      const decorator = findAngularDecorator(decorators, "Directive", this.isCore);
      return decorator ? { trigger: decorator.node, decorator, metadata: decorator } : void 0;
    }
  }
  analyze(node, decorator) {
    var _a;
    if (decorator === null) {
      if (this.isCore) {
        return {};
      }
      return { diagnostics: [getUndecoratedClassWithAngularFeaturesDiagnostic(node)] };
    }
    this.perf.eventCount(PerfEvent.AnalyzeDirective);
    const directiveResult = extractDirectiveMetadata(node, decorator, this.reflector, this.evaluator, this.refEmitter, this.referencesRegistry, this.isCore, this.annotateForClosureCompiler);
    if (directiveResult === void 0) {
      return {};
    }
    const analysis = directiveResult.metadata;
    let providersRequiringFactory = null;
    if (directiveResult !== void 0 && directiveResult.decorator.has("providers")) {
      providersRequiringFactory = resolveProvidersRequiringFactory(directiveResult.decorator.get("providers"), this.reflector, this.evaluator);
    }
    return {
      analysis: {
        inputs: directiveResult.inputs,
        outputs: directiveResult.outputs,
        meta: analysis,
        hostDirectives: directiveResult.hostDirectives,
        rawHostDirectives: directiveResult.rawHostDirectives,
        classMetadata: this.includeClassMetadata ? extractClassMetadata(node, this.reflector, this.isCore, this.annotateForClosureCompiler) : null,
        baseClass: readBaseClass(node, this.reflector, this.evaluator),
        typeCheckMeta: extractDirectiveTypeCheckMeta(node, directiveResult.inputs, this.reflector),
        providersRequiringFactory,
        isPoisoned: false,
        isStructural: directiveResult.isStructural,
        decorator: (_a = decorator == null ? void 0 : decorator.node) != null ? _a : null
      }
    };
  }
  symbol(node, analysis) {
    const typeParameters = extractSemanticTypeParameters(node);
    return new DirectiveSymbol(node, analysis.meta.selector, analysis.inputs, analysis.outputs, analysis.meta.exportAs, analysis.typeCheckMeta, typeParameters);
  }
  register(node, analysis) {
    const ref = new Reference(node);
    this.metaRegistry.registerDirectiveMetadata({
      kind: MetaKind.Directive,
      matchSource: MatchSource.Selector,
      ref,
      name: node.name.text,
      selector: analysis.meta.selector,
      exportAs: analysis.meta.exportAs,
      inputs: analysis.inputs,
      outputs: analysis.outputs,
      queries: analysis.meta.queries.map((query) => query.propertyName),
      isComponent: false,
      baseClass: analysis.baseClass,
      hostDirectives: analysis.hostDirectives,
      ...analysis.typeCheckMeta,
      isPoisoned: analysis.isPoisoned,
      isStructural: analysis.isStructural,
      animationTriggerNames: null,
      isStandalone: analysis.meta.isStandalone,
      isSignal: analysis.meta.isSignal,
      imports: null,
      schemas: null,
      decorator: analysis.decorator,
      assumedToExportProviders: false
    });
    this.injectableRegistry.registerInjectable(node, {
      ctorDeps: analysis.meta.deps
    });
  }
  resolve(node, analysis, symbol) {
    if (this.semanticDepGraphUpdater !== null && analysis.baseClass instanceof Reference) {
      symbol.baseClass = this.semanticDepGraphUpdater.getSymbol(analysis.baseClass.node);
    }
    const diagnostics = [];
    if (analysis.providersRequiringFactory !== null && analysis.meta.providers instanceof WrappedNodeExpr5) {
      const providerDiagnostics = getProviderDiagnostics(analysis.providersRequiringFactory, analysis.meta.providers.node, this.injectableRegistry);
      diagnostics.push(...providerDiagnostics);
    }
    const directiveDiagnostics = getDirectiveDiagnostics(node, this.injectableRegistry, this.evaluator, this.reflector, this.scopeRegistry, this.strictCtorDeps, "Directive");
    if (directiveDiagnostics !== null) {
      diagnostics.push(...directiveDiagnostics);
    }
    const hostDirectivesDiagnotics = analysis.hostDirectives && analysis.rawHostDirectives ? validateHostDirectives(analysis.rawHostDirectives, analysis.hostDirectives, this.metaReader) : null;
    if (hostDirectivesDiagnotics !== null) {
      diagnostics.push(...hostDirectivesDiagnotics);
    }
    return { diagnostics: diagnostics.length > 0 ? diagnostics : void 0 };
  }
  compileFull(node, analysis, resolution, pool) {
    const fac = compileNgFactoryDefField(toFactoryMetadata(analysis.meta, FactoryTarget.Directive));
    const def = compileDirectiveFromMetadata(analysis.meta, pool, makeBindingParser());
    const inputTransformFields = compileInputTransformFields(analysis.inputs);
    const classMetadata = analysis.classMetadata !== null ? compileClassMetadata(analysis.classMetadata).toStmt() : null;
    return compileResults(fac, def, classMetadata, "\u0275dir", inputTransformFields, null);
  }
  compilePartial(node, analysis, resolution) {
    const fac = compileDeclareFactory(toFactoryMetadata(analysis.meta, FactoryTarget.Directive));
    const def = compileDeclareDirectiveFromMetadata(analysis.meta);
    const inputTransformFields = compileInputTransformFields(analysis.inputs);
    const classMetadata = analysis.classMetadata !== null ? compileDeclareClassMetadata(analysis.classMetadata).toStmt() : null;
    return compileResults(fac, def, classMetadata, "\u0275dir", inputTransformFields, null);
  }
  compileLocal(node, analysis, pool) {
    const fac = compileNgFactoryDefField(toFactoryMetadata(analysis.meta, FactoryTarget.Directive));
    const def = compileDirectiveFromMetadata(analysis.meta, pool, makeBindingParser());
    const inputTransformFields = compileInputTransformFields(analysis.inputs);
    const classMetadata = analysis.classMetadata !== null ? compileClassMetadata(analysis.classMetadata).toStmt() : null;
    return compileResults(fac, def, classMetadata, "\u0275dir", inputTransformFields, null);
  }
  findClassFieldWithAngularFeatures(node) {
    return this.reflector.getMembersOfClass(node).find((member) => {
      if (!member.isStatic && member.kind === ClassMemberKind.Method && LIFECYCLE_HOOKS.has(member.name)) {
        return true;
      }
      if (member.decorators) {
        return member.decorators.some((decorator) => FIELD_DECORATORS.some((decoratorName) => isAngularDecorator(decorator, decoratorName, this.isCore)));
      }
      return false;
    });
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/ng_module/src/handler.mjs
import { compileClassMetadata as compileClassMetadata2, compileDeclareClassMetadata as compileDeclareClassMetadata2, compileDeclareInjectorFromMetadata, compileDeclareNgModuleFromMetadata, compileInjector, compileNgModule, ExternalExpr as ExternalExpr5, FactoryTarget as FactoryTarget2, FunctionExpr as FunctionExpr2, InvokeFunctionExpr, LiteralArrayExpr as LiteralArrayExpr2, R3Identifiers, R3NgModuleMetadataKind, R3SelectorScopeMode, ReturnStatement as ReturnStatement2, WrappedNodeExpr as WrappedNodeExpr6 } from "@angular/compiler";
import ts22 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/ng_module/src/module_with_providers.mjs
import ts21 from "typescript";
function createModuleWithProvidersResolver(reflector, isCore) {
  function _reflectModuleFromTypeParam(type, node) {
    if (!ts21.isTypeReferenceNode(type)) {
      return null;
    }
    const typeName = type && (ts21.isIdentifier(type.typeName) && type.typeName || ts21.isQualifiedName(type.typeName) && type.typeName.right) || null;
    if (typeName === null) {
      return null;
    }
    const id = reflector.getImportOfIdentifier(typeName);
    if (id === null || id.name !== "ModuleWithProviders") {
      return null;
    }
    if (!isCore && id.from !== "@angular/core") {
      return null;
    }
    if (type.typeArguments === void 0 || type.typeArguments.length !== 1) {
      const parent = ts21.isMethodDeclaration(node) && ts21.isClassDeclaration(node.parent) ? node.parent : null;
      const symbolName = (parent && parent.name ? parent.name.getText() + "." : "") + (node.name ? node.name.getText() : "anonymous");
      throw new FatalDiagnosticError(ErrorCode.NGMODULE_MODULE_WITH_PROVIDERS_MISSING_GENERIC, type, `${symbolName} returns a ModuleWithProviders type without a generic type argument. Please add a generic type argument to the ModuleWithProviders type. If this occurrence is in library code you don't control, please contact the library authors.`);
    }
    const arg = type.typeArguments[0];
    return typeNodeToValueExpr(arg);
  }
  function _reflectModuleFromLiteralType(type) {
    if (!ts21.isIntersectionTypeNode(type)) {
      return null;
    }
    for (const t of type.types) {
      if (ts21.isTypeLiteralNode(t)) {
        for (const m of t.members) {
          const ngModuleType = ts21.isPropertySignature(m) && ts21.isIdentifier(m.name) && m.name.text === "ngModule" && m.type || null;
          const ngModuleExpression = ngModuleType && typeNodeToValueExpr(ngModuleType);
          if (ngModuleExpression) {
            return ngModuleExpression;
          }
        }
      }
    }
    return null;
  }
  return (fn, callExpr, resolve, unresolvable) => {
    var _a;
    const rawType = fn.node.type;
    if (rawType === void 0) {
      return unresolvable;
    }
    const type = (_a = _reflectModuleFromTypeParam(rawType, fn.node)) != null ? _a : _reflectModuleFromLiteralType(rawType);
    if (type === null) {
      return unresolvable;
    }
    const ngModule = resolve(type);
    if (!(ngModule instanceof Reference) || !isNamedClassDeclaration(ngModule.node)) {
      return unresolvable;
    }
    return new SyntheticValue({
      ngModule,
      mwpCall: callExpr
    });
  };
}
function isResolvedModuleWithProviders(sv) {
  return typeof sv.value === "object" && sv.value != null && sv.value.hasOwnProperty("ngModule") && sv.value.hasOwnProperty("mwpCall");
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/ng_module/src/handler.mjs
var NgModuleSymbol = class extends SemanticSymbol {
  constructor(decl, hasProviders) {
    super(decl);
    this.hasProviders = hasProviders;
    this.remotelyScopedComponents = [];
    this.transitiveImportsFromStandaloneComponents = /* @__PURE__ */ new Set();
  }
  isPublicApiAffected(previousSymbol) {
    if (!(previousSymbol instanceof NgModuleSymbol)) {
      return true;
    }
    if (previousSymbol.hasProviders !== this.hasProviders) {
      return true;
    }
    return false;
  }
  isEmitAffected(previousSymbol) {
    if (!(previousSymbol instanceof NgModuleSymbol)) {
      return true;
    }
    if (previousSymbol.remotelyScopedComponents.length !== this.remotelyScopedComponents.length) {
      return true;
    }
    for (const currEntry of this.remotelyScopedComponents) {
      const prevEntry = previousSymbol.remotelyScopedComponents.find((prevEntry2) => {
        return isSymbolEqual(prevEntry2.component, currEntry.component);
      });
      if (prevEntry === void 0) {
        return true;
      }
      if (!isArrayEqual(currEntry.usedDirectives, prevEntry.usedDirectives, isReferenceEqual)) {
        return true;
      }
      if (!isArrayEqual(currEntry.usedPipes, prevEntry.usedPipes, isReferenceEqual)) {
        return true;
      }
    }
    if (previousSymbol.transitiveImportsFromStandaloneComponents.size !== this.transitiveImportsFromStandaloneComponents.size) {
      return true;
    }
    const previousImports = Array.from(previousSymbol.transitiveImportsFromStandaloneComponents);
    for (const transitiveImport of this.transitiveImportsFromStandaloneComponents) {
      const prevEntry = previousImports.find((prevEntry2) => isSymbolEqual(prevEntry2, transitiveImport));
      if (prevEntry === void 0) {
        return true;
      }
      if (transitiveImport.isPublicApiAffected(prevEntry)) {
        return true;
      }
    }
    return false;
  }
  isTypeCheckApiAffected(previousSymbol) {
    if (!(previousSymbol instanceof NgModuleSymbol)) {
      return true;
    }
    return false;
  }
  addRemotelyScopedComponent(component, usedDirectives, usedPipes) {
    this.remotelyScopedComponents.push({ component, usedDirectives, usedPipes });
  }
  addTransitiveImportFromStandaloneComponent(importedSymbol) {
    this.transitiveImportsFromStandaloneComponents.add(importedSymbol);
  }
};
var NgModuleDecoratorHandler = class {
  constructor(reflector, evaluator, metaReader, metaRegistry, scopeRegistry, referencesRegistry, exportedProviderStatusResolver, semanticDepGraphUpdater, isCore, refEmitter, annotateForClosureCompiler, onlyPublishPublicTypings, injectableRegistry, perf, includeClassMetadata, includeSelectorScope, compilationMode) {
    this.reflector = reflector;
    this.evaluator = evaluator;
    this.metaReader = metaReader;
    this.metaRegistry = metaRegistry;
    this.scopeRegistry = scopeRegistry;
    this.referencesRegistry = referencesRegistry;
    this.exportedProviderStatusResolver = exportedProviderStatusResolver;
    this.semanticDepGraphUpdater = semanticDepGraphUpdater;
    this.isCore = isCore;
    this.refEmitter = refEmitter;
    this.annotateForClosureCompiler = annotateForClosureCompiler;
    this.onlyPublishPublicTypings = onlyPublishPublicTypings;
    this.injectableRegistry = injectableRegistry;
    this.perf = perf;
    this.includeClassMetadata = includeClassMetadata;
    this.includeSelectorScope = includeSelectorScope;
    this.compilationMode = compilationMode;
    this.precedence = HandlerPrecedence.PRIMARY;
    this.name = "NgModuleDecoratorHandler";
  }
  detect(node, decorators) {
    if (!decorators) {
      return void 0;
    }
    const decorator = findAngularDecorator(decorators, "NgModule", this.isCore);
    if (decorator !== void 0) {
      return {
        trigger: decorator.node,
        decorator,
        metadata: decorator
      };
    } else {
      return void 0;
    }
  }
  analyze(node, decorator) {
    var _a, _b, _c, _d, _e;
    this.perf.eventCount(PerfEvent.AnalyzeNgModule);
    const name = node.name.text;
    if (decorator.args === null || decorator.args.length > 1) {
      throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, `Incorrect number of arguments to @NgModule decorator`);
    }
    const meta = decorator.args.length === 1 ? unwrapExpression(decorator.args[0]) : ts22.factory.createObjectLiteralExpression([]);
    if (!ts22.isObjectLiteralExpression(meta)) {
      throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARG_NOT_LITERAL, meta, "@NgModule argument must be an object literal");
    }
    const ngModule = reflectObjectLiteral(meta);
    if (ngModule.has("jit")) {
      return {};
    }
    const moduleResolvers = combineResolvers([
      createModuleWithProvidersResolver(this.reflector, this.isCore),
      forwardRefResolver
    ]);
    const diagnostics = [];
    let declarationRefs = [];
    const rawDeclarations = (_a = ngModule.get("declarations")) != null ? _a : null;
    if (this.compilationMode !== CompilationMode.LOCAL && rawDeclarations !== null) {
      const declarationMeta = this.evaluator.evaluate(rawDeclarations, forwardRefResolver);
      declarationRefs = this.resolveTypeList(rawDeclarations, declarationMeta, name, "declarations", 0).references;
      for (const ref of declarationRefs) {
        if (ref.node.getSourceFile().isDeclarationFile) {
          const errorNode = ref.getOriginForDiagnostics(rawDeclarations);
          diagnostics.push(makeDiagnostic(ErrorCode.NGMODULE_INVALID_DECLARATION, errorNode, `Cannot declare '${ref.node.name.text}' in an NgModule as it's not a part of the current compilation.`, [makeRelatedInformation(ref.node.name, `'${ref.node.name.text}' is declared here.`)]));
        }
      }
    }
    if (diagnostics.length > 0) {
      return { diagnostics };
    }
    let importRefs = [];
    let rawImports = (_b = ngModule.get("imports")) != null ? _b : null;
    if (this.compilationMode !== CompilationMode.LOCAL && rawImports !== null) {
      const importsMeta = this.evaluator.evaluate(rawImports, moduleResolvers);
      importRefs = this.resolveTypeList(rawImports, importsMeta, name, "imports", 0).references;
    }
    let exportRefs = [];
    const rawExports = (_c = ngModule.get("exports")) != null ? _c : null;
    if (this.compilationMode !== CompilationMode.LOCAL && rawExports !== null) {
      const exportsMeta = this.evaluator.evaluate(rawExports, moduleResolvers);
      exportRefs = this.resolveTypeList(rawExports, exportsMeta, name, "exports", 0).references;
      this.referencesRegistry.add(node, ...exportRefs);
    }
    let bootstrapRefs = [];
    const rawBootstrap = (_d = ngModule.get("bootstrap")) != null ? _d : null;
    if (this.compilationMode !== CompilationMode.LOCAL && rawBootstrap !== null) {
      const bootstrapMeta = this.evaluator.evaluate(rawBootstrap, forwardRefResolver);
      bootstrapRefs = this.resolveTypeList(rawBootstrap, bootstrapMeta, name, "bootstrap", 0).references;
      for (const ref of bootstrapRefs) {
        const dirMeta = this.metaReader.getDirectiveMetadata(ref);
        if (dirMeta == null ? void 0 : dirMeta.isStandalone) {
          diagnostics.push(makeStandaloneBootstrapDiagnostic(node, ref, rawBootstrap));
        }
      }
    }
    const schemas = this.compilationMode !== CompilationMode.LOCAL && ngModule.has("schemas") ? extractSchemas(ngModule.get("schemas"), this.evaluator, "NgModule") : [];
    let id = null;
    if (ngModule.has("id")) {
      const idExpr = ngModule.get("id");
      if (!isModuleIdExpression(idExpr)) {
        id = new WrappedNodeExpr6(idExpr);
      } else {
        const diag = makeDiagnostic(ErrorCode.WARN_NGMODULE_ID_UNNECESSARY, idExpr, `Using 'module.id' for NgModule.id is a common anti-pattern that is ignored by the Angular compiler.`);
        diag.category = ts22.DiagnosticCategory.Warning;
        diagnostics.push(diag);
      }
    }
    const valueContext = node.getSourceFile();
    const exportedNodes = new Set(exportRefs.map((ref) => ref.node));
    const declarations = [];
    const exportedDeclarations = [];
    const bootstrap = bootstrapRefs.map((bootstrap2) => this._toR3Reference(bootstrap2.getOriginForDiagnostics(meta, node.name), bootstrap2, valueContext));
    for (const ref of declarationRefs) {
      const decl = this._toR3Reference(ref.getOriginForDiagnostics(meta, node.name), ref, valueContext);
      declarations.push(decl);
      if (exportedNodes.has(ref.node)) {
        exportedDeclarations.push(decl.type);
      }
    }
    const imports = importRefs.map((imp) => this._toR3Reference(imp.getOriginForDiagnostics(meta, node.name), imp, valueContext));
    const exports = exportRefs.map((exp) => this._toR3Reference(exp.getOriginForDiagnostics(meta, node.name), exp, valueContext));
    const isForwardReference = (ref) => isExpressionForwardReference(ref.value, node.name, valueContext);
    const containsForwardDecls = bootstrap.some(isForwardReference) || declarations.some(isForwardReference) || imports.some(isForwardReference) || exports.some(isForwardReference);
    const type = wrapTypeReference(this.reflector, node);
    let ngModuleMetadata;
    if (this.compilationMode === CompilationMode.LOCAL) {
      ngModuleMetadata = {
        kind: R3NgModuleMetadataKind.Local,
        type,
        bootstrapExpression: rawBootstrap ? new WrappedNodeExpr6(rawBootstrap) : null,
        declarationsExpression: rawDeclarations ? new WrappedNodeExpr6(rawDeclarations) : null,
        exportsExpression: rawExports ? new WrappedNodeExpr6(rawExports) : null,
        importsExpression: rawImports ? new WrappedNodeExpr6(rawImports) : null,
        id,
        selectorScopeMode: R3SelectorScopeMode.SideEffect,
        schemas: []
      };
    } else {
      ngModuleMetadata = {
        kind: R3NgModuleMetadataKind.Global,
        type,
        bootstrap,
        declarations,
        publicDeclarationTypes: this.onlyPublishPublicTypings ? exportedDeclarations : null,
        exports,
        imports,
        includeImportTypes: !this.onlyPublishPublicTypings,
        containsForwardDecls,
        id,
        selectorScopeMode: this.includeSelectorScope ? R3SelectorScopeMode.SideEffect : R3SelectorScopeMode.Omit,
        schemas: []
      };
    }
    const rawProviders = ngModule.has("providers") ? ngModule.get("providers") : null;
    let wrappedProviders = null;
    if (rawProviders !== null && (!ts22.isArrayLiteralExpression(rawProviders) || rawProviders.elements.length > 0)) {
      wrappedProviders = new WrappedNodeExpr6(this.annotateForClosureCompiler ? wrapFunctionExpressionsInParens(rawProviders) : rawProviders);
    }
    const topLevelImports = [];
    if (this.compilationMode !== CompilationMode.LOCAL && ngModule.has("imports")) {
      const rawImports2 = unwrapExpression(ngModule.get("imports"));
      let topLevelExpressions = [];
      if (ts22.isArrayLiteralExpression(rawImports2)) {
        for (const element of rawImports2.elements) {
          if (ts22.isSpreadElement(element)) {
            topLevelExpressions.push(element.expression);
            continue;
          }
          topLevelExpressions.push(element);
        }
      } else {
        topLevelExpressions.push(rawImports2);
      }
      let absoluteIndex = 0;
      for (const importExpr of topLevelExpressions) {
        const resolved = this.evaluator.evaluate(importExpr, moduleResolvers);
        const { references, hasModuleWithProviders } = this.resolveTypeList(importExpr, [resolved], node.name.text, "imports", absoluteIndex);
        absoluteIndex += references.length;
        topLevelImports.push({
          expression: importExpr,
          resolvedReferences: references,
          hasModuleWithProviders
        });
      }
    }
    const injectorMetadata = {
      name,
      type,
      providers: wrappedProviders
    };
    const factoryMetadata = {
      name,
      type,
      typeArgumentCount: 0,
      deps: getValidConstructorDependencies(node, this.reflector, this.isCore),
      target: FactoryTarget2.NgModule
    };
    const remoteScopesMayRequireCycleProtection = declarationRefs.some(isSyntheticReference) || importRefs.some(isSyntheticReference);
    return {
      diagnostics: diagnostics.length > 0 ? diagnostics : void 0,
      analysis: {
        id,
        schemas,
        mod: ngModuleMetadata,
        inj: injectorMetadata,
        fac: factoryMetadata,
        declarations: declarationRefs,
        rawDeclarations,
        imports: topLevelImports,
        rawImports,
        importRefs,
        exports: exportRefs,
        rawExports,
        providers: rawProviders,
        providersRequiringFactory: rawProviders ? resolveProvidersRequiringFactory(rawProviders, this.reflector, this.evaluator) : null,
        classMetadata: this.includeClassMetadata ? extractClassMetadata(node, this.reflector, this.isCore, this.annotateForClosureCompiler) : null,
        factorySymbolName: node.name.text,
        remoteScopesMayRequireCycleProtection,
        decorator: (_e = decorator == null ? void 0 : decorator.node) != null ? _e : null
      }
    };
  }
  symbol(node, analysis) {
    return new NgModuleSymbol(node, analysis.providers !== null);
  }
  register(node, analysis) {
    this.metaRegistry.registerNgModuleMetadata({
      kind: MetaKind.NgModule,
      ref: new Reference(node),
      schemas: analysis.schemas,
      declarations: analysis.declarations,
      imports: analysis.importRefs,
      exports: analysis.exports,
      rawDeclarations: analysis.rawDeclarations,
      rawImports: analysis.rawImports,
      rawExports: analysis.rawExports,
      decorator: analysis.decorator,
      mayDeclareProviders: analysis.providers !== null
    });
    this.injectableRegistry.registerInjectable(node, {
      ctorDeps: analysis.fac.deps
    });
  }
  resolve(node, analysis) {
    const scope = this.scopeRegistry.getScopeOfModule(node);
    const diagnostics = [];
    const scopeDiagnostics = this.scopeRegistry.getDiagnosticsOfModule(node);
    if (scopeDiagnostics !== null) {
      diagnostics.push(...scopeDiagnostics);
    }
    if (analysis.providersRequiringFactory !== null) {
      const providerDiagnostics = getProviderDiagnostics(analysis.providersRequiringFactory, analysis.providers, this.injectableRegistry);
      diagnostics.push(...providerDiagnostics);
    }
    const data = {
      injectorImports: []
    };
    for (const topLevelImport of analysis.imports) {
      if (topLevelImport.hasModuleWithProviders) {
        data.injectorImports.push(new WrappedNodeExpr6(topLevelImport.expression));
        continue;
      }
      const refsToEmit = [];
      let symbol = null;
      if (this.semanticDepGraphUpdater !== null) {
        const sym = this.semanticDepGraphUpdater.getSymbol(node);
        if (sym instanceof NgModuleSymbol) {
          symbol = sym;
        }
      }
      for (const ref of topLevelImport.resolvedReferences) {
        const dirMeta = this.metaReader.getDirectiveMetadata(ref);
        if (dirMeta !== null) {
          if (!dirMeta.isComponent) {
            continue;
          }
          const mayExportProviders = this.exportedProviderStatusResolver.mayExportProviders(dirMeta.ref, (importRef) => {
            if (symbol !== null && this.semanticDepGraphUpdater !== null) {
              const importSymbol = this.semanticDepGraphUpdater.getSymbol(importRef.node);
              symbol.addTransitiveImportFromStandaloneComponent(importSymbol);
            }
          });
          if (!mayExportProviders) {
            continue;
          }
        }
        const pipeMeta = dirMeta === null ? this.metaReader.getPipeMetadata(ref) : null;
        if (pipeMeta !== null) {
          continue;
        }
        refsToEmit.push(ref);
      }
      if (refsToEmit.length === topLevelImport.resolvedReferences.length) {
        data.injectorImports.push(new WrappedNodeExpr6(topLevelImport.expression));
      } else {
        const context = node.getSourceFile();
        for (const ref of refsToEmit) {
          const emittedRef = this.refEmitter.emit(ref, context);
          assertSuccessfulReferenceEmit(emittedRef, topLevelImport.expression, "class");
          data.injectorImports.push(emittedRef.expression);
        }
      }
    }
    if (scope !== null && !scope.compilation.isPoisoned) {
      const context = getSourceFile(node);
      for (const exportRef of analysis.exports) {
        if (isNgModule(exportRef.node, scope.compilation)) {
          const type = this.refEmitter.emit(exportRef, context);
          assertSuccessfulReferenceEmit(type, node, "NgModule");
          data.injectorImports.push(type.expression);
        }
      }
      for (const decl of analysis.declarations) {
        const dirMeta = this.metaReader.getDirectiveMetadata(decl);
        if (dirMeta !== null) {
          const refType = dirMeta.isComponent ? "Component" : "Directive";
          if (dirMeta.selector === null) {
            throw new FatalDiagnosticError(ErrorCode.DIRECTIVE_MISSING_SELECTOR, decl.node, `${refType} ${decl.node.name.text} has no selector, please add it!`);
          }
          continue;
        }
      }
    }
    if (diagnostics.length > 0) {
      return { diagnostics };
    }
    if (scope === null || scope.compilation.isPoisoned || scope.exported.isPoisoned || scope.reexports === null) {
      return { data };
    } else {
      return {
        data,
        reexports: scope.reexports
      };
    }
  }
  compileFull(node, { inj, mod, fac, classMetadata, declarations, remoteScopesMayRequireCycleProtection }, { injectorImports }) {
    const factoryFn = compileNgFactoryDefField(fac);
    const ngInjectorDef = compileInjector({
      ...inj,
      imports: injectorImports
    });
    const ngModuleDef = compileNgModule(mod);
    const statements = ngModuleDef.statements;
    const metadata = classMetadata !== null ? compileClassMetadata2(classMetadata) : null;
    this.insertMetadataStatement(statements, metadata);
    this.appendRemoteScopingStatements(statements, node, declarations, remoteScopesMayRequireCycleProtection);
    return this.compileNgModule(factoryFn, ngInjectorDef, ngModuleDef);
  }
  compilePartial(node, { inj, fac, mod, classMetadata }, { injectorImports }) {
    const factoryFn = compileDeclareFactory(fac);
    const injectorDef = compileDeclareInjectorFromMetadata({
      ...inj,
      imports: injectorImports
    });
    const ngModuleDef = compileDeclareNgModuleFromMetadata(mod);
    const metadata = classMetadata !== null ? compileDeclareClassMetadata2(classMetadata) : null;
    this.insertMetadataStatement(ngModuleDef.statements, metadata);
    return this.compileNgModule(factoryFn, injectorDef, ngModuleDef);
  }
  compileLocal(node, { inj, mod, fac, classMetadata, declarations, remoteScopesMayRequireCycleProtection }) {
    const factoryFn = compileNgFactoryDefField(fac);
    const ngInjectorDef = compileInjector({
      ...inj,
      imports: []
    });
    const ngModuleDef = compileNgModule(mod);
    const statements = ngModuleDef.statements;
    const metadata = classMetadata !== null ? compileClassMetadata2(classMetadata) : null;
    this.insertMetadataStatement(statements, metadata);
    this.appendRemoteScopingStatements(statements, node, declarations, remoteScopesMayRequireCycleProtection);
    return this.compileNgModule(factoryFn, ngInjectorDef, ngModuleDef);
  }
  insertMetadataStatement(ngModuleStatements, metadata) {
    if (metadata !== null) {
      ngModuleStatements.unshift(metadata.toStmt());
    }
  }
  appendRemoteScopingStatements(ngModuleStatements, node, declarations, remoteScopesMayRequireCycleProtection) {
    const context = getSourceFile(node);
    for (const decl of declarations) {
      const remoteScope = this.scopeRegistry.getRemoteScope(decl.node);
      if (remoteScope !== null) {
        const directives = remoteScope.directives.map((directive) => {
          const type = this.refEmitter.emit(directive, context);
          assertSuccessfulReferenceEmit(type, node, "directive");
          return type.expression;
        });
        const pipes = remoteScope.pipes.map((pipe) => {
          const type = this.refEmitter.emit(pipe, context);
          assertSuccessfulReferenceEmit(type, node, "pipe");
          return type.expression;
        });
        const directiveArray = new LiteralArrayExpr2(directives);
        const pipesArray = new LiteralArrayExpr2(pipes);
        const directiveExpr = remoteScopesMayRequireCycleProtection && directives.length > 0 ? new FunctionExpr2([], [new ReturnStatement2(directiveArray)]) : directiveArray;
        const pipesExpr = remoteScopesMayRequireCycleProtection && pipes.length > 0 ? new FunctionExpr2([], [new ReturnStatement2(pipesArray)]) : pipesArray;
        const componentType = this.refEmitter.emit(decl, context);
        assertSuccessfulReferenceEmit(componentType, node, "component");
        const declExpr = componentType.expression;
        const setComponentScope = new ExternalExpr5(R3Identifiers.setComponentScope);
        const callExpr = new InvokeFunctionExpr(setComponentScope, [declExpr, directiveExpr, pipesExpr]);
        ngModuleStatements.push(callExpr.toStmt());
      }
    }
  }
  compileNgModule(factoryFn, injectorDef, ngModuleDef) {
    const res = [
      factoryFn,
      {
        name: "\u0275mod",
        initializer: ngModuleDef.expression,
        statements: ngModuleDef.statements,
        type: ngModuleDef.type,
        deferrableImports: null
      },
      {
        name: "\u0275inj",
        initializer: injectorDef.expression,
        statements: injectorDef.statements,
        type: injectorDef.type,
        deferrableImports: null
      }
    ];
    return res;
  }
  _toR3Reference(origin, valueRef, valueContext) {
    if (valueRef.hasOwningModuleGuess) {
      return toR3Reference(origin, valueRef, valueContext, this.refEmitter);
    } else {
      return toR3Reference(origin, valueRef, valueContext, this.refEmitter);
    }
  }
  isClassDeclarationReference(ref) {
    return this.reflector.isClass(ref.node);
  }
  resolveTypeList(expr, resolvedList, className, arrayName, absoluteIndex) {
    let hasModuleWithProviders = false;
    const refList = [];
    if (!Array.isArray(resolvedList)) {
      throw createValueHasWrongTypeError(expr, resolvedList, `Expected array when reading the NgModule.${arrayName} of ${className}`);
    }
    for (let idx = 0; idx < resolvedList.length; idx++) {
      let entry = resolvedList[idx];
      if (entry instanceof SyntheticValue && isResolvedModuleWithProviders(entry)) {
        entry = entry.value.ngModule;
        hasModuleWithProviders = true;
      } else if (entry instanceof Map && entry.has("ngModule")) {
        entry = entry.get("ngModule");
        hasModuleWithProviders = true;
      }
      if (Array.isArray(entry)) {
        const recursiveResult = this.resolveTypeList(expr, entry, className, arrayName, absoluteIndex);
        refList.push(...recursiveResult.references);
        absoluteIndex += recursiveResult.references.length;
        hasModuleWithProviders = hasModuleWithProviders || recursiveResult.hasModuleWithProviders;
      } else if (entry instanceof Reference) {
        if (!this.isClassDeclarationReference(entry)) {
          throw createValueHasWrongTypeError(entry.node, entry, `Value at position ${absoluteIndex} in the NgModule.${arrayName} of ${className} is not a class`);
        }
        refList.push(entry);
        absoluteIndex += 1;
      } else {
        throw createValueHasWrongTypeError(expr, entry, `Value at position ${absoluteIndex} in the NgModule.${arrayName} of ${className} is not a reference`);
      }
    }
    return {
      references: refList,
      hasModuleWithProviders
    };
  }
};
function isNgModule(node, compilation) {
  return !compilation.dependencies.some((dep) => dep.ref.node === node);
}
function isModuleIdExpression(expr) {
  return ts22.isPropertyAccessExpression(expr) && ts22.isIdentifier(expr.expression) && expr.expression.text === "module" && expr.name.text === "id";
}
function makeStandaloneBootstrapDiagnostic(ngModuleClass, bootstrappedClassRef, rawBootstrapExpr) {
  const componentClassName = bootstrappedClassRef.node.name.text;
  const message = `The \`${componentClassName}\` class is a standalone component, which can not be used in the \`@NgModule.bootstrap\` array. Use the \`bootstrapApplication\` function for bootstrap instead.`;
  const relatedInformation = [makeRelatedInformation(ngModuleClass, `The 'bootstrap' array is present on this NgModule.`)];
  return makeDiagnostic(ErrorCode.NGMODULE_BOOTSTRAP_IS_STANDALONE, getDiagnosticNode(bootstrappedClassRef, rawBootstrapExpr), message, relatedInformation);
}
function isSyntheticReference(ref) {
  return ref.synthetic;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/component/src/diagnostics.mjs
function makeCyclicImportInfo(ref, type, cycle) {
  const name = ref.debugName || "(unknown)";
  const path = cycle.getPath().map((sf) => sf.fileName).join(" -> ");
  const message = `The ${type} '${name}' is used in the template but importing it would create a cycle: `;
  return makeRelatedInformation(ref.node, message + path);
}
function checkCustomElementSelectorForErrors(selector) {
  if (selector.includes(".") || selector.includes("[") && selector.includes("]")) {
    return null;
  }
  if (!/^[a-z]/.test(selector)) {
    return "Selector of a ShadowDom-encapsulated component must start with a lower case letter.";
  }
  if (/[A-Z]/.test(selector)) {
    return "Selector of a ShadowDom-encapsulated component must all be in lower case.";
  }
  if (!selector.includes("-")) {
    return "Selector of a component that uses ViewEncapsulation.ShadowDom must contain a hyphen.";
  }
  return null;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/component/src/resources.mjs
import { DEFAULT_INTERPOLATION_CONFIG, InterpolationConfig, ParseSourceFile as ParseSourceFile2, parseTemplate } from "@angular/compiler";
import ts23 from "typescript";
function getTemplateDeclarationNodeForError(declaration) {
  return declaration.isInline ? declaration.expression : declaration.templateUrlExpression;
}
function extractTemplate(node, template, evaluator, depTracker, resourceLoader, options) {
  if (template.isInline) {
    let sourceStr;
    let sourceParseRange = null;
    let templateContent;
    let sourceMapping;
    let escapedString = false;
    let sourceMapUrl;
    if (ts23.isStringLiteral(template.expression) || ts23.isNoSubstitutionTemplateLiteral(template.expression)) {
      sourceParseRange = getTemplateRange(template.expression);
      sourceStr = template.expression.getSourceFile().text;
      templateContent = template.expression.text;
      escapedString = true;
      sourceMapping = {
        type: "direct",
        node: template.expression
      };
      sourceMapUrl = template.resolvedTemplateUrl;
    } else {
      const resolvedTemplate = evaluator.evaluate(template.expression);
      if (typeof resolvedTemplate !== "string") {
        throw createValueHasWrongTypeError(template.expression, resolvedTemplate, "template must be a string");
      }
      sourceStr = resolvedTemplate;
      templateContent = resolvedTemplate;
      sourceMapping = {
        type: "indirect",
        node: template.expression,
        componentClass: node,
        template: templateContent
      };
      sourceMapUrl = null;
    }
    return {
      ...parseExtractedTemplate(template, sourceStr, sourceParseRange, escapedString, sourceMapUrl, options),
      content: templateContent,
      sourceMapping,
      declaration: template
    };
  } else {
    const templateContent = resourceLoader.load(template.resolvedTemplateUrl);
    if (depTracker !== null) {
      depTracker.addResourceDependency(node.getSourceFile(), absoluteFrom(template.resolvedTemplateUrl));
    }
    return {
      ...parseExtractedTemplate(
        template,
        templateContent,
        null,
        false,
        template.resolvedTemplateUrl,
        options
      ),
      content: templateContent,
      sourceMapping: {
        type: "external",
        componentClass: node,
        node: template.templateUrlExpression,
        template: templateContent,
        templateUrl: template.resolvedTemplateUrl
      },
      declaration: template
    };
  }
}
function parseExtractedTemplate(template, sourceStr, sourceParseRange, escapedString, sourceMapUrl, options) {
  const i18nNormalizeLineEndingsInICUs = escapedString || options.i18nNormalizeLineEndingsInICUs;
  const parsedTemplate = parseTemplate(sourceStr, sourceMapUrl != null ? sourceMapUrl : "", {
    preserveWhitespaces: template.preserveWhitespaces,
    interpolationConfig: template.interpolationConfig,
    range: sourceParseRange != null ? sourceParseRange : void 0,
    escapedString,
    enableI18nLegacyMessageIdFormat: options.enableI18nLegacyMessageIdFormat,
    i18nNormalizeLineEndingsInICUs,
    alwaysAttemptHtmlToR3AstConversion: options.usePoisonedData,
    enabledBlockTypes: options.enabledBlockTypes
  });
  const { nodes: diagNodes } = parseTemplate(sourceStr, sourceMapUrl != null ? sourceMapUrl : "", {
    preserveWhitespaces: true,
    preserveLineEndings: true,
    interpolationConfig: template.interpolationConfig,
    range: sourceParseRange != null ? sourceParseRange : void 0,
    escapedString,
    enableI18nLegacyMessageIdFormat: options.enableI18nLegacyMessageIdFormat,
    i18nNormalizeLineEndingsInICUs,
    leadingTriviaChars: [],
    alwaysAttemptHtmlToR3AstConversion: options.usePoisonedData
  });
  return {
    ...parsedTemplate,
    diagNodes,
    file: new ParseSourceFile2(sourceStr, sourceMapUrl != null ? sourceMapUrl : "")
  };
}
function parseTemplateDeclaration(node, decorator, component, containingFile, evaluator, depTracker, resourceLoader, defaultPreserveWhitespaces) {
  let preserveWhitespaces = defaultPreserveWhitespaces;
  if (component.has("preserveWhitespaces")) {
    const expr = component.get("preserveWhitespaces");
    const value = evaluator.evaluate(expr);
    if (typeof value !== "boolean") {
      throw createValueHasWrongTypeError(expr, value, "preserveWhitespaces must be a boolean");
    }
    preserveWhitespaces = value;
  }
  let interpolationConfig = DEFAULT_INTERPOLATION_CONFIG;
  if (component.has("interpolation")) {
    const expr = component.get("interpolation");
    const value = evaluator.evaluate(expr);
    if (!Array.isArray(value) || value.length !== 2 || !value.every((element) => typeof element === "string")) {
      throw createValueHasWrongTypeError(expr, value, "interpolation must be an array with 2 elements of string type");
    }
    interpolationConfig = InterpolationConfig.fromArray(value);
  }
  if (component.has("templateUrl")) {
    const templateUrlExpr = component.get("templateUrl");
    const templateUrl = evaluator.evaluate(templateUrlExpr);
    if (typeof templateUrl !== "string") {
      throw createValueHasWrongTypeError(templateUrlExpr, templateUrl, "templateUrl must be a string");
    }
    try {
      const resourceUrl = resourceLoader.resolve(templateUrl, containingFile);
      return {
        isInline: false,
        interpolationConfig,
        preserveWhitespaces,
        templateUrl,
        templateUrlExpression: templateUrlExpr,
        resolvedTemplateUrl: resourceUrl
      };
    } catch (e) {
      if (depTracker !== null) {
        depTracker.recordDependencyAnalysisFailure(node.getSourceFile());
      }
      throw makeResourceNotFoundError(templateUrl, templateUrlExpr, 0);
    }
  } else if (component.has("template")) {
    return {
      isInline: true,
      interpolationConfig,
      preserveWhitespaces,
      expression: component.get("template"),
      templateUrl: containingFile,
      resolvedTemplateUrl: containingFile
    };
  } else {
    throw new FatalDiagnosticError(ErrorCode.COMPONENT_MISSING_TEMPLATE, decorator.node, "component is missing a template");
  }
}
function preloadAndParseTemplate(evaluator, resourceLoader, depTracker, preanalyzeTemplateCache, node, decorator, component, containingFile, defaultPreserveWhitespaces, options) {
  if (component.has("templateUrl")) {
    const templateUrlExpr = component.get("templateUrl");
    const templateUrl = evaluator.evaluate(templateUrlExpr);
    if (typeof templateUrl !== "string") {
      throw createValueHasWrongTypeError(templateUrlExpr, templateUrl, "templateUrl must be a string");
    }
    try {
      const resourceUrl = resourceLoader.resolve(templateUrl, containingFile);
      const templatePromise = resourceLoader.preload(resourceUrl, { type: "template", containingFile });
      if (templatePromise !== void 0) {
        return templatePromise.then(() => {
          const templateDecl = parseTemplateDeclaration(node, decorator, component, containingFile, evaluator, depTracker, resourceLoader, defaultPreserveWhitespaces);
          const template = extractTemplate(node, templateDecl, evaluator, depTracker, resourceLoader, options);
          preanalyzeTemplateCache.set(node, template);
          return template;
        });
      } else {
        return Promise.resolve(null);
      }
    } catch (e) {
      if (depTracker !== null) {
        depTracker.recordDependencyAnalysisFailure(node.getSourceFile());
      }
      throw makeResourceNotFoundError(templateUrl, templateUrlExpr, 0);
    }
  } else {
    const templateDecl = parseTemplateDeclaration(node, decorator, component, containingFile, evaluator, depTracker, resourceLoader, defaultPreserveWhitespaces);
    const template = extractTemplate(node, templateDecl, evaluator, depTracker, resourceLoader, options);
    preanalyzeTemplateCache.set(node, template);
    return Promise.resolve(template);
  }
}
function getTemplateRange(templateExpr) {
  const startPos = templateExpr.getStart() + 1;
  const { line, character } = ts23.getLineAndCharacterOfPosition(templateExpr.getSourceFile(), startPos);
  return {
    startPos,
    startLine: line,
    startCol: character,
    endPos: templateExpr.getEnd() - 1
  };
}
function makeResourceNotFoundError(file, nodeForError, resourceType) {
  let errorText;
  switch (resourceType) {
    case 0:
      errorText = `Could not find template file '${file}'.`;
      break;
    case 1:
      errorText = `Could not find stylesheet file '${file}' linked from the template.`;
      break;
    case 2:
      errorText = `Could not find stylesheet file '${file}'.`;
      break;
  }
  return new FatalDiagnosticError(ErrorCode.COMPONENT_RESOURCE_NOT_FOUND, nodeForError, errorText);
}
function transformDecoratorResources(dec, component, styles, template) {
  if (dec.name !== "Component") {
    return dec;
  }
  if (!component.has("templateUrl") && !component.has("styleUrls") && !component.has("styles")) {
    return dec;
  }
  const metadata = new Map(component);
  if (metadata.has("templateUrl")) {
    metadata.delete("templateUrl");
    metadata.set("template", ts23.factory.createStringLiteral(template.content));
  }
  if (metadata.has("styleUrls") || metadata.has("styles")) {
    metadata.delete("styles");
    metadata.delete("styleUrls");
    if (styles.length > 0) {
      const styleNodes = styles.reduce((result, style) => {
        if (style.trim().length > 0) {
          result.push(ts23.factory.createStringLiteral(style));
        }
        return result;
      }, []);
      if (styleNodes.length > 0) {
        metadata.set("styles", ts23.factory.createArrayLiteralExpression(styleNodes));
      }
    }
  }
  const newMetadataFields = [];
  for (const [name, value] of metadata.entries()) {
    newMetadataFields.push(ts23.factory.createPropertyAssignment(name, value));
  }
  return { ...dec, args: [ts23.factory.createObjectLiteralExpression(newMetadataFields)] };
}
function extractComponentStyleUrls(evaluator, component) {
  if (!component.has("styleUrls")) {
    return [];
  }
  return extractStyleUrlsFromExpression(evaluator, component.get("styleUrls"));
}
function extractStyleUrlsFromExpression(evaluator, styleUrlsExpr) {
  const styleUrls = [];
  if (ts23.isArrayLiteralExpression(styleUrlsExpr)) {
    for (const styleUrlExpr of styleUrlsExpr.elements) {
      if (ts23.isSpreadElement(styleUrlExpr)) {
        styleUrls.push(...extractStyleUrlsFromExpression(evaluator, styleUrlExpr.expression));
      } else {
        const styleUrl = evaluator.evaluate(styleUrlExpr);
        if (typeof styleUrl !== "string") {
          throw createValueHasWrongTypeError(styleUrlExpr, styleUrl, "styleUrl must be a string");
        }
        styleUrls.push({
          url: styleUrl,
          source: 2,
          nodeForError: styleUrlExpr
        });
      }
    }
  } else {
    const evaluatedStyleUrls = evaluator.evaluate(styleUrlsExpr);
    if (!isStringArray(evaluatedStyleUrls)) {
      throw createValueHasWrongTypeError(styleUrlsExpr, evaluatedStyleUrls, "styleUrls must be an array of strings");
    }
    for (const styleUrl of evaluatedStyleUrls) {
      styleUrls.push({
        url: styleUrl,
        source: 2,
        nodeForError: styleUrlsExpr
      });
    }
  }
  return styleUrls;
}
function extractStyleResources(resourceLoader, component, containingFile) {
  const styles = /* @__PURE__ */ new Set();
  function stringLiteralElements(array) {
    return array.elements.filter((e) => ts23.isStringLiteralLike(e));
  }
  const styleUrlsExpr = component.get("styleUrls");
  if (styleUrlsExpr !== void 0 && ts23.isArrayLiteralExpression(styleUrlsExpr)) {
    for (const expression of stringLiteralElements(styleUrlsExpr)) {
      try {
        const resourceUrl = resourceLoader.resolve(expression.text, containingFile);
        styles.add({ path: absoluteFrom(resourceUrl), expression });
      } catch {
      }
    }
  }
  const stylesExpr = component.get("styles");
  if (stylesExpr !== void 0 && ts23.isArrayLiteralExpression(stylesExpr)) {
    for (const expression of stringLiteralElements(stylesExpr)) {
      styles.add({ path: null, expression });
    }
  }
  return styles;
}
function _extractTemplateStyleUrls(template) {
  if (template.styleUrls === null) {
    return [];
  }
  const nodeForError = getTemplateDeclarationNodeForError(template.declaration);
  return template.styleUrls.map((url) => ({ url, source: 1, nodeForError }));
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/component/src/symbol.mjs
var ComponentSymbol = class extends DirectiveSymbol {
  constructor() {
    super(...arguments);
    this.usedDirectives = [];
    this.usedPipes = [];
    this.isRemotelyScoped = false;
  }
  isEmitAffected(previousSymbol, publicApiAffected) {
    if (!(previousSymbol instanceof ComponentSymbol)) {
      return true;
    }
    const isSymbolUnaffected = (current, previous) => isReferenceEqual(current, previous) && !publicApiAffected.has(current.symbol);
    return this.isRemotelyScoped !== previousSymbol.isRemotelyScoped || !isArrayEqual(this.usedDirectives, previousSymbol.usedDirectives, isSymbolUnaffected) || !isArrayEqual(this.usedPipes, previousSymbol.usedPipes, isSymbolUnaffected);
  }
  isTypeCheckBlockAffected(previousSymbol, typeCheckApiAffected) {
    if (!(previousSymbol instanceof ComponentSymbol)) {
      return true;
    }
    const isInheritanceChainAffected = (symbol) => {
      let currentSymbol = symbol;
      while (currentSymbol instanceof DirectiveSymbol) {
        if (typeCheckApiAffected.has(currentSymbol)) {
          return true;
        }
        currentSymbol = currentSymbol.baseClass;
      }
      return false;
    };
    const isDirectiveUnaffected = (current, previous) => isReferenceEqual(current, previous) && !isInheritanceChainAffected(current.symbol);
    const isPipeUnaffected = (current, previous) => isReferenceEqual(current, previous) && !typeCheckApiAffected.has(current.symbol);
    return !isArrayEqual(this.usedDirectives, previousSymbol.usedDirectives, isDirectiveUnaffected) || !isArrayEqual(this.usedPipes, previousSymbol.usedPipes, isPipeUnaffected);
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/component/src/util.mjs
function collectAnimationNames(value, animationTriggerNames) {
  if (value instanceof Map) {
    const name = value.get("name");
    if (typeof name === "string") {
      animationTriggerNames.staticTriggerNames.push(name);
    } else {
      animationTriggerNames.includesDynamicAnimations = true;
    }
  } else if (Array.isArray(value)) {
    for (const resolvedValue of value) {
      collectAnimationNames(resolvedValue, animationTriggerNames);
    }
  } else {
    animationTriggerNames.includesDynamicAnimations = true;
  }
}
function isAngularAnimationsReference(reference, symbolName) {
  return reference.ownedByModuleGuess === "@angular/animations" && reference.debugName === symbolName;
}
var animationTriggerResolver = (fn, node, resolve, unresolvable) => {
  const animationTriggerMethodName = "trigger";
  if (!isAngularAnimationsReference(fn, animationTriggerMethodName)) {
    return unresolvable;
  }
  const triggerNameExpression = node.arguments[0];
  if (!triggerNameExpression) {
    return unresolvable;
  }
  const res = /* @__PURE__ */ new Map();
  res.set("name", resolve(triggerNameExpression));
  return res;
};
function validateAndFlattenComponentImports(imports, expr) {
  const flattened = [];
  if (!Array.isArray(imports)) {
    const error = createValueHasWrongTypeError(expr, imports, `'imports' must be an array of components, directives, pipes, or NgModules.`).toDiagnostic();
    return {
      imports: [],
      diagnostics: [error]
    };
  }
  const diagnostics = [];
  for (const ref of imports) {
    if (Array.isArray(ref)) {
      const { imports: childImports, diagnostics: childDiagnostics } = validateAndFlattenComponentImports(ref, expr);
      flattened.push(...childImports);
      diagnostics.push(...childDiagnostics);
    } else if (ref instanceof Reference) {
      if (isNamedClassDeclaration(ref.node)) {
        flattened.push(ref);
      } else {
        diagnostics.push(createValueHasWrongTypeError(ref.getOriginForDiagnostics(expr), ref, `'imports' must be an array of components, directives, pipes, or NgModules.`).toDiagnostic());
      }
    } else if (isLikelyModuleWithProviders(ref)) {
      let origin = expr;
      if (ref instanceof SyntheticValue) {
        origin = getOriginNodeForDiagnostics(ref.value.mwpCall, expr);
      }
      diagnostics.push(makeDiagnostic(ErrorCode.COMPONENT_UNKNOWN_IMPORT, origin, `'imports' contains a ModuleWithProviders value, likely the result of a 'Module.forRoot()'-style call. These calls are not used to configure components and are not valid in standalone component imports - consider importing them in the application bootstrap instead.`));
    } else {
      diagnostics.push(createValueHasWrongTypeError(expr, imports, `'imports' must be an array of components, directives, pipes, or NgModules.`).toDiagnostic());
    }
  }
  return { imports: flattened, diagnostics };
}
function isLikelyModuleWithProviders(value) {
  if (value instanceof SyntheticValue && isResolvedModuleWithProviders(value)) {
    return true;
  }
  if (value instanceof Map && value.has("ngModule")) {
    return true;
  }
  return false;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/component/src/handler.mjs
var EMPTY_ARRAY2 = [];
var isUsedDirective = (decl) => decl.kind === R3TemplateDependencyKind.Directive;
var isUsedPipe = (decl) => decl.kind === R3TemplateDependencyKind.Pipe;
var ComponentDecoratorHandler = class {
  constructor(reflector, evaluator, metaRegistry, metaReader, scopeReader, dtsScopeReader, scopeRegistry, typeCheckScopeRegistry, resourceRegistry, isCore, strictCtorDeps, resourceLoader, rootDirs, defaultPreserveWhitespaces, i18nUseExternalIds, enableI18nLegacyMessageIdFormat, usePoisonedData, i18nNormalizeLineEndingsInICUs, enabledBlockTypes, moduleResolver, cycleAnalyzer, cycleHandlingStrategy, refEmitter, referencesRegistry, depTracker, injectableRegistry, semanticDepGraphUpdater, annotateForClosureCompiler, perf, hostDirectivesResolver, includeClassMetadata, compilationMode, deferredSymbolTracker) {
    this.reflector = reflector;
    this.evaluator = evaluator;
    this.metaRegistry = metaRegistry;
    this.metaReader = metaReader;
    this.scopeReader = scopeReader;
    this.dtsScopeReader = dtsScopeReader;
    this.scopeRegistry = scopeRegistry;
    this.typeCheckScopeRegistry = typeCheckScopeRegistry;
    this.resourceRegistry = resourceRegistry;
    this.isCore = isCore;
    this.strictCtorDeps = strictCtorDeps;
    this.resourceLoader = resourceLoader;
    this.rootDirs = rootDirs;
    this.defaultPreserveWhitespaces = defaultPreserveWhitespaces;
    this.i18nUseExternalIds = i18nUseExternalIds;
    this.enableI18nLegacyMessageIdFormat = enableI18nLegacyMessageIdFormat;
    this.usePoisonedData = usePoisonedData;
    this.i18nNormalizeLineEndingsInICUs = i18nNormalizeLineEndingsInICUs;
    this.enabledBlockTypes = enabledBlockTypes;
    this.moduleResolver = moduleResolver;
    this.cycleAnalyzer = cycleAnalyzer;
    this.cycleHandlingStrategy = cycleHandlingStrategy;
    this.refEmitter = refEmitter;
    this.referencesRegistry = referencesRegistry;
    this.depTracker = depTracker;
    this.injectableRegistry = injectableRegistry;
    this.semanticDepGraphUpdater = semanticDepGraphUpdater;
    this.annotateForClosureCompiler = annotateForClosureCompiler;
    this.perf = perf;
    this.hostDirectivesResolver = hostDirectivesResolver;
    this.includeClassMetadata = includeClassMetadata;
    this.compilationMode = compilationMode;
    this.deferredSymbolTracker = deferredSymbolTracker;
    this.literalCache = /* @__PURE__ */ new Map();
    this.elementSchemaRegistry = new DomElementSchemaRegistry();
    this.preanalyzeTemplateCache = /* @__PURE__ */ new Map();
    this.preanalyzeStylesCache = /* @__PURE__ */ new Map();
    this.precedence = HandlerPrecedence.PRIMARY;
    this.name = "ComponentDecoratorHandler";
    this.extractTemplateOptions = {
      enableI18nLegacyMessageIdFormat: this.enableI18nLegacyMessageIdFormat,
      i18nNormalizeLineEndingsInICUs: this.i18nNormalizeLineEndingsInICUs,
      usePoisonedData: this.usePoisonedData,
      enabledBlockTypes: this.enabledBlockTypes
    };
  }
  detect(node, decorators) {
    if (!decorators) {
      return void 0;
    }
    const decorator = findAngularDecorator(decorators, "Component", this.isCore);
    if (decorator !== void 0) {
      return {
        trigger: decorator.node,
        decorator,
        metadata: decorator
      };
    } else {
      return void 0;
    }
  }
  preanalyze(node, decorator) {
    if (!this.resourceLoader.canPreload) {
      return void 0;
    }
    const meta = resolveLiteral(decorator, this.literalCache);
    const component = reflectObjectLiteral(meta);
    const containingFile = node.getSourceFile().fileName;
    const resolveStyleUrl = (styleUrl) => {
      try {
        const resourceUrl = this.resourceLoader.resolve(styleUrl, containingFile);
        return this.resourceLoader.preload(resourceUrl, { type: "style", containingFile });
      } catch {
        return void 0;
      }
    };
    const templateAndTemplateStyleResources = preloadAndParseTemplate(this.evaluator, this.resourceLoader, this.depTracker, this.preanalyzeTemplateCache, node, decorator, component, containingFile, this.defaultPreserveWhitespaces, this.extractTemplateOptions).then((template) => {
      if (template === null) {
        return void 0;
      }
      return Promise.all(template.styleUrls.map((styleUrl) => resolveStyleUrl(styleUrl))).then(() => void 0);
    });
    const componentStyleUrls = extractComponentStyleUrls(this.evaluator, component);
    let inlineStyles;
    if (component.has("styles")) {
      const litStyles = parseFieldStringArrayValue(component, "styles", this.evaluator);
      if (litStyles === null) {
        this.preanalyzeStylesCache.set(node, null);
      } else {
        inlineStyles = Promise.all(litStyles.map((style) => this.resourceLoader.preprocessInline(style, { type: "style", containingFile }))).then((styles) => {
          this.preanalyzeStylesCache.set(node, styles);
        });
      }
    } else {
      this.preanalyzeStylesCache.set(node, null);
    }
    return Promise.all([
      templateAndTemplateStyleResources,
      inlineStyles,
      ...componentStyleUrls.map((styleUrl) => resolveStyleUrl(styleUrl.url))
    ]).then(() => void 0);
  }
  analyze(node, decorator) {
    var _a, _b, _c, _d;
    this.perf.eventCount(PerfEvent.AnalyzeComponent);
    const containingFile = node.getSourceFile().fileName;
    this.literalCache.delete(decorator);
    let diagnostics;
    let isPoisoned = false;
    const directiveResult = extractDirectiveMetadata(node, decorator, this.reflector, this.evaluator, this.refEmitter, this.referencesRegistry, this.isCore, this.annotateForClosureCompiler, this.elementSchemaRegistry.getDefaultComponentElementName());
    if (directiveResult === void 0) {
      return {};
    }
    const { decorator: component, metadata, inputs, outputs, hostDirectives, rawHostDirectives } = directiveResult;
    const encapsulation = (_a = resolveEnumValue(this.evaluator, component, "encapsulation", "ViewEncapsulation")) != null ? _a : ViewEncapsulation.Emulated;
    const changeDetection = resolveEnumValue(this.evaluator, component, "changeDetection", "ChangeDetectionStrategy");
    let animations = null;
    let animationTriggerNames = null;
    if (component.has("animations")) {
      const animationExpression = component.get("animations");
      animations = new WrappedNodeExpr7(animationExpression);
      const animationsValue = this.evaluator.evaluate(animationExpression, animationTriggerResolver);
      animationTriggerNames = { includesDynamicAnimations: false, staticTriggerNames: [] };
      collectAnimationNames(animationsValue, animationTriggerNames);
    }
    const relativeContextFilePath = this.rootDirs.reduce((previous, rootDir) => {
      const candidate = relative(absoluteFrom(rootDir), absoluteFrom(containingFile));
      if (previous === void 0 || candidate.length < previous.length) {
        return candidate;
      } else {
        return previous;
      }
    }, void 0);
    let viewProvidersRequiringFactory = null;
    let providersRequiringFactory = null;
    let wrappedViewProviders = null;
    if (component.has("viewProviders")) {
      const viewProviders = component.get("viewProviders");
      viewProvidersRequiringFactory = resolveProvidersRequiringFactory(viewProviders, this.reflector, this.evaluator);
      wrappedViewProviders = new WrappedNodeExpr7(this.annotateForClosureCompiler ? wrapFunctionExpressionsInParens(viewProviders) : viewProviders);
    }
    if (component.has("providers")) {
      providersRequiringFactory = resolveProvidersRequiringFactory(component.get("providers"), this.reflector, this.evaluator);
    }
    let resolvedImports = null;
    let rawImports = (_b = component.get("imports")) != null ? _b : null;
    if (rawImports && !metadata.isStandalone) {
      if (diagnostics === void 0) {
        diagnostics = [];
      }
      diagnostics.push(makeDiagnostic(ErrorCode.COMPONENT_NOT_STANDALONE, component.get("imports"), `'imports' is only valid on a component that is standalone.`, [makeRelatedInformation(node.name, `Did you forget to add 'standalone: true' to this @Component?`)]));
      isPoisoned = true;
    } else if (this.compilationMode !== CompilationMode.LOCAL && rawImports) {
      const expr = rawImports;
      const importResolvers = combineResolvers([
        createModuleWithProvidersResolver(this.reflector, this.isCore),
        forwardRefResolver
      ]);
      const imported = this.evaluator.evaluate(expr, importResolvers);
      const { imports: flattened, diagnostics: importDiagnostics } = validateAndFlattenComponentImports(imported, expr);
      resolvedImports = flattened;
      rawImports = expr;
      if (importDiagnostics.length > 0) {
        isPoisoned = true;
        if (diagnostics === void 0) {
          diagnostics = [];
        }
        diagnostics.push(...importDiagnostics);
      }
    }
    let schemas = null;
    if (component.has("schemas") && !metadata.isStandalone) {
      if (diagnostics === void 0) {
        diagnostics = [];
      }
      diagnostics.push(makeDiagnostic(ErrorCode.COMPONENT_NOT_STANDALONE, component.get("schemas"), `'schemas' is only valid on a component that is standalone.`));
    } else if (this.compilationMode !== CompilationMode.LOCAL && component.has("schemas")) {
      schemas = extractSchemas(component.get("schemas"), this.evaluator, "Component");
    } else if (metadata.isStandalone) {
      schemas = [];
    }
    let template;
    if (this.preanalyzeTemplateCache.has(node)) {
      const preanalyzed = this.preanalyzeTemplateCache.get(node);
      this.preanalyzeTemplateCache.delete(node);
      template = preanalyzed;
    } else {
      const templateDecl = parseTemplateDeclaration(node, decorator, component, containingFile, this.evaluator, this.depTracker, this.resourceLoader, this.defaultPreserveWhitespaces);
      template = extractTemplate(node, templateDecl, this.evaluator, this.depTracker, this.resourceLoader, {
        enableI18nLegacyMessageIdFormat: this.enableI18nLegacyMessageIdFormat,
        i18nNormalizeLineEndingsInICUs: this.i18nNormalizeLineEndingsInICUs,
        usePoisonedData: this.usePoisonedData,
        enabledBlockTypes: this.enabledBlockTypes
      });
    }
    const templateResource = template.declaration.isInline ? { path: null, expression: component.get("template") } : {
      path: absoluteFrom(template.declaration.resolvedTemplateUrl),
      expression: template.sourceMapping.node
    };
    let styles = [];
    const styleResources = extractStyleResources(this.resourceLoader, component, containingFile);
    const styleUrls = [
      ...extractComponentStyleUrls(this.evaluator, component),
      ..._extractTemplateStyleUrls(template)
    ];
    for (const styleUrl of styleUrls) {
      try {
        const resourceUrl = this.resourceLoader.resolve(styleUrl.url, containingFile);
        const resourceStr = this.resourceLoader.load(resourceUrl);
        styles.push(resourceStr);
        if (this.depTracker !== null) {
          this.depTracker.addResourceDependency(node.getSourceFile(), absoluteFrom(resourceUrl));
        }
      } catch {
        if (this.depTracker !== null) {
          this.depTracker.recordDependencyAnalysisFailure(node.getSourceFile());
        }
        if (diagnostics === void 0) {
          diagnostics = [];
        }
        const resourceType = styleUrl.source === 2 ? 2 : 1;
        diagnostics.push(makeResourceNotFoundError(styleUrl.url, styleUrl.nodeForError, resourceType).toDiagnostic());
      }
    }
    if (encapsulation === ViewEncapsulation.ShadowDom && metadata.selector !== null) {
      const selectorError = checkCustomElementSelectorForErrors(metadata.selector);
      if (selectorError !== null) {
        if (diagnostics === void 0) {
          diagnostics = [];
        }
        diagnostics.push(makeDiagnostic(ErrorCode.COMPONENT_INVALID_SHADOW_DOM_SELECTOR, component.get("selector"), selectorError));
      }
    }
    let inlineStyles = null;
    if (this.preanalyzeStylesCache.has(node)) {
      inlineStyles = this.preanalyzeStylesCache.get(node);
      this.preanalyzeStylesCache.delete(node);
      if (inlineStyles !== null) {
        styles.push(...inlineStyles);
      }
    } else {
      if (this.resourceLoader.canPreprocess) {
        throw new Error("Inline resource processing requires asynchronous preanalyze.");
      }
      if (component.has("styles")) {
        const litStyles = parseFieldStringArrayValue(component, "styles", this.evaluator);
        if (litStyles !== null) {
          inlineStyles = [...litStyles];
          styles.push(...litStyles);
        }
      }
    }
    if (template.styles.length > 0) {
      styles.push(...template.styles);
    }
    const output = {
      analysis: {
        baseClass: readBaseClass(node, this.reflector, this.evaluator),
        inputs,
        outputs,
        hostDirectives,
        rawHostDirectives,
        meta: {
          ...metadata,
          template: {
            nodes: template.nodes,
            ngContentSelectors: template.ngContentSelectors
          },
          encapsulation,
          interpolation: (_c = template.interpolationConfig) != null ? _c : DEFAULT_INTERPOLATION_CONFIG2,
          styles,
          animations,
          viewProviders: wrappedViewProviders,
          i18nUseExternalIds: this.i18nUseExternalIds,
          relativeContextFilePath
        },
        typeCheckMeta: extractDirectiveTypeCheckMeta(node, inputs, this.reflector),
        classMetadata: this.includeClassMetadata ? extractClassMetadata(node, this.reflector, this.isCore, this.annotateForClosureCompiler, (dec) => transformDecoratorResources(dec, component, styles, template)) : null,
        template,
        providersRequiringFactory,
        viewProvidersRequiringFactory,
        inlineStyles,
        styleUrls,
        resources: {
          styles: styleResources,
          template: templateResource
        },
        isPoisoned,
        animationTriggerNames,
        rawImports,
        resolvedImports,
        schemas,
        decorator: (_d = decorator == null ? void 0 : decorator.node) != null ? _d : null
      },
      diagnostics
    };
    if (changeDetection !== null) {
      output.analysis.meta.changeDetection = changeDetection;
    }
    return output;
  }
  symbol(node, analysis) {
    const typeParameters = extractSemanticTypeParameters(node);
    return new ComponentSymbol(node, analysis.meta.selector, analysis.inputs, analysis.outputs, analysis.meta.exportAs, analysis.typeCheckMeta, typeParameters);
  }
  register(node, analysis) {
    const ref = new Reference(node);
    this.metaRegistry.registerDirectiveMetadata({
      kind: MetaKind.Directive,
      matchSource: MatchSource.Selector,
      ref,
      name: node.name.text,
      selector: analysis.meta.selector,
      exportAs: analysis.meta.exportAs,
      inputs: analysis.inputs,
      outputs: analysis.outputs,
      queries: analysis.meta.queries.map((query) => query.propertyName),
      isComponent: true,
      baseClass: analysis.baseClass,
      hostDirectives: analysis.hostDirectives,
      ...analysis.typeCheckMeta,
      isPoisoned: analysis.isPoisoned,
      isStructural: false,
      isStandalone: analysis.meta.isStandalone,
      isSignal: analysis.meta.isSignal,
      imports: analysis.resolvedImports,
      animationTriggerNames: analysis.animationTriggerNames,
      schemas: analysis.schemas,
      decorator: analysis.decorator,
      assumedToExportProviders: false
    });
    this.resourceRegistry.registerResources(analysis.resources, node);
    this.injectableRegistry.registerInjectable(node, {
      ctorDeps: analysis.meta.deps
    });
  }
  index(context, node, analysis) {
    if (analysis.isPoisoned && !this.usePoisonedData) {
      return null;
    }
    const scope = this.scopeReader.getScopeForComponent(node);
    const selector = analysis.meta.selector;
    const matcher = new SelectorMatcher2();
    if (scope !== null) {
      let { dependencies, isPoisoned } = scope.kind === ComponentScopeKind.NgModule ? scope.compilation : scope;
      if ((isPoisoned || scope.kind === ComponentScopeKind.NgModule && scope.exported.isPoisoned) && !this.usePoisonedData) {
        return null;
      }
      for (const dep of dependencies) {
        if (dep.kind === MetaKind.Directive && dep.selector !== null) {
          matcher.addSelectables(CssSelector2.parse(dep.selector), [...this.hostDirectivesResolver.resolve(dep), dep]);
        }
      }
    }
    const binder = new R3TargetBinder(matcher);
    const boundTemplate = binder.bind({ template: analysis.template.diagNodes });
    context.addComponent({
      declaration: node,
      selector,
      boundTemplate,
      templateMeta: {
        isInline: analysis.template.declaration.isInline,
        file: analysis.template.file
      }
    });
  }
  typeCheck(ctx, node, meta) {
    if (this.typeCheckScopeRegistry === null || !ts24.isClassDeclaration(node)) {
      return;
    }
    if (meta.isPoisoned && !this.usePoisonedData) {
      return;
    }
    const scope = this.typeCheckScopeRegistry.getTypeCheckScope(node);
    if (scope.isPoisoned && !this.usePoisonedData) {
      return;
    }
    const binder = new R3TargetBinder(scope.matcher);
    ctx.addTemplate(new Reference(node), binder, meta.template.diagNodes, scope.pipes, scope.schemas, meta.template.sourceMapping, meta.template.file, meta.template.errors, meta.meta.isStandalone);
  }
  extendedTemplateCheck(component, extendedTemplateChecker) {
    return extendedTemplateChecker.getDiagnosticsForComponent(component);
  }
  resolve(node, analysis, symbol) {
    if (this.semanticDepGraphUpdater !== null && analysis.baseClass instanceof Reference) {
      symbol.baseClass = this.semanticDepGraphUpdater.getSymbol(analysis.baseClass.node);
    }
    if (analysis.isPoisoned && !this.usePoisonedData) {
      return {};
    }
    const context = getSourceFile(node);
    const metadata = analysis.meta;
    const data = {
      declarations: EMPTY_ARRAY2,
      declarationListEmitMode: 0,
      deferBlocks: /* @__PURE__ */ new Map(),
      deferrableDeclToImportDecl: /* @__PURE__ */ new Map()
    };
    const diagnostics = [];
    const scope = this.scopeReader.getScopeForComponent(node);
    if (scope !== null) {
      const matcher = new SelectorMatcher2();
      const pipes = /* @__PURE__ */ new Map();
      const dependencies = scope.kind === ComponentScopeKind.NgModule ? scope.compilation.dependencies : scope.dependencies;
      for (const dep of dependencies) {
        if (dep.kind === MetaKind.Directive && dep.selector !== null) {
          matcher.addSelectables(CssSelector2.parse(dep.selector), [dep]);
        } else if (dep.kind === MetaKind.Pipe) {
          pipes.set(dep.name, dep);
        }
      }
      const binder = new R3TargetBinder(matcher);
      const bound = binder.bind({ template: metadata.template.nodes });
      const deferBlocks = /* @__PURE__ */ new Map();
      for (const deferBlock of bound.getDeferBlocks()) {
        deferBlocks.set(deferBlock, binder.bind({ template: deferBlock.children }));
      }
      const eagerlyUsed = /* @__PURE__ */ new Set();
      for (const dir of bound.getEagerlyUsedDirectives()) {
        eagerlyUsed.add(dir.ref.node);
      }
      for (const name of bound.getEagerlyUsedPipes()) {
        if (!pipes.has(name)) {
          continue;
        }
        eagerlyUsed.add(pipes.get(name).ref.node);
      }
      const wholeTemplateUsed = new Set(eagerlyUsed);
      for (const bound2 of deferBlocks.values()) {
        for (const dir of bound2.getEagerlyUsedDirectives()) {
          wholeTemplateUsed.add(dir.ref.node);
        }
        for (const name of bound2.getEagerlyUsedPipes()) {
          if (!pipes.has(name)) {
            continue;
          }
          wholeTemplateUsed.add(pipes.get(name).ref.node);
        }
      }
      const declarations = /* @__PURE__ */ new Map();
      for (const dep of dependencies) {
        if (declarations.has(dep.ref.node)) {
          continue;
        }
        switch (dep.kind) {
          case MetaKind.Directive:
            if (!wholeTemplateUsed.has(dep.ref.node) || dep.matchSource !== MatchSource.Selector) {
              continue;
            }
            const dirType = this.refEmitter.emit(dep.ref, context);
            assertSuccessfulReferenceEmit(dirType, node.name, dep.isComponent ? "component" : "directive");
            declarations.set(dep.ref.node, {
              kind: R3TemplateDependencyKind.Directive,
              ref: dep.ref,
              type: dirType.expression,
              importedFile: dirType.importedFile,
              selector: dep.selector,
              inputs: dep.inputs.propertyNames,
              outputs: dep.outputs.propertyNames,
              exportAs: dep.exportAs,
              isComponent: dep.isComponent
            });
            break;
          case MetaKind.Pipe:
            if (!wholeTemplateUsed.has(dep.ref.node)) {
              continue;
            }
            const pipeType = this.refEmitter.emit(dep.ref, context);
            assertSuccessfulReferenceEmit(pipeType, node.name, "pipe");
            declarations.set(dep.ref.node, {
              kind: R3TemplateDependencyKind.Pipe,
              type: pipeType.expression,
              name: dep.name,
              ref: dep.ref,
              importedFile: pipeType.importedFile
            });
            break;
          case MetaKind.NgModule:
            const ngModuleType = this.refEmitter.emit(dep.ref, context);
            assertSuccessfulReferenceEmit(ngModuleType, node.name, "NgModule");
            declarations.set(dep.ref.node, {
              kind: R3TemplateDependencyKind.NgModule,
              type: ngModuleType.expression,
              importedFile: ngModuleType.importedFile
            });
            break;
        }
      }
      const getSemanticReference = (decl) => this.semanticDepGraphUpdater.getSemanticReference(decl.ref.node, decl.type);
      if (this.semanticDepGraphUpdater !== null) {
        symbol.usedDirectives = Array.from(declarations.values()).filter(isUsedDirective).map(getSemanticReference);
        symbol.usedPipes = Array.from(declarations.values()).filter(isUsedPipe).map(getSemanticReference);
      }
      const eagerDeclarations = Array.from(declarations.values()).filter((decl) => decl.kind === R3TemplateDependencyKind.NgModule || eagerlyUsed.has(decl.ref.node));
      this.resolveDeferBlocks(deferBlocks, declarations, data, analysis, eagerlyUsed);
      const cyclesFromDirectives = /* @__PURE__ */ new Map();
      const cyclesFromPipes = /* @__PURE__ */ new Map();
      if (!metadata.isStandalone) {
        for (const usedDep of eagerDeclarations) {
          const cycle = this._checkForCyclicImport(usedDep.importedFile, usedDep.type, context);
          if (cycle !== null) {
            switch (usedDep.kind) {
              case R3TemplateDependencyKind.Directive:
                cyclesFromDirectives.set(usedDep, cycle);
                break;
              case R3TemplateDependencyKind.Pipe:
                cyclesFromPipes.set(usedDep, cycle);
                break;
            }
          }
        }
      }
      const standaloneImportMayBeForwardDeclared = analysis.resolvedImports !== null && analysis.resolvedImports.some((ref) => ref.synthetic);
      const cycleDetected = cyclesFromDirectives.size !== 0 || cyclesFromPipes.size !== 0;
      if (!cycleDetected) {
        for (const { type, importedFile } of eagerDeclarations) {
          this.maybeRecordSyntheticImport(importedFile, type, context);
        }
        const declarationIsForwardDeclared = eagerDeclarations.some((decl) => isExpressionForwardReference(decl.type, node.name, context));
        const wrapDirectivesAndPipesInClosure = declarationIsForwardDeclared || standaloneImportMayBeForwardDeclared;
        data.declarations = eagerDeclarations;
        data.declarationListEmitMode = wrapDirectivesAndPipesInClosure ? 1 : 0;
      } else {
        if (this.cycleHandlingStrategy === 0) {
          this.scopeRegistry.setComponentRemoteScope(node, eagerDeclarations.filter(isUsedDirective).map((dir) => dir.ref), eagerDeclarations.filter(isUsedPipe).map((pipe) => pipe.ref));
          symbol.isRemotelyScoped = true;
          if (this.semanticDepGraphUpdater !== null && scope.kind === ComponentScopeKind.NgModule && scope.ngModule !== null) {
            const moduleSymbol = this.semanticDepGraphUpdater.getSymbol(scope.ngModule);
            if (!(moduleSymbol instanceof NgModuleSymbol)) {
              throw new Error(`AssertionError: Expected ${scope.ngModule.name} to be an NgModuleSymbol.`);
            }
            moduleSymbol.addRemotelyScopedComponent(symbol, symbol.usedDirectives, symbol.usedPipes);
          }
        } else {
          const relatedMessages = [];
          for (const [dir, cycle] of cyclesFromDirectives) {
            relatedMessages.push(makeCyclicImportInfo(dir.ref, dir.isComponent ? "component" : "directive", cycle));
          }
          for (const [pipe, cycle] of cyclesFromPipes) {
            relatedMessages.push(makeCyclicImportInfo(pipe.ref, "pipe", cycle));
          }
          throw new FatalDiagnosticError(ErrorCode.IMPORT_CYCLE_DETECTED, node, "One or more import cycles would need to be created to compile this component, which is not supported by the current compiler configuration.", relatedMessages);
        }
      }
    }
    if (analysis.resolvedImports !== null && analysis.rawImports !== null) {
      const standaloneDiagnostics = validateStandaloneImports(analysis.resolvedImports, analysis.rawImports, this.metaReader, this.scopeReader);
      diagnostics.push(...standaloneDiagnostics);
    }
    if (analysis.providersRequiringFactory !== null && analysis.meta.providers instanceof WrappedNodeExpr7) {
      const providerDiagnostics = getProviderDiagnostics(analysis.providersRequiringFactory, analysis.meta.providers.node, this.injectableRegistry);
      diagnostics.push(...providerDiagnostics);
    }
    if (analysis.viewProvidersRequiringFactory !== null && analysis.meta.viewProviders instanceof WrappedNodeExpr7) {
      const viewProviderDiagnostics = getProviderDiagnostics(analysis.viewProvidersRequiringFactory, analysis.meta.viewProviders.node, this.injectableRegistry);
      diagnostics.push(...viewProviderDiagnostics);
    }
    const directiveDiagnostics = getDirectiveDiagnostics(node, this.injectableRegistry, this.evaluator, this.reflector, this.scopeRegistry, this.strictCtorDeps, "Component");
    if (directiveDiagnostics !== null) {
      diagnostics.push(...directiveDiagnostics);
    }
    const hostDirectivesDiagnotics = analysis.hostDirectives && analysis.rawHostDirectives ? validateHostDirectives(analysis.rawHostDirectives, analysis.hostDirectives, this.metaReader) : null;
    if (hostDirectivesDiagnotics !== null) {
      diagnostics.push(...hostDirectivesDiagnotics);
    }
    if (diagnostics.length > 0) {
      return { diagnostics };
    }
    return { data };
  }
  xi18n(ctx, node, analysis) {
    var _a;
    ctx.updateFromTemplate(analysis.template.content, analysis.template.declaration.resolvedTemplateUrl, (_a = analysis.template.interpolationConfig) != null ? _a : DEFAULT_INTERPOLATION_CONFIG2);
  }
  updateResources(node, analysis) {
    const containingFile = node.getSourceFile().fileName;
    const templateDecl = analysis.template.declaration;
    if (!templateDecl.isInline) {
      analysis.template = extractTemplate(node, templateDecl, this.evaluator, this.depTracker, this.resourceLoader, this.extractTemplateOptions);
    }
    let styles = [];
    if (analysis.styleUrls !== null) {
      for (const styleUrl of analysis.styleUrls) {
        try {
          const resolvedStyleUrl = this.resourceLoader.resolve(styleUrl.url, containingFile);
          const styleText = this.resourceLoader.load(resolvedStyleUrl);
          styles.push(styleText);
        } catch (e) {
        }
      }
    }
    if (analysis.inlineStyles !== null) {
      for (const styleText of analysis.inlineStyles) {
        styles.push(styleText);
      }
    }
    for (const styleText of analysis.template.styles) {
      styles.push(styleText);
    }
    analysis.meta.styles = styles.filter((s) => s.trim().length > 0);
  }
  compileFull(node, analysis, resolution, pool) {
    var _a;
    if (analysis.template.errors !== null && analysis.template.errors.length > 0) {
      return [];
    }
    for (const [_, deferBlockDeps] of resolution.deferBlocks) {
      for (const deferBlockDep of deferBlockDeps) {
        const dep = deferBlockDep;
        const classDecl = dep.classDeclaration;
        const importDecl = (_a = resolution.deferrableDeclToImportDecl.get(classDecl)) != null ? _a : null;
        if (importDecl && this.deferredSymbolTracker.canDefer(importDecl)) {
          deferBlockDep.isDeferrable = true;
          deferBlockDep.importPath = importDecl.moduleSpecifier.text;
        }
      }
    }
    const meta = { ...analysis.meta, ...resolution };
    const fac = compileNgFactoryDefField(toFactoryMetadata(meta, FactoryTarget3.Component));
    const def = compileComponentFromMetadata(meta, pool, makeBindingParser2());
    const inputTransformFields = compileInputTransformFields(analysis.inputs);
    const classMetadata = analysis.classMetadata !== null ? compileClassMetadata3(analysis.classMetadata).toStmt() : null;
    const deferrableImports = this.deferredSymbolTracker.getDeferrableImportDecls();
    return compileResults(fac, def, classMetadata, "\u0275cmp", inputTransformFields, deferrableImports);
  }
  compilePartial(node, analysis, resolution) {
    if (analysis.template.errors !== null && analysis.template.errors.length > 0) {
      return [];
    }
    const templateInfo = {
      content: analysis.template.content,
      sourceUrl: analysis.template.declaration.resolvedTemplateUrl,
      isInline: analysis.template.declaration.isInline,
      inlineTemplateLiteralExpression: analysis.template.sourceMapping.type === "direct" ? new WrappedNodeExpr7(analysis.template.sourceMapping.node) : null
    };
    const meta = { ...analysis.meta, ...resolution };
    const fac = compileDeclareFactory(toFactoryMetadata(meta, FactoryTarget3.Component));
    const inputTransformFields = compileInputTransformFields(analysis.inputs);
    const def = compileDeclareComponentFromMetadata(meta, analysis.template, templateInfo);
    const classMetadata = analysis.classMetadata !== null ? compileDeclareClassMetadata3(analysis.classMetadata).toStmt() : null;
    return compileResults(fac, def, classMetadata, "\u0275cmp", inputTransformFields, null);
  }
  compileLocal(node, analysis, pool) {
    if (analysis.template.errors !== null && analysis.template.errors.length > 0) {
      return [];
    }
    const meta = {
      ...analysis.meta,
      declarationListEmitMode: 0,
      declarations: [],
      deferBlocks: /* @__PURE__ */ new Map(),
      deferrableDeclToImportDecl: /* @__PURE__ */ new Map()
    };
    const fac = compileNgFactoryDefField(toFactoryMetadata(meta, FactoryTarget3.Component));
    const def = compileComponentFromMetadata(meta, pool, makeBindingParser2());
    const inputTransformFields = compileInputTransformFields(analysis.inputs);
    const classMetadata = analysis.classMetadata !== null ? compileClassMetadata3(analysis.classMetadata).toStmt() : null;
    return compileResults(fac, def, classMetadata, "\u0275cmp", inputTransformFields, null);
  }
  _checkForCyclicImport(importedFile, expr, origin) {
    const imported = resolveImportedFile(this.moduleResolver, importedFile, expr, origin);
    if (imported === null) {
      return null;
    }
    return this.cycleAnalyzer.wouldCreateCycle(origin, imported);
  }
  maybeRecordSyntheticImport(importedFile, expr, origin) {
    const imported = resolveImportedFile(this.moduleResolver, importedFile, expr, origin);
    if (imported === null) {
      return;
    }
    this.cycleAnalyzer.recordSyntheticImport(origin, imported);
  }
  resolveDeferBlocks(deferBlocks, deferrableDecls, resolutionData, analysisData, eagerlyUsedDecls) {
    const allDeferredDecls = /* @__PURE__ */ new Set();
    for (const [deferBlock, bound] of deferBlocks) {
      const usedDirectives = new Set(bound.getEagerlyUsedDirectives().map((d) => d.ref.node));
      const usedPipes = new Set(bound.getEagerlyUsedPipes());
      const deps = [];
      for (const decl of Array.from(deferrableDecls.values())) {
        if (decl.kind === R3TemplateDependencyKind.NgModule) {
          continue;
        }
        if (decl.kind === R3TemplateDependencyKind.Directive && !usedDirectives.has(decl.ref.node)) {
          continue;
        }
        if (decl.kind === R3TemplateDependencyKind.Pipe && !usedPipes.has(decl.name)) {
          continue;
        }
        deps.push({
          type: decl.type,
          symbolName: decl.ref.node.name.escapedText,
          isDeferrable: false,
          importPath: null,
          classDeclaration: decl.ref.node
        });
        allDeferredDecls.add(decl.ref.node);
      }
      resolutionData.deferBlocks.set(deferBlock, deps);
    }
    if (analysisData.meta.isStandalone && analysisData.rawImports !== null && ts24.isArrayLiteralExpression(analysisData.rawImports)) {
      for (const node of analysisData.rawImports.elements) {
        if (!ts24.isIdentifier(node)) {
          continue;
        }
        const imp = this.reflector.getImportOfIdentifier(node);
        if (imp === null) {
          continue;
        }
        const decl = this.reflector.getDeclarationOfIdentifier(node);
        if (decl === null) {
          continue;
        }
        if (!isNamedClassDeclaration(decl.node)) {
          continue;
        }
        if (!allDeferredDecls.has(decl.node)) {
          continue;
        }
        if (eagerlyUsedDecls.has(decl.node)) {
          continue;
        }
        const dirMeta = this.metaReader.getDirectiveMetadata(new Reference(decl.node));
        if (dirMeta !== null && !dirMeta.isStandalone) {
          continue;
        }
        const pipeMeta = this.metaReader.getPipeMetadata(new Reference(decl.node));
        if (pipeMeta !== null && !pipeMeta.isStandalone) {
          continue;
        }
        if (dirMeta === null && pipeMeta === null) {
          continue;
        }
        resolutionData.deferrableDeclToImportDecl.set(decl.node, imp.node);
        this.deferredSymbolTracker.markAsDeferrableCandidate(node, imp.node);
      }
    }
  }
};
function validateStandaloneImports(importRefs, importExpr, metaReader, scopeReader) {
  const diagnostics = [];
  for (const ref of importRefs) {
    const dirMeta = metaReader.getDirectiveMetadata(ref);
    if (dirMeta !== null) {
      if (!dirMeta.isStandalone) {
        diagnostics.push(makeNotStandaloneDiagnostic(scopeReader, ref, importExpr, dirMeta.isComponent ? "component" : "directive"));
      }
      continue;
    }
    const pipeMeta = metaReader.getPipeMetadata(ref);
    if (pipeMeta !== null) {
      if (!pipeMeta.isStandalone) {
        diagnostics.push(makeNotStandaloneDiagnostic(scopeReader, ref, importExpr, "pipe"));
      }
      continue;
    }
    const ngModuleMeta = metaReader.getNgModuleMetadata(ref);
    if (ngModuleMeta !== null) {
      continue;
    }
    diagnostics.push(makeUnknownComponentImportDiagnostic(ref, importExpr));
  }
  return diagnostics;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/src/injectable.mjs
import { compileClassMetadata as compileClassMetadata4, compileDeclareClassMetadata as compileDeclareClassMetadata4, compileDeclareInjectableFromMetadata, compileInjectable, createMayBeForwardRefExpression as createMayBeForwardRefExpression2, FactoryTarget as FactoryTarget4, LiteralExpr as LiteralExpr3, WrappedNodeExpr as WrappedNodeExpr8 } from "@angular/compiler";
import ts25 from "typescript";
var InjectableDecoratorHandler = class {
  constructor(reflector, evaluator, isCore, strictCtorDeps, injectableRegistry, perf, includeClassMetadata, errorOnDuplicateProv = true) {
    this.reflector = reflector;
    this.evaluator = evaluator;
    this.isCore = isCore;
    this.strictCtorDeps = strictCtorDeps;
    this.injectableRegistry = injectableRegistry;
    this.perf = perf;
    this.includeClassMetadata = includeClassMetadata;
    this.errorOnDuplicateProv = errorOnDuplicateProv;
    this.precedence = HandlerPrecedence.SHARED;
    this.name = "InjectableDecoratorHandler";
  }
  detect(node, decorators) {
    if (!decorators) {
      return void 0;
    }
    const decorator = findAngularDecorator(decorators, "Injectable", this.isCore);
    if (decorator !== void 0) {
      return {
        trigger: decorator.node,
        decorator,
        metadata: decorator
      };
    } else {
      return void 0;
    }
  }
  analyze(node, decorator) {
    this.perf.eventCount(PerfEvent.AnalyzeInjectable);
    const meta = extractInjectableMetadata(node, decorator, this.reflector);
    const decorators = this.reflector.getDecoratorsOfDeclaration(node);
    return {
      analysis: {
        meta,
        ctorDeps: extractInjectableCtorDeps(node, meta, decorator, this.reflector, this.isCore, this.strictCtorDeps),
        classMetadata: this.includeClassMetadata ? extractClassMetadata(node, this.reflector, this.isCore) : null,
        needsFactory: !decorators || decorators.every((current) => !isAngularCore(current) || current.name === "Injectable")
      }
    };
  }
  symbol() {
    return null;
  }
  register(node, analysis) {
    this.injectableRegistry.registerInjectable(node, {
      ctorDeps: analysis.ctorDeps
    });
  }
  resolve(node, analysis, symbol) {
    if (requiresValidCtor(analysis.meta)) {
      const diagnostic = checkInheritanceOfInjectable(node, this.injectableRegistry, this.reflector, this.evaluator, this.strictCtorDeps, "Injectable");
      if (diagnostic !== null) {
        return {
          diagnostics: [diagnostic]
        };
      }
    }
    return {};
  }
  compileFull(node, analysis) {
    return this.compile(compileNgFactoryDefField, (meta) => compileInjectable(meta, false), compileClassMetadata4, node, analysis);
  }
  compilePartial(node, analysis) {
    return this.compile(compileDeclareFactory, compileDeclareInjectableFromMetadata, compileDeclareClassMetadata4, node, analysis);
  }
  compileLocal(node, analysis) {
    return this.compile(compileNgFactoryDefField, (meta) => compileInjectable(meta, false), compileClassMetadata4, node, analysis);
  }
  compile(compileFactoryFn, compileInjectableFn, compileClassMetadataFn, node, analysis) {
    const results = [];
    if (analysis.needsFactory) {
      const meta = analysis.meta;
      const factoryRes = compileFactoryFn(toFactoryMetadata({ ...meta, deps: analysis.ctorDeps }, FactoryTarget4.Injectable));
      if (analysis.classMetadata !== null) {
        factoryRes.statements.push(compileClassMetadataFn(analysis.classMetadata).toStmt());
      }
      results.push(factoryRes);
    }
    const \u0275prov = this.reflector.getMembersOfClass(node).find((member) => member.name === "\u0275prov");
    if (\u0275prov !== void 0 && this.errorOnDuplicateProv) {
      throw new FatalDiagnosticError(ErrorCode.INJECTABLE_DUPLICATE_PROV, \u0275prov.nameNode || \u0275prov.node || node, "Injectables cannot contain a static \u0275prov property, because the compiler is going to generate one.");
    }
    if (\u0275prov === void 0) {
      const res = compileInjectableFn(analysis.meta);
      results.push({
        name: "\u0275prov",
        initializer: res.expression,
        statements: res.statements,
        type: res.type,
        deferrableImports: null
      });
    }
    return results;
  }
};
function extractInjectableMetadata(clazz, decorator, reflector) {
  const name = clazz.name.text;
  const type = wrapTypeReference(reflector, clazz);
  const typeArgumentCount = reflector.getGenericArityOfClass(clazz) || 0;
  if (decorator.args === null) {
    throw new FatalDiagnosticError(ErrorCode.DECORATOR_NOT_CALLED, decorator.node, "@Injectable must be called");
  }
  if (decorator.args.length === 0) {
    return {
      name,
      type,
      typeArgumentCount,
      providedIn: createMayBeForwardRefExpression2(new LiteralExpr3(null), 0)
    };
  } else if (decorator.args.length === 1) {
    const metaNode = decorator.args[0];
    if (!ts25.isObjectLiteralExpression(metaNode)) {
      throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARG_NOT_LITERAL, metaNode, `@Injectable argument must be an object literal`);
    }
    const meta = reflectObjectLiteral(metaNode);
    const providedIn = meta.has("providedIn") ? getProviderExpression(meta.get("providedIn"), reflector) : createMayBeForwardRefExpression2(new LiteralExpr3(null), 0);
    let deps = void 0;
    if ((meta.has("useClass") || meta.has("useFactory")) && meta.has("deps")) {
      const depsExpr = meta.get("deps");
      if (!ts25.isArrayLiteralExpression(depsExpr)) {
        throw new FatalDiagnosticError(ErrorCode.VALUE_NOT_LITERAL, depsExpr, `@Injectable deps metadata must be an inline array`);
      }
      deps = depsExpr.elements.map((dep) => getDep(dep, reflector));
    }
    const result = { name, type, typeArgumentCount, providedIn };
    if (meta.has("useValue")) {
      result.useValue = getProviderExpression(meta.get("useValue"), reflector);
    } else if (meta.has("useExisting")) {
      result.useExisting = getProviderExpression(meta.get("useExisting"), reflector);
    } else if (meta.has("useClass")) {
      result.useClass = getProviderExpression(meta.get("useClass"), reflector);
      result.deps = deps;
    } else if (meta.has("useFactory")) {
      result.useFactory = new WrappedNodeExpr8(meta.get("useFactory"));
      result.deps = deps;
    }
    return result;
  } else {
    throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, decorator.args[2], "Too many arguments to @Injectable");
  }
}
function getProviderExpression(expression, reflector) {
  const forwardRefValue = tryUnwrapForwardRef(expression, reflector);
  return createMayBeForwardRefExpression2(new WrappedNodeExpr8(forwardRefValue != null ? forwardRefValue : expression), forwardRefValue !== null ? 2 : 0);
}
function extractInjectableCtorDeps(clazz, meta, decorator, reflector, isCore, strictCtorDeps) {
  if (decorator.args === null) {
    throw new FatalDiagnosticError(ErrorCode.DECORATOR_NOT_CALLED, decorator.node, "@Injectable must be called");
  }
  let ctorDeps = null;
  if (decorator.args.length === 0) {
    if (strictCtorDeps && !isAbstractClassDeclaration(clazz)) {
      ctorDeps = getValidConstructorDependencies(clazz, reflector, isCore);
    } else {
      ctorDeps = unwrapConstructorDependencies(getConstructorDependencies(clazz, reflector, isCore));
    }
    return ctorDeps;
  } else if (decorator.args.length === 1) {
    const rawCtorDeps = getConstructorDependencies(clazz, reflector, isCore);
    if (strictCtorDeps && !isAbstractClassDeclaration(clazz) && requiresValidCtor(meta)) {
      ctorDeps = validateConstructorDependencies(clazz, rawCtorDeps);
    } else {
      ctorDeps = unwrapConstructorDependencies(rawCtorDeps);
    }
  }
  return ctorDeps;
}
function requiresValidCtor(meta) {
  return meta.useValue === void 0 && meta.useExisting === void 0 && meta.useClass === void 0 && meta.useFactory === void 0;
}
function getDep(dep, reflector) {
  const meta = {
    token: new WrappedNodeExpr8(dep),
    attributeNameType: null,
    host: false,
    optional: false,
    self: false,
    skipSelf: false
  };
  function maybeUpdateDecorator(dec, reflector2, token) {
    const source = reflector2.getImportOfIdentifier(dec);
    if (source === null || source.from !== "@angular/core") {
      return false;
    }
    switch (source.name) {
      case "Inject":
        if (token !== void 0) {
          meta.token = new WrappedNodeExpr8(token);
        }
        break;
      case "Optional":
        meta.optional = true;
        break;
      case "SkipSelf":
        meta.skipSelf = true;
        break;
      case "Self":
        meta.self = true;
        break;
      default:
        return false;
    }
    return true;
  }
  if (ts25.isArrayLiteralExpression(dep)) {
    dep.elements.forEach((el) => {
      let isDecorator = false;
      if (ts25.isIdentifier(el)) {
        isDecorator = maybeUpdateDecorator(el, reflector);
      } else if (ts25.isNewExpression(el) && ts25.isIdentifier(el.expression)) {
        const token = el.arguments && el.arguments.length > 0 && el.arguments[0] || void 0;
        isDecorator = maybeUpdateDecorator(el.expression, reflector, token);
      }
      if (!isDecorator) {
        meta.token = new WrappedNodeExpr8(el);
      }
    });
  }
  return meta;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/annotations/src/pipe.mjs
import { compileClassMetadata as compileClassMetadata5, compileDeclareClassMetadata as compileDeclareClassMetadata5, compileDeclarePipeFromMetadata, compilePipeFromMetadata, FactoryTarget as FactoryTarget5 } from "@angular/compiler";
import ts26 from "typescript";
var PipeSymbol = class extends SemanticSymbol {
  constructor(decl, name) {
    super(decl);
    this.name = name;
  }
  isPublicApiAffected(previousSymbol) {
    if (!(previousSymbol instanceof PipeSymbol)) {
      return true;
    }
    return this.name !== previousSymbol.name;
  }
  isTypeCheckApiAffected(previousSymbol) {
    return this.isPublicApiAffected(previousSymbol);
  }
};
var PipeDecoratorHandler = class {
  constructor(reflector, evaluator, metaRegistry, scopeRegistry, injectableRegistry, isCore, perf, includeClassMetadata) {
    this.reflector = reflector;
    this.evaluator = evaluator;
    this.metaRegistry = metaRegistry;
    this.scopeRegistry = scopeRegistry;
    this.injectableRegistry = injectableRegistry;
    this.isCore = isCore;
    this.perf = perf;
    this.includeClassMetadata = includeClassMetadata;
    this.precedence = HandlerPrecedence.PRIMARY;
    this.name = "PipeDecoratorHandler";
  }
  detect(node, decorators) {
    if (!decorators) {
      return void 0;
    }
    const decorator = findAngularDecorator(decorators, "Pipe", this.isCore);
    if (decorator !== void 0) {
      return {
        trigger: decorator.node,
        decorator,
        metadata: decorator
      };
    } else {
      return void 0;
    }
  }
  analyze(clazz, decorator) {
    var _a;
    this.perf.eventCount(PerfEvent.AnalyzePipe);
    const name = clazz.name.text;
    const type = wrapTypeReference(this.reflector, clazz);
    if (decorator.args === null) {
      throw new FatalDiagnosticError(ErrorCode.DECORATOR_NOT_CALLED, decorator.node, `@Pipe must be called`);
    }
    if (decorator.args.length !== 1) {
      throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARITY_WRONG, decorator.node, "@Pipe must have exactly one argument");
    }
    const meta = unwrapExpression(decorator.args[0]);
    if (!ts26.isObjectLiteralExpression(meta)) {
      throw new FatalDiagnosticError(ErrorCode.DECORATOR_ARG_NOT_LITERAL, meta, "@Pipe must have a literal argument");
    }
    const pipe = reflectObjectLiteral(meta);
    if (!pipe.has("name")) {
      throw new FatalDiagnosticError(ErrorCode.PIPE_MISSING_NAME, meta, `@Pipe decorator is missing name field`);
    }
    const pipeNameExpr = pipe.get("name");
    const pipeName = this.evaluator.evaluate(pipeNameExpr);
    if (typeof pipeName !== "string") {
      throw createValueHasWrongTypeError(pipeNameExpr, pipeName, `@Pipe.name must be a string`);
    }
    let pure = true;
    if (pipe.has("pure")) {
      const expr = pipe.get("pure");
      const pureValue = this.evaluator.evaluate(expr);
      if (typeof pureValue !== "boolean") {
        throw createValueHasWrongTypeError(expr, pureValue, `@Pipe.pure must be a boolean`);
      }
      pure = pureValue;
    }
    let isStandalone = false;
    if (pipe.has("standalone")) {
      const expr = pipe.get("standalone");
      const resolved = this.evaluator.evaluate(expr);
      if (typeof resolved !== "boolean") {
        throw createValueHasWrongTypeError(expr, resolved, `standalone flag must be a boolean`);
      }
      isStandalone = resolved;
    }
    return {
      analysis: {
        meta: {
          name,
          type,
          typeArgumentCount: this.reflector.getGenericArityOfClass(clazz) || 0,
          pipeName,
          deps: getValidConstructorDependencies(clazz, this.reflector, this.isCore),
          pure,
          isStandalone
        },
        classMetadata: this.includeClassMetadata ? extractClassMetadata(clazz, this.reflector, this.isCore) : null,
        pipeNameExpr,
        decorator: (_a = decorator == null ? void 0 : decorator.node) != null ? _a : null
      }
    };
  }
  symbol(node, analysis) {
    return new PipeSymbol(node, analysis.meta.pipeName);
  }
  register(node, analysis) {
    const ref = new Reference(node);
    this.metaRegistry.registerPipeMetadata({
      kind: MetaKind.Pipe,
      ref,
      name: analysis.meta.pipeName,
      nameExpr: analysis.pipeNameExpr,
      isStandalone: analysis.meta.isStandalone,
      decorator: analysis.decorator
    });
    this.injectableRegistry.registerInjectable(node, {
      ctorDeps: analysis.meta.deps
    });
  }
  resolve(node) {
    const duplicateDeclData = this.scopeRegistry.getDuplicateDeclarations(node);
    if (duplicateDeclData !== null) {
      return {
        diagnostics: [makeDuplicateDeclarationError(node, duplicateDeclData, "Pipe")]
      };
    }
    return {};
  }
  compileFull(node, analysis) {
    const fac = compileNgFactoryDefField(toFactoryMetadata(analysis.meta, FactoryTarget5.Pipe));
    const def = compilePipeFromMetadata(analysis.meta);
    const classMetadata = analysis.classMetadata !== null ? compileClassMetadata5(analysis.classMetadata).toStmt() : null;
    return compileResults(fac, def, classMetadata, "\u0275pipe", null, null);
  }
  compilePartial(node, analysis) {
    const fac = compileDeclareFactory(toFactoryMetadata(analysis.meta, FactoryTarget5.Pipe));
    const def = compileDeclarePipeFromMetadata(analysis.meta);
    const classMetadata = analysis.classMetadata !== null ? compileDeclareClassMetadata5(analysis.classMetadata).toStmt() : null;
    return compileResults(fac, def, classMetadata, "\u0275pipe", null, null);
  }
  compileLocal(node, analysis) {
    const fac = compileNgFactoryDefField(toFactoryMetadata(analysis.meta, FactoryTarget5.Pipe));
    const def = compilePipeFromMetadata(analysis.meta);
    const classMetadata = analysis.classMetadata !== null ? compileClassMetadata5(analysis.classMetadata).toStmt() : null;
    return compileResults(fac, def, classMetadata, "\u0275pipe", null, null);
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/typecheck/api/checker.mjs
var OptimizeFor;
(function(OptimizeFor2) {
  OptimizeFor2[OptimizeFor2["SingleFile"] = 0] = "SingleFile";
  OptimizeFor2[OptimizeFor2["WholeProgram"] = 1] = "WholeProgram";
})(OptimizeFor || (OptimizeFor = {}));

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/typecheck/api/scope.mjs
var PotentialImportKind;
(function(PotentialImportKind2) {
  PotentialImportKind2[PotentialImportKind2["NgModule"] = 0] = "NgModule";
  PotentialImportKind2[PotentialImportKind2["Standalone"] = 1] = "Standalone";
})(PotentialImportKind || (PotentialImportKind = {}));
var PotentialImportMode;
(function(PotentialImportMode2) {
  PotentialImportMode2[PotentialImportMode2["Normal"] = 0] = "Normal";
  PotentialImportMode2[PotentialImportMode2["ForceDirect"] = 1] = "ForceDirect";
})(PotentialImportMode || (PotentialImportMode = {}));

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/typecheck/api/completion.mjs
var CompletionKind;
(function(CompletionKind2) {
  CompletionKind2[CompletionKind2["Reference"] = 0] = "Reference";
  CompletionKind2[CompletionKind2["Variable"] = 1] = "Variable";
})(CompletionKind || (CompletionKind = {}));

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/typecheck/api/symbols.mjs
var SymbolKind;
(function(SymbolKind2) {
  SymbolKind2[SymbolKind2["Input"] = 0] = "Input";
  SymbolKind2[SymbolKind2["Output"] = 1] = "Output";
  SymbolKind2[SymbolKind2["Binding"] = 2] = "Binding";
  SymbolKind2[SymbolKind2["Reference"] = 3] = "Reference";
  SymbolKind2[SymbolKind2["Variable"] = 4] = "Variable";
  SymbolKind2[SymbolKind2["Directive"] = 5] = "Directive";
  SymbolKind2[SymbolKind2["Element"] = 6] = "Element";
  SymbolKind2[SymbolKind2["Template"] = 7] = "Template";
  SymbolKind2[SymbolKind2["Expression"] = 8] = "Expression";
  SymbolKind2[SymbolKind2["DomBinding"] = 9] = "DomBinding";
  SymbolKind2[SymbolKind2["Pipe"] = 10] = "Pipe";
})(SymbolKind || (SymbolKind = {}));

export {
  forwardRefResolver,
  MetaKind,
  CompoundMetadataReader,
  DtsMetadataReader,
  LocalMetadataRegistry,
  CompoundMetadataRegistry,
  ResourceRegistry,
  ExportedProviderStatusResolver,
  HostDirectivesResolver,
  DynamicValue,
  StaticInterpreter,
  PartialEvaluator,
  InjectableClassRegistry,
  NoopReferencesRegistry,
  SemanticDepGraphUpdater,
  ComponentScopeKind,
  CompoundComponentScopeReader,
  MetadataDtsModuleScopeResolver,
  LocalModuleScopeRegistry,
  TypeCheckScopeRegistry,
  CompilationMode,
  aliasTransformFactory,
  TraitCompiler,
  DtsTransformRegistry,
  declarationTransformFactory,
  ivyTransformFactory,
  DirectiveDecoratorHandler,
  NgModuleDecoratorHandler,
  ComponentDecoratorHandler,
  InjectableDecoratorHandler,
  PipeDecoratorHandler,
  OptimizeFor,
  CompletionKind,
  PotentialImportKind,
  PotentialImportMode,
  SymbolKind
};
/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
//# sourceMappingURL=chunk-IGDIWPM6.js.map
