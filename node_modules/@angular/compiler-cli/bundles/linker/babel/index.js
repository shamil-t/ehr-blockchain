
      import {createRequire as __cjsCompatRequire} from 'module';
      const require = __cjsCompatRequire(import.meta.url);
    
import {
  FatalLinkerError,
  FileLinker,
  LinkerEnvironment,
  assert,
  isFatalLinkerError
} from "../../chunk-VZK5UEE7.js";
import "../../chunk-ZETVX4VH.js";
import "../../chunk-CS2FNZXR.js";
import {
  ConsoleLogger,
  LogLevel
} from "../../chunk-SBDNBITT.js";
import "../../chunk-GYHDNUIK.js";
import {
  NodeJSFileSystem
} from "../../chunk-EC5K6QPP.js";
import "../../chunk-SRFZMXHZ.js";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/linker/babel/src/es2015_linker_plugin.mjs
import { types as t4 } from "@babel/core";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/linker/babel/src/ast/babel_ast_factory.mjs
import { types as t } from "@babel/core";
var BabelAstFactory = class {
  constructor(sourceUrl) {
    this.sourceUrl = sourceUrl;
    this.createArrayLiteral = t.arrayExpression;
    this.createBlock = t.blockStatement;
    this.createConditional = t.conditionalExpression;
    this.createExpressionStatement = t.expressionStatement;
    this.createIdentifier = t.identifier;
    this.createIfStatement = t.ifStatement;
    this.createNewExpression = t.newExpression;
    this.createParenthesizedExpression = t.parenthesizedExpression;
    this.createReturnStatement = t.returnStatement;
    this.createThrowStatement = t.throwStatement;
    this.createUnaryExpression = t.unaryExpression;
  }
  attachComments(statement, leadingComments) {
    for (let i = leadingComments.length - 1; i >= 0; i--) {
      const comment = leadingComments[i];
      t.addComment(statement, "leading", comment.toString(), !comment.multiline);
    }
  }
  createAssignment(target, value) {
    assert(target, isLExpression, "must be a left hand side expression");
    return t.assignmentExpression("=", target, value);
  }
  createBinaryExpression(leftOperand, operator, rightOperand) {
    switch (operator) {
      case "&&":
      case "||":
      case "??":
        return t.logicalExpression(operator, leftOperand, rightOperand);
      default:
        return t.binaryExpression(operator, leftOperand, rightOperand);
    }
  }
  createCallExpression(callee, args, pure) {
    const call = t.callExpression(callee, args);
    if (pure) {
      t.addComment(call, "leading", " @__PURE__ ", false);
    }
    return call;
  }
  createElementAccess(expression, element) {
    return t.memberExpression(expression, element, true);
  }
  createFunctionDeclaration(functionName, parameters, body) {
    assert(body, t.isBlockStatement, "a block");
    return t.functionDeclaration(t.identifier(functionName), parameters.map((param) => t.identifier(param)), body);
  }
  createFunctionExpression(functionName, parameters, body) {
    assert(body, t.isBlockStatement, "a block");
    const name = functionName !== null ? t.identifier(functionName) : null;
    return t.functionExpression(name, parameters.map((param) => t.identifier(param)), body);
  }
  createDynamicImport(url) {
    return this.createCallExpression(t.import(), [t.stringLiteral(url)], false);
  }
  createLiteral(value) {
    if (typeof value === "string") {
      return t.stringLiteral(value);
    } else if (typeof value === "number") {
      return t.numericLiteral(value);
    } else if (typeof value === "boolean") {
      return t.booleanLiteral(value);
    } else if (value === void 0) {
      return t.identifier("undefined");
    } else if (value === null) {
      return t.nullLiteral();
    } else {
      throw new Error(`Invalid literal: ${value} (${typeof value})`);
    }
  }
  createObjectLiteral(properties) {
    return t.objectExpression(properties.map((prop) => {
      const key = prop.quoted ? t.stringLiteral(prop.propertyName) : t.identifier(prop.propertyName);
      return t.objectProperty(key, prop.value);
    }));
  }
  createPropertyAccess(expression, propertyName) {
    return t.memberExpression(expression, t.identifier(propertyName), false);
  }
  createTaggedTemplate(tag, template) {
    const elements = template.elements.map((element, i) => this.setSourceMapRange(t.templateElement(element, i === template.elements.length - 1), element.range));
    return t.taggedTemplateExpression(tag, t.templateLiteral(elements, template.expressions));
  }
  createTypeOfExpression(expression) {
    return t.unaryExpression("typeof", expression);
  }
  createVariableDeclaration(variableName, initializer, type) {
    return t.variableDeclaration(type, [t.variableDeclarator(t.identifier(variableName), initializer)]);
  }
  setSourceMapRange(node, sourceMapRange) {
    if (sourceMapRange === null) {
      return node;
    }
    node.loc = {
      filename: sourceMapRange.url !== this.sourceUrl ? sourceMapRange.url : void 0,
      start: {
        line: sourceMapRange.start.line + 1,
        column: sourceMapRange.start.column
      },
      end: {
        line: sourceMapRange.end.line + 1,
        column: sourceMapRange.end.column
      }
    };
    node.start = sourceMapRange.start.offset;
    node.end = sourceMapRange.end.offset;
    return node;
  }
};
function isLExpression(expr) {
  return t.isLVal(expr);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/linker/babel/src/ast/babel_ast_host.mjs
import { types as t2 } from "@babel/core";
var BabelAstHost = class {
  constructor() {
    this.isStringLiteral = t2.isStringLiteral;
    this.isNumericLiteral = t2.isNumericLiteral;
    this.isArrayLiteral = t2.isArrayExpression;
    this.isObjectLiteral = t2.isObjectExpression;
    this.isCallExpression = t2.isCallExpression;
  }
  getSymbolName(node) {
    if (t2.isIdentifier(node)) {
      return node.name;
    } else if (t2.isMemberExpression(node) && t2.isIdentifier(node.property)) {
      return node.property.name;
    } else {
      return null;
    }
  }
  parseStringLiteral(str) {
    assert(str, t2.isStringLiteral, "a string literal");
    return str.value;
  }
  parseNumericLiteral(num) {
    assert(num, t2.isNumericLiteral, "a numeric literal");
    return num.value;
  }
  isBooleanLiteral(bool) {
    return t2.isBooleanLiteral(bool) || isMinifiedBooleanLiteral(bool);
  }
  parseBooleanLiteral(bool) {
    if (t2.isBooleanLiteral(bool)) {
      return bool.value;
    } else if (isMinifiedBooleanLiteral(bool)) {
      return !bool.argument.value;
    } else {
      throw new FatalLinkerError(bool, "Unsupported syntax, expected a boolean literal.");
    }
  }
  parseArrayLiteral(array) {
    assert(array, t2.isArrayExpression, "an array literal");
    return array.elements.map((element) => {
      assert(element, isNotEmptyElement, "element in array not to be empty");
      assert(element, isNotSpreadElement, "element in array not to use spread syntax");
      return element;
    });
  }
  parseObjectLiteral(obj) {
    assert(obj, t2.isObjectExpression, "an object literal");
    const result = /* @__PURE__ */ new Map();
    for (const property of obj.properties) {
      assert(property, t2.isObjectProperty, "a property assignment");
      assert(property.value, t2.isExpression, "an expression");
      assert(property.key, isObjectExpressionPropertyName, "a property name");
      const key = t2.isIdentifier(property.key) ? property.key.name : property.key.value;
      result.set(`${key}`, property.value);
    }
    return result;
  }
  isFunctionExpression(node) {
    return t2.isFunction(node);
  }
  parseReturnValue(fn) {
    assert(fn, this.isFunctionExpression, "a function");
    if (!t2.isBlockStatement(fn.body)) {
      return fn.body;
    }
    if (fn.body.body.length !== 1) {
      throw new FatalLinkerError(fn.body, "Unsupported syntax, expected a function body with a single return statement.");
    }
    const stmt = fn.body.body[0];
    assert(stmt, t2.isReturnStatement, "a function body with a single return statement");
    if (stmt.argument === null || stmt.argument === void 0) {
      throw new FatalLinkerError(stmt, "Unsupported syntax, expected function to return a value.");
    }
    return stmt.argument;
  }
  parseCallee(call) {
    assert(call, t2.isCallExpression, "a call expression");
    assert(call.callee, t2.isExpression, "an expression");
    return call.callee;
  }
  parseArguments(call) {
    assert(call, t2.isCallExpression, "a call expression");
    return call.arguments.map((arg) => {
      assert(arg, isNotSpreadArgument, "argument not to use spread syntax");
      assert(arg, t2.isExpression, "argument to be an expression");
      return arg;
    });
  }
  getRange(node) {
    if (node.loc == null || node.start == null || node.end == null) {
      throw new FatalLinkerError(node, "Unable to read range for node - it is missing location information.");
    }
    return {
      startLine: node.loc.start.line - 1,
      startCol: node.loc.start.column,
      startPos: node.start,
      endPos: node.end
    };
  }
};
function isNotEmptyElement(e) {
  return e !== null;
}
function isNotSpreadElement(e) {
  return !t2.isSpreadElement(e);
}
function isObjectExpressionPropertyName(n) {
  return t2.isIdentifier(n) || t2.isStringLiteral(n) || t2.isNumericLiteral(n);
}
function isNotSpreadArgument(arg) {
  return !t2.isSpreadElement(arg);
}
function isMinifiedBooleanLiteral(node) {
  return t2.isUnaryExpression(node) && node.prefix && node.operator === "!" && t2.isNumericLiteral(node.argument) && (node.argument.value === 0 || node.argument.value === 1);
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/linker/babel/src/babel_declaration_scope.mjs
import { types as t3 } from "@babel/core";
var BabelDeclarationScope = class {
  constructor(declarationScope) {
    this.declarationScope = declarationScope;
  }
  getConstantScopeRef(expression) {
    let bindingExpression = expression;
    while (t3.isMemberExpression(bindingExpression)) {
      bindingExpression = bindingExpression.object;
    }
    if (!t3.isIdentifier(bindingExpression)) {
      return null;
    }
    const binding = this.declarationScope.getBinding(bindingExpression.name);
    if (binding === void 0) {
      return null;
    }
    const path = binding.scope.path;
    if (!path.isFunctionDeclaration() && !path.isFunctionExpression() && !(path.isProgram() && path.node.sourceType === "module")) {
      return null;
    }
    return path;
  }
};

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/linker/babel/src/es2015_linker_plugin.mjs
function createEs2015LinkerPlugin({ fileSystem, logger, ...options }) {
  let fileLinker = null;
  return {
    visitor: {
      Program: {
        enter(path) {
          var _a, _b;
          assertNull(fileLinker);
          const file = path.hub.file;
          const filename = (_a = file.opts.filename) != null ? _a : file.opts.filenameRelative;
          if (!filename) {
            throw new Error("No filename (nor filenameRelative) provided by Babel. This is required for the linking of partially compiled directives and components.");
          }
          const sourceUrl = fileSystem.resolve((_b = file.opts.cwd) != null ? _b : ".", filename);
          const linkerEnvironment = LinkerEnvironment.create(fileSystem, logger, new BabelAstHost(), new BabelAstFactory(sourceUrl), options);
          fileLinker = new FileLinker(linkerEnvironment, sourceUrl, file.code);
        },
        exit() {
          assertNotNull(fileLinker);
          for (const { constantScope, statements } of fileLinker.getConstantStatements()) {
            insertStatements(constantScope, statements);
          }
          fileLinker = null;
        }
      },
      CallExpression(call) {
        if (fileLinker === null) {
          return;
        }
        try {
          const calleeName = getCalleeName(call);
          if (calleeName === null) {
            return;
          }
          const args = call.node.arguments;
          if (!fileLinker.isPartialDeclaration(calleeName) || !isExpressionArray(args)) {
            return;
          }
          const declarationScope = new BabelDeclarationScope(call.scope);
          const replacement = fileLinker.linkPartialDeclaration(calleeName, args, declarationScope);
          call.replaceWith(replacement);
        } catch (e) {
          const node = isFatalLinkerError(e) ? e.node : call.node;
          throw buildCodeFrameError(call.hub.file, e.message, node);
        }
      }
    }
  };
}
function insertStatements(path, statements) {
  if (path.isProgram()) {
    insertIntoProgram(path, statements);
  } else {
    insertIntoFunction(path, statements);
  }
}
function insertIntoFunction(fn, statements) {
  const body = fn.get("body");
  body.unshiftContainer("body", statements);
}
function insertIntoProgram(program, statements) {
  const body = program.get("body");
  const importStatements = body.filter((statement) => statement.isImportDeclaration());
  if (importStatements.length === 0) {
    program.unshiftContainer("body", statements);
  } else {
    importStatements[importStatements.length - 1].insertAfter(statements);
  }
}
function getCalleeName(call) {
  const callee = call.node.callee;
  if (t4.isIdentifier(callee)) {
    return callee.name;
  } else if (t4.isMemberExpression(callee) && t4.isIdentifier(callee.property)) {
    return callee.property.name;
  } else if (t4.isMemberExpression(callee) && t4.isStringLiteral(callee.property)) {
    return callee.property.value;
  } else {
    return null;
  }
}
function isExpressionArray(nodes) {
  return nodes.every((node) => t4.isExpression(node));
}
function assertNull(obj) {
  if (obj !== null) {
    throw new Error("BUG - expected `obj` to be null");
  }
}
function assertNotNull(obj) {
  if (obj === null) {
    throw new Error("BUG - expected `obj` not to be null");
  }
}
function buildCodeFrameError(file, message, node) {
  const filename = file.opts.filename || "(unknown file)";
  const error = file.buildCodeFrameError(node, message);
  return `${filename}: ${error.message}`;
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/linker/babel/src/babel_plugin.mjs
function defaultLinkerPlugin(api, options) {
  api.assertVersion(7);
  return createEs2015LinkerPlugin({
    ...options,
    fileSystem: new NodeJSFileSystem(),
    logger: new ConsoleLogger(LogLevel.info)
  });
}

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/linker/babel/index.mjs
var babel_default = defaultLinkerPlugin;
export {
  createEs2015LinkerPlugin,
  babel_default as default
};
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
//# sourceMappingURL=index.js.map
