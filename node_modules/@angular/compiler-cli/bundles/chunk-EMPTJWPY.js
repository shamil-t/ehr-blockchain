
      import {createRequire as __cjsCompatRequire} from 'module';
      const require = __cjsCompatRequire(import.meta.url);
    
import {
  TypeScriptReflectionHost,
  isAliasImportDeclaration,
  loadIsReferencedAliasDeclarationPatch
} from "./chunk-CS2FNZXR.js";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/transformers/downlevel_decorators_transform/downlevel_decorators_transform.mjs
import ts from "typescript";
function isAngularDecorator(decorator, isCore) {
  return isCore || decorator.import !== null && decorator.import.from === "@angular/core";
}
var DECORATOR_INVOCATION_JSDOC_TYPE = "!Array<{type: !Function, args: (undefined|!Array<?>)}>";
function extractMetadataFromSingleDecorator(decorator, diagnostics) {
  const metadataProperties = [];
  const expr = decorator.expression;
  switch (expr.kind) {
    case ts.SyntaxKind.Identifier:
      metadataProperties.push(ts.factory.createPropertyAssignment("type", expr));
      break;
    case ts.SyntaxKind.CallExpression:
      const call = expr;
      metadataProperties.push(ts.factory.createPropertyAssignment("type", call.expression));
      if (call.arguments.length) {
        const args = [];
        for (const arg of call.arguments) {
          args.push(arg);
        }
        const argsArrayLiteral = ts.factory.createArrayLiteralExpression(ts.factory.createNodeArray(args, true));
        metadataProperties.push(ts.factory.createPropertyAssignment("args", argsArrayLiteral));
      }
      break;
    default:
      diagnostics.push({
        file: decorator.getSourceFile(),
        start: decorator.getStart(),
        length: decorator.getEnd() - decorator.getStart(),
        messageText: `${ts.SyntaxKind[decorator.kind]} not implemented in gathering decorator metadata.`,
        category: ts.DiagnosticCategory.Error,
        code: 0
      });
      break;
  }
  return ts.factory.createObjectLiteralExpression(metadataProperties);
}
function createCtorParametersClassProperty(diagnostics, entityNameToExpression, ctorParameters, isClosureCompilerEnabled) {
  const params = [];
  for (const ctorParam of ctorParameters) {
    if (!ctorParam.type && ctorParam.decorators.length === 0) {
      params.push(ts.factory.createNull());
      continue;
    }
    const paramType = ctorParam.type ? typeReferenceToExpression(entityNameToExpression, ctorParam.type) : void 0;
    const members = [ts.factory.createPropertyAssignment("type", paramType || ts.factory.createIdentifier("undefined"))];
    const decorators = [];
    for (const deco of ctorParam.decorators) {
      decorators.push(extractMetadataFromSingleDecorator(deco, diagnostics));
    }
    if (decorators.length) {
      members.push(ts.factory.createPropertyAssignment("decorators", ts.factory.createArrayLiteralExpression(decorators)));
    }
    params.push(ts.factory.createObjectLiteralExpression(members));
  }
  const initializer = ts.factory.createArrowFunction(void 0, void 0, [], void 0, ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), ts.factory.createArrayLiteralExpression(params, true));
  const ctorProp = ts.factory.createPropertyDeclaration([ts.factory.createToken(ts.SyntaxKind.StaticKeyword)], "ctorParameters", void 0, void 0, initializer);
  if (isClosureCompilerEnabled) {
    ts.setSyntheticLeadingComments(ctorProp, [
      {
        kind: ts.SyntaxKind.MultiLineCommentTrivia,
        text: [
          `*`,
          ` * @type {function(): !Array<(null|{`,
          ` *   type: ?,`,
          ` *   decorators: (undefined|${DECORATOR_INVOCATION_JSDOC_TYPE}),`,
          ` * })>}`,
          ` * @nocollapse`,
          ` `
        ].join("\n"),
        pos: -1,
        end: -1,
        hasTrailingNewLine: true
      }
    ]);
  }
  return ctorProp;
}
function typeReferenceToExpression(entityNameToExpression, node) {
  let kind = node.kind;
  if (ts.isLiteralTypeNode(node)) {
    kind = node.literal.kind;
  }
  switch (kind) {
    case ts.SyntaxKind.FunctionType:
    case ts.SyntaxKind.ConstructorType:
      return ts.factory.createIdentifier("Function");
    case ts.SyntaxKind.ArrayType:
    case ts.SyntaxKind.TupleType:
      return ts.factory.createIdentifier("Array");
    case ts.SyntaxKind.TypePredicate:
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
    case ts.SyntaxKind.BooleanKeyword:
      return ts.factory.createIdentifier("Boolean");
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.StringKeyword:
      return ts.factory.createIdentifier("String");
    case ts.SyntaxKind.ObjectKeyword:
      return ts.factory.createIdentifier("Object");
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.NumericLiteral:
      return ts.factory.createIdentifier("Number");
    case ts.SyntaxKind.TypeReference:
      const typeRef = node;
      return entityNameToExpression(typeRef.typeName);
    case ts.SyntaxKind.UnionType:
      const childTypeNodes = node.types.filter((t) => !(ts.isLiteralTypeNode(t) && t.literal.kind === ts.SyntaxKind.NullKeyword));
      return childTypeNodes.length === 1 ? typeReferenceToExpression(entityNameToExpression, childTypeNodes[0]) : void 0;
    default:
      return void 0;
  }
}
function symbolIsRuntimeValue(typeChecker, symbol) {
  if (symbol.flags & ts.SymbolFlags.Alias) {
    symbol = typeChecker.getAliasedSymbol(symbol);
  }
  return (symbol.flags & ts.SymbolFlags.Value & ts.SymbolFlags.ConstEnumExcludes) !== 0;
}
function getDownlevelDecoratorsTransform(typeChecker, host, diagnostics, isCore, isClosureCompilerEnabled) {
  function addJSDocTypeAnnotation(node, jsdocType) {
    if (!isClosureCompilerEnabled) {
      return;
    }
    ts.setSyntheticLeadingComments(node, [
      {
        kind: ts.SyntaxKind.MultiLineCommentTrivia,
        text: `* @type {${jsdocType}} `,
        pos: -1,
        end: -1,
        hasTrailingNewLine: true
      }
    ]);
  }
  function createPropDecoratorsClassProperty(diagnostics2, properties) {
    const entries = [];
    for (const [name, decorators] of properties.entries()) {
      entries.push(ts.factory.createPropertyAssignment(name, ts.factory.createArrayLiteralExpression(decorators.map((deco) => extractMetadataFromSingleDecorator(deco, diagnostics2)))));
    }
    const initializer = ts.factory.createObjectLiteralExpression(entries, true);
    const prop = ts.factory.createPropertyDeclaration([ts.factory.createToken(ts.SyntaxKind.StaticKeyword)], "propDecorators", void 0, void 0, initializer);
    addJSDocTypeAnnotation(prop, `!Object<string, ${DECORATOR_INVOCATION_JSDOC_TYPE}>`);
    return prop;
  }
  return (context) => {
    const referencedParameterTypes = loadIsReferencedAliasDeclarationPatch(context);
    function entityNameToExpression(name) {
      const symbol = typeChecker.getSymbolAtLocation(name);
      if (!symbol || !symbolIsRuntimeValue(typeChecker, symbol) || !symbol.declarations || symbol.declarations.length === 0) {
        return void 0;
      }
      if (ts.isQualifiedName(name)) {
        const containerExpr = entityNameToExpression(name.left);
        if (containerExpr === void 0) {
          return void 0;
        }
        return ts.factory.createPropertyAccessExpression(containerExpr, name.right);
      }
      const decl = symbol.declarations[0];
      if (isAliasImportDeclaration(decl)) {
        referencedParameterTypes.add(decl);
        if (decl.name !== void 0) {
          return ts.setOriginalNode(ts.factory.createIdentifier(decl.name.text), decl.name);
        }
      }
      return ts.setOriginalNode(ts.factory.createIdentifier(name.text), name);
    }
    function transformClassElement(element) {
      element = ts.visitEachChild(element, decoratorDownlevelVisitor, context);
      const decoratorsToKeep = [];
      const toLower = [];
      const decorators = host.getDecoratorsOfDeclaration(element) || [];
      for (const decorator of decorators) {
        const decoratorNode = decorator.node;
        if (!isAngularDecorator(decorator, isCore)) {
          decoratorsToKeep.push(decoratorNode);
          continue;
        }
        toLower.push(decoratorNode);
      }
      if (!toLower.length)
        return [void 0, element, []];
      if (!element.name || !ts.isIdentifier(element.name)) {
        diagnostics.push({
          file: element.getSourceFile(),
          start: element.getStart(),
          length: element.getEnd() - element.getStart(),
          messageText: `Cannot process decorators for class element with non-analyzable name.`,
          category: ts.DiagnosticCategory.Error,
          code: 0
        });
        return [void 0, element, []];
      }
      const elementModifiers = ts.canHaveModifiers(element) ? ts.getModifiers(element) : void 0;
      let modifiers;
      if (decoratorsToKeep.length || (elementModifiers == null ? void 0 : elementModifiers.length)) {
        modifiers = ts.setTextRange(ts.factory.createNodeArray([...decoratorsToKeep, ...elementModifiers || []]), element.modifiers);
      }
      return [element.name.text, cloneClassElementWithModifiers(element, modifiers), toLower];
    }
    function transformConstructor(ctor) {
      ctor = ts.visitEachChild(ctor, decoratorDownlevelVisitor, context);
      const newParameters = [];
      const oldParameters = ctor.parameters;
      const parametersInfo = [];
      for (const param of oldParameters) {
        const decoratorsToKeep = [];
        const paramInfo = { decorators: [], type: null };
        const decorators = host.getDecoratorsOfDeclaration(param) || [];
        for (const decorator of decorators) {
          const decoratorNode = decorator.node;
          if (!isAngularDecorator(decorator, isCore)) {
            decoratorsToKeep.push(decoratorNode);
            continue;
          }
          paramInfo.decorators.push(decoratorNode);
        }
        if (param.type) {
          paramInfo.type = param.type;
        }
        parametersInfo.push(paramInfo);
        let modifiers;
        const paramModifiers = ts.getModifiers(param);
        if (decoratorsToKeep.length || (paramModifiers == null ? void 0 : paramModifiers.length)) {
          modifiers = [...decoratorsToKeep, ...paramModifiers || []];
        }
        const newParam = ts.factory.updateParameterDeclaration(param, modifiers, param.dotDotDotToken, param.name, param.questionToken, param.type, param.initializer);
        newParameters.push(newParam);
      }
      const updated = ts.factory.updateConstructorDeclaration(ctor, ts.getModifiers(ctor), newParameters, ctor.body);
      return [updated, parametersInfo];
    }
    function transformClassDeclaration(classDecl) {
      const newMembers = [];
      const decoratedProperties = /* @__PURE__ */ new Map();
      let classParameters = null;
      for (const member of classDecl.members) {
        switch (member.kind) {
          case ts.SyntaxKind.PropertyDeclaration:
          case ts.SyntaxKind.GetAccessor:
          case ts.SyntaxKind.SetAccessor:
          case ts.SyntaxKind.MethodDeclaration: {
            const [name, newMember, decorators] = transformClassElement(member);
            newMembers.push(newMember);
            if (name)
              decoratedProperties.set(name, decorators);
            continue;
          }
          case ts.SyntaxKind.Constructor: {
            const ctor = member;
            if (!ctor.body)
              break;
            const [newMember, parametersInfo] = transformConstructor(member);
            classParameters = parametersInfo;
            newMembers.push(newMember);
            continue;
          }
          default:
            break;
        }
        newMembers.push(ts.visitEachChild(member, decoratorDownlevelVisitor, context));
      }
      const possibleAngularDecorators = host.getDecoratorsOfDeclaration(classDecl) || [];
      const hasAngularDecorator = possibleAngularDecorators.some((d) => isAngularDecorator(d, isCore));
      if (classParameters) {
        if (hasAngularDecorator || classParameters.some((p) => !!p.decorators.length)) {
          newMembers.push(createCtorParametersClassProperty(diagnostics, entityNameToExpression, classParameters, isClosureCompilerEnabled));
        }
      }
      if (decoratedProperties.size) {
        newMembers.push(createPropDecoratorsClassProperty(diagnostics, decoratedProperties));
      }
      const members = ts.setTextRange(ts.factory.createNodeArray(newMembers, classDecl.members.hasTrailingComma), classDecl.members);
      return ts.factory.updateClassDeclaration(classDecl, classDecl.modifiers, classDecl.name, classDecl.typeParameters, classDecl.heritageClauses, members);
    }
    function decoratorDownlevelVisitor(node) {
      if (ts.isClassDeclaration(node)) {
        return transformClassDeclaration(node);
      }
      return ts.visitEachChild(node, decoratorDownlevelVisitor, context);
    }
    return (sf) => {
      return ts.visitEachChild(sf, decoratorDownlevelVisitor, context);
    };
  };
}
function cloneClassElementWithModifiers(node, modifiers) {
  let clone;
  if (ts.isMethodDeclaration(node)) {
    clone = ts.factory.createMethodDeclaration(modifiers, node.asteriskToken, node.name, node.questionToken, node.typeParameters, node.parameters, node.type, node.body);
  } else if (ts.isPropertyDeclaration(node)) {
    clone = ts.factory.createPropertyDeclaration(modifiers, node.name, node.questionToken, node.type, node.initializer);
  } else if (ts.isGetAccessor(node)) {
    clone = ts.factory.createGetAccessorDeclaration(modifiers, node.name, node.parameters, node.type, node.body);
  } else if (ts.isSetAccessor(node)) {
    clone = ts.factory.createSetAccessorDeclaration(modifiers, node.name, node.parameters, node.body);
  } else {
    throw new Error(`Unsupported decorated member with kind ${ts.SyntaxKind[node.kind]}`);
  }
  return ts.setOriginalNode(clone, node);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/private/tooling.mjs
var GLOBAL_DEFS_FOR_TERSER = {
  ngDevMode: false,
  ngI18nClosureMode: false
};
var GLOBAL_DEFS_FOR_TERSER_WITH_AOT = {
  ...GLOBAL_DEFS_FOR_TERSER,
  ngJitMode: false
};
function constructorParametersDownlevelTransform(program) {
  const typeChecker = program.getTypeChecker();
  const reflectionHost = new TypeScriptReflectionHost(typeChecker);
  return getDownlevelDecoratorsTransform(
    typeChecker,
    reflectionHost,
    [],
    false,
    false
  );
}

export {
  GLOBAL_DEFS_FOR_TERSER,
  GLOBAL_DEFS_FOR_TERSER_WITH_AOT,
  constructorParametersDownlevelTransform
};
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
//# sourceMappingURL=chunk-EMPTJWPY.js.map
