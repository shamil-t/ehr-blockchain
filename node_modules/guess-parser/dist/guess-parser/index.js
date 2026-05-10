(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("path"), require("typescript"), require("@wessberg/ts-evaluator"));
	else if(typeof define === 'function' && define.amd)
		define(["path", "typescript", "@wessberg/ts-evaluator"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("path"), require("typescript"), require("@wessberg/ts-evaluator")) : factory(root["path"], root["typescript"], root["@wessberg/ts-evaluator"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(global, function(__WEBPACK_EXTERNAL_MODULE__0__, __WEBPACK_EXTERNAL_MODULE__1__, __WEBPACK_EXTERNAL_MODULE__14__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 11);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__0__;

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__1__;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var base_1 = __webpack_require__(15);
exports.parseReactRoutes = base_1.parseReactRoutes;
var react_tsx_1 = __webpack_require__(16);
exports.parseReactTSXRoutes = react_tsx_1.parseRoutes;
var react_jsx_1 = __webpack_require__(17);
exports.parseReactJSXRoutes = react_jsx_1.parseRoutes;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(13));


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts = __webpack_require__(1);
var path_1 = __webpack_require__(0);
var fs_1 = __webpack_require__(2);
var routes_1 = __webpack_require__(6);
exports.findRootModule = function (registry) {
    var childModules = new Set();
    var traverseRoute = function (route) {
        if (route.module) {
            childModules.add(route.module);
        }
        route.children.forEach(traverseRoute);
    };
    var allModulePaths = Object.keys(registry);
    allModulePaths.forEach(function (path) {
        var declaration = registry[path];
        // It's possible if the declaration does not exist
        // See https://github.com/guess-js/guess/issues/311
        if (declaration) {
            declaration.eagerRoutes.forEach(traverseRoute);
            declaration.lazyRoutes.forEach(traverseRoute);
        }
    });
    var roots = allModulePaths.filter(function (m) { return !childModules.has(m); });
    if (roots.length > 1) {
        throw new Error('Multiple root routing modules found ' + roots.join(', '));
    }
    return roots[0];
};
exports.collectRoutingModules = function (rootFile, registry, result, parentFilePath, currentRoutePath, existing) {
    if (parentFilePath === void 0) { parentFilePath = rootFile; }
    if (currentRoutePath === void 0) { currentRoutePath = ''; }
    if (existing === void 0) { existing = new Set(); }
    var declaration = registry[rootFile];
    // It's possible if the declaration does not exist
    // See https://github.com/guess-js/guess/issues/311
    if (!declaration) {
        return;
    }
    var process = function (r, routePath) {
        if (routePath === void 0) { routePath = currentRoutePath; }
        if (r.module) {
            // tslint:disable-next-line: no-use-before-declare
            return processLazyRoute(r, routePath);
        }
        // tslint:disable-next-line: no-use-before-declare
        return processRoute(r, routePath);
    };
    var processRoute = function (r, routePath) {
        if (routePath === void 0) { routePath = currentRoutePath; }
        var path = (routePath + '/' + r.path).replace(/\/$/, '');
        r.children.forEach(function (route) { return process(route, path); });
        if (!existing.has(path)) {
            var routingModule = {
                path: path,
                lazy: parentFilePath !== rootFile && r.redirectTo === undefined,
                modulePath: rootFile,
                parentModulePath: parentFilePath,
            };
            if (r.redirectTo !== undefined) {
                routingModule.redirectTo = r.redirectTo;
            }
            result.push(routingModule);
            existing.add(path);
        }
    };
    var processLazyRoute = function (r, routePath) {
        if (routePath === void 0) { routePath = currentRoutePath; }
        var path = (routePath + '/' + r.path).replace(/\/$/, '');
        r.children.forEach(function (route) { return process(route, path); });
        exports.collectRoutingModules(r.module, registry, result, rootFile, path);
    };
    declaration.eagerRoutes.forEach(function (r) { return processRoute(r); });
    declaration.lazyRoutes.forEach(function (r) { return processLazyRoute(r); });
};
exports.findMainModule = function (program) {
    var tryFindMainModule = function (n, sf) {
        if (n.kind === ts.SyntaxKind.Identifier &&
            n.text === 'bootstrapModule') {
            var propAccess = n.parent;
            if (!propAccess ||
                propAccess.kind !== ts.SyntaxKind.PropertyAccessExpression) {
                return null;
            }
            var tempExpr = propAccess.parent;
            if (!tempExpr || tempExpr.kind !== ts.SyntaxKind.CallExpression) {
                return null;
            }
            var expr = tempExpr;
            var module_1 = expr.arguments[0];
            var tc = program.getTypeChecker();
            var symbol = tc.getTypeAtLocation(module_1).getSymbol();
            if (!symbol) {
                return null;
            }
            var decl = symbol.getDeclarations();
            if (!decl) {
                return null;
            }
            return path_1.resolve(decl[0].getSourceFile().fileName);
        }
        var mainPath = null;
        n.forEachChild(function (c) {
            if (mainPath) {
                return mainPath;
            }
            mainPath = tryFindMainModule(c, sf);
        });
        return mainPath;
    };
    return program.getSourceFiles().reduce(function (a, sf) {
        if (a) {
            return a;
        }
        var mainPath = null;
        sf.forEachChild(function (n) {
            if (mainPath) {
                return;
            }
            mainPath = tryFindMainModule(n, sf);
        });
        return mainPath;
    }, null);
};
var isImportDeclaration = function (node) {
    return node.kind === ts.SyntaxKind.ImportDeclaration;
};
var isReExportDeclaration = function (node) {
    return (node.kind === ts.SyntaxKind.ExportDeclaration && node.exportClause === undefined);
};
var normalizeFilePath = function (path) {
    return path_1.join.apply(void 0, __spread(path.split(/\//).map(function (part, index) { return (part === '' && index === 0) ? path_1.sep : part; })));
};
exports.getModulePathFromRoute = function (parentPath, loadChildren, program, host) {
    var childModule = loadChildren.split('#')[0];
    var resolvedModule = ts.resolveModuleName(childModule, parentPath, program.getCompilerOptions(), host).resolvedModule;
    if (resolvedModule) {
        return normalizeFilePath(resolvedModule.resolvedFileName);
    }
    var childModuleFile = childModule + '.ts';
    var parentSegments = path_1.dirname(parentPath).split(path_1.sep);
    var childSegments = childModuleFile.split('/');
    var max = Math.min(parentSegments.length, childSegments.length);
    var maxCommon = 0;
    for (var i = 1; i < max; i += 1) {
        for (var j = 0; j < i; j += 1) {
            var common = 0;
            if (parentSegments[parentSegments.length - 1 - j] === childSegments[j]) {
                common++;
                maxCommon = Math.max(maxCommon, common);
            }
            else {
                // breaking here
                common = 0;
                j = i;
            }
        }
    }
    var path = path_1.join(path_1.dirname(parentPath), childModuleFile
        .split('/')
        .slice(maxCommon, childSegments.length)
        .join('/'));
    // This early failure provides better error message compared to the
    // generic "Multiple root routing modules" error.
    if (!fs_1.existsSync(path)) {
        throw new Error("The relative path \"" + loadChildren + "\" to \"" + parentPath + "\" cannot be resolved to a module");
    }
    return path;
};
var imports = function (parent, child, program, host, importCache, visited) {
    if (visited === void 0) { visited = {}; }
    if (importCache[parent] && importCache[parent][child] !== undefined) {
        return importCache[parent][child];
    }
    importCache[parent] = importCache[parent] || {};
    var sf = program.getSourceFile(parent);
    if (!sf) {
        importCache[parent][child] = false;
        return false;
    }
    if (visited[parent]) {
        importCache[parent][child] = false;
        return false;
    }
    visited[parent] = true;
    var found = false;
    sf.forEachChild(function (n) {
        if (found) {
            return;
        }
        if (!isImportDeclaration(n) && !isReExportDeclaration(n)) {
            return;
        }
        var path = n.moduleSpecifier.text;
        var resolvedModule = ts.resolveModuleName(path, parent, program.getCompilerOptions(), host).resolvedModule;
        if (resolvedModule === undefined) {
            return;
        }
        var fullPath = normalizeFilePath(resolvedModule.resolvedFileName);
        if (fullPath === child) {
            found = true;
        }
        // We don't want to dig into node_modules to find an entry point.
        if (!found && fs_1.existsSync(fullPath) && !fullPath.includes('node_modules')) {
            found = imports(fullPath, child, program, host, importCache, visited);
        }
    });
    importCache[parent][child] = found;
    return found;
};
var cache = {};
exports.cleanModuleCache = function () { return (cache = {}); };
// This can potentially break if there's a lazy module
// that is not only loaded lazily but also imported
// inside of a parent module.
//
// For example, `app.module.ts` lazily loads `bar.module.ts`
// in the same time `app.module.ts` imports `bar.module.ts`
// this way the module entry point will be `app.module.ts`.
exports.getModuleEntryPoint = function (path, entryPoints, program, host) {
    var parents = __spread(entryPoints).filter(function (e) { return imports(e, path, program, host, cache); });
    // If no parents, this could be the root module
    if (parents.length === 0) {
        return path;
    }
    if (parents.length > 1) {
        throw new Error("Module " + path + " belongs to more than one module: " + parents.join(', '));
    }
    return parents[0];
};
exports.getLazyEntryPoints = function (node, program, host) {
    var value = routes_1.readLoadChildren(node, program.getTypeChecker());
    if (!value) {
        return null;
    }
    var parent = path_1.resolve(node.getSourceFile().fileName);
    var module = exports.getModulePathFromRoute(parent, value, program, host);
    return module;
};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts = __webpack_require__(1);
var ts_evaluator_1 = __webpack_require__(14);
var modules_1 = __webpack_require__(5);
var path_1 = __webpack_require__(0);
var getObjectProp = function (node, prop) {
    var e_1, _a;
    var vals = node.properties.values();
    try {
        for (var vals_1 = __values(vals), vals_1_1 = vals_1.next(); !vals_1_1.done; vals_1_1 = vals_1.next()) {
            var val = vals_1_1.value;
            if (val.kind !== ts.SyntaxKind.PropertyAssignment) {
                continue;
            }
            var value = val;
            if (value.name.kind !== ts.SyntaxKind.Identifier) {
                continue;
            }
            var name_1 = value.name.text;
            if (name_1 === prop) {
                return value.initializer;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (vals_1_1 && !vals_1_1.done && (_a = vals_1.return)) _a.call(vals_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return null;
};
exports.readLoadChildren = function (node, typeChecker) {
    var expr = getObjectProp(node, 'loadChildren');
    if (!expr) {
        return null;
    }
    if (expr.kind === ts.SyntaxKind.StringLiteral) {
        return expr.text;
    }
    var result = null;
    var visitor = function (n) {
        if (n.kind === ts.SyntaxKind.ImportKeyword) {
            var parent_1 = n.parent;
            var arg = parent_1.arguments[0];
            var res = ts_evaluator_1.evaluate({
                node: arg,
                typeChecker: typeChecker
            });
            if (res.success) {
                result = res.value;
            }
        }
        if (result) {
            return;
        }
        n.forEachChild(visitor);
    };
    expr.forEachChild(visitor);
    // Fallback to when loadChildren looks like:
    // loadChildren: 'foo' + '/' + 'bar'
    if (!result) {
        var res = ts_evaluator_1.evaluate({
            node: expr,
            typeChecker: typeChecker
        });
        if (res.success) {
            result = res.value;
        }
    }
    return result;
};
var readPath = function (node, typeChecker) {
    var expr = getObjectProp(node, 'path');
    if (!expr) {
        return null;
    }
    var val = ts_evaluator_1.evaluate({
        node: expr,
        typeChecker: typeChecker
    });
    if (val.success) {
        return val.value;
    }
    return null;
};
var readRedirect = function (node, typeChecker) {
    var expr = getObjectProp(node, 'redirectTo');
    if (!expr) {
        return null;
    }
    var val = ts_evaluator_1.evaluate({
        node: expr,
        typeChecker: typeChecker
    });
    if (val.success) {
        return val.value;
    }
    return null;
};
exports.readChildren = function (node) {
    var expr = getObjectProp(node, 'children');
    if (!expr) {
        return null;
    }
    return expr.elements;
};
exports.getRoute = function (node, entryPoints, program, host) {
    var path = readPath(node, program.getTypeChecker());
    if (path === null) {
        return null;
    }
    var childrenArray = exports.readChildren(node);
    var children = [];
    if (childrenArray) {
        children = childrenArray
            .map(function (c) {
            if (c.kind !== ts.SyntaxKind.ObjectLiteralExpression) {
                return null;
            }
            return exports.getRoute(c, entryPoints, program, host);
        })
            .filter(function (e) { return e !== null; });
    }
    var route = { path: path, children: children };
    var redirectTo = readRedirect(node, program.getTypeChecker());
    if (redirectTo) {
        route.redirectTo = redirectTo;
    }
    var loadChildren = exports.readLoadChildren(node, program.getTypeChecker());
    if (loadChildren) {
        var parent_2 = modules_1.getModuleEntryPoint(path_1.resolve(node.getSourceFile().fileName), entryPoints, program, host);
        var module_1 = modules_1.getModulePathFromRoute(parent_2, loadChildren, program, host);
        return __assign({}, route, { module: module_1 });
    }
    return route;
};
exports.isRoute = function (n, typeChecker, redirects) {
    if (n.kind !== ts.SyntaxKind.ObjectLiteralExpression ||
        !n.parent ||
        n.parent.kind !== ts.SyntaxKind.ArrayLiteralExpression) {
        return false;
    }
    var objLiteral = n;
    var path = readPath(objLiteral, typeChecker) !== null;
    var redirectTo = redirects && readRedirect(objLiteral, typeChecker) !== null;
    var children = !!exports.readChildren(objLiteral);
    var loadChildren = !!exports.readLoadChildren(objLiteral, typeChecker);
    var component = !!getObjectProp(objLiteral, 'component');
    return (path && children) || (path && component) || (path && loadChildren) || (path && redirectTo);
};


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __webpack_require__(2);
var path_1 = __webpack_require__(0);
exports.readFiles = function (dir) {
    if (dir === 'node_modules') {
        return [];
    }
    var result = fs_1.readdirSync(dir).map(function (node) { return path_1.join(dir, node); });
    var files = result.filter(function (node) { return fs_1.statSync(node).isFile() && (node.endsWith('.jsx') || node.endsWith('.js')); });
    var dirs = result.filter(function (node) { return fs_1.statSync(node).isDirectory(); });
    return [].concat.apply(files, dirs.map(exports.readFiles));
};


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts = __webpack_require__(1);
var path = __webpack_require__(0);
var utils_1 = __webpack_require__(7);
var language_service_1 = __webpack_require__(18);
var LazyRe = /routes\/((\w+\/index)|\w+)\.(js|jsx|ts|tsx)$/;
var getLazyDefinition = function (filename, identifier, ls) {
    var defs = ls.getDefinitionAtPosition(filename, identifier.pos + 1);
    if (!defs) {
        return undefined;
    }
    return defs.filter(function (d) { return LazyRe.test(d.fileName) && d.kind === 'class'; }).pop();
};
var extractModule = function (a) {
    var init = a.initializer;
    if (!init) {
        return null;
    }
    var arrow = init.expression;
    if (!arrow) {
        return '';
    }
    var body = arrow.body;
    if (!body) {
        return '';
    }
    var temp = body.expression;
    if (!temp) {
        return '';
    }
    var internalExpr = temp.expression;
    if (!internalExpr) {
        return '';
    }
    var arg = internalExpr.arguments[0];
    if (!arg || arg.kind !== ts.SyntaxKind.StringLiteral) {
        return '';
    }
    return arg.text;
};
var extractRoute = function (c, file, ls) {
    if (c.kind !== ts.SyntaxKind.JsxElement && c.kind !== ts.SyntaxKind.JsxSelfClosingElement) {
        return;
    }
    var el = c.openingElement;
    if (c.kind === ts.SyntaxKind.JsxSelfClosingElement) {
        el = c;
    }
    var module = {
        lazy: el.tagName.text === 'AsyncRoute',
        parentModulePath: file.fileName,
        modulePath: file.fileName
    };
    var def = getLazyDefinition(file.getSourceFile().fileName, el, ls);
    if (def) {
        module.lazy = true;
        module.modulePath = def.fileName;
    }
    el.attributes.properties.forEach(function (p) {
        var text = p.name.text;
        if (text === 'path') {
            module.path = p.initializer.text;
        }
        if (text === 'getComponent') {
            var parts = file.fileName.split('/');
            parts.pop();
            var tempName = extractModule(p);
            if (tempName) {
                var name_1 = tempName + '.tsx';
                module.modulePath = '/' + path.join.apply(path, __spread(parts.concat([name_1])));
                module.lazy = true;
            }
        }
    });
    return module;
};
var extractRoutes = function (file, ls) {
    var result = [];
    var stack = [file];
    while (stack.length) {
        var c = stack.pop();
        if (!c) {
            return result;
        }
        var el = c.openingElement;
        if (c.kind === ts.SyntaxKind.JsxElement && el.tagName.text === 'Router') {
            c.children.forEach(function (e) {
                var route = extractRoute(e, file, ls);
                if (route) {
                    result.push(route);
                }
            });
        }
        else {
            c.getChildren(file).forEach(function (child) { return stack.push(child); });
        }
    }
    return result;
};
exports.parsePreactJSXRoutes = function (base) {
    var options = {
        jsx: ts.JsxEmit.React,
        allowJs: true
    };
    var rootFileNames = utils_1.readFiles(base);
    var program = ts.createProgram(rootFileNames, options);
    var jsxFiles = program
        .getSourceFiles()
        .filter(function (f) { return f.fileName.endsWith('.tsx') || f.fileName.endsWith('.jsx') || f.fileName.endsWith('.js'); });
    var routes = jsxFiles.reduce(function (a, f) { return a.concat(extractRoutes(f, language_service_1.getLanguageService(rootFileNames, options))); }, []);
    var routeMap = routes.reduce(function (a, m) {
        a[m.path] = m;
        return a;
    }, {});
    return Object.keys(routeMap).map(function (k) { return routeMap[k]; });
};


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ProjectType;
(function (ProjectType) {
    ProjectType["AngularCLI"] = "angular-cli";
    ProjectType["CreateReactApp"] = "create-react-app";
    ProjectType["PreactCLI"] = "preact-cli";
    ProjectType["Gatsby"] = "gatsby";
    ProjectType["CreateReactAppTypeScript"] = "create-react-app-typescript";
})(ProjectType = exports.ProjectType || (exports.ProjectType = {}));


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(__webpack_require__(19));


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = __webpack_require__(12);
exports.parseRoutes = parser_1.parseRoutes;
var detector_1 = __webpack_require__(10);
exports.detect = detector_1.detect;
var angular_1 = __webpack_require__(4);
exports.parseAngularRoutes = angular_1.parseRoutes;
__export(__webpack_require__(3));
__export(__webpack_require__(8));


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var angular_1 = __webpack_require__(4);
var react_1 = __webpack_require__(3);
var preact_1 = __webpack_require__(8);
var interfaces_1 = __webpack_require__(9);
var detector_1 = __webpack_require__(10);
var path_1 = __webpack_require__(0);
var unique = function (a) {
    var map = {};
    a.forEach(function (r) { return (map[r.path] = r); });
    return Object.keys(map).map(function (k) { return map[k]; });
};
exports.parseRoutes = function (base) {
    var result = undefined;
    var app = detector_1.detect(base);
    if (!app) {
        throw new Error('Cannot detect the application type');
    }
    if (app.type === interfaces_1.ProjectType.AngularCLI && app.details && app.details.tsconfigPath) {
        result = angular_1.parseRoutes(path_1.join(base, app.details.tsconfigPath));
    }
    if (app.type === interfaces_1.ProjectType.CreateReactAppTypeScript && app.details && app.details.tsconfigPath) {
        result = react_1.parseReactTSXRoutes(app.details.tsconfigPath);
    }
    if (app.type === interfaces_1.ProjectType.CreateReactApp && app.details && app.details.sourceDir) {
        result = react_1.parseReactJSXRoutes(path_1.join(base, app.details.sourceDir));
    }
    if (app.type === interfaces_1.ProjectType.PreactCLI && app.details && app.details.sourceDir) {
        result = preact_1.parsePreactJSXRoutes(path_1.join(base, app.details.sourceDir));
    }
    if (!result) {
        throw new Error('Unknown project type');
    }
    var res = unique(result);
    res.filter(function (r) { return !r.parentModulePath || r.path === '/'; }).forEach(function (r) { return (r.parentModulePath = null); });
    return res;
};


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts = __webpack_require__(1);
var fs_1 = __webpack_require__(2);
var path_1 = __webpack_require__(0);
var modules_1 = __webpack_require__(5);
var routes_1 = __webpack_require__(6);
var defaultOptions = {
    redirects: false,
};
var normalizeOptions = function (options) { return (__assign({}, defaultOptions, options)); };
exports.parseRoutes = function (tsconfig, exclude, inputOptions) {
    if (exclude === void 0) { exclude = []; }
    if (inputOptions === void 0) { inputOptions = {}; }
    var options = normalizeOptions(inputOptions);
    modules_1.cleanModuleCache();
    var parseConfigHost = {
        fileExists: fs_1.existsSync,
        readDirectory: ts.sys.readDirectory,
        readFile: function (file) { return fs_1.readFileSync(file, 'utf8'); },
        useCaseSensitiveFileNames: true
    };
    var config = ts.readConfigFile(tsconfig, function (path) {
        return fs_1.readFileSync(path).toString();
    });
    var parsed = ts.parseJsonConfigFileContent(config.config, parseConfigHost, path_1.resolve(path_1.dirname(tsconfig)), {
        noEmit: true
    });
    var host = ts.createCompilerHost(parsed.options, true);
    var program = ts.createProgram(parsed.fileNames, parsed.options, host);
    var typeChecker = program.getTypeChecker();
    var toAbsolute = function (file) {
        return file.startsWith('/') || file.startsWith(process.cwd()) ? file : path_1.join(process.cwd(), file);
    };
    var excludeFiles = new Set(exclude.map(toAbsolute));
    var visitTopLevelRoutes = function (s, callback, n) {
        if (excludeFiles.has(path_1.resolve(s.fileName))) {
            return;
        }
        if (!n) {
            return;
        }
        if (routes_1.isRoute(n, typeChecker, options.redirects)) {
            callback(n);
        }
        else {
            n.forEachChild(visitTopLevelRoutes.bind(null, s, callback));
        }
    };
    var mainPath = modules_1.findMainModule(program);
    if (!mainPath) {
        throw new Error('Cannot find the main application module');
    }
    var entryPoints = new Set([mainPath]);
    var collectEntryPoints = function (n) {
        var path = modules_1.getLazyEntryPoints(n, program, host);
        if (!path) {
            var childrenArray = routes_1.readChildren(n);
            if (childrenArray) {
                childrenArray.forEach(collectEntryPoints);
            }
            return;
        }
        entryPoints.add(path);
    };
    program.getSourceFiles().map(function (s) {
        s.forEachChild(visitTopLevelRoutes.bind(null, s, collectEntryPoints));
    });
    var registry = {};
    program.getSourceFiles().map(function (s) {
        s.forEachChild(visitTopLevelRoutes.bind(null, s, function (n) {
            var path = path_1.resolve(n.getSourceFile().fileName);
            var route = routes_1.getRoute(n, entryPoints, program, host);
            if (!route) {
                return;
            }
            var modulePath = modules_1.getModuleEntryPoint(path, entryPoints, program, host);
            var current = registry[modulePath] || {
                lazyRoutes: [],
                eagerRoutes: []
            };
            if (route.module) {
                current.lazyRoutes.push(route);
            }
            else {
                current.eagerRoutes.push(route);
            }
            registry[modulePath] = current;
        }));
    });
    var result = [];
    if (Object.keys(registry).length > 0) {
        modules_1.collectRoutingModules(modules_1.findRootModule(registry), registry, result);
    }
    return result;
};


/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__14__;

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts = __webpack_require__(1);
var path = __webpack_require__(0);
var extractRoutes = function (file) {
    var result = [];
    var stack = [file];
    var extractModule = function (a) {
        var init = a.initializer;
        if (!init) {
            return null;
        }
        var expr = init.expression;
        if (!expr) {
            return '';
        }
        if (!expr.arguments) {
            return '';
        }
        var arrow = expr.arguments[0];
        if (!arrow) {
            return '';
        }
        var body = arrow.body;
        if (!body) {
            return '';
        }
        var arg = body.arguments[0];
        if (!arg || arg.kind !== ts.SyntaxKind.StringLiteral) {
            return '';
        }
        return arg.text;
    };
    var _loop_1 = function () {
        var c = stack.pop();
        if (!c) {
            return { value: result };
        }
        if (c.kind === ts.SyntaxKind.JsxElement || c.kind === ts.SyntaxKind.JsxSelfClosingElement) {
            var el = c.openingElement;
            if (c.kind === ts.SyntaxKind.JsxSelfClosingElement) {
                el = c;
            }
            if (el.tagName.text === 'Route') {
                var module_1 = {
                    lazy: false,
                    parentModulePath: file.fileName,
                    modulePath: file.fileName
                };
                el.attributes.properties.forEach(function (p) {
                    var text = p.name.text;
                    if (text === 'path') {
                        module_1.path = p.initializer.text;
                    }
                    if (text === 'component') {
                        var parts = file.fileName.split('/');
                        parts.pop();
                        var tempName = extractModule(p);
                        if (tempName) {
                            var name_1 = tempName + '.tsx';
                            module_1.modulePath = '/' + path.join.apply(path, __spread(parts.concat([name_1])));
                            module_1.lazy = true;
                        }
                    }
                    result.push(module_1);
                });
            }
        }
        c.getChildren(file).forEach(function (child) {
            stack.push(child);
        });
    };
    while (stack.length) {
        var state_1 = _loop_1();
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return result;
};
exports.parseReactRoutes = function (files, options) {
    var program = ts.createProgram(files, options);
    var jsxFiles = program.getSourceFiles().filter(function (f) { return f.fileName.endsWith('.tsx') || f.fileName.endsWith('.jsx'); });
    var routes = jsxFiles.reduce(function (a, f) { return a.concat(extractRoutes(f)); }, []);
    var modules = routes.reduce(function (a, r) {
        a[r.modulePath] = true;
        return a;
    }, {});
    var rootModule = routes.filter(function (r) { return r.parentModulePath && !modules[r.parentModulePath]; }).pop();
    if (rootModule) {
        routes.push({
            path: '/',
            parentModulePath: null,
            modulePath: rootModule.parentModulePath,
            lazy: false
        });
    }
    var routeMap = routes.reduce(function (a, m) {
        a[m.path] = m;
        return a;
    }, {});
    return Object.keys(routeMap).map(function (k) { return routeMap[k]; });
};


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __webpack_require__(2);
var ts = __webpack_require__(1);
var path_1 = __webpack_require__(0);
var _1 = __webpack_require__(3);
var parseConfigHost = {
    useCaseSensitiveFileNames: true,
    fileExists: fs_1.existsSync,
    readDirectory: ts.sys.readDirectory,
    readFile: ts.sys.readFile
};
var calcProjectFileAndBasePath = function (project) {
    var projectIsDir = fs_1.lstatSync(project).isDirectory();
    var projectFile = projectIsDir ? path_1.join(project, 'tsconfig.json') : project;
    var projectDir = projectIsDir ? project : path_1.dirname(project);
    var basePath = path_1.resolve(process.cwd(), projectDir);
    return { projectFile: projectFile, basePath: basePath };
};
exports.parseRoutes = function (tsconfig) {
    var _a = ts.readConfigFile(tsconfig, function (f) { return fs_1.readFileSync(f).toString(); }), config = _a.config, error = _a.error;
    if (error) {
        throw error;
    }
    var basePath = calcProjectFileAndBasePath(tsconfig).basePath;
    var parsed = ts.parseJsonConfigFileContent(config, parseConfigHost, basePath);
    return _1.parseReactRoutes(parsed.fileNames, parsed.options);
};


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var _1 = __webpack_require__(3);
var typescript_1 = __webpack_require__(1);
var utils_1 = __webpack_require__(7);
exports.parseRoutes = function (base) {
    return _1.parseReactRoutes(utils_1.readFiles(base), {
        jsx: typescript_1.JsxEmit.React,
        allowJs: true
    });
};


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __webpack_require__(2);
var ts = __webpack_require__(1);
exports.getLanguageService = function (rootFileNames, options) {
    var files = {};
    // initialize the list of files
    rootFileNames.forEach(function (fileName) {
        files[fileName] = { version: 0 };
    });
    var servicesHost = {
        getScriptFileNames: function () { return rootFileNames; },
        getScriptVersion: function (fileName) { return files[fileName] && files[fileName].version.toString(); },
        getScriptSnapshot: function (fileName) {
            if (!fs_1.existsSync(fileName)) {
                return undefined;
            }
            return ts.ScriptSnapshot.fromString(fs_1.readFileSync(fileName).toString());
        },
        getCurrentDirectory: function () { return process.cwd(); },
        getCompilationSettings: function () { return options; },
        getDefaultLibFileName: function (o) { return ts.getDefaultLibFilePath(o); }
    };
    return ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
};


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __webpack_require__(2);
var path_1 = __webpack_require__(0);
var interfaces_1 = __webpack_require__(9);
var dep = function (p) { return function (name) { return (p.dependencies ? p.dependencies[name] : undefined); }; };
var devDep = function (p) { return function (name) { return (p.devDependencies ? p.devDependencies[name] : undefined); }; };
exports.detect = function (base) {
    var path = ['package.json', '../package.json']
        .map(function (p) { return path_1.join(base, p); })
        .filter(fs_1.existsSync)
        .pop();
    if (!path) {
        throw new Error('Unable to discover the project type');
    }
    var content = JSON.parse(fs_1.readFileSync(path).toString());
    var exists = function (file) { return fs_1.existsSync(path_1.join(base, file)); };
    var d = dep(content);
    var dd = devDep(content);
    var tsconfig = 'tsconfig.app.json';
    var srcTsConfig = path_1.join('src', tsconfig);
    if (dd('@angular/cli') && (exists(srcTsConfig) || exists(tsconfig))) {
        var tsconfigPath = tsconfig;
        if (exists(srcTsConfig)) {
            tsconfigPath = srcTsConfig;
        }
        return {
            type: interfaces_1.ProjectType.AngularCLI,
            version: dd('@angular/cli'),
            details: {
                typescript: dd('typescript'),
                tsconfigPath: tsconfigPath,
                sourceDir: 'src'
            }
        };
    }
    if (d('gatsby')) {
        return {
            type: interfaces_1.ProjectType.Gatsby,
            version: d('gatsby')
        };
    }
    if (d('react') && d('react-scripts-ts') && exists('tsconfig.json')) {
        return {
            type: interfaces_1.ProjectType.CreateReactAppTypeScript,
            version: d('react-scripts-ts'),
            details: {
                typescript: dd('typescript'),
                tsconfigPath: path_1.join(base, 'tsconfig.json'),
                sourceDir: 'src'
            }
        };
    }
    if (d('react') && d('react-scripts')) {
        return {
            type: interfaces_1.ProjectType.CreateReactApp,
            version: d('react-scripts'),
            details: {
                sourceDir: 'src'
            }
        };
    }
    if (d('preact') && dd('preact-cli')) {
        return {
            type: interfaces_1.ProjectType.PreactCLI,
            version: dd('preact-cli'),
            details: {
                sourceDir: '.'
            }
        };
    }
    return undefined;
};


/***/ })
/******/ ]);
});