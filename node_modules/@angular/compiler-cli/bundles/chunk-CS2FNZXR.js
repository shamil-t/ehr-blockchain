
      import {createRequire as __cjsCompatRequire} from 'module';
      const require = __cjsCompatRequire(import.meta.url);
    
import {
  LogicalProjectPath,
  absoluteFrom,
  absoluteFromSourceFile,
  dirname,
  getFileSystem,
  relative,
  resolve,
  stripExtension,
  toRelativeImport
} from "./chunk-EC5K6QPP.js";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/reflection/src/typescript.mjs
import ts4 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/reflection/src/host.mjs
import ts from "typescript";
function isDecoratorIdentifier(exp) {
  return ts.isIdentifier(exp) || ts.isPropertyAccessExpression(exp) && ts.isIdentifier(exp.expression) && ts.isIdentifier(exp.name);
}
var ClassMemberKind;
(function(ClassMemberKind2) {
  ClassMemberKind2[ClassMemberKind2["Constructor"] = 0] = "Constructor";
  ClassMemberKind2[ClassMemberKind2["Getter"] = 1] = "Getter";
  ClassMemberKind2[ClassMemberKind2["Setter"] = 2] = "Setter";
  ClassMemberKind2[ClassMemberKind2["Property"] = 3] = "Property";
  ClassMemberKind2[ClassMemberKind2["Method"] = 4] = "Method";
})(ClassMemberKind || (ClassMemberKind = {}));

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/reflection/src/type_to_value.mjs
import ts2 from "typescript";
function typeToValue(typeNode, checker) {
  if (typeNode === null) {
    return missingType();
  }
  if (!ts2.isTypeReferenceNode(typeNode)) {
    return unsupportedType(typeNode);
  }
  const symbols = resolveTypeSymbols(typeNode, checker);
  if (symbols === null) {
    return unknownReference(typeNode);
  }
  const { local, decl } = symbols;
  if (decl.valueDeclaration === void 0 || decl.flags & ts2.SymbolFlags.ConstEnum) {
    let typeOnlyDecl = null;
    if (decl.declarations !== void 0 && decl.declarations.length > 0) {
      typeOnlyDecl = decl.declarations[0];
    }
    return noValueDeclaration(typeNode, typeOnlyDecl);
  }
  const firstDecl = local.declarations && local.declarations[0];
  if (firstDecl !== void 0) {
    if (ts2.isImportClause(firstDecl) && firstDecl.name !== void 0) {
      if (firstDecl.isTypeOnly) {
        return typeOnlyImport(typeNode, firstDecl);
      }
      return {
        kind: 0,
        expression: firstDecl.name,
        defaultImportStatement: firstDecl.parent
      };
    } else if (ts2.isImportSpecifier(firstDecl)) {
      if (firstDecl.isTypeOnly) {
        return typeOnlyImport(typeNode, firstDecl);
      }
      if (firstDecl.parent.parent.isTypeOnly) {
        return typeOnlyImport(typeNode, firstDecl.parent.parent);
      }
      const importedName = (firstDecl.propertyName || firstDecl.name).text;
      const [_localName, ...nestedPath] = symbols.symbolNames;
      const moduleName = extractModuleName(firstDecl.parent.parent.parent);
      return {
        kind: 1,
        valueDeclaration: decl.valueDeclaration,
        moduleName,
        importedName,
        nestedPath
      };
    } else if (ts2.isNamespaceImport(firstDecl)) {
      if (firstDecl.parent.isTypeOnly) {
        return typeOnlyImport(typeNode, firstDecl.parent);
      }
      if (symbols.symbolNames.length === 1) {
        return namespaceImport(typeNode, firstDecl.parent);
      }
      const [_ns, importedName, ...nestedPath] = symbols.symbolNames;
      const moduleName = extractModuleName(firstDecl.parent.parent);
      return {
        kind: 1,
        valueDeclaration: decl.valueDeclaration,
        moduleName,
        importedName,
        nestedPath
      };
    }
  }
  const expression = typeNodeToValueExpr(typeNode);
  if (expression !== null) {
    return {
      kind: 0,
      expression,
      defaultImportStatement: null
    };
  } else {
    return unsupportedType(typeNode);
  }
}
function unsupportedType(typeNode) {
  return {
    kind: 2,
    reason: { kind: 5, typeNode }
  };
}
function noValueDeclaration(typeNode, decl) {
  return {
    kind: 2,
    reason: { kind: 1, typeNode, decl }
  };
}
function typeOnlyImport(typeNode, node) {
  return {
    kind: 2,
    reason: { kind: 2, typeNode, node }
  };
}
function unknownReference(typeNode) {
  return {
    kind: 2,
    reason: { kind: 3, typeNode }
  };
}
function namespaceImport(typeNode, importClause) {
  return {
    kind: 2,
    reason: { kind: 4, typeNode, importClause }
  };
}
function missingType() {
  return {
    kind: 2,
    reason: { kind: 0 }
  };
}
function typeNodeToValueExpr(node) {
  if (ts2.isTypeReferenceNode(node)) {
    return entityNameToValue(node.typeName);
  } else {
    return null;
  }
}
function resolveTypeSymbols(typeRef, checker) {
  const typeName = typeRef.typeName;
  const typeRefSymbol = checker.getSymbolAtLocation(typeName);
  if (typeRefSymbol === void 0) {
    return null;
  }
  let local = typeRefSymbol;
  let leftMost = typeName;
  const symbolNames = [];
  while (ts2.isQualifiedName(leftMost)) {
    symbolNames.unshift(leftMost.right.text);
    leftMost = leftMost.left;
  }
  symbolNames.unshift(leftMost.text);
  if (leftMost !== typeName) {
    const localTmp = checker.getSymbolAtLocation(leftMost);
    if (localTmp !== void 0) {
      local = localTmp;
    }
  }
  let decl = typeRefSymbol;
  if (typeRefSymbol.flags & ts2.SymbolFlags.Alias) {
    decl = checker.getAliasedSymbol(typeRefSymbol);
  }
  return { local, decl, symbolNames };
}
function entityNameToValue(node) {
  if (ts2.isQualifiedName(node)) {
    const left = entityNameToValue(node.left);
    return left !== null ? ts2.factory.createPropertyAccessExpression(left, node.right) : null;
  } else if (ts2.isIdentifier(node)) {
    const clone = ts2.setOriginalNode(ts2.factory.createIdentifier(node.text), node);
    clone.parent = node.parent;
    return clone;
  } else {
    return null;
  }
}
function extractModuleName(node) {
  if (!ts2.isStringLiteral(node.moduleSpecifier)) {
    throw new Error("not a module specifier");
  }
  return node.moduleSpecifier.text;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/reflection/src/util.mjs
import ts3 from "typescript";
function isNamedClassDeclaration(node) {
  return ts3.isClassDeclaration(node) && isIdentifier(node.name);
}
function isIdentifier(node) {
  return node !== void 0 && ts3.isIdentifier(node);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/reflection/src/typescript.mjs
var TypeScriptReflectionHost = class {
  constructor(checker) {
    this.checker = checker;
  }
  getDecoratorsOfDeclaration(declaration) {
    const decorators = ts4.canHaveDecorators(declaration) ? ts4.getDecorators(declaration) : void 0;
    return decorators !== void 0 && decorators.length ? decorators.map((decorator) => this._reflectDecorator(decorator)).filter((dec) => dec !== null) : null;
  }
  getMembersOfClass(clazz) {
    const tsClazz = castDeclarationToClassOrDie(clazz);
    return tsClazz.members.map((member) => this._reflectMember(member)).filter((member) => member !== null);
  }
  getConstructorParameters(clazz) {
    const tsClazz = castDeclarationToClassOrDie(clazz);
    const isDeclaration2 = tsClazz.getSourceFile().isDeclarationFile;
    const ctor = tsClazz.members.find((member) => ts4.isConstructorDeclaration(member) && (isDeclaration2 || member.body !== void 0));
    if (ctor === void 0) {
      return null;
    }
    return ctor.parameters.map((node) => {
      const name = parameterName(node.name);
      const decorators = this.getDecoratorsOfDeclaration(node);
      let originalTypeNode = node.type || null;
      let typeNode = originalTypeNode;
      if (typeNode && ts4.isUnionTypeNode(typeNode)) {
        let childTypeNodes = typeNode.types.filter((childTypeNode) => !(ts4.isLiteralTypeNode(childTypeNode) && childTypeNode.literal.kind === ts4.SyntaxKind.NullKeyword));
        if (childTypeNodes.length === 1) {
          typeNode = childTypeNodes[0];
        }
      }
      const typeValueReference = typeToValue(typeNode, this.checker);
      return {
        name,
        nameNode: node.name,
        typeValueReference,
        typeNode: originalTypeNode,
        decorators
      };
    });
  }
  getImportOfIdentifier(id) {
    const directImport = this.getDirectImportOfIdentifier(id);
    if (directImport !== null) {
      return directImport;
    } else if (ts4.isQualifiedName(id.parent) && id.parent.right === id) {
      return this.getImportOfNamespacedIdentifier(id, getQualifiedNameRoot(id.parent));
    } else if (ts4.isPropertyAccessExpression(id.parent) && id.parent.name === id) {
      return this.getImportOfNamespacedIdentifier(id, getFarLeftIdentifier(id.parent));
    } else {
      return null;
    }
  }
  getExportsOfModule(node) {
    if (!ts4.isSourceFile(node)) {
      throw new Error(`getExportsOfModule() called on non-SourceFile in TS code`);
    }
    const symbol = this.checker.getSymbolAtLocation(node);
    if (symbol === void 0) {
      return null;
    }
    const map = /* @__PURE__ */ new Map();
    this.checker.getExportsOfModule(symbol).forEach((exportSymbol) => {
      const decl = this.getDeclarationOfSymbol(exportSymbol, null);
      if (decl !== null) {
        map.set(exportSymbol.name, decl);
      }
    });
    return map;
  }
  isClass(node) {
    return isNamedClassDeclaration(node);
  }
  hasBaseClass(clazz) {
    return this.getBaseClassExpression(clazz) !== null;
  }
  getBaseClassExpression(clazz) {
    if (!(ts4.isClassDeclaration(clazz) || ts4.isClassExpression(clazz)) || clazz.heritageClauses === void 0) {
      return null;
    }
    const extendsClause = clazz.heritageClauses.find((clause) => clause.token === ts4.SyntaxKind.ExtendsKeyword);
    if (extendsClause === void 0) {
      return null;
    }
    const extendsType = extendsClause.types[0];
    if (extendsType === void 0) {
      return null;
    }
    return extendsType.expression;
  }
  getDeclarationOfIdentifier(id) {
    let symbol = this.checker.getSymbolAtLocation(id);
    if (symbol === void 0) {
      return null;
    }
    return this.getDeclarationOfSymbol(symbol, id);
  }
  getDefinitionOfFunction(node) {
    if (!ts4.isFunctionDeclaration(node) && !ts4.isMethodDeclaration(node) && !ts4.isFunctionExpression(node) && !ts4.isArrowFunction(node)) {
      return null;
    }
    let body = null;
    if (node.body !== void 0) {
      body = ts4.isBlock(node.body) ? Array.from(node.body.statements) : [ts4.factory.createReturnStatement(node.body)];
    }
    const type = this.checker.getTypeAtLocation(node);
    const signatures = this.checker.getSignaturesOfType(type, ts4.SignatureKind.Call);
    return {
      node,
      body,
      signatureCount: signatures.length,
      typeParameters: node.typeParameters === void 0 ? null : Array.from(node.typeParameters),
      parameters: node.parameters.map((param) => {
        const name = parameterName(param.name);
        const initializer = param.initializer || null;
        return { name, node: param, initializer, type: param.type || null };
      })
    };
  }
  getGenericArityOfClass(clazz) {
    if (!ts4.isClassDeclaration(clazz)) {
      return null;
    }
    return clazz.typeParameters !== void 0 ? clazz.typeParameters.length : 0;
  }
  getVariableValue(declaration) {
    return declaration.initializer || null;
  }
  isStaticallyExported(decl) {
    let topLevel = decl;
    if (ts4.isVariableDeclaration(decl) && ts4.isVariableDeclarationList(decl.parent)) {
      topLevel = decl.parent.parent;
    }
    const modifiers = ts4.canHaveModifiers(topLevel) ? ts4.getModifiers(topLevel) : void 0;
    if (modifiers !== void 0 && modifiers.some((modifier) => modifier.kind === ts4.SyntaxKind.ExportKeyword)) {
      return true;
    }
    if (topLevel.parent === void 0 || !ts4.isSourceFile(topLevel.parent)) {
      return false;
    }
    const localExports = this.getLocalExportedDeclarationsOfSourceFile(decl.getSourceFile());
    return localExports.has(decl);
  }
  getDirectImportOfIdentifier(id) {
    const symbol = this.checker.getSymbolAtLocation(id);
    if (symbol === void 0 || symbol.declarations === void 0 || symbol.declarations.length !== 1) {
      return null;
    }
    const decl = symbol.declarations[0];
    const importDecl = getContainingImportDeclaration(decl);
    if (importDecl === null) {
      return null;
    }
    if (!ts4.isStringLiteral(importDecl.moduleSpecifier)) {
      return null;
    }
    return {
      from: importDecl.moduleSpecifier.text,
      name: getExportedName(decl, id),
      node: importDecl
    };
  }
  getImportOfNamespacedIdentifier(id, namespaceIdentifier) {
    if (namespaceIdentifier === null) {
      return null;
    }
    const namespaceSymbol = this.checker.getSymbolAtLocation(namespaceIdentifier);
    if (!namespaceSymbol || namespaceSymbol.declarations === void 0) {
      return null;
    }
    const declaration = namespaceSymbol.declarations.length === 1 ? namespaceSymbol.declarations[0] : null;
    if (!declaration) {
      return null;
    }
    const namespaceDeclaration = ts4.isNamespaceImport(declaration) ? declaration : null;
    if (!namespaceDeclaration) {
      return null;
    }
    const importDeclaration = namespaceDeclaration.parent.parent;
    if (!ts4.isStringLiteral(importDeclaration.moduleSpecifier)) {
      return null;
    }
    return {
      from: importDeclaration.moduleSpecifier.text,
      name: id.text,
      node: namespaceDeclaration.parent.parent
    };
  }
  getDeclarationOfSymbol(symbol, originalId) {
    let valueDeclaration = void 0;
    if (symbol.valueDeclaration !== void 0) {
      valueDeclaration = symbol.valueDeclaration;
    } else if (symbol.declarations !== void 0 && symbol.declarations.length > 0) {
      valueDeclaration = symbol.declarations[0];
    }
    if (valueDeclaration !== void 0 && ts4.isShorthandPropertyAssignment(valueDeclaration)) {
      const shorthandSymbol = this.checker.getShorthandAssignmentValueSymbol(valueDeclaration);
      if (shorthandSymbol === void 0) {
        return null;
      }
      return this.getDeclarationOfSymbol(shorthandSymbol, originalId);
    } else if (valueDeclaration !== void 0 && ts4.isExportSpecifier(valueDeclaration)) {
      const targetSymbol = this.checker.getExportSpecifierLocalTargetSymbol(valueDeclaration);
      if (targetSymbol === void 0) {
        return null;
      }
      return this.getDeclarationOfSymbol(targetSymbol, originalId);
    }
    const importInfo = originalId && this.getImportOfIdentifier(originalId);
    const viaModule = importInfo !== null && importInfo.from !== null && !importInfo.from.startsWith(".") ? importInfo.from : null;
    while (symbol.flags & ts4.SymbolFlags.Alias) {
      symbol = this.checker.getAliasedSymbol(symbol);
    }
    if (symbol.valueDeclaration !== void 0) {
      return {
        node: symbol.valueDeclaration,
        viaModule
      };
    } else if (symbol.declarations !== void 0 && symbol.declarations.length > 0) {
      return {
        node: symbol.declarations[0],
        viaModule
      };
    } else {
      return null;
    }
  }
  _reflectDecorator(node) {
    let decoratorExpr = node.expression;
    let args = null;
    if (ts4.isCallExpression(decoratorExpr)) {
      args = Array.from(decoratorExpr.arguments);
      decoratorExpr = decoratorExpr.expression;
    }
    if (!isDecoratorIdentifier(decoratorExpr)) {
      return null;
    }
    const decoratorIdentifier = ts4.isIdentifier(decoratorExpr) ? decoratorExpr : decoratorExpr.name;
    const importDecl = this.getImportOfIdentifier(decoratorIdentifier);
    return {
      name: decoratorIdentifier.text,
      identifier: decoratorExpr,
      import: importDecl,
      node,
      args
    };
  }
  _reflectMember(node) {
    let kind = null;
    let value = null;
    let name = null;
    let nameNode = null;
    if (ts4.isPropertyDeclaration(node)) {
      kind = ClassMemberKind.Property;
      value = node.initializer || null;
    } else if (ts4.isGetAccessorDeclaration(node)) {
      kind = ClassMemberKind.Getter;
    } else if (ts4.isSetAccessorDeclaration(node)) {
      kind = ClassMemberKind.Setter;
    } else if (ts4.isMethodDeclaration(node)) {
      kind = ClassMemberKind.Method;
    } else if (ts4.isConstructorDeclaration(node)) {
      kind = ClassMemberKind.Constructor;
    } else {
      return null;
    }
    if (ts4.isConstructorDeclaration(node)) {
      name = "constructor";
    } else if (ts4.isIdentifier(node.name)) {
      name = node.name.text;
      nameNode = node.name;
    } else if (ts4.isStringLiteral(node.name)) {
      name = node.name.text;
      nameNode = node.name;
    } else {
      return null;
    }
    const decorators = this.getDecoratorsOfDeclaration(node);
    const modifiers = ts4.getModifiers(node);
    const isStatic = modifiers !== void 0 && modifiers.some((mod) => mod.kind === ts4.SyntaxKind.StaticKeyword);
    return {
      node,
      implementation: node,
      kind,
      type: node.type || null,
      name,
      nameNode,
      decorators,
      value,
      isStatic
    };
  }
  getLocalExportedDeclarationsOfSourceFile(file) {
    const cacheSf = file;
    if (cacheSf[LocalExportedDeclarations] !== void 0) {
      return cacheSf[LocalExportedDeclarations];
    }
    const exportSet = /* @__PURE__ */ new Set();
    cacheSf[LocalExportedDeclarations] = exportSet;
    const sfSymbol = this.checker.getSymbolAtLocation(cacheSf);
    if (sfSymbol === void 0 || sfSymbol.exports === void 0) {
      return exportSet;
    }
    const iter = sfSymbol.exports.values();
    let item = iter.next();
    while (item.done !== true) {
      let exportedSymbol = item.value;
      if (exportedSymbol.flags & ts4.SymbolFlags.Alias) {
        exportedSymbol = this.checker.getAliasedSymbol(exportedSymbol);
      }
      if (exportedSymbol.valueDeclaration !== void 0 && exportedSymbol.valueDeclaration.getSourceFile() === file) {
        exportSet.add(exportedSymbol.valueDeclaration);
      }
      item = iter.next();
    }
    return exportSet;
  }
};
function reflectTypeEntityToDeclaration(type, checker) {
  let realSymbol = checker.getSymbolAtLocation(type);
  if (realSymbol === void 0) {
    throw new Error(`Cannot resolve type entity ${type.getText()} to symbol`);
  }
  while (realSymbol.flags & ts4.SymbolFlags.Alias) {
    realSymbol = checker.getAliasedSymbol(realSymbol);
  }
  let node = null;
  if (realSymbol.valueDeclaration !== void 0) {
    node = realSymbol.valueDeclaration;
  } else if (realSymbol.declarations !== void 0 && realSymbol.declarations.length === 1) {
    node = realSymbol.declarations[0];
  } else {
    throw new Error(`Cannot resolve type entity symbol to declaration`);
  }
  if (ts4.isQualifiedName(type)) {
    if (!ts4.isIdentifier(type.left)) {
      throw new Error(`Cannot handle qualified name with non-identifier lhs`);
    }
    const symbol = checker.getSymbolAtLocation(type.left);
    if (symbol === void 0 || symbol.declarations === void 0 || symbol.declarations.length !== 1) {
      throw new Error(`Cannot resolve qualified type entity lhs to symbol`);
    }
    const decl = symbol.declarations[0];
    if (ts4.isNamespaceImport(decl)) {
      const clause = decl.parent;
      const importDecl = clause.parent;
      if (!ts4.isStringLiteral(importDecl.moduleSpecifier)) {
        throw new Error(`Module specifier is not a string`);
      }
      return { node, from: importDecl.moduleSpecifier.text };
    } else if (ts4.isModuleDeclaration(decl)) {
      return { node, from: null };
    } else {
      throw new Error(`Unknown import type?`);
    }
  } else {
    return { node, from: null };
  }
}
function filterToMembersWithDecorator(members, name, module) {
  return members.filter((member) => !member.isStatic).map((member) => {
    if (member.decorators === null) {
      return null;
    }
    const decorators = member.decorators.filter((dec) => {
      if (dec.import !== null) {
        return dec.import.name === name && (module === void 0 || dec.import.from === module);
      } else {
        return dec.name === name && module === void 0;
      }
    });
    if (decorators.length === 0) {
      return null;
    }
    return { member, decorators };
  }).filter((value) => value !== null);
}
function reflectObjectLiteral(node) {
  const map = /* @__PURE__ */ new Map();
  node.properties.forEach((prop) => {
    if (ts4.isPropertyAssignment(prop)) {
      const name = propertyNameToString(prop.name);
      if (name === null) {
        return;
      }
      map.set(name, prop.initializer);
    } else if (ts4.isShorthandPropertyAssignment(prop)) {
      map.set(prop.name.text, prop.name);
    } else {
      return;
    }
  });
  return map;
}
function castDeclarationToClassOrDie(declaration) {
  if (!ts4.isClassDeclaration(declaration)) {
    throw new Error(`Reflecting on a ${ts4.SyntaxKind[declaration.kind]} instead of a ClassDeclaration.`);
  }
  return declaration;
}
function parameterName(name) {
  if (ts4.isIdentifier(name)) {
    return name.text;
  } else {
    return null;
  }
}
function propertyNameToString(node) {
  if (ts4.isIdentifier(node) || ts4.isStringLiteral(node) || ts4.isNumericLiteral(node)) {
    return node.text;
  } else {
    return null;
  }
}
function getQualifiedNameRoot(qualifiedName) {
  while (ts4.isQualifiedName(qualifiedName.left)) {
    qualifiedName = qualifiedName.left;
  }
  return ts4.isIdentifier(qualifiedName.left) ? qualifiedName.left : null;
}
function getFarLeftIdentifier(propertyAccess) {
  while (ts4.isPropertyAccessExpression(propertyAccess.expression)) {
    propertyAccess = propertyAccess.expression;
  }
  return ts4.isIdentifier(propertyAccess.expression) ? propertyAccess.expression : null;
}
function getContainingImportDeclaration(node) {
  return ts4.isImportSpecifier(node) ? node.parent.parent.parent : ts4.isNamespaceImport(node) ? node.parent.parent : null;
}
function getExportedName(decl, originalId) {
  return ts4.isImportSpecifier(decl) ? (decl.propertyName !== void 0 ? decl.propertyName : decl.name).text : originalId.text;
}
var LocalExportedDeclarations = Symbol("LocalExportedDeclarations");

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/util/src/typescript.mjs
import ts5 from "typescript";
var TS = /\.tsx?$/i;
var D_TS = /\.d\.ts$/i;
function isSymbolWithValueDeclaration(symbol) {
  return symbol != null && symbol.valueDeclaration !== void 0 && symbol.declarations !== void 0;
}
function isDtsPath(filePath) {
  return D_TS.test(filePath);
}
function isNonDeclarationTsPath(filePath) {
  return TS.test(filePath) && !D_TS.test(filePath);
}
function isFromDtsFile(node) {
  let sf = node.getSourceFile();
  if (sf === void 0) {
    sf = ts5.getOriginalNode(node).getSourceFile();
  }
  return sf !== void 0 && sf.isDeclarationFile;
}
function nodeNameForError(node) {
  if (node.name !== void 0 && ts5.isIdentifier(node.name)) {
    return node.name.text;
  } else {
    const kind = ts5.SyntaxKind[node.kind];
    const { line, character } = ts5.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart());
    return `${kind}@${line}:${character}`;
  }
}
function getSourceFile(node) {
  const directSf = node.getSourceFile();
  return directSf !== void 0 ? directSf : ts5.getOriginalNode(node).getSourceFile();
}
function getSourceFileOrNull(program, fileName) {
  return program.getSourceFile(fileName) || null;
}
function getTokenAtPosition(sf, pos) {
  return ts5.getTokenAtPosition(sf, pos);
}
function identifierOfNode(decl) {
  if (decl.name !== void 0 && ts5.isIdentifier(decl.name)) {
    return decl.name;
  } else {
    return null;
  }
}
function isDeclaration(node) {
  return isValueDeclaration(node) || isTypeDeclaration(node);
}
function isValueDeclaration(node) {
  return ts5.isClassDeclaration(node) || ts5.isFunctionDeclaration(node) || ts5.isVariableDeclaration(node);
}
function isTypeDeclaration(node) {
  return ts5.isEnumDeclaration(node) || ts5.isTypeAliasDeclaration(node) || ts5.isInterfaceDeclaration(node);
}
function isNamedDeclaration(node) {
  const namedNode = node;
  return namedNode.name !== void 0 && ts5.isIdentifier(namedNode.name);
}
function getRootDirs(host, options) {
  const rootDirs = [];
  const cwd = host.getCurrentDirectory();
  const fs = getFileSystem();
  if (options.rootDirs !== void 0) {
    rootDirs.push(...options.rootDirs);
  } else if (options.rootDir !== void 0) {
    rootDirs.push(options.rootDir);
  } else {
    rootDirs.push(cwd);
  }
  return rootDirs.map((rootDir) => fs.resolve(cwd, host.getCanonicalFileName(rootDir)));
}
function nodeDebugInfo(node) {
  const sf = getSourceFile(node);
  const { line, character } = ts5.getLineAndCharacterOfPosition(sf, node.pos);
  return `[${sf.fileName}: ${ts5.SyntaxKind[node.kind]} @ ${line}:${character}]`;
}
function resolveModuleName(moduleName, containingFile, compilerOptions, compilerHost, moduleResolutionCache) {
  if (compilerHost.resolveModuleNames) {
    return compilerHost.resolveModuleNames(
      [moduleName],
      containingFile,
      void 0,
      void 0,
      compilerOptions
    )[0];
  } else {
    return ts5.resolveModuleName(moduleName, containingFile, compilerOptions, compilerHost, moduleResolutionCache !== null ? moduleResolutionCache : void 0).resolvedModule;
  }
}
function isAssignment(node) {
  return ts5.isBinaryExpression(node) && node.operatorToken.kind === ts5.SyntaxKind.EqualsToken;
}
function toUnredirectedSourceFile(sf) {
  const redirectInfo = sf.redirectInfo;
  if (redirectInfo === void 0) {
    return sf;
  }
  return redirectInfo.unredirected;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/imports/src/references.mjs
var Reference = class {
  constructor(node, bestGuessOwningModule = null) {
    this.node = node;
    this.identifiers = [];
    this.synthetic = false;
    this._alias = null;
    this.bestGuessOwningModule = bestGuessOwningModule;
    const id = identifierOfNode(node);
    if (id !== null) {
      this.identifiers.push(id);
    }
  }
  get ownedByModuleGuess() {
    if (this.bestGuessOwningModule !== null) {
      return this.bestGuessOwningModule.specifier;
    } else {
      return null;
    }
  }
  get hasOwningModuleGuess() {
    return this.bestGuessOwningModule !== null;
  }
  get debugName() {
    const id = identifierOfNode(this.node);
    return id !== null ? id.text : null;
  }
  get alias() {
    return this._alias;
  }
  addIdentifier(identifier) {
    this.identifiers.push(identifier);
  }
  getIdentityIn(context) {
    return this.identifiers.find((id) => id.getSourceFile() === context) || null;
  }
  getIdentityInExpression(expr) {
    const sf = expr.getSourceFile();
    return this.identifiers.find((id) => {
      if (id.getSourceFile() !== sf) {
        return false;
      }
      return id.pos >= expr.pos && id.end <= expr.end;
    }) || null;
  }
  getOriginForDiagnostics(container, fallback = container) {
    const id = this.getIdentityInExpression(container);
    return id !== null ? id : fallback;
  }
  cloneWithAlias(alias) {
    const ref = new Reference(this.node, this.bestGuessOwningModule);
    ref.identifiers = [...this.identifiers];
    ref._alias = alias;
    return ref;
  }
  cloneWithNoIdentifiers() {
    const ref = new Reference(this.node, this.bestGuessOwningModule);
    ref._alias = this._alias;
    ref.identifiers = [];
    return ref;
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/imports/src/alias.mjs
import { ExternalExpr as ExternalExpr2 } from "@angular/compiler";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/imports/src/emitter.mjs
import { ExternalExpr, ExternalReference, WrappedNodeExpr } from "@angular/compiler";
import ts7 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/diagnostics/src/error_code.mjs
var ErrorCode;
(function(ErrorCode2) {
  ErrorCode2[ErrorCode2["DECORATOR_ARG_NOT_LITERAL"] = 1001] = "DECORATOR_ARG_NOT_LITERAL";
  ErrorCode2[ErrorCode2["DECORATOR_ARITY_WRONG"] = 1002] = "DECORATOR_ARITY_WRONG";
  ErrorCode2[ErrorCode2["DECORATOR_NOT_CALLED"] = 1003] = "DECORATOR_NOT_CALLED";
  ErrorCode2[ErrorCode2["DECORATOR_UNEXPECTED"] = 1005] = "DECORATOR_UNEXPECTED";
  ErrorCode2[ErrorCode2["DECORATOR_COLLISION"] = 1006] = "DECORATOR_COLLISION";
  ErrorCode2[ErrorCode2["VALUE_HAS_WRONG_TYPE"] = 1010] = "VALUE_HAS_WRONG_TYPE";
  ErrorCode2[ErrorCode2["VALUE_NOT_LITERAL"] = 1011] = "VALUE_NOT_LITERAL";
  ErrorCode2[ErrorCode2["COMPONENT_MISSING_TEMPLATE"] = 2001] = "COMPONENT_MISSING_TEMPLATE";
  ErrorCode2[ErrorCode2["PIPE_MISSING_NAME"] = 2002] = "PIPE_MISSING_NAME";
  ErrorCode2[ErrorCode2["PARAM_MISSING_TOKEN"] = 2003] = "PARAM_MISSING_TOKEN";
  ErrorCode2[ErrorCode2["DIRECTIVE_MISSING_SELECTOR"] = 2004] = "DIRECTIVE_MISSING_SELECTOR";
  ErrorCode2[ErrorCode2["UNDECORATED_PROVIDER"] = 2005] = "UNDECORATED_PROVIDER";
  ErrorCode2[ErrorCode2["DIRECTIVE_INHERITS_UNDECORATED_CTOR"] = 2006] = "DIRECTIVE_INHERITS_UNDECORATED_CTOR";
  ErrorCode2[ErrorCode2["UNDECORATED_CLASS_USING_ANGULAR_FEATURES"] = 2007] = "UNDECORATED_CLASS_USING_ANGULAR_FEATURES";
  ErrorCode2[ErrorCode2["COMPONENT_RESOURCE_NOT_FOUND"] = 2008] = "COMPONENT_RESOURCE_NOT_FOUND";
  ErrorCode2[ErrorCode2["COMPONENT_INVALID_SHADOW_DOM_SELECTOR"] = 2009] = "COMPONENT_INVALID_SHADOW_DOM_SELECTOR";
  ErrorCode2[ErrorCode2["COMPONENT_NOT_STANDALONE"] = 2010] = "COMPONENT_NOT_STANDALONE";
  ErrorCode2[ErrorCode2["COMPONENT_IMPORT_NOT_STANDALONE"] = 2011] = "COMPONENT_IMPORT_NOT_STANDALONE";
  ErrorCode2[ErrorCode2["COMPONENT_UNKNOWN_IMPORT"] = 2012] = "COMPONENT_UNKNOWN_IMPORT";
  ErrorCode2[ErrorCode2["HOST_DIRECTIVE_INVALID"] = 2013] = "HOST_DIRECTIVE_INVALID";
  ErrorCode2[ErrorCode2["HOST_DIRECTIVE_NOT_STANDALONE"] = 2014] = "HOST_DIRECTIVE_NOT_STANDALONE";
  ErrorCode2[ErrorCode2["HOST_DIRECTIVE_COMPONENT"] = 2015] = "HOST_DIRECTIVE_COMPONENT";
  ErrorCode2[ErrorCode2["INJECTABLE_INHERITS_INVALID_CONSTRUCTOR"] = 2016] = "INJECTABLE_INHERITS_INVALID_CONSTRUCTOR";
  ErrorCode2[ErrorCode2["HOST_DIRECTIVE_UNDEFINED_BINDING"] = 2017] = "HOST_DIRECTIVE_UNDEFINED_BINDING";
  ErrorCode2[ErrorCode2["HOST_DIRECTIVE_CONFLICTING_ALIAS"] = 2018] = "HOST_DIRECTIVE_CONFLICTING_ALIAS";
  ErrorCode2[ErrorCode2["HOST_DIRECTIVE_MISSING_REQUIRED_BINDING"] = 2019] = "HOST_DIRECTIVE_MISSING_REQUIRED_BINDING";
  ErrorCode2[ErrorCode2["CONFLICTING_INPUT_TRANSFORM"] = 2020] = "CONFLICTING_INPUT_TRANSFORM";
  ErrorCode2[ErrorCode2["SYMBOL_NOT_EXPORTED"] = 3001] = "SYMBOL_NOT_EXPORTED";
  ErrorCode2[ErrorCode2["IMPORT_CYCLE_DETECTED"] = 3003] = "IMPORT_CYCLE_DETECTED";
  ErrorCode2[ErrorCode2["IMPORT_GENERATION_FAILURE"] = 3004] = "IMPORT_GENERATION_FAILURE";
  ErrorCode2[ErrorCode2["CONFIG_FLAT_MODULE_NO_INDEX"] = 4001] = "CONFIG_FLAT_MODULE_NO_INDEX";
  ErrorCode2[ErrorCode2["CONFIG_STRICT_TEMPLATES_IMPLIES_FULL_TEMPLATE_TYPECHECK"] = 4002] = "CONFIG_STRICT_TEMPLATES_IMPLIES_FULL_TEMPLATE_TYPECHECK";
  ErrorCode2[ErrorCode2["CONFIG_EXTENDED_DIAGNOSTICS_IMPLIES_STRICT_TEMPLATES"] = 4003] = "CONFIG_EXTENDED_DIAGNOSTICS_IMPLIES_STRICT_TEMPLATES";
  ErrorCode2[ErrorCode2["CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CATEGORY_LABEL"] = 4004] = "CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CATEGORY_LABEL";
  ErrorCode2[ErrorCode2["CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CHECK"] = 4005] = "CONFIG_EXTENDED_DIAGNOSTICS_UNKNOWN_CHECK";
  ErrorCode2[ErrorCode2["HOST_BINDING_PARSE_ERROR"] = 5001] = "HOST_BINDING_PARSE_ERROR";
  ErrorCode2[ErrorCode2["TEMPLATE_PARSE_ERROR"] = 5002] = "TEMPLATE_PARSE_ERROR";
  ErrorCode2[ErrorCode2["NGMODULE_INVALID_DECLARATION"] = 6001] = "NGMODULE_INVALID_DECLARATION";
  ErrorCode2[ErrorCode2["NGMODULE_INVALID_IMPORT"] = 6002] = "NGMODULE_INVALID_IMPORT";
  ErrorCode2[ErrorCode2["NGMODULE_INVALID_EXPORT"] = 6003] = "NGMODULE_INVALID_EXPORT";
  ErrorCode2[ErrorCode2["NGMODULE_INVALID_REEXPORT"] = 6004] = "NGMODULE_INVALID_REEXPORT";
  ErrorCode2[ErrorCode2["NGMODULE_MODULE_WITH_PROVIDERS_MISSING_GENERIC"] = 6005] = "NGMODULE_MODULE_WITH_PROVIDERS_MISSING_GENERIC";
  ErrorCode2[ErrorCode2["NGMODULE_REEXPORT_NAME_COLLISION"] = 6006] = "NGMODULE_REEXPORT_NAME_COLLISION";
  ErrorCode2[ErrorCode2["NGMODULE_DECLARATION_NOT_UNIQUE"] = 6007] = "NGMODULE_DECLARATION_NOT_UNIQUE";
  ErrorCode2[ErrorCode2["NGMODULE_DECLARATION_IS_STANDALONE"] = 6008] = "NGMODULE_DECLARATION_IS_STANDALONE";
  ErrorCode2[ErrorCode2["NGMODULE_BOOTSTRAP_IS_STANDALONE"] = 6009] = "NGMODULE_BOOTSTRAP_IS_STANDALONE";
  ErrorCode2[ErrorCode2["WARN_NGMODULE_ID_UNNECESSARY"] = 6100] = "WARN_NGMODULE_ID_UNNECESSARY";
  ErrorCode2[ErrorCode2["NGMODULE_VE_DEPENDENCY_ON_IVY_LIB"] = 6999] = "NGMODULE_VE_DEPENDENCY_ON_IVY_LIB";
  ErrorCode2[ErrorCode2["SCHEMA_INVALID_ELEMENT"] = 8001] = "SCHEMA_INVALID_ELEMENT";
  ErrorCode2[ErrorCode2["SCHEMA_INVALID_ATTRIBUTE"] = 8002] = "SCHEMA_INVALID_ATTRIBUTE";
  ErrorCode2[ErrorCode2["MISSING_REFERENCE_TARGET"] = 8003] = "MISSING_REFERENCE_TARGET";
  ErrorCode2[ErrorCode2["MISSING_PIPE"] = 8004] = "MISSING_PIPE";
  ErrorCode2[ErrorCode2["WRITE_TO_READ_ONLY_VARIABLE"] = 8005] = "WRITE_TO_READ_ONLY_VARIABLE";
  ErrorCode2[ErrorCode2["DUPLICATE_VARIABLE_DECLARATION"] = 8006] = "DUPLICATE_VARIABLE_DECLARATION";
  ErrorCode2[ErrorCode2["SPLIT_TWO_WAY_BINDING"] = 8007] = "SPLIT_TWO_WAY_BINDING";
  ErrorCode2[ErrorCode2["MISSING_REQUIRED_INPUTS"] = 8008] = "MISSING_REQUIRED_INPUTS";
  ErrorCode2[ErrorCode2["INVALID_BANANA_IN_BOX"] = 8101] = "INVALID_BANANA_IN_BOX";
  ErrorCode2[ErrorCode2["NULLISH_COALESCING_NOT_NULLABLE"] = 8102] = "NULLISH_COALESCING_NOT_NULLABLE";
  ErrorCode2[ErrorCode2["MISSING_CONTROL_FLOW_DIRECTIVE"] = 8103] = "MISSING_CONTROL_FLOW_DIRECTIVE";
  ErrorCode2[ErrorCode2["TEXT_ATTRIBUTE_NOT_BINDING"] = 8104] = "TEXT_ATTRIBUTE_NOT_BINDING";
  ErrorCode2[ErrorCode2["MISSING_NGFOROF_LET"] = 8105] = "MISSING_NGFOROF_LET";
  ErrorCode2[ErrorCode2["SUFFIX_NOT_SUPPORTED"] = 8106] = "SUFFIX_NOT_SUPPORTED";
  ErrorCode2[ErrorCode2["OPTIONAL_CHAIN_NOT_NULLABLE"] = 8107] = "OPTIONAL_CHAIN_NOT_NULLABLE";
  ErrorCode2[ErrorCode2["SKIP_HYDRATION_NOT_STATIC"] = 8108] = "SKIP_HYDRATION_NOT_STATIC";
  ErrorCode2[ErrorCode2["INLINE_TCB_REQUIRED"] = 8900] = "INLINE_TCB_REQUIRED";
  ErrorCode2[ErrorCode2["INLINE_TYPE_CTOR_REQUIRED"] = 8901] = "INLINE_TYPE_CTOR_REQUIRED";
  ErrorCode2[ErrorCode2["INJECTABLE_DUPLICATE_PROV"] = 9001] = "INJECTABLE_DUPLICATE_PROV";
  ErrorCode2[ErrorCode2["SUGGEST_STRICT_TEMPLATES"] = 10001] = "SUGGEST_STRICT_TEMPLATES";
  ErrorCode2[ErrorCode2["SUGGEST_SUBOPTIMAL_TYPE_INFERENCE"] = 10002] = "SUGGEST_SUBOPTIMAL_TYPE_INFERENCE";
})(ErrorCode || (ErrorCode = {}));

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/diagnostics/src/docs.mjs
var COMPILER_ERRORS_WITH_GUIDES = /* @__PURE__ */ new Set([
  ErrorCode.DECORATOR_ARG_NOT_LITERAL,
  ErrorCode.IMPORT_CYCLE_DETECTED,
  ErrorCode.PARAM_MISSING_TOKEN,
  ErrorCode.SCHEMA_INVALID_ELEMENT,
  ErrorCode.SCHEMA_INVALID_ATTRIBUTE,
  ErrorCode.MISSING_REFERENCE_TARGET,
  ErrorCode.COMPONENT_INVALID_SHADOW_DOM_SELECTOR,
  ErrorCode.WARN_NGMODULE_ID_UNNECESSARY
]);

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/diagnostics/src/error.mjs
import ts6 from "typescript";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/diagnostics/src/util.mjs
var ERROR_CODE_MATCHER = /(\u001b\[\d+m ?)TS-99(\d+: ?\u001b\[\d+m)/g;
function replaceTsWithNgInErrors(errors) {
  return errors.replace(ERROR_CODE_MATCHER, "$1NG$2");
}
function ngErrorCode(code) {
  return parseInt("-99" + code);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/diagnostics/src/error.mjs
var FatalDiagnosticError = class {
  constructor(code, node, message, relatedInformation) {
    this.code = code;
    this.node = node;
    this.message = message;
    this.relatedInformation = relatedInformation;
    this._isFatalDiagnosticError = true;
  }
  toDiagnostic() {
    return makeDiagnostic(this.code, this.node, this.message, this.relatedInformation);
  }
};
function makeDiagnostic(code, node, messageText, relatedInformation) {
  node = ts6.getOriginalNode(node);
  return {
    category: ts6.DiagnosticCategory.Error,
    code: ngErrorCode(code),
    file: ts6.getOriginalNode(node).getSourceFile(),
    start: node.getStart(void 0, false),
    length: node.getWidth(),
    messageText,
    relatedInformation
  };
}
function makeDiagnosticChain(messageText, next) {
  return {
    category: ts6.DiagnosticCategory.Message,
    code: 0,
    messageText,
    next
  };
}
function makeRelatedInformation(node, messageText) {
  node = ts6.getOriginalNode(node);
  return {
    category: ts6.DiagnosticCategory.Message,
    code: 0,
    file: node.getSourceFile(),
    start: node.getStart(),
    length: node.getWidth(),
    messageText
  };
}
function addDiagnosticChain(messageText, add) {
  if (typeof messageText === "string") {
    return makeDiagnosticChain(messageText, add);
  }
  if (messageText.next === void 0) {
    messageText.next = add;
  } else {
    messageText.next.push(...add);
  }
  return messageText;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/diagnostics/src/error_details_base_url.mjs
var ERROR_DETAILS_PAGE_BASE_URL = "https://angular.io/errors";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/diagnostics/src/extended_template_diagnostic_name.mjs
var ExtendedTemplateDiagnosticName;
(function(ExtendedTemplateDiagnosticName2) {
  ExtendedTemplateDiagnosticName2["INVALID_BANANA_IN_BOX"] = "invalidBananaInBox";
  ExtendedTemplateDiagnosticName2["NULLISH_COALESCING_NOT_NULLABLE"] = "nullishCoalescingNotNullable";
  ExtendedTemplateDiagnosticName2["OPTIONAL_CHAIN_NOT_NULLABLE"] = "optionalChainNotNullable";
  ExtendedTemplateDiagnosticName2["MISSING_CONTROL_FLOW_DIRECTIVE"] = "missingControlFlowDirective";
  ExtendedTemplateDiagnosticName2["TEXT_ATTRIBUTE_NOT_BINDING"] = "textAttributeNotBinding";
  ExtendedTemplateDiagnosticName2["MISSING_NGFOROF_LET"] = "missingNgForOfLet";
  ExtendedTemplateDiagnosticName2["SUFFIX_NOT_SUPPORTED"] = "suffixNotSupported";
  ExtendedTemplateDiagnosticName2["SKIP_HYDRATION_NOT_STATIC"] = "skipHydrationNotStatic";
})(ExtendedTemplateDiagnosticName || (ExtendedTemplateDiagnosticName = {}));

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/imports/src/find_export.mjs
function findExportedNameOfNode(target, file, reflector) {
  const exports = reflector.getExportsOfModule(file);
  if (exports === null) {
    return null;
  }
  const declaredName = isNamedDeclaration(target) ? target.name.text : null;
  let foundExportName = null;
  for (const [exportName, declaration] of exports) {
    if (declaration.node !== target) {
      continue;
    }
    if (exportName === declaredName) {
      return exportName;
    }
    foundExportName = exportName;
  }
  return foundExportName;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/imports/src/emitter.mjs
var ImportFlags;
(function(ImportFlags2) {
  ImportFlags2[ImportFlags2["None"] = 0] = "None";
  ImportFlags2[ImportFlags2["ForceNewImport"] = 1] = "ForceNewImport";
  ImportFlags2[ImportFlags2["NoAliasing"] = 2] = "NoAliasing";
  ImportFlags2[ImportFlags2["AllowTypeImports"] = 4] = "AllowTypeImports";
  ImportFlags2[ImportFlags2["AllowRelativeDtsImports"] = 8] = "AllowRelativeDtsImports";
})(ImportFlags || (ImportFlags = {}));
function assertSuccessfulReferenceEmit(result, origin, typeKind) {
  if (result.kind === 0) {
    return;
  }
  const message = makeDiagnosticChain(`Unable to import ${typeKind} ${nodeNameForError(result.ref.node)}.`, [makeDiagnosticChain(result.reason)]);
  throw new FatalDiagnosticError(ErrorCode.IMPORT_GENERATION_FAILURE, origin, message, [makeRelatedInformation(result.ref.node, `The ${typeKind} is declared here.`)]);
}
var ReferenceEmitter = class {
  constructor(strategies) {
    this.strategies = strategies;
  }
  emit(ref, context, importFlags = ImportFlags.None) {
    for (const strategy of this.strategies) {
      const emitted = strategy.emit(ref, context, importFlags);
      if (emitted !== null) {
        return emitted;
      }
    }
    return {
      kind: 1,
      ref,
      context,
      reason: `Unable to write a reference to ${nodeNameForError(ref.node)}.`
    };
  }
};
var LocalIdentifierStrategy = class {
  emit(ref, context, importFlags) {
    const refSf = getSourceFile(ref.node);
    if (importFlags & ImportFlags.ForceNewImport && refSf !== context) {
      return null;
    }
    if (!isDeclaration(ref.node) && refSf === context) {
      return {
        kind: 0,
        expression: new WrappedNodeExpr(ref.node),
        importedFile: null
      };
    }
    const identifier = ref.getIdentityIn(context);
    if (identifier !== null) {
      return {
        kind: 0,
        expression: new WrappedNodeExpr(identifier),
        importedFile: null
      };
    } else {
      return null;
    }
  }
};
var AbsoluteModuleStrategy = class {
  constructor(program, checker, moduleResolver, reflectionHost) {
    this.program = program;
    this.checker = checker;
    this.moduleResolver = moduleResolver;
    this.reflectionHost = reflectionHost;
    this.moduleExportsCache = /* @__PURE__ */ new Map();
  }
  emit(ref, context, importFlags) {
    if (ref.bestGuessOwningModule === null) {
      return null;
    } else if (!isDeclaration(ref.node)) {
      throw new Error(`Debug assert: unable to import a Reference to non-declaration of type ${ts7.SyntaxKind[ref.node.kind]}.`);
    } else if ((importFlags & ImportFlags.AllowTypeImports) === 0 && isTypeDeclaration(ref.node)) {
      throw new Error(`Importing a type-only declaration of type ${ts7.SyntaxKind[ref.node.kind]} in a value position is not allowed.`);
    }
    const { specifier, resolutionContext } = ref.bestGuessOwningModule;
    const exports = this.getExportsOfModule(specifier, resolutionContext);
    if (exports.module === null) {
      return {
        kind: 1,
        ref,
        context,
        reason: `The module '${specifier}' could not be found.`
      };
    } else if (exports.exportMap === null || !exports.exportMap.has(ref.node)) {
      return {
        kind: 1,
        ref,
        context,
        reason: `The symbol is not exported from ${exports.module.fileName} (module '${specifier}').`
      };
    }
    const symbolName = exports.exportMap.get(ref.node);
    return {
      kind: 0,
      expression: new ExternalExpr(new ExternalReference(specifier, symbolName)),
      importedFile: exports.module
    };
  }
  getExportsOfModule(moduleName, fromFile) {
    if (!this.moduleExportsCache.has(moduleName)) {
      this.moduleExportsCache.set(moduleName, this.enumerateExportsOfModule(moduleName, fromFile));
    }
    return this.moduleExportsCache.get(moduleName);
  }
  enumerateExportsOfModule(specifier, fromFile) {
    const entryPointFile = this.moduleResolver.resolveModule(specifier, fromFile);
    if (entryPointFile === null) {
      return { module: null, exportMap: null };
    }
    const exports = this.reflectionHost.getExportsOfModule(entryPointFile);
    if (exports === null) {
      return { module: entryPointFile, exportMap: null };
    }
    const exportMap = /* @__PURE__ */ new Map();
    for (const [name, declaration] of exports) {
      if (exportMap.has(declaration.node)) {
        const existingExport = exportMap.get(declaration.node);
        if (isNamedDeclaration(declaration.node) && declaration.node.name.text === existingExport) {
          continue;
        }
      }
      exportMap.set(declaration.node, name);
    }
    return { module: entryPointFile, exportMap };
  }
};
var LogicalProjectStrategy = class {
  constructor(reflector, logicalFs) {
    this.reflector = reflector;
    this.logicalFs = logicalFs;
    this.relativePathStrategy = new RelativePathStrategy(this.reflector);
  }
  emit(ref, context, importFlags) {
    const destSf = getSourceFile(ref.node);
    const destPath = this.logicalFs.logicalPathOfSf(destSf);
    if (destPath === null) {
      if (destSf.isDeclarationFile && importFlags & ImportFlags.AllowRelativeDtsImports) {
        return this.relativePathStrategy.emit(ref, context);
      }
      return {
        kind: 1,
        ref,
        context,
        reason: `The file ${destSf.fileName} is outside of the configured 'rootDir'.`
      };
    }
    const originPath = this.logicalFs.logicalPathOfSf(context);
    if (originPath === null) {
      throw new Error(`Debug assert: attempt to import from ${context.fileName} but it's outside the program?`);
    }
    if (destPath === originPath) {
      return null;
    }
    const name = findExportedNameOfNode(ref.node, destSf, this.reflector);
    if (name === null) {
      return {
        kind: 1,
        ref,
        context,
        reason: `The symbol is not exported from ${destSf.fileName}.`
      };
    }
    const moduleName = LogicalProjectPath.relativePathBetween(originPath, destPath);
    return {
      kind: 0,
      expression: new ExternalExpr({ moduleName, name }),
      importedFile: destSf
    };
  }
};
var RelativePathStrategy = class {
  constructor(reflector) {
    this.reflector = reflector;
  }
  emit(ref, context) {
    const destSf = getSourceFile(ref.node);
    const relativePath = relative(dirname(absoluteFromSourceFile(context)), absoluteFromSourceFile(destSf));
    const moduleName = toRelativeImport(stripExtension(relativePath));
    const name = findExportedNameOfNode(ref.node, destSf, this.reflector);
    if (name === null) {
      return {
        kind: 1,
        ref,
        context,
        reason: `The symbol is not exported from ${destSf.fileName}.`
      };
    }
    return {
      kind: 0,
      expression: new ExternalExpr({ moduleName, name }),
      importedFile: destSf
    };
  }
};
var UnifiedModulesStrategy = class {
  constructor(reflector, unifiedModulesHost) {
    this.reflector = reflector;
    this.unifiedModulesHost = unifiedModulesHost;
  }
  emit(ref, context) {
    const destSf = getSourceFile(ref.node);
    const name = findExportedNameOfNode(ref.node, destSf, this.reflector);
    if (name === null) {
      return null;
    }
    const moduleName = this.unifiedModulesHost.fileNameToModuleName(destSf.fileName, context.fileName);
    return {
      kind: 0,
      expression: new ExternalExpr({ moduleName, name }),
      importedFile: destSf
    };
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/imports/src/alias.mjs
var CHARS_TO_ESCAPE = /[^a-zA-Z0-9/_]/g;
var UnifiedModulesAliasingHost = class {
  constructor(unifiedModulesHost) {
    this.unifiedModulesHost = unifiedModulesHost;
    this.aliasExportsInDts = false;
  }
  maybeAliasSymbolAs(ref, context, ngModuleName, isReExport) {
    if (!isReExport) {
      return null;
    }
    return this.aliasName(ref.node, context);
  }
  getAliasIn(decl, via, isReExport) {
    if (!isReExport) {
      return null;
    }
    const moduleName = this.unifiedModulesHost.fileNameToModuleName(via.fileName, via.fileName);
    return new ExternalExpr2({ moduleName, name: this.aliasName(decl, via) });
  }
  aliasName(decl, context) {
    const declModule = this.unifiedModulesHost.fileNameToModuleName(decl.getSourceFile().fileName, context.fileName);
    const replaced = declModule.replace(CHARS_TO_ESCAPE, "_").replace(/\//g, "$");
    return "\u0275ng$" + replaced + "$$" + decl.name.text;
  }
};
var PrivateExportAliasingHost = class {
  constructor(host) {
    this.host = host;
    this.aliasExportsInDts = true;
  }
  maybeAliasSymbolAs(ref, context, ngModuleName) {
    if (ref.hasOwningModuleGuess) {
      return null;
    }
    const exports = this.host.getExportsOfModule(context);
    if (exports === null) {
      throw new Error(`Could not determine the exports of: ${context.fileName}`);
    }
    let found = false;
    exports.forEach((value) => {
      if (value.node === ref.node) {
        found = true;
      }
    });
    if (found) {
      return null;
    }
    return `\u0275ngExport\u0275${ngModuleName}\u0275${ref.node.name.text}`;
  }
  getAliasIn() {
    return null;
  }
};
var AliasStrategy = class {
  emit(ref, context, importMode) {
    if (importMode & ImportFlags.NoAliasing || ref.alias === null) {
      return null;
    }
    return {
      kind: 0,
      expression: ref.alias,
      importedFile: "unknown"
    };
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/util/src/path.mjs
function relativePathBetween(from, to) {
  const relativePath = stripExtension(relative(dirname(resolve(from)), resolve(to)));
  return relativePath !== "" ? toRelativeImport(relativePath) : null;
}
function normalizeSeparators(path) {
  return path.replace(/\\/g, "/");
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/imports/src/core.mjs
var NoopImportRewriter = class {
  shouldImportSymbol(symbol, specifier) {
    return true;
  }
  rewriteSymbol(symbol, specifier) {
    return symbol;
  }
  rewriteSpecifier(specifier, inContextOfFile) {
    return specifier;
  }
};
var CORE_SUPPORTED_SYMBOLS = /* @__PURE__ */ new Map([
  ["\u0275\u0275defineInjectable", "\u0275\u0275defineInjectable"],
  ["\u0275\u0275defineInjector", "\u0275\u0275defineInjector"],
  ["\u0275\u0275defineNgModule", "\u0275\u0275defineNgModule"],
  ["\u0275\u0275setNgModuleScope", "\u0275\u0275setNgModuleScope"],
  ["\u0275\u0275inject", "\u0275\u0275inject"],
  ["\u0275\u0275FactoryDeclaration", "\u0275\u0275FactoryDeclaration"],
  ["\u0275setClassMetadata", "setClassMetadata"],
  ["\u0275\u0275InjectableDeclaration", "\u0275\u0275InjectableDeclaration"],
  ["\u0275\u0275InjectorDeclaration", "\u0275\u0275InjectorDeclaration"],
  ["\u0275\u0275NgModuleDeclaration", "\u0275\u0275NgModuleDeclaration"],
  ["\u0275NgModuleFactory", "NgModuleFactory"],
  ["\u0275noSideEffects", "\u0275noSideEffects"]
]);
var CORE_MODULE = "@angular/core";
var R3SymbolsImportRewriter = class {
  constructor(r3SymbolsPath) {
    this.r3SymbolsPath = r3SymbolsPath;
  }
  shouldImportSymbol(symbol, specifier) {
    return true;
  }
  rewriteSymbol(symbol, specifier) {
    if (specifier !== CORE_MODULE) {
      return symbol;
    }
    return validateAndRewriteCoreSymbol(symbol);
  }
  rewriteSpecifier(specifier, inContextOfFile) {
    if (specifier !== CORE_MODULE) {
      return specifier;
    }
    const relativePathToR3Symbols = relativePathBetween(inContextOfFile, this.r3SymbolsPath);
    if (relativePathToR3Symbols === null) {
      throw new Error(`Failed to rewrite import inside ${CORE_MODULE}: ${inContextOfFile} -> ${this.r3SymbolsPath}`);
    }
    return relativePathToR3Symbols;
  }
};
function validateAndRewriteCoreSymbol(name) {
  if (!CORE_SUPPORTED_SYMBOLS.has(name)) {
    throw new Error(`Importing unexpected symbol ${name} while compiling ${CORE_MODULE}`);
  }
  return CORE_SUPPORTED_SYMBOLS.get(name);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/imports/src/patch_alias_reference_resolution.mjs
import ts8 from "typescript";
var patchedReferencedAliasesSymbol = Symbol("patchedReferencedAliases");
function loadIsReferencedAliasDeclarationPatch(context) {
  if (!isTransformationContextWithEmitResolver(context)) {
    throwIncompatibleTransformationContextError();
  }
  const emitResolver = context.getEmitResolver();
  const existingReferencedAliases = emitResolver[patchedReferencedAliasesSymbol];
  if (existingReferencedAliases !== void 0) {
    return existingReferencedAliases;
  }
  const originalIsReferencedAliasDeclaration = emitResolver.isReferencedAliasDeclaration;
  if (originalIsReferencedAliasDeclaration === void 0) {
    throwIncompatibleTransformationContextError();
  }
  const referencedAliases = /* @__PURE__ */ new Set();
  emitResolver.isReferencedAliasDeclaration = function(node, ...args) {
    if (isAliasImportDeclaration(node) && referencedAliases.has(node)) {
      return true;
    }
    return originalIsReferencedAliasDeclaration.call(emitResolver, node, ...args);
  };
  return emitResolver[patchedReferencedAliasesSymbol] = referencedAliases;
}
function isAliasImportDeclaration(node) {
  return ts8.isImportSpecifier(node) || ts8.isNamespaceImport(node) || ts8.isImportClause(node);
}
function isTransformationContextWithEmitResolver(context) {
  return context.getEmitResolver !== void 0;
}
function throwIncompatibleTransformationContextError() {
  throw Error("Angular compiler is incompatible with this version of the TypeScript compiler.\n\nIf you recently updated TypeScript and this issue surfaces now, consider downgrading.\n\nPlease report an issue on the Angular repositories when this issue surfaces and you are using a supposedly compatible TypeScript version.");
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/imports/src/default.mjs
var DefaultImportDeclaration = Symbol("DefaultImportDeclaration");
function attachDefaultImportDeclaration(expr, importDecl) {
  expr[DefaultImportDeclaration] = importDecl;
}
function getDefaultImportDeclaration(expr) {
  var _a;
  return (_a = expr[DefaultImportDeclaration]) != null ? _a : null;
}
var DefaultImportTracker = class {
  constructor() {
    this.sourceFileToUsedImports = /* @__PURE__ */ new Map();
  }
  recordUsedImport(importDecl) {
    if (importDecl.importClause) {
      const sf = getSourceFile(importDecl);
      if (!this.sourceFileToUsedImports.has(sf.fileName)) {
        this.sourceFileToUsedImports.set(sf.fileName, /* @__PURE__ */ new Set());
      }
      this.sourceFileToUsedImports.get(sf.fileName).add(importDecl.importClause);
    }
  }
  importPreservingTransformer() {
    return (context) => {
      let clausesToPreserve = null;
      return (sourceFile) => {
        const clausesForFile = this.sourceFileToUsedImports.get(sourceFile.fileName);
        if (clausesForFile !== void 0) {
          for (const clause of clausesForFile) {
            if (clausesToPreserve === null) {
              clausesToPreserve = loadIsReferencedAliasDeclarationPatch(context);
            }
            clausesToPreserve.add(clause);
          }
        }
        return sourceFile;
      };
    };
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/imports/src/deferred_symbol_tracker.mjs
import ts9 from "typescript";
var AssumeEager = "AssumeEager";
var DeferredSymbolTracker = class {
  constructor(typeChecker) {
    this.typeChecker = typeChecker;
    this.imports = /* @__PURE__ */ new Map();
  }
  extractImportedSymbols(importDecl) {
    const symbolMap = /* @__PURE__ */ new Map();
    if (importDecl.importClause === void 0) {
      throw new Error(`Provided import declaration doesn't have any symbols.`);
    }
    if (importDecl.importClause.namedBindings !== void 0) {
      const bindings = importDecl.importClause.namedBindings;
      if (ts9.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          symbolMap.set(element.name.text, AssumeEager);
        }
      } else {
        symbolMap.set(bindings.name.text, AssumeEager);
      }
    } else if (importDecl.importClause.name !== void 0) {
      symbolMap.set(importDecl.importClause.name.text, AssumeEager);
    } else {
      throw new Error("Unrecognized import structure.");
    }
    return symbolMap;
  }
  markAsDeferrableCandidate(identifier, importDecl) {
    if (!this.imports.has(importDecl)) {
      const symbolMap2 = this.extractImportedSymbols(importDecl);
      this.imports.set(importDecl, symbolMap2);
    }
    const symbolMap = this.imports.get(importDecl);
    if (!symbolMap.has(identifier.text)) {
      throw new Error(`The '${identifier.text}' identifier doesn't belong to the provided import declaration.`);
    }
    if (symbolMap.get(identifier.text) === AssumeEager) {
      symbolMap.set(identifier.text, this.lookupIdentifiersInSourceFile(identifier.text, importDecl));
    }
    const identifiers = symbolMap.get(identifier.text);
    identifiers.delete(identifier);
  }
  canDefer(importDecl) {
    if (!this.imports.has(importDecl)) {
      return false;
    }
    const symbolsMap = this.imports.get(importDecl);
    for (const [symbol, refs] of symbolsMap) {
      if (refs === AssumeEager || refs.size > 0) {
        return false;
      }
    }
    return true;
  }
  getDeferrableImportDecls() {
    const deferrableDecls = /* @__PURE__ */ new Set();
    for (const [importDecl] of this.imports) {
      if (this.canDefer(importDecl)) {
        deferrableDecls.add(importDecl);
      }
    }
    return deferrableDecls;
  }
  lookupIdentifiersInSourceFile(name, importDecl) {
    const results = /* @__PURE__ */ new Set();
    const visit = (node) => {
      if (node === importDecl) {
        return;
      }
      if (ts9.isIdentifier(node) && node.text === name) {
        const sym = this.typeChecker.getSymbolAtLocation(node);
        if (sym === void 0) {
          return;
        }
        if (sym.declarations === void 0 || sym.declarations.length === 0) {
          return;
        }
        const importClause = sym.declarations[0];
        const decl = getContainingImportDeclaration(importClause);
        if (decl !== importDecl) {
          return;
        }
        results.add(node);
      }
      ts9.forEachChild(node, visit);
    };
    visit(importDecl.getSourceFile());
    return results;
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/src/ngtsc/imports/src/resolver.mjs
var ModuleResolver = class {
  constructor(program, compilerOptions, host, moduleResolutionCache) {
    this.program = program;
    this.compilerOptions = compilerOptions;
    this.host = host;
    this.moduleResolutionCache = moduleResolutionCache;
  }
  resolveModule(moduleName, containingFile) {
    const resolved = resolveModuleName(moduleName, containingFile, this.compilerOptions, this.host, this.moduleResolutionCache);
    if (resolved === void 0) {
      return null;
    }
    return getSourceFileOrNull(this.program, absoluteFrom(resolved.resolvedFileName));
  }
};

export {
  ErrorCode,
  COMPILER_ERRORS_WITH_GUIDES,
  replaceTsWithNgInErrors,
  ngErrorCode,
  FatalDiagnosticError,
  makeDiagnostic,
  makeDiagnosticChain,
  makeRelatedInformation,
  addDiagnosticChain,
  ERROR_DETAILS_PAGE_BASE_URL,
  ExtendedTemplateDiagnosticName,
  isSymbolWithValueDeclaration,
  isDtsPath,
  isNonDeclarationTsPath,
  isFromDtsFile,
  nodeNameForError,
  getSourceFile,
  getSourceFileOrNull,
  getTokenAtPosition,
  identifierOfNode,
  isDeclaration,
  getRootDirs,
  nodeDebugInfo,
  isAssignment,
  toUnredirectedSourceFile,
  ImportFlags,
  assertSuccessfulReferenceEmit,
  ReferenceEmitter,
  LocalIdentifierStrategy,
  AbsoluteModuleStrategy,
  LogicalProjectStrategy,
  RelativePathStrategy,
  UnifiedModulesStrategy,
  UnifiedModulesAliasingHost,
  PrivateExportAliasingHost,
  AliasStrategy,
  relativePathBetween,
  normalizeSeparators,
  NoopImportRewriter,
  R3SymbolsImportRewriter,
  loadIsReferencedAliasDeclarationPatch,
  isAliasImportDeclaration,
  attachDefaultImportDeclaration,
  getDefaultImportDeclaration,
  DefaultImportTracker,
  ClassMemberKind,
  typeNodeToValueExpr,
  isNamedClassDeclaration,
  TypeScriptReflectionHost,
  reflectTypeEntityToDeclaration,
  filterToMembersWithDecorator,
  reflectObjectLiteral,
  DeferredSymbolTracker,
  Reference,
  ModuleResolver
};
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
//# sourceMappingURL=chunk-CS2FNZXR.js.map
