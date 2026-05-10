import * as TSModule from 'typescript';
import { has, get, set, del } from 'object-path';
import { dirname } from 'path';
import { JSDOM } from 'jsdom';
import { __rest, __decorate, __param } from 'tslib';
import chalk from 'chalk';
import { inspect } from 'util';

/**
 * Returns true if the provided value is ObjectLike
 *
 * @param value
 * @returns
 */
function isObjectLike(value) {
    return value != null && (typeof value === "function" || typeof value === "object");
}
/**
 * Returns true if the given value can be observed
 *
 * @param value
 * @returns
 */
function canBeObserved(value) {
    return isObjectLike(value);
}

/**
 * Returns true if the given function is either Function.prototype.bind, Function.prototype.call, or Function.prototype.apply
 *
 * @param func
 * @param [environment]
 * @return
 */
function isBindCallApply(func, environment) {
    switch (func) {
        case Function.prototype.bind:
        case Function.prototype.call:
        case Function.prototype.apply:
            return true;
    }
    if (environment != null) {
        const _Function = getFromLexicalEnvironment(undefined, environment, "Function").literal;
        switch (func) {
            case _Function.prototype.bind:
            case _Function.prototype.call:
            case _Function.prototype.apply:
                return true;
        }
    }
    return false;
}

/* eslint-disable @typescript-eslint/ban-types */
/**
 * Stringifies the given PropertyKey path
 */
function stringifyPath(path) {
    return path.map(part => (typeof part === "symbol" ? part.description : part)).join(".");
}
/**
 * Creates a proxy with hooks to check the given policy
 */
function createPolicyProxy({ hook, item, scope, policy }) {
    /**
     * Creates a trap that captures function invocation
     */
    function createAccessTrap(inputPath, currentItem) {
        return !canBeObserved(currentItem) || isBindCallApply(currentItem)
            ? currentItem
            : new Proxy(currentItem, {
                /**
                 * Constructs a new instance of the given target
                 */
                construct(target, argArray, newTarget) {
                    // Don't proceed if the hook says no
                    if (!hook({
                        kind: "__$$_PROXY_CONSTRUCT" /* CONSTRUCT */,
                        policy,
                        newTarget,
                        argArray,
                        target,
                        path: stringifyPath(inputPath)
                    })) {
                        return {};
                    }
                    return Reflect.construct(target, argArray, newTarget);
                },
                /**
                 * A trap for a function call. Used to create new proxies for methods on the retrieved module objects
                 */
                apply(target, thisArg, argArray = []) {
                    // Don't proceed if the hook says no
                    if (!hook({
                        kind: "__$$_PROXY_APPLY" /* APPLY */,
                        policy,
                        thisArg,
                        argArray,
                        target,
                        path: stringifyPath(inputPath)
                    })) {
                        return;
                    }
                    return Reflect.apply(target, thisArg, argArray);
                },
                /**
                 * Gets a trap for 'get' accesses
                 */
                get(target, property, receiver) {
                    const newPath = [...inputPath, property];
                    // Don't proceed if the hook says no
                    if (!hook({
                        kind: "__$$_PROXY_GET" /* GET */,
                        policy,
                        path: stringifyPath(newPath),
                        target
                    })) {
                        return;
                    }
                    const match = Reflect.get(target, property, receiver);
                    const config = Reflect.getOwnPropertyDescriptor(currentItem, property);
                    if (config != null && config.configurable === false && config.writable === false) {
                        return currentItem[property];
                    }
                    return createAccessTrap(newPath, match);
                }
            });
    }
    return !canBeObserved(item) ? item : createAccessTrap([scope], item);
}

/**
 * Stringifies the given PolicyTrapKind on the given path
 *
 * @param kind
 * @param path
 * @return
 */
function stringifyPolicyTrapKindOnPath(kind, path) {
    switch (kind) {
        case "__$$_PROXY_GET" /* GET */:
            return `get ${path}`;
        case "__$$_PROXY_APPLY" /* APPLY */:
            return `${path}(...)`;
        case "__$$_PROXY_CONSTRUCT" /* CONSTRUCT */:
            return `new ${path}(...)`;
    }
}

/**
 * A Map between built-in modules and the kind of IO operations their members performs
 * @type {TrapConditionMap<NodeBuiltInsAndGlobals>}
 */
const NETWORK_MAP = {
    http2: {
        connect: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        createSecureServer: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        createServer: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        }
    },
    https: {
        createServer: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        request: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        get: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        Server: {
            ["__$$_PROXY_CONSTRUCT" /* CONSTRUCT */]: true
        },
        globalAgent: {
            destroy: {
                ["__$$_PROXY_APPLY" /* APPLY */]: true
            }
        },
        Agent: {
            ["__$$_PROXY_CONSTRUCT" /* CONSTRUCT */]: true
        }
    },
    http: {
        createServer: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        request: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        get: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        Server: {
            ["__$$_PROXY_CONSTRUCT" /* CONSTRUCT */]: true
        },
        ClientRequest: {
            ["__$$_PROXY_CONSTRUCT" /* CONSTRUCT */]: true
        },
        globalAgent: {
            destroy: {
                ["__$$_PROXY_APPLY" /* APPLY */]: true
            }
        },
        Agent: {
            ["__$$_PROXY_CONSTRUCT" /* CONSTRUCT */]: true
        }
    },
    dgram: {
        createSocket: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        }
    },
    dns: {
        lookup: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        lookupService: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolve: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolve4: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolve6: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolveAny: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolveCname: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolveMx: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolveNaptr: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolveNs: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolvePtr: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolveSoa: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolveSrv: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        resolveTxt: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        reverse: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        Resolver: {
            ["__$$_PROXY_CONSTRUCT" /* CONSTRUCT */]: true
        }
    },
    net: {
        createServer: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        createConnection: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        connect: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        Server: {
            ["__$$_PROXY_CONSTRUCT" /* CONSTRUCT */]: true
        }
    },
    tls: {
        createServer: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        createSecureContext: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        connect: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        Server: {
            ["__$$_PROXY_CONSTRUCT" /* CONSTRUCT */]: true
        },
        TLSSocket: {
            ["__$$_PROXY_CONSTRUCT" /* CONSTRUCT */]: true
        }
    }
};

/**
 * A Map between built-in identifiers and the members that produce non-deterministic results.
 * @type {TrapConditionMap<NodeBuiltInsAndGlobals>}
 */
const NONDETERMINISTIC_MAP = Object.assign(Object.assign({}, NETWORK_MAP), { Math: {
        random: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        }
    }, Date: {
        now: {
            ["__$$_PROXY_APPLY" /* APPLY */]: true
        },
        // Dates that receive no arguments are nondeterministic since they care about "now" and will evaluate to a new value for each invocation
        ["__$$_PROXY_CONSTRUCT" /* CONSTRUCT */]: (...args) => args.length === 0 && !(args[0] instanceof Date)
    } });

/**
 * Returns true if the given item is a TrapCondition
 *
 * @param item
 * @param condition
 * @return
 */
function isTrapCondition(item, condition) {
    // noinspection SuspiciousTypeOfGuard
    return typeof item === typeof condition || typeof item === "function";
}
/**
 * Returns true if the given item is a TrapCondition
 *
 * @param item
 * @return
 */
function isTrapConditionFunction(item) {
    return typeof item === "function";
}

/* eslint-disable @typescript-eslint/ban-types */
/**
 * Returns true if the given path represents something that is nondeterministic.
 *
 * @param map
 * @param condition
 * @param item
 * @returns
 */
function isTrapConditionMet(map, condition, item) {
    const atoms = item.path.split(".");
    return walkAtoms(map, condition, item, atoms);
}
/**
 * Walks all atoms of the given item path
 *
 * @param map
 * @param matchCondition
 * @param item
 * @param atoms
 * @return
 */
function walkAtoms(map, matchCondition, item, atoms) {
    const [head, ...tail] = atoms;
    if (head == null)
        return false;
    const mapEntry = map[head];
    // If nothing was matched within the namespace, the trap wasn't matched
    if (mapEntry == null)
        return false;
    if (isTrapCondition(mapEntry, matchCondition)) {
        return handleTrapCondition(mapEntry, matchCondition, item);
    }
    else {
        const trapMapMatch = mapEntry[item.kind];
        if (trapMapMatch != null) {
            return handleTrapCondition(trapMapMatch, matchCondition, item);
        }
        else {
            return walkAtoms(mapEntry, matchCondition, item, tail);
        }
    }
}
/**
 * Handles a TrapCondition
 *
 * @param trapCondition
 * @param matchCondition
 * @param item
 * @return
 */
function handleTrapCondition(trapCondition, matchCondition, item) {
    // If matching the condition depends on the provided arguments, pass them in
    if (isTrapConditionFunction(trapCondition)) {
        const castItem = item;
        return trapCondition(...castItem.argArray) === matchCondition;
    }
    // Otherwise, evaluate the truthiness of the condition
    else {
        return trapCondition === matchCondition;
    }
}

/**
 * Returns true if the given path represents something that is nondeterministic.
 *
 * @param item
 * @returns
 */
function isNonDeterministic(item) {
    return isTrapConditionMet(NONDETERMINISTIC_MAP, true, item);
}

/**
 * A Base class for EvaluationErrors
 */
class EvaluationError extends Error {
    constructor({ node, message }) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.node = node;
    }
}

/**
 * An Error that can be thrown when a policy is violated
 */
class PolicyError extends EvaluationError {
    constructor({ violation, node, message }) {
        super({ node, message: `[${violation}]: ${message}` });
        this.violation = violation;
    }
}

/**
 * An Error that can be thrown when something nondeterministic is attempted to be evaluated and has been disallowed to be so
 */
class NonDeterministicError extends PolicyError {
    constructor({ operation, node, message = `The operation: '${operation}' is nondeterministic. That is in violation of the policy` }) {
        super({ violation: "deterministic", message, node });
        this.operation = operation;
    }
}

/**
 * A Map between built-in modules and the kind of IO operations their members performs
 * @type {TrapConditionMap<NodeBuiltInsAndGlobals, "read"|"write">}
 */
const IO_MAP = {
    fs: {
        readFile: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        readFileSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        readdir: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        readdirSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        read: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        readSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        exists: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        existsSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        access: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        accessSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        close: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        closeSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        createReadStream: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        stat: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        statSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        watch: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        watchFile: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        unwatchFile: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        realpath: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        realpathSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        fstat: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        fstatSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "read"
        },
        createWriteStream: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        copyFile: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        copyFileSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        unlink: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        unlinkSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        rmdir: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        rmdirSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        symlink: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        symlinkSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        truncate: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        truncateSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        utimes: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        utimesSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        appendFile: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        appendFileSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        write: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        writeSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        writeFile: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        writeFileSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        chmod: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        chmodSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        chown: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        chownSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        mkdir: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        mkdirSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        rename: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        renameSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        futimes: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        futimesSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        link: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        linkSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        mkdtemp: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        open: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        openSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        fchmod: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        fchmodSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        fchown: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        fchownSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        ftruncate: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        ftruncateSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        fsync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        fsyncSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        fdatasync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        fdatasyncSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        lchmod: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        },
        lchmodSync: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "write"
        }
    }
};

/**
 * Returns true if the given member represents a READ operation from IO
 *
 * @param item
 * @returns
 */
function isIoRead(item) {
    return isTrapConditionMet(IO_MAP, "read", item);
}

/**
 * An Error that can be thrown when an IO operation is attempted to be executed that is in violation of the context policy
 */
class IoError extends PolicyError {
    constructor({ node, kind, message = `${kind} operations are in violation of the policy` }) {
        super({ violation: "io", message, node });
        this.kind = kind;
    }
}

/**
 * Returns true if the given member represents a WRITE operation from IO
 *
 * @param item
 * @returns
 */
function isIoWrite(item) {
    return isTrapConditionMet(IO_MAP, "write", item);
}

/**
 * Returns true if the given item represents a network operation
 *
 * @param item
 * @returns
 */
function isNetworkOperation(item) {
    return isTrapConditionMet(NETWORK_MAP, true, item);
}

/**
 * An Error that can be thrown when a network operation is attempted to be executed that is in violation of the context policy
 */
class NetworkError extends PolicyError {
    constructor({ operation, node, message = `The operation: '${operation}' is performing network activity. That is in violation of the policy` }) {
        super({ violation: "deterministic", message, node });
        this.operation = operation;
    }
}

/**
 * A Map between built-in modules (as well as 'process' and the kind of IO operations their members performs
 * @type {TrapConditionMap<NodeBuiltInsAndGlobals, string>}
 */
const PROCESS_MAP = {
    process: {
        exit: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "exit"
        }
    },
    // Everything inside child_process is just one big violation of this policy
    child_process: {
        ["__$$_PROXY_APPLY" /* APPLY */]: "spawnChild"
    },
    cluster: {
        fork: {
            ["__$$_PROXY_APPLY" /* APPLY */]: "spawnChild"
        },
        worker: {
            ["__$$_PROXY_GET" /* GET */]: "spawnChild"
        },
        Worker: {
            ["__$$_PROXY_CONSTRUCT" /* CONSTRUCT */]: "spawnChild"
        },
        workers: {
            ["__$$_PROXY_GET" /* GET */]: "spawnChild"
        }
    }
};

/**
 * Returns true if the given item represents a process operation that exits the process
 *
 * @param item
 * @returns
 */
function isProcessExitOperation(item) {
    return isTrapConditionMet(PROCESS_MAP, "exit", item);
}

/**
 * An Error that can be thrown when a Process operation is attempted to be executed that is in violation of the context policy
 */
class ProcessError extends PolicyError {
    constructor({ kind, node, message = `${kind} operations are in violation of the policy` }) {
        super({ violation: "process", message, node });
        this.kind = kind;
    }
}

/**
 * Returns true if the given item represents a process operation that spawns a child
 *
 * @param item
 * @returns
 */
function isProcessSpawnChildOperation(item) {
    return isTrapConditionMet(PROCESS_MAP, "spawnChild", item);
}

/**
 * A Map between built-in modules (as well as 'console' and the operations that print to console
 * @type {TrapConditionMap<NodeBuiltInsAndGlobals>}
 */
const CONSOLE_MAP = {
    console: {
        ["__$$_PROXY_APPLY" /* APPLY */]: true
    }
};

/**
 * Returns true if the given item represents an operation that prints to console
 *
 * @param item
 * @returns
 */
function isConsoleOperation(item) {
    return isTrapConditionMet(CONSOLE_MAP, true, item);
}

/**
 * Creates an environment that provide hooks into policy checks
 */
function createSanitizedEnvironment({ policy, env, getCurrentNode }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hook = (item) => {
        if (!policy.console && isConsoleOperation(item)) {
            return false;
        }
        if (!policy.io.read && isIoRead(item)) {
            throw new IoError({ kind: "read", node: getCurrentNode() });
        }
        if (!policy.io.write && isIoWrite(item)) {
            throw new IoError({ kind: "write", node: getCurrentNode() });
        }
        if (!policy.process.exit && isProcessExitOperation(item)) {
            throw new ProcessError({ kind: "exit", node: getCurrentNode() });
        }
        if (!policy.process.exit && isProcessSpawnChildOperation(item)) {
            throw new ProcessError({ kind: "spawnChild", node: getCurrentNode() });
        }
        if (!policy.network && isNetworkOperation(item)) {
            throw new NetworkError({ operation: stringifyPolicyTrapKindOnPath(item.kind, item.path), node: getCurrentNode() });
        }
        if (policy.deterministic && isNonDeterministic(item)) {
            throw new NonDeterministicError({ operation: stringifyPolicyTrapKindOnPath(item.kind, item.path), node: getCurrentNode() });
        }
        return true;
    };
    const descriptors = Object.entries(Object.getOwnPropertyDescriptors(env));
    const gettersAndSetters = Object.assign({}, ...descriptors.filter(([, descriptor]) => !("value" in descriptor)).map(([name, descriptor]) => ({ [name]: descriptor })));
    const values = Object.assign({}, ...descriptors
        .filter(([, descriptor]) => "value" in descriptor)
        .map(([name, descriptor]) => ({
        [name]: name === "require"
            ? new Proxy(descriptor.value, {
                /**
                 * A trap for a function call. Used to create new proxies for methods on the retrieved module objects
                 *
                 * @param target
                 * @param thisArg
                 * @param argArray
                 * @return
                 */
                apply(target, thisArg, argArray = []) {
                    const [moduleName] = argArray;
                    return createPolicyProxy({
                        policy,
                        item: Reflect.apply(target, thisArg, argArray),
                        scope: moduleName,
                        hook
                    });
                }
            })
            : createPolicyProxy({
                policy,
                item: descriptor.value,
                scope: name,
                hook
            })
    })));
    return Object.defineProperties(values, Object.assign({}, gettersAndSetters));
}

const ECMA_GLOBALS = () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const base = {
        Infinity,
        NaN,
        undefined,
        isNaN,
        parseFloat,
        parseInt,
        decodeURI,
        decodeURIComponent,
        encodeURI,
        encodeURIComponent,
        Array,
        Boolean,
        Date,
        Error,
        EvalError,
        Number,
        Object,
        RangeError,
        ReferenceError,
        RegExp,
        String,
        SyntaxError,
        TypeError,
        URIError,
        JSON,
        Math,
        escape,
        unescape,
        // eslint-disable-next-line no-eval
        eval,
        Function
        /* eslint-enable @typescript-eslint/naming-convention */
    };
    try {
        base.BigInt = BigInt;
    }
    catch (_a) { }
    try {
        base.Reflect = Reflect;
    }
    catch (_b) { }
    try {
        base.WeakMap = WeakMap;
    }
    catch (_c) { }
    try {
        base.WeakSet = WeakSet;
    }
    catch (_d) { }
    try {
        base.Set = Set;
    }
    catch (_e) { }
    try {
        base.Map = Map;
    }
    catch (_f) { }
    try {
        base.Uint8Array = Uint8Array;
    }
    catch (_g) { }
    try {
        base.Uint8ClampedArray = Uint8ClampedArray;
    }
    catch (_h) { }
    try {
        base.Uint16Array = Uint16Array;
    }
    catch (_j) { }
    try {
        base.Uint32Array = Uint32Array;
    }
    catch (_k) { }
    try {
        base.Intl = Intl;
    }
    catch (_l) { }
    try {
        base.Int8Array = Int8Array;
    }
    catch (_m) { }
    try {
        base.Int16Array = Int16Array;
    }
    catch (_o) { }
    try {
        base.Int32Array = Int32Array;
    }
    catch (_p) { }
    try {
        base.Float32Array = Float32Array;
    }
    catch (_q) { }
    try {
        base.Float64Array = Float64Array;
    }
    catch (_r) { }
    try {
        base.ArrayBuffer = ArrayBuffer;
    }
    catch (_s) { }
    try {
        base.DataView = DataView;
    }
    catch (_t) { }
    try {
        base.isFinite = isFinite;
    }
    catch (_u) { }
    try {
        base.Promise = Promise;
    }
    catch (_v) { }
    try {
        base.Proxy = Proxy;
    }
    catch (_w) { }
    try {
        base.Symbol = Symbol;
    }
    catch (_x) { }
    return base;
};

/* eslint-disable @typescript-eslint/ban-types */
function mergeDescriptors(a, b, c) {
    const newObj = {};
    const normalizedB = b == null ? {} : b;
    const normalizedC = c == null ? {} : c;
    [a, normalizedB, normalizedC].forEach(item => Object.defineProperties(newObj, Object.getOwnPropertyDescriptors(item)));
    return newObj;
}

/* eslint-disable @typescript-eslint/ban-types */
/**
 * Excludes the properties of B from A
 */
function subtract(a, b) {
    const newA = {};
    Object.getOwnPropertyNames(a).forEach(name => {
        if (!(name in b)) {
            Object.defineProperty(newA, name, Object.getOwnPropertyDescriptor(a, name));
        }
    });
    return newA;
}

const NODE_GLOBALS = () => {
    const ecmaGlobals = ECMA_GLOBALS();
    const merged = mergeDescriptors(subtract(global, ecmaGlobals), ecmaGlobals, {
        require,
        __dirname: (fileName) => dirname(fileName),
        __filename: (fileName) => fileName
    });
    Object.defineProperties(merged, {
        global: {
            get() {
                return merged;
            }
        },
        globalThis: {
            get() {
                return merged;
            }
        }
    });
    return merged;
};

var EnvironmentPresetKind;
(function (EnvironmentPresetKind) {
    EnvironmentPresetKind["NONE"] = "NONE";
    EnvironmentPresetKind["ECMA"] = "ECMA";
    EnvironmentPresetKind["BROWSER"] = "BROWSER";
    EnvironmentPresetKind["NODE"] = "NODE";
})(EnvironmentPresetKind || (EnvironmentPresetKind = {}));

/**
 * Returns an object containing the properties that are relevant to 'requestAnimationFrame' and 'requestIdleCallback'
 */
function rafImplementation(global) {
    let lastTime = 0;
    const _requestAnimationFrame = function requestAnimationFrame(callback) {
        const currTime = new Date().getTime();
        const timeToCall = Math.max(0, 16 - (currTime - lastTime));
        const id = global.setTimeout(function () {
            callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
    const _cancelAnimationFrame = function cancelAnimationFrame(id) {
        clearTimeout(id);
    };
    return {
        requestAnimationFrame: _requestAnimationFrame,
        cancelAnimationFrame: _cancelAnimationFrame
    };
}

const BROWSER_GLOBALS = () => {
    const { window } = new JSDOM("", { url: "https://example.com" });
    const ecmaGlobals = ECMA_GLOBALS();
    const raf = rafImplementation(window);
    const merged = mergeDescriptors(subtract(window, ecmaGlobals), subtract(raf, window), ecmaGlobals);
    Object.defineProperties(merged, {
        window: {
            get() {
                return merged;
            }
        },
        globalThis: {
            get() {
                return merged;
            }
        }
    });
    return merged;
};

const RETURN_SYMBOL = "[return]";

const BREAK_SYMBOL = "[break]";

const CONTINUE_SYMBOL = "[continue]";

const THIS_SYMBOL = "this";

const SUPER_SYMBOL = "super";

/**
 * Gets a value from a Lexical Environment
 *
 * @param env
 * @param path
 * @returns
 */
function getRelevantDictFromLexicalEnvironment(env, path) {
    const [firstBinding] = path.split(".");
    if (has(env.env, firstBinding))
        return env.env;
    if (env.parentEnv != null)
        return getRelevantDictFromLexicalEnvironment(env.parentEnv, path);
    return undefined;
}
/**
 * Gets the EnvironmentPresetKind for the given LexicalEnvironment
 */
function getPresetForLexicalEnvironment(env) {
    if (env.preset != null)
        return env.preset;
    else if (env.parentEnv != null)
        return getPresetForLexicalEnvironment(env.parentEnv);
    else
        return EnvironmentPresetKind.NONE;
}
/**
 * Gets a value from a Lexical Environment
 */
function getFromLexicalEnvironment(node, env, path) {
    const [firstBinding] = path.split(".");
    if (has(env.env, firstBinding)) {
        const literal = get(env.env, path);
        switch (path) {
            // If we're in a Node environment, the "__dirname" and "__filename" meta-properties should report the current directory or file of the SourceFile and not the parent process
            case "__dirname":
            case "__filename": {
                const preset = getPresetForLexicalEnvironment(env);
                return preset === EnvironmentPresetKind.NODE && typeof literal === "function" && node != null ? { literal: literal(node.getSourceFile().fileName) } : { literal };
            }
            default:
                return { literal };
        }
    }
    if (env.parentEnv != null)
        return getFromLexicalEnvironment(node, env.parentEnv, path);
    return undefined;
}
/**
 * Returns true if the given lexical environment contains a value on the given path that equals the given literal
 */
function pathInLexicalEnvironmentEquals(node, env, equals, ...matchPaths) {
    return matchPaths.some(path => {
        const match = getFromLexicalEnvironment(node, env, path);
        return match == null ? false : match.literal === equals;
    });
}
/**
 * Returns true if the given value represents an internal symbol
 *
 * @param value
 * @return
 */
function isInternalSymbol(value) {
    switch (value) {
        case RETURN_SYMBOL:
        case BREAK_SYMBOL:
        case CONTINUE_SYMBOL:
        case THIS_SYMBOL:
        case SUPER_SYMBOL:
            return true;
        default:
            return false;
    }
}
/**
 * Gets a value from a Lexical Environment
 *
 * @param options
 * @param [newBinding=false]
 */
function setInLexicalEnvironment({ env, path, value, reporting, node, newBinding = false }) {
    const [firstBinding] = path.split(".");
    if (has(env.env, firstBinding) || newBinding || env.parentEnv == null) {
        // If the value didn't change, do no more
        if (has(env.env, path) && get(env.env, path) === value)
            return;
        // Otherwise, mutate it
        set(env.env, path, value);
        // Inform reporting hooks if any is given
        if (reporting.reportBindings != null && !isInternalSymbol(path)) {
            reporting.reportBindings({ path, value, node });
        }
    }
    else {
        let currentParentEnv = env.parentEnv;
        while (currentParentEnv != null) {
            if (has(currentParentEnv.env, firstBinding)) {
                // If the value didn't change, do no more
                if (has(currentParentEnv.env, path) && get(currentParentEnv.env, path) === value)
                    return;
                // Otherwise, mutate it
                set(currentParentEnv.env, path, value);
                // Inform reporting hooks if any is given
                if (reporting.reportBindings != null && !isInternalSymbol(path)) {
                    reporting.reportBindings({ path, value, node });
                }
                return;
            }
            else {
                currentParentEnv = currentParentEnv.parentEnv;
            }
        }
    }
}
/**
 * Clears a binding from a Lexical Environment
 *
 * @param env
 * @param path
 */
function clearBindingFromLexicalEnvironment(env, path) {
    const [firstBinding] = path.split(".");
    if (has(env.env, firstBinding)) {
        del(env.env, path);
    }
    else {
        let currentParentEnv = env.parentEnv;
        while (currentParentEnv != null) {
            if (has(currentParentEnv.env, firstBinding)) {
                del(currentParentEnv.env, path);
                return;
            }
            else {
                currentParentEnv = currentParentEnv.parentEnv;
            }
        }
    }
}
/**
 * Creates a Lexical Environment
 *
 * @param options
 * @returns
 */
function createLexicalEnvironment({ inputEnvironment: { extra, preset }, policy, getCurrentNode }) {
    let envInput;
    switch (preset) {
        case EnvironmentPresetKind.NONE:
            envInput = mergeDescriptors(extra);
            break;
        case EnvironmentPresetKind.ECMA:
            envInput = mergeDescriptors(ECMA_GLOBALS(), extra);
            break;
        case EnvironmentPresetKind.NODE:
            envInput = mergeDescriptors(NODE_GLOBALS(), extra);
            break;
        case EnvironmentPresetKind.BROWSER:
            envInput = mergeDescriptors(BROWSER_GLOBALS(), extra);
            break;
        default:
            envInput = {};
            break;
    }
    return {
        preset,
        parentEnv: undefined,
        env: createSanitizedEnvironment({
            policy,
            env: envInput,
            getCurrentNode
        })
    };
}

/**
 * Returns true if the given node is a BooleanLiteral
 */
function isBooleanLiteral(node, typescript) {
    return node.kind === typescript.SyntaxKind.TrueKeyword || node.kind === typescript.SyntaxKind.FalseKeyword;
}

/**
 * Returns true if the given node is a NullLiteral
 */
function isNullLiteral(node, typescript) {
    return node.kind === typescript.SyntaxKind.NullKeyword;
}

/**
 * This is a tiny function that avoids the costs of building up an evaluation environment
 * for the interpreter. If the node is a simple literal, it will return its' value.
 */
function evaluateSimpleLiteral(node, typescript) {
    var _a;
    if (typescript.isStringLiteralLike(node))
        return { success: true, value: node.text };
    else if (isBooleanLiteral(node, typescript))
        return { success: true, value: node.kind === typescript.SyntaxKind.TrueKeyword };
    else if (typescript.isRegularExpressionLiteral(node))
        return { success: true, value: new Function(`return ${node.text}`)() };
    else if (typescript.isNumericLiteral(node))
        return { success: true, value: Number(node.text) };
    else if ((_a = typescript.isBigIntLiteral) === null || _a === void 0 ? void 0 : _a.call(typescript, node))
        return { success: true, value: BigInt(node.text) };
    else if (typescript.isIdentifier(node) && node.text === "Infinity")
        return { success: true, value: Infinity };
    else if (typescript.isIdentifier(node) && node.text === "NaN")
        return { success: true, value: NaN };
    else if (typescript.isIdentifier(node) && node.text === "null")
        return { success: true, value: null };
    else if (typescript.isIdentifier(node) && node.text === "undefined")
        return { success: true, value: undefined };
    else if (isNullLiteral(node, typescript))
        return { success: true, value: null };
    else
        return { success: false };
}

/**
 * An Error that can be thrown when the maximum amount of operations dictated by the policy is exceeded
 */
class MaxOpsExceededError extends PolicyError {
    constructor({ ops, node, message = `Maximum ops exceeded: ${ops}` }) {
        super({ violation: "maxOps", message, node });
        this.ops = ops;
    }
}

/**
 * Evaluates, or attempts to evaluate, a VariableDeclaration
 */
function evaluateVariableDeclaration({ node, environment, evaluate, stack, typescript, statementTraversalStack }, initializer) {
    const initializerResult = initializer != null
        ? initializer
        : node.initializer == null
            ? // A VariableDeclaration with no initializer is implicitly bound to 'undefined'
                undefined
            : evaluate.expression(node.initializer, environment, statementTraversalStack);
    // There's no way of destructuring a nullish value
    if (initializerResult == null && !typescript.isIdentifier(node.name)) {
        throw new EvaluationError({ node });
    }
    // Evaluate the binding name
    evaluate.nodeWithArgument(node.name, environment, initializerResult, statementTraversalStack);
    stack.push(initializerResult);
}

/**
 * Returns true if the given node is a ThisExpression
 */
function isThisExpression(node, typescript) {
    return node.kind === typescript.SyntaxKind.ThisKeyword;
}

/**
 * Returns true if the given node is a SuperExpression
 */
function isSuperExpression(node, typescript) {
    return node.kind === typescript.SyntaxKind.SuperKeyword;
}

/**
 * Gets the path to "dot" into an object with based on the node. For example, if the node is a simple identifier, say, 'foo', the dot path is simply "foo".
 * And, if it is a PropertyAccessExpression, that path may be "console.log" for example
 */
function getDotPathFromNode(options) {
    var _a;
    const { node, evaluate, typescript, environment, statementTraversalStack } = options;
    if (typescript.isIdentifier(node)) {
        return node.text;
    }
    else if ((_a = typescript.isPrivateIdentifier) === null || _a === void 0 ? void 0 : _a.call(typescript, node)) {
        return node.text;
    }
    else if (isThisExpression(node, typescript)) {
        return THIS_SYMBOL;
    }
    else if (isSuperExpression(node, typescript)) {
        return SUPER_SYMBOL;
    }
    else if (typescript.isParenthesizedExpression(node)) {
        return getDotPathFromNode(Object.assign(Object.assign({}, options), { node: node.expression }));
    }
    else if (typescript.isTypeAssertion(node)) {
        return getDotPathFromNode(Object.assign(Object.assign({}, options), { node: node.expression }));
    }
    else if (typescript.isPropertyAccessExpression(node)) {
        let leftHand = getDotPathFromNode(Object.assign(Object.assign({}, options), { node: node.expression }));
        if (leftHand == null)
            leftHand = evaluate.expression(node.expression, environment, statementTraversalStack);
        let rightHand = getDotPathFromNode(Object.assign(Object.assign({}, options), { node: node.name }));
        if (rightHand == null)
            rightHand = evaluate.expression(node.name, environment, statementTraversalStack);
        if (leftHand == null || rightHand == null)
            return undefined;
        return `${leftHand}.${rightHand}`;
    }
    else if (typescript.isElementAccessExpression(node)) {
        let leftHand = getDotPathFromNode(Object.assign(Object.assign({}, options), { node: node.expression }));
        if (leftHand == null)
            leftHand = evaluate.expression(node.expression, environment, statementTraversalStack);
        const rightHand = evaluate.expression(node.argumentExpression, environment, statementTraversalStack);
        if (leftHand == null || rightHand == null)
            return undefined;
        return `${leftHand}.${rightHand}`;
    }
    else if (typescript.isFunctionDeclaration(node)) {
        if (node.name == null)
            return undefined;
        return node.name.text;
    }
    return undefined;
}

/**
 * An Error that can be thrown when an unexpected node is encountered
 */
class UnexpectedNodeError extends EvaluationError {
    constructor({ node, typescript, message = `Unexpected Node: '${typescript.SyntaxKind[node.kind]}'` }) {
        super({ message, node });
    }
}

/**
 * An Error that can be thrown when an undefined leftValue is encountered
 */
class UndefinedLeftValueError extends EvaluationError {
    constructor({ node, message = `'No leftValue could be determined'` }) {
        super({ message, node });
    }
}

/**
 * Evaluates, or attempts to evaluate, a BinaryExpression
 */
function evaluateBinaryExpression(options) {
    const { node, environment, evaluate, logger, statementTraversalStack, reporting, typescript } = options;
    const leftValue = evaluate.expression(node.left, environment, statementTraversalStack);
    const rightValue = evaluate.expression(node.right, environment, statementTraversalStack);
    const leftIdentifier = getDotPathFromNode(Object.assign(Object.assign({}, options), { node: node.left }));
    const operator = node.operatorToken.kind;
    switch (operator) {
        case typescript.SyntaxKind.AmpersandToken: {
            return leftValue & rightValue;
        }
        case typescript.SyntaxKind.AmpersandAmpersandToken: {
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            return leftValue && rightValue;
        }
        case typescript.SyntaxKind.AmpersandEqualsToken:
        case typescript.SyntaxKind.CaretEqualsToken:
        case typescript.SyntaxKind.BarEqualsToken:
        case typescript.SyntaxKind.MinusEqualsToken:
        case typescript.SyntaxKind.PlusEqualsToken:
        case typescript.SyntaxKind.PercentEqualsToken:
        case typescript.SyntaxKind.SlashEqualsToken:
        case typescript.SyntaxKind.AsteriskEqualsToken:
        case typescript.SyntaxKind.AsteriskAsteriskEqualsToken:
        case typescript.SyntaxKind.LessThanLessThanEqualsToken:
        case typescript.SyntaxKind.GreaterThanGreaterThanEqualsToken:
        case typescript.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
        case typescript.SyntaxKind.QuestionQuestionEqualsToken:
        case typescript.SyntaxKind.BarBarEqualsToken:
        case typescript.SyntaxKind.AmpersandAmpersandEqualsToken: {
            // There's nothing in the engine restricting you from applying this kind of arithmetic operation on non-numeric data types
            let computedValue = leftValue;
            switch (operator) {
                case typescript.SyntaxKind.AmpersandEqualsToken:
                    computedValue &= rightValue;
                    break;
                case typescript.SyntaxKind.CaretEqualsToken:
                    computedValue ^= rightValue;
                    break;
                case typescript.SyntaxKind.BarEqualsToken:
                    computedValue |= rightValue;
                    break;
                case typescript.SyntaxKind.AsteriskEqualsToken:
                    computedValue *= rightValue;
                    break;
                case typescript.SyntaxKind.AsteriskAsteriskEqualsToken:
                    computedValue **= rightValue;
                    break;
                case typescript.SyntaxKind.LessThanLessThanEqualsToken:
                    computedValue <<= rightValue;
                    break;
                case typescript.SyntaxKind.GreaterThanGreaterThanEqualsToken:
                    computedValue >>= rightValue;
                    break;
                case typescript.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
                    computedValue >>>= rightValue;
                    break;
                case typescript.SyntaxKind.MinusEqualsToken:
                    computedValue -= rightValue;
                    break;
                case typescript.SyntaxKind.PlusEqualsToken:
                    computedValue += rightValue;
                    break;
                case typescript.SyntaxKind.PercentEqualsToken:
                    computedValue %= rightValue;
                    break;
                case typescript.SyntaxKind.SlashEqualsToken:
                    computedValue /= rightValue;
                    break;
                case typescript.SyntaxKind.QuestionQuestionEqualsToken:
                    computedValue = leftValue == null ? rightValue : leftValue;
                    break;
                case typescript.SyntaxKind.BarBarEqualsToken:
                    if (!leftValue) {
                        computedValue = rightValue;
                    }
                    break;
                case typescript.SyntaxKind.AmpersandAmpersandEqualsToken:
                    if (leftValue) {
                        computedValue = rightValue;
                    }
                    break;
            }
            // Update to the left-value within the environment if it exists there and has been updated
            if (leftIdentifier != null) {
                setInLexicalEnvironment({ env: environment, path: leftIdentifier, value: computedValue, reporting, node });
            }
            // Return the computed value
            return computedValue;
        }
        case typescript.SyntaxKind.AsteriskToken: {
            return leftValue * rightValue;
        }
        case typescript.SyntaxKind.AsteriskAsteriskToken: {
            return leftValue ** rightValue;
        }
        case typescript.SyntaxKind.BarToken: {
            return leftValue | rightValue;
        }
        case typescript.SyntaxKind.BarBarToken: {
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            return leftValue || rightValue;
        }
        case typescript.SyntaxKind.CaretToken: {
            return leftValue ^ rightValue;
        }
        case typescript.SyntaxKind.CommaToken: {
            return rightValue;
        }
        case typescript.SyntaxKind.MinusToken:
            return leftValue - rightValue;
        case typescript.SyntaxKind.PlusToken:
            logger.logResult(leftValue + rightValue, "BinaryExpression (PlusToken)");
            return leftValue + rightValue;
        case typescript.SyntaxKind.PercentToken:
            return leftValue % rightValue;
        case typescript.SyntaxKind.SlashToken:
            return leftValue / rightValue;
        case typescript.SyntaxKind.EqualsToken: {
            // Update to the left-value within the environment if it exists there and has been updated
            if (leftIdentifier != null) {
                setInLexicalEnvironment({ env: environment, path: leftIdentifier, value: rightValue, reporting, node });
                logger.logBinding(leftIdentifier, rightValue, "Assignment");
            }
            else {
                throw new UndefinedLeftValueError({ node: node.left });
            }
            // The return value of an assignment is always the assigned value
            return rightValue;
        }
        case typescript.SyntaxKind.EqualsEqualsToken: {
            // eslint-disable-next-line eqeqeq
            return leftValue == rightValue;
        }
        case typescript.SyntaxKind.EqualsEqualsEqualsToken: {
            return leftValue === rightValue;
        }
        case typescript.SyntaxKind.ExclamationEqualsToken: {
            // eslint-disable-next-line eqeqeq
            return leftValue != rightValue;
        }
        case typescript.SyntaxKind.ExclamationEqualsEqualsToken: {
            return leftValue !== rightValue;
        }
        case typescript.SyntaxKind.GreaterThanToken:
            return leftValue > rightValue;
        case typescript.SyntaxKind.GreaterThanEqualsToken:
            return leftValue >= rightValue;
        case typescript.SyntaxKind.LessThanToken:
            return leftValue < rightValue;
        case typescript.SyntaxKind.LessThanEqualsToken:
            return leftValue <= rightValue;
        case typescript.SyntaxKind.InKeyword: {
            return leftValue in rightValue;
        }
        // Nullish coalescing (A ?? B)
        case typescript.SyntaxKind.QuestionQuestionToken:
            return leftValue != null ? leftValue : rightValue;
        case typescript.SyntaxKind.InstanceOfKeyword: {
            return leftValue instanceof rightValue;
        }
    }
    // Throw if the operator couldn't be handled
    throw new UnexpectedNodeError({ node: node.operatorToken, typescript });
}

// tslint:disable:no-any
const LAZY_CALL_FLAG = "___lazyCallFlag";
/**
 * Returns true if the given literal is a lazy call
 *
 * @param literal
 * @return
 */
function isLazyCall(literal) {
    return literal != null && typeof literal === "object" && LAZY_CALL_FLAG in literal;
}
/**
 * Stringifies the given literal
 *
 * @param literal
 * @return
 */
function stringifyLiteral(literal) {
    if (literal === undefined)
        return "undefined";
    else if (literal === null)
        return "null";
    else if (typeof literal === "string")
        return `"${literal}"`;
    return literal.toString();
}

/**
 * An Error that can be thrown when a value is attempted to be called, but isn't callable
 */
class NotCallableError extends EvaluationError {
    constructor({ value, node, message = `${stringifyLiteral(value)} is not a function'` }) {
        super({ message, node });
        this.value = value;
    }
}

/**
 * Returns true if the given expression contains a 'super' keyword
 */
function expressionContainsSuperKeyword(expression, typescript) {
    if (isSuperExpression(expression, typescript))
        return true;
    else if (typescript.isPropertyAccessExpression(expression)) {
        return expressionContainsSuperKeyword(expression.expression, typescript) || expressionContainsSuperKeyword(expression.name, typescript);
    }
    else if (typescript.isElementAccessExpression(expression)) {
        return expressionContainsSuperKeyword(expression.expression, typescript) || expressionContainsSuperKeyword(expression.argumentExpression, typescript);
    }
    else if (typescript.isParenthesizedExpression(expression))
        return expressionContainsSuperKeyword(expression.expression, typescript);
    else if (typescript.isAsExpression(expression))
        return expressionContainsSuperKeyword(expression.expression, typescript);
    else if (typescript.isTypeAssertion(expression))
        return expressionContainsSuperKeyword(expression.expression, typescript);
    else {
        return false;
    }
}

/**
 * Evaluates, or attempts to evaluate, a CallExpression
 */
function evaluateCallExpression({ node, environment, evaluate, statementTraversalStack, typescript, logger }) {
    const evaluatedArgs = [];
    for (let i = 0; i < node.arguments.length; i++) {
        evaluatedArgs[i] = evaluate.expression(node.arguments[i], environment, statementTraversalStack);
    }
    // Evaluate the expression
    const expressionResult = evaluate.expression(node.expression, environment, statementTraversalStack);
    if (isLazyCall(expressionResult)) {
        const currentThisBinding = expressionContainsSuperKeyword(node.expression, typescript) ? getFromLexicalEnvironment(node, environment, THIS_SYMBOL) : undefined;
        const value = expressionResult.invoke(currentThisBinding != null ? currentThisBinding.literal : undefined, ...evaluatedArgs);
        logger.logResult(value, "CallExpression");
        return value;
    }
    // Otherwise, assume that the expression still needs calling
    else {
        // Unless optional chaining is being used, throw a NotCallableError
        if (node.questionDotToken == null && typeof expressionResult !== "function") {
            throw new NotCallableError({ value: expressionResult, node: node.expression });
        }
        const value = typeof expressionResult !== "function" ? undefined : expressionResult(...evaluatedArgs);
        logger.logResult(value, "CallExpression");
        return value;
    }
}

/**
 * Evaluates, or attempts to evaluate, a ParenthesizedExpression
 */
function evaluateParenthesizedExpression({ node, environment, evaluate, statementTraversalStack }) {
    return evaluate.expression(node.expression, environment, statementTraversalStack);
}

/**
 * Clones the given LexicalEnvironment
 */
function cloneLexicalEnvironment(environment) {
    return {
        parentEnv: environment,
        env: {}
    };
}

/**
 * Returns true if the given Node has the given kind of Modifier
 */
function hasModifier(node, modifier) {
    const modifiers = Array.isArray(node) ? node : node.modifiers;
    return modifiers != null && modifiers.some(m => m.kind === modifier);
}

/**
 * Evaluates, or attempts to evaluate, a NodeArray of ParameterDeclarations
 */
function evaluateParameterDeclarations({ node, evaluate, environment, statementTraversalStack, typescript }, boundArguments, context) {
    // 'this' is a special parameter which is removed from the emitted results
    const parameters = node.filter(param => !(typescript.isIdentifier(param.name) && param.name.text === "this"));
    for (let i = 0; i < parameters.length; i++) {
        const parameter = parameters[i];
        // It it is a spread element, it should receive all arguments from the current index.
        if (parameter.dotDotDotToken != null) {
            evaluate.nodeWithArgument(parameter, environment, boundArguments.slice(i), statementTraversalStack);
            // Spread elements must always be the last parameter
            break;
        }
        else {
            evaluate.nodeWithArgument(parameter, environment, boundArguments[i], statementTraversalStack);
            // If a context is given, and if a [public|protected|private] keyword is in front of the parameter, the initialized value should be
            // set on the context as an instance property
            if (context != null &&
                typescript.isIdentifier(parameter.name) &&
                (hasModifier(parameter, typescript.SyntaxKind.PublicKeyword) ||
                    hasModifier(parameter, typescript.SyntaxKind.ProtectedKeyword) ||
                    hasModifier(parameter, typescript.SyntaxKind.PrivateKeyword))) {
                const value = getFromLexicalEnvironment(parameter, environment, parameter.name.text);
                if (value != null) {
                    context[parameter.name.text] = value.literal;
                }
            }
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, an ArrowFunction
 */
function evaluateArrowFunctionExpression(options) {
    const { node, environment, evaluate, stack, statementTraversalStack, reporting, typescript } = options;
    const arrowFunctionExpression = hasModifier(node, typescript.SyntaxKind.AsyncKeyword)
        ? async (...args) => {
            // Prepare a lexical environment for the function context
            const localLexicalEnvironment = cloneLexicalEnvironment(environment);
            // Define a new binding for a return symbol within the environment
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: RETURN_SYMBOL, value: false, newBinding: true, reporting, node });
            // Define a new binding for the arguments given to the function
            // eslint-disable-next-line prefer-rest-params
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: "arguments", value: arguments, newBinding: true, reporting, node });
            // Evaluate the parameters based on the given arguments
            evaluateParameterDeclarations(Object.assign(Object.assign({}, options), { node: node.parameters, environment: localLexicalEnvironment }), args);
            // If the body is a block, evaluate it as a statement
            if (typescript.isBlock(node.body)) {
                evaluate.statement(node.body, localLexicalEnvironment);
                // If a 'return' has occurred within the block, pop the Stack and return that value
                if (pathInLexicalEnvironmentEquals(node, localLexicalEnvironment, true, RETURN_SYMBOL)) {
                    return stack.pop();
                }
                // Otherwise, return 'undefined'. Nothing is returned from the function
                else
                    return undefined;
            }
            // Otherwise, the body is itself an expression
            else {
                return evaluate.expression(node.body, localLexicalEnvironment, statementTraversalStack);
            }
        }
        : (...args) => {
            // Prepare a lexical environment for the function context
            const localLexicalEnvironment = cloneLexicalEnvironment(environment);
            // Define a new binding for a return symbol within the environment
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: RETURN_SYMBOL, value: false, newBinding: true, reporting, node });
            // Define a new binding for the arguments given to the function
            // eslint-disable-next-line prefer-rest-params
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: "arguments", value: arguments, newBinding: true, reporting, node });
            // Evaluate the parameters based on the given arguments
            evaluateParameterDeclarations(Object.assign(Object.assign({}, options), { node: node.parameters, environment: localLexicalEnvironment }), args);
            // If the body is a block, evaluate it as a statement
            if (typescript.isBlock(node.body)) {
                evaluate.statement(node.body, localLexicalEnvironment);
                // If a 'return' has occurred within the block, pop the Stack and return that value
                if (pathInLexicalEnvironmentEquals(node, localLexicalEnvironment, true, RETURN_SYMBOL)) {
                    return stack.pop();
                }
                // Otherwise, return 'undefined'. Nothing is returned from the function
                else
                    return undefined;
            }
            // Otherwise, the body is itself an expression
            else {
                return evaluate.expression(node.body, localLexicalEnvironment, statementTraversalStack);
            }
        };
    arrowFunctionExpression.toString = () => `[Function: anonymous]`;
    // Make sure to use the Function that is contained within the Realm. Otherwise, 'instanceof' checks may fail
    // since this particular function comes from the executing context.
    Object.setPrototypeOf(arrowFunctionExpression, getFromLexicalEnvironment(node, environment, "Function").literal);
    return arrowFunctionExpression;
}

/**
 * Evaluates, or attempts to evaluate, a StringLiteralLike
 */
function evaluateStringLiteral({ node }) {
    return node.text;
}

/**
 * Evaluates, or attempts to evaluate, a NumericLiteral
 */
function evaluateNumericLiteral({ node }) {
    return Number(node.text);
}

/**
 * Evaluates, or attempts to evaluate, a BooleanLiteral
 */
function evaluateBooleanLiteral({ node, typescript }) {
    return node.kind === typescript.SyntaxKind.TrueKeyword;
}

/**
 * Evaluates, or attempts to evaluate, a RegularExpressionLiteral
 */
function evaluateRegularExpressionLiteral({ node, environment }) {
    const functionCtor = getFromLexicalEnvironment(node, environment, "Function").literal;
    return new functionCtor(`return ${node.text}`)();
}

/**
 * Evaluates, or attempts to evaluate, a ObjectLiteralExpression
 */
function evaluateObjectLiteralExpression({ node, evaluate, environment, reporting, statementTraversalStack }) {
    // Create a new ObjectLiteral based on the Object implementation from the Realm since this must not be the same as in the parent executing context
    // Otherwise, instanceof checks would fail
    const objectCtor = getFromLexicalEnvironment(node, environment, "Object").literal;
    const value = objectCtor.create(objectCtor.prototype);
    // Mark the object as the 'this' value of the scope
    setInLexicalEnvironment({ env: environment, path: THIS_SYMBOL, value, newBinding: true, reporting, node });
    for (const property of node.properties) {
        evaluate.nodeWithArgument(property, environment, value, statementTraversalStack);
    }
    return value;
}

/**
 * Returns true if the given item is an Iterable
 *
 * @param item
 * @return
 */
function isIterable(item) {
    return item != null && item[Symbol.iterator] != null;
}

/**
 * Evaluates, or attempts to evaluate, a ArrayLiteralExpression
 */
function evaluateArrayLiteralExpression({ node, environment, evaluate, typescript, statementTraversalStack }) {
    // Get the Array constructor from the realm - not that of the executing context. Otherwise, instanceof checks would fail
    const arrayCtor = getFromLexicalEnvironment(node, environment, "Array").literal;
    const value = arrayCtor.of();
    for (const element of node.elements) {
        const nextValue = evaluate.expression(element, environment, statementTraversalStack);
        if (typescript.isSpreadElement(element) && isIterable(nextValue)) {
            value.push(...nextValue);
        }
        else {
            value.push(nextValue);
        }
    }
    return value;
}

/**
 * An Error that can be thrown when an undefined identifier is encountered
 */
class UndefinedIdentifierError extends EvaluationError {
    constructor({ node, message = `'${node.text}' is not defined'` }) {
        super({ message, node });
    }
}

/**
 * Returns true if the given VariableDeclarationList is declared with a 'var' keyword
 */
function isVarDeclaration(declarationList, typescript) {
    return declarationList.flags !== typescript.NodeFlags.Const && declarationList.flags !== typescript.NodeFlags.Let;
}

/**
 * Finds the nearest parent node of the given kind from the given Node
 */
function findNearestParentNodeOfKind(from, kind, typescript) {
    let currentParent = from;
    while (true) {
        currentParent = currentParent.parent;
        if (currentParent == null)
            return undefined;
        if (currentParent.kind === kind) {
            const combinedNodeFlags = typescript.getCombinedNodeFlags(currentParent);
            const isNamespace = (combinedNodeFlags & typescript.NodeFlags.Namespace) !== 0 || (combinedNodeFlags & typescript.NodeFlags.NestedNamespace) !== 0;
            if (!isNamespace)
                return currentParent;
        }
        if (typescript.isSourceFile(currentParent))
            return undefined;
    }
}

/**
 * An Error that can be thrown when a moduleSpecifier couldn't be resolved
 */
class ModuleNotFoundError extends EvaluationError {
    constructor({ path, node, message = `Module '${path}' could not be resolved'` }) {
        super({ message, node });
        this.path = path;
    }
}

/**
 * Gets the name of the given declaration
 */
function getDeclarationName({ node, evaluate, environment, typescript, statementTraversalStack }) {
    var _a;
    const name = typescript.getNameOfDeclaration(node);
    if (name == null)
        return undefined;
    if (typescript.isIdentifier(name)) {
        return name.text;
    }
    else if ((_a = typescript.isPrivateIdentifier) === null || _a === void 0 ? void 0 : _a.call(typescript, name)) {
        return name.text;
    }
    else if (typescript.isStringLiteralLike(name)) {
        return name.text;
    }
    else if (typescript.isNumericLiteral(name)) {
        return Number(name.text);
    }
    else if (typescript.isComputedPropertyName(name)) {
        return evaluate.expression(name.expression, environment, statementTraversalStack);
    }
    else {
        throw new UnexpectedNodeError({ node: name, typescript });
    }
}

/**
 * Gets an implementation for the given declaration that lives within a declaration file
 */
function getImplementationForDeclarationWithinDeclarationFile(options) {
    var _a;
    const { node, typescript } = options;
    const name = getDeclarationName(options);
    if (name == null) {
        throw new UnexpectedNodeError({ node, typescript });
    }
    // First see if it lives within the lexical environment
    const matchInLexicalEnvironment = getFromLexicalEnvironment(node, options.environment, name);
    // If so, return it
    if (matchInLexicalEnvironment != null && matchInLexicalEnvironment.literal != null) {
        return matchInLexicalEnvironment.literal;
    }
    // Otherwise, expect it to be something that is require'd on demand
    const require = getFromLexicalEnvironment(node, options.environment, "require").literal;
    const moduleDeclaration = typescript.isModuleDeclaration(node)
        ? node
        : findNearestParentNodeOfKind(node, typescript.SyntaxKind.ModuleDeclaration, typescript);
    if (moduleDeclaration == null) {
        throw new UnexpectedNodeError({ node, typescript });
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
        const module = require(moduleDeclaration.name.text);
        return typescript.isModuleDeclaration(node) ? module : (_a = module[name]) !== null && _a !== void 0 ? _a : module;
    }
    catch (ex) {
        if (ex instanceof EvaluationError)
            throw ex;
        else
            throw new ModuleNotFoundError({ node: moduleDeclaration, path: moduleDeclaration.name.text });
    }
}

/**
 * Evaluates, or attempts to evaluate, an Identifier or a PrivateIdentifier
 */
function evaluateIdentifier(options) {
    const { node, environment, typeChecker, evaluate, stack, logger, reporting, typescript, statementTraversalStack } = options;
    // Otherwise, try to resolve it. Maybe it exists in the environment already?
    const environmentMatch = getFromLexicalEnvironment(node, environment, node.text);
    if (environmentMatch != null) {
        logger.logBinding(node.text, environmentMatch.literal, "Lexical Environment match");
        // Return the existing evaluated value from the environment
        return environmentMatch.literal;
    }
    // Try to get a symbol for whatever the identifier points to and take its value declaration.
    // It may not have a symbol, for example if it is an inlined expression such as an initializer or a Block
    const symbol = typeChecker.getSymbolAtLocation(node);
    let valueDeclaration = symbol == null ? undefined : symbol.valueDeclaration;
    if (symbol != null && valueDeclaration == null) {
        try {
            // The symbol may be aliasing another one - which may have a value declaration
            const aliasedSymbol = typeChecker.getAliasedSymbol(symbol);
            valueDeclaration = aliasedSymbol.valueDeclaration;
        }
        catch (_a) {
            // OK, it didn't alias anything
        }
    }
    // If it has a value declaration, go forward with that one
    if (valueDeclaration != null) {
        if (valueDeclaration.getSourceFile().isDeclarationFile) {
            const implementation = getImplementationForDeclarationWithinDeclarationFile(Object.assign(Object.assign({}, options), { node: valueDeclaration }));
            // Bind the value placed on the top of the stack to the local environment
            setInLexicalEnvironment({ env: environment, path: node.text, value: implementation, reporting, node: valueDeclaration });
            logger.logBinding(node.text, implementation, `Discovered declaration value${valueDeclaration.getSourceFile() === node.getSourceFile() ? "" : ` (imported into '${node.getSourceFile().fileName}' from '${valueDeclaration.getSourceFile().fileName}')`}`);
            return implementation;
        }
        // If the value is a variable declaration and is located *after* the current node within the SourceFile
        // It is potentially a SyntaxError unless it is hoisted (if the 'var' keyword is being used) in which case the variable is defined, but initialized to 'undefined'
        if (typescript.isVariableDeclaration(valueDeclaration) && valueDeclaration.getSourceFile().fileName === node.getSourceFile().fileName && valueDeclaration.pos > node.pos) {
            // The 'var' keyword declares a variable that is defined, but which rvalue is still undefined
            if (typescript.isVariableDeclarationList(valueDeclaration.parent) && isVarDeclaration(valueDeclaration.parent, typescript)) {
                const returnValue = undefined;
                setInLexicalEnvironment({ env: environment, path: node.text, value: returnValue, newBinding: true, reporting, node: valueDeclaration });
                logger.logBinding(node.text, returnValue, "Hoisted var declaration");
                return returnValue;
            }
            // In all other cases, both the identifier and the rvalue is still undefined
            else {
                throw new UndefinedIdentifierError({ node });
            }
        }
        evaluate.declaration(valueDeclaration, environment, statementTraversalStack);
        const stackValue = stack.pop();
        // Bind the value placed on the top of the stack to the local environment
        setInLexicalEnvironment({ env: environment, path: node.text, value: stackValue, reporting, node: valueDeclaration });
        logger.logBinding(node.text, stackValue, `Discovered declaration value${valueDeclaration.getSourceFile() === node.getSourceFile() ? "" : ` (imported into '${node.getSourceFile().fileName}' from '${valueDeclaration.getSourceFile().fileName}')`}`);
        return stackValue;
    }
    // Otherwise throw. The identifier is unknown
    throw new UndefinedIdentifierError({ node });
}

/**
 * Evaluates, or attempts to evaluate, a Block
 */
function evaluateBlock({ node, environment, typescript, evaluate }) {
    // Prepare a lexical environment for the Block context
    const localLexicalEnvironment = cloneLexicalEnvironment(environment);
    for (let i = 0; i < node.statements.length; i++) {
        const statement = node.statements[i];
        // Don't execute 'super()' within Constructor Blocks since this is handled in another level
        if (typescript.isConstructorDeclaration(node.parent) &&
            i === 0 &&
            typescript.isExpressionStatement(statement) &&
            typescript.isCallExpression(statement.expression) &&
            isSuperExpression(statement.expression.expression, typescript)) {
            continue;
        }
        evaluate.statement(statement, localLexicalEnvironment);
        // Check if a 'break', 'continue', or 'return' statement has been encountered, break the block
        if (pathInLexicalEnvironmentEquals(node, localLexicalEnvironment, true, BREAK_SYMBOL, CONTINUE_SYMBOL, RETURN_SYMBOL)) {
            break;
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a ReturnStatement
 */
function evaluateReturnStatement({ node, environment, evaluate, stack, reporting, statementTraversalStack }) {
    setInLexicalEnvironment({ env: environment, path: RETURN_SYMBOL, value: true, reporting, node });
    // If it is a simple 'return', return undefined
    if (node.expression == null) {
        stack.push(undefined);
    }
    else {
        stack.push(evaluate.expression(node.expression, environment, statementTraversalStack));
    }
}

/**
 * Evaluates, or attempts to evaluate, a VariableDeclarationList
 */
function evaluateVariableDeclarationList({ node, evaluate, environment, statementTraversalStack }) {
    for (const declaration of node.declarations) {
        evaluate.declaration(declaration, environment, statementTraversalStack);
    }
}

/**
 * Evaluates, or attempts to evaluate, a VariableStatement
 */
function evaluateVariableStatement(_a) {
    var { node } = _a, rest = __rest(_a, ["node"]);
    evaluateVariableDeclarationList(Object.assign({ node: node.declarationList }, rest));
}

/**
 * Evaluates, or attempts to evaluate, a PrefixUnaryExpression
 */
function evaluatePrefixUnaryExpression({ node, environment, evaluate, reporting, typescript, statementTraversalStack }) {
    var _a, _b;
    const operandValue = evaluate.expression(node.operand, environment, statementTraversalStack);
    switch (node.operator) {
        case typescript.SyntaxKind.PlusToken: {
            return +operandValue;
        }
        case typescript.SyntaxKind.MinusToken: {
            return -operandValue;
        }
        case typescript.SyntaxKind.TildeToken: {
            return ~operandValue;
        }
        case typescript.SyntaxKind.ExclamationToken: {
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
            return !operandValue;
        }
        case typescript.SyntaxKind.PlusPlusToken: {
            // If the Operand isn't an identifier, this will be a SyntaxError
            if (!typescript.isIdentifier(node.operand) && !((_a = typescript.isPrivateIdentifier) === null || _a === void 0 ? void 0 : _a.call(typescript, node.operand))) {
                throw new UnexpectedNodeError({ node: node.operand, typescript });
            }
            // Find the value associated with the identifier within the environment.
            const dict = getRelevantDictFromLexicalEnvironment(environment, node.operand.text);
            const value = ++dict[node.operand.text];
            // Inform reporting hooks if any is given
            if (reporting.reportBindings != null) {
                reporting.reportBindings({ path: node.operand.text, value, node });
            }
            return value;
        }
        case typescript.SyntaxKind.MinusMinusToken: {
            // If the Operand isn't an identifier, this will be a SyntaxError
            if (!typescript.isIdentifier(node.operand) && !((_b = typescript.isPrivateIdentifier) === null || _b === void 0 ? void 0 : _b.call(typescript, node.operand))) {
                throw new UnexpectedNodeError({ node: node.operand, typescript });
            }
            // Find the value associated with the identifier within the environment.
            const dict = getRelevantDictFromLexicalEnvironment(environment, node.operand.text);
            const value = --dict[node.operand.text];
            // Inform reporting hooks if any is given
            if (reporting.reportBindings != null) {
                reporting.reportBindings({ path: node.operand.text, value, node });
            }
            return value;
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a PropertyAccessExpression
 */
function evaluatePropertyAccessExpression({ node, environment, evaluate, typescript, statementTraversalStack }) {
    const expressionResult = evaluate.expression(node.expression, environment, statementTraversalStack);
    const match = node.questionDotToken != null && expressionResult == null
        ? // If optional chaining are being used and the expressionResult is undefined or null, assign undefined to 'match'
            undefined
        : expressionResult[node.name.text];
    // If it is a function, wrap it in a lazy call to preserve implicit 'this' bindings. This is to avoid losing the 'this' binding or having to
    // explicitly bind a 'this' value
    if (typeof match === "function" && statementTraversalStack.includes(typescript.SyntaxKind.CallExpression)) {
        return {
            [LAZY_CALL_FLAG]: 0 /* CALL */,
            invoke: (overriddenThis, ...args) => overriddenThis != null && !isBindCallApply(match, environment)
                ? // eslint-disable-next-line @typescript-eslint/ban-types
                    expressionResult[node.name.text].call(overriddenThis, ...args)
                : expressionResult[node.name.text](...args)
        };
    }
    else
        return match;
}

/**
 * Evaluates, or attempts to evaluate, a ElementAccessExpression
 */
function evaluateElementAccessExpression({ node, environment, evaluate, statementTraversalStack, typescript }) {
    const expressionResult = evaluate.expression(node.expression, environment, statementTraversalStack);
    const argumentExpressionResult = evaluate.expression(node.argumentExpression, environment, statementTraversalStack);
    const match = node.questionDotToken != null && expressionResult == null
        ? // If optional chaining are being used and the expressionResult is undefined or null, assign undefined to 'match'
            undefined
        : expressionResult[argumentExpressionResult];
    // If it is a function, wrap it in a lazy call to preserve implicit this bindings. This is to avoid losing the this binding or having to
    // explicitly bind a 'this' value
    if (typeof match === "function" && statementTraversalStack.includes(typescript.SyntaxKind.CallExpression)) {
        return {
            [LAZY_CALL_FLAG]: 0 /* CALL */,
            invoke: (overriddenThis, ...args) => overriddenThis != null && !isBindCallApply(match, environment)
                ? // eslint-disable-next-line @typescript-eslint/ban-types
                    expressionResult[argumentExpressionResult].call(overriddenThis, ...args)
                : expressionResult[argumentExpressionResult](...args)
        };
    }
    else
        return match;
}

/**
 * Evaluates, or attempts to evaluate, a ComputedPropertyName
 */
function evaluateComputedPropertyName({ node, environment, evaluate, statementTraversalStack }) {
    return evaluate.expression(node.expression, environment, statementTraversalStack);
}

/**
 * Evaluates, or attempts to evaluate, a FunctionDeclaration
 */
function evaluateFunctionDeclaration(options) {
    const { node, environment, evaluate, stack, reporting, typescript } = options;
    const nameResult = node.name == null ? undefined : node.name.text;
    const _functionDeclaration = hasModifier(node, typescript.SyntaxKind.AsyncKeyword)
        ? async function functionDeclaration(...args) {
            // Prepare a lexical environment for the function context
            const localLexicalEnvironment = cloneLexicalEnvironment(environment);
            // Define a new binding for a return symbol within the environment
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: RETURN_SYMBOL, value: false, newBinding: true, reporting, node });
            // Define a new binding for the arguments given to the function
            // eslint-disable-next-line prefer-rest-params
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: "arguments", value: arguments, newBinding: true, reporting, node });
            if (this != null) {
                setInLexicalEnvironment({ env: localLexicalEnvironment, path: THIS_SYMBOL, value: this, newBinding: true, reporting, node });
            }
            // Evaluate the parameters based on the given arguments
            evaluateParameterDeclarations(Object.assign(Object.assign({}, options), { node: node.parameters, environment: localLexicalEnvironment }), args);
            const sourceFile = node.getSourceFile();
            if (nameResult != null && sourceFile.isDeclarationFile) {
                const implementation = getImplementationForDeclarationWithinDeclarationFile(options);
                return implementation(...args);
            }
            // If the body is a block, evaluate it as a statement
            if (node.body == null)
                return;
            evaluate.statement(node.body, localLexicalEnvironment);
            // If a 'return' has occurred within the block, pop the Stack and return that value
            if (pathInLexicalEnvironmentEquals(node, localLexicalEnvironment, true, RETURN_SYMBOL)) {
                return stack.pop();
            }
            // Otherwise, return 'undefined'. Nothing is returned from the function
            else {
                return undefined;
            }
        }
        : function functionDeclaration(...args) {
            // Prepare a lexical environment for the function context
            const localLexicalEnvironment = cloneLexicalEnvironment(environment);
            // Define a new binding for a return symbol within the environment
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: RETURN_SYMBOL, value: false, newBinding: true, reporting, node });
            // Define a new binding for the arguments given to the function
            // eslint-disable-next-line prefer-rest-params
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: "arguments", value: arguments, newBinding: true, reporting, node });
            if (this != null) {
                setInLexicalEnvironment({ env: localLexicalEnvironment, path: THIS_SYMBOL, value: this, newBinding: true, reporting, node });
            }
            // Evaluate the parameters based on the given arguments
            evaluateParameterDeclarations(Object.assign(Object.assign({}, options), { node: node.parameters, environment: localLexicalEnvironment }), args);
            const sourceFile = node.getSourceFile();
            if (nameResult != null && sourceFile.isDeclarationFile) {
                const implementation = getImplementationForDeclarationWithinDeclarationFile(options);
                return implementation(...args);
            }
            // If the body is a block, evaluate it as a statement
            if (node.body == null)
                return;
            evaluate.statement(node.body, localLexicalEnvironment);
            // If a 'return' has occurred within the block, pop the Stack and return that value
            if (pathInLexicalEnvironmentEquals(node, localLexicalEnvironment, true, RETURN_SYMBOL)) {
                return stack.pop();
            }
            // Otherwise, return 'undefined'. Nothing is returned from the function
            else
                return undefined;
        };
    if (nameResult != null) {
        setInLexicalEnvironment({ env: environment, path: nameResult, value: _functionDeclaration.bind(_functionDeclaration), reporting, node });
    }
    _functionDeclaration.toString = () => `[Function${nameResult == null ? "" : `: ${nameResult}`}]`;
    // Make sure to use the Function that is contained within the Realm. Otherwise, 'instanceof' checks may fail
    // since this particular function comes from the executing context.
    Object.setPrototypeOf(_functionDeclaration, getFromLexicalEnvironment(node, environment, "Function").literal);
    stack.push(_functionDeclaration);
}

/**
 * Evaluates, or attempts to evaluate, an IfStatement
 */
function evaluateIfStatement({ node, environment, evaluate, statementTraversalStack }) {
    const expressionValue = evaluate.expression(node.expression, environment, statementTraversalStack);
    // We have to perform a loose boolean expression here to conform with actual spec behavior
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (expressionValue) {
        // Proceed with the truthy branch
        evaluate.statement(node.thenStatement, environment);
    }
    // Proceed with the falsy branch
    else if (node.elseStatement != null) {
        return evaluate.statement(node.elseStatement, environment);
    }
}

/**
 * Evaluates, or attempts to evaluate, an ExpressionStatement
 */
function evaluateExpressionStatement({ node, environment, evaluate, stack, statementTraversalStack }) {
    stack.push(evaluate.expression(node.expression, environment, statementTraversalStack));
}

/**
 * Evaluates, or attempts to evaluate, a TemplateExpression
 */
function evaluateTemplateExpression({ node, environment, evaluate, statementTraversalStack }) {
    let str = "";
    str += node.head.text;
    for (const span of node.templateSpans) {
        const expression = evaluate.expression(span.expression, environment, statementTraversalStack);
        str += expression;
        str += span.literal.text;
    }
    return str;
}

/**
 * Evaluates, or attempts to evaluate, a TypeAssertion
 */
function evaluateTypeAssertion({ node, environment, evaluate, statementTraversalStack }) {
    return evaluate.expression(node.expression, environment, statementTraversalStack);
}

/**
 * Evaluates, or attempts to evaluate, a PostfixUnaryExpression
 */
function evaluatePostfixUnaryExpression({ node, evaluate, environment, reporting, typescript, statementTraversalStack }) {
    var _a, _b;
    // Make sure to evaluate the operand to ensure that it is found in the lexical environment
    evaluate.expression(node.operand, environment, statementTraversalStack);
    switch (node.operator) {
        case typescript.SyntaxKind.PlusPlusToken: {
            // If the Operand isn't an identifier, this will be a SyntaxError
            if (!typescript.isIdentifier(node.operand) && !((_a = typescript.isPrivateIdentifier) === null || _a === void 0 ? void 0 : _a.call(typescript, node.operand))) {
                throw new UnexpectedNodeError({ node: node.operand, typescript });
            }
            // Find the value associated with the identifier within the environment.
            const value = getRelevantDictFromLexicalEnvironment(environment, node.operand.text)[node.operand.text]++;
            // Inform reporting hooks if any is given
            if (reporting.reportBindings != null) {
                reporting.reportBindings({ path: node.operand.text, value, node });
            }
            return value;
        }
        case typescript.SyntaxKind.MinusMinusToken: {
            // If the Operand isn't an identifier, this will be a SyntaxError
            if (!typescript.isIdentifier(node.operand) && !((_b = typescript.isPrivateIdentifier) === null || _b === void 0 ? void 0 : _b.call(typescript, node.operand))) {
                throw new UnexpectedNodeError({ node: node.operand, typescript });
            }
            // Find the value associated with the identifier within the environment.
            const value = getRelevantDictFromLexicalEnvironment(environment, node.operand.text)[node.operand.text]--;
            // Inform reporting hooks if any is given
            if (reporting.reportBindings != null) {
                reporting.reportBindings({ path: node.operand.text, value, node });
            }
            return value;
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a NewExpression
 */
function evaluateNewExpression({ node, environment, evaluate, statementTraversalStack }) {
    const evaluatedArgs = [];
    if (node.arguments != null) {
        for (let i = 0; i < node.arguments.length; i++) {
            evaluatedArgs[i] = evaluate.expression(node.arguments[i], environment, statementTraversalStack);
        }
    }
    // Evaluate the expression
    const expressionResult = evaluate.expression(node.expression, environment, statementTraversalStack);
    return new expressionResult(...evaluatedArgs);
}

/**
 * Evaluates, or attempts to evaluate, a NonNullExpression
 */
function evaluateNonNullExpression({ node, environment, evaluate, statementTraversalStack }) {
    return evaluate.expression(node.expression, environment, statementTraversalStack);
}

/**
 * Evaluates, or attempts to evaluate, an AsExpression
 */
function evaluateAsExpression({ node, environment, evaluate, statementTraversalStack }) {
    return evaluate.expression(node.expression, environment, statementTraversalStack);
}

/**
 * Evaluates, or attempts to evaluate, a SwitchStatement
 */
function evaluateSwitchStatement({ node, evaluate, environment, statementTraversalStack }) {
    const expressionResult = evaluate.expression(node.expression, environment, statementTraversalStack);
    evaluate.nodeWithArgument(node.caseBlock, environment, expressionResult, statementTraversalStack);
}

/**
 * An Error that can be thrown when an async iteration operation is attempted
 */
class AsyncIteratorNotSupportedError extends EvaluationError {
    constructor({ message = `It is not possible to evaluate an async iterator'`, typescript }) {
        super({ message, node: typescript.createEmptyStatement() });
    }
}

/**
 * Evaluates, or attempts to evaluate, a ForOfStatement
 */
function evaluateForOfStatement({ node, environment, evaluate, logger, reporting, typescript, statementTraversalStack }) {
    // Compute the 'of' part
    const expressionResult = evaluate.expression(node.expression, environment, statementTraversalStack);
    // Ensure that the initializer is a proper VariableDeclarationList
    if (!typescript.isVariableDeclarationList(node.initializer)) {
        throw new UnexpectedNodeError({ node: node.initializer, typescript });
    }
    // Only 1 declaration is allowed in a ForOfStatement
    else if (node.initializer.declarations.length > 1) {
        throw new UnexpectedNodeError({ node: node.initializer.declarations[1], typescript });
    }
    // As long as we only offer a synchronous API, there's no way to evaluate an async iterator in a synchronous fashion
    if (node.awaitModifier != null) {
        throw new AsyncIteratorNotSupportedError({ typescript });
    }
    else {
        for (const literal of expressionResult) {
            // Prepare a lexical environment for the current iteration
            const localEnvironment = cloneLexicalEnvironment(environment);
            // Define a new binding for a break symbol within the environment
            setInLexicalEnvironment({ env: localEnvironment, path: BREAK_SYMBOL, value: false, newBinding: true, reporting, node });
            // Define a new binding for a continue symbol within the environment
            setInLexicalEnvironment({ env: localEnvironment, path: CONTINUE_SYMBOL, value: false, newBinding: true, reporting, node });
            // Evaluate the VariableDeclaration and manually pass in the current literal as the initializer for the variable assignment
            evaluate.nodeWithArgument(node.initializer.declarations[0], localEnvironment, literal, statementTraversalStack);
            // Evaluate the Statement
            evaluate.statement(node.statement, localEnvironment);
            // Check if a 'break' statement has been encountered and break if so
            if (pathInLexicalEnvironmentEquals(node, localEnvironment, true, BREAK_SYMBOL)) {
                logger.logBreak(node, typescript);
                break;
            }
            else if (pathInLexicalEnvironmentEquals(node, localEnvironment, true, CONTINUE_SYMBOL)) {
                logger.logContinue(node, typescript);
                // noinspection UnnecessaryContinueJS
                continue;
            }
            else if (pathInLexicalEnvironmentEquals(node, localEnvironment, true, RETURN_SYMBOL)) {
                logger.logReturn(node, typescript);
                return;
            }
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a ThisExpression
 */
function evaluateThisExpression({ node, environment }) {
    const match = getFromLexicalEnvironment(node, environment, THIS_SYMBOL);
    return match == null ? undefined : match.literal;
}

/**
 * Evaluates, or attempts to evaluate, a BreakStatement
 */
function evaluateBreakStatement({ environment, reporting, node }) {
    setInLexicalEnvironment({ env: environment, path: BREAK_SYMBOL, value: true, reporting, node });
}

/**
 * Evaluates, or attempts to evaluate, a ContinueStatement
 */
function evaluateContinueStatement({ node, environment, reporting }) {
    setInLexicalEnvironment({ env: environment, path: CONTINUE_SYMBOL, value: true, reporting, node });
}

/**
 * Evaluates, or attempts to evaluate, a ForStatement
 */
function evaluateForStatement({ node, environment, evaluate, reporting, statementTraversalStack, typescript }) {
    // Prepare a lexical environment for the ForStatement
    const forEnvironment = cloneLexicalEnvironment(environment);
    // Evaluate the initializer if it is given
    if (node.initializer !== undefined) {
        if (typescript.isVariableDeclarationList(node.initializer)) {
            for (const declaration of node.initializer.declarations) {
                evaluate.declaration(declaration, forEnvironment, statementTraversalStack);
            }
        }
        else {
            evaluate.expression(node.initializer, forEnvironment, statementTraversalStack);
        }
    }
    while (true) {
        // Prepare a lexical environment for the current iteration
        const iterationEnvironment = cloneLexicalEnvironment(forEnvironment);
        // Define a new binding for a break symbol within the environment
        setInLexicalEnvironment({ env: iterationEnvironment, path: BREAK_SYMBOL, value: false, newBinding: true, reporting, node });
        // Define a new binding for a continue symbol within the environment
        setInLexicalEnvironment({ env: iterationEnvironment, path: CONTINUE_SYMBOL, value: false, newBinding: true, reporting, node });
        // Evaluate the condition. It may be truthy always
        const conditionResult = node.condition == null ? true : evaluate.expression(node.condition, forEnvironment, statementTraversalStack);
        // If the condition doesn't hold, return immediately
        if (!conditionResult)
            return;
        // Execute the Statement
        evaluate.statement(node.statement, iterationEnvironment);
        // Check if a 'break' statement has been encountered and break if so
        if (pathInLexicalEnvironmentEquals(node, iterationEnvironment, true, BREAK_SYMBOL)) {
            break;
        }
        else if (pathInLexicalEnvironmentEquals(node, iterationEnvironment, true, RETURN_SYMBOL)) {
            return;
        }
        // Run the incrementor
        if (node.incrementor != null) {
            evaluate.expression(node.incrementor, forEnvironment, statementTraversalStack);
        }
        // Always run the incrementor before continuing
        else if (pathInLexicalEnvironmentEquals(node, iterationEnvironment, true, CONTINUE_SYMBOL)) {
            // noinspection UnnecessaryContinueJS
            continue;
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a WhileStatement
 */
function evaluateWhileStatement({ node, environment, evaluate, logger, reporting, typescript, statementTraversalStack }) {
    let condition = evaluate.expression(node.expression, environment, statementTraversalStack);
    while (condition) {
        // Prepare a lexical environment for the current iteration
        const iterationEnvironment = cloneLexicalEnvironment(environment);
        // Define a new binding for a break symbol within the environment
        setInLexicalEnvironment({ env: iterationEnvironment, path: BREAK_SYMBOL, value: false, newBinding: true, reporting, node });
        // Define a new binding for a continue symbol within the environment
        setInLexicalEnvironment({ env: iterationEnvironment, path: CONTINUE_SYMBOL, value: false, newBinding: true, reporting, node });
        // Execute the Statement
        evaluate.statement(node.statement, iterationEnvironment);
        // Check if a 'break' statement has been encountered and break if so
        if (pathInLexicalEnvironmentEquals(node, iterationEnvironment, true, BREAK_SYMBOL)) {
            logger.logBreak(node, typescript);
            break;
        }
        else if (pathInLexicalEnvironmentEquals(node, iterationEnvironment, true, RETURN_SYMBOL)) {
            logger.logReturn(node, typescript);
            return;
        }
        condition = evaluate.expression(node.expression, environment, statementTraversalStack);
        // Always re-evaluate the condition before continuing
        if (pathInLexicalEnvironmentEquals(node, iterationEnvironment, true, CONTINUE_SYMBOL)) {
            logger.logContinue(node, typescript);
            // noinspection UnnecessaryContinueJS
            continue;
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a ForInStatement
 */
function evaluateForInStatement({ node, environment, evaluate, logger, reporting, typescript, statementTraversalStack }) {
    // Compute the 'of' part
    const expressionResult = evaluate.expression(node.expression, environment, statementTraversalStack);
    // Ensure that the initializer is a proper VariableDeclarationList
    if (!typescript.isVariableDeclarationList(node.initializer)) {
        throw new UnexpectedNodeError({ node: node.initializer, typescript });
    }
    // Only 1 declaration is allowed in a ForOfStatement
    else if (node.initializer.declarations.length > 1) {
        throw new UnexpectedNodeError({ node: node.initializer.declarations[1], typescript });
    }
    for (const literal in expressionResult) {
        // Prepare a lexical environment for the current iteration
        const localEnvironment = cloneLexicalEnvironment(environment);
        // Define a new binding for a break symbol within the environment
        setInLexicalEnvironment({ env: localEnvironment, path: BREAK_SYMBOL, value: false, newBinding: true, reporting, node });
        // Define a new binding for a continue symbol within the environment
        setInLexicalEnvironment({ env: localEnvironment, path: CONTINUE_SYMBOL, value: false, newBinding: true, reporting, node });
        // Evaluate the VariableDeclaration and manually pass in the current literal as the initializer for the variable assignment
        evaluate.nodeWithArgument(node.initializer.declarations[0], localEnvironment, literal, statementTraversalStack);
        // Evaluate the Statement
        evaluate.statement(node.statement, localEnvironment);
        // Check if a 'break' statement has been encountered and break if so
        if (pathInLexicalEnvironmentEquals(node, localEnvironment, true, BREAK_SYMBOL)) {
            logger.logBreak(node, typescript);
            break;
        }
        else if (pathInLexicalEnvironmentEquals(node, localEnvironment, true, CONTINUE_SYMBOL)) {
            logger.logContinue(node, typescript);
            // noinspection UnnecessaryContinueJS
            continue;
        }
        else if (pathInLexicalEnvironmentEquals(node, localEnvironment, true, RETURN_SYMBOL)) {
            logger.logReturn(node, typescript);
            return;
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a FunctionExpression
 */
function evaluateFunctionExpression(options) {
    const { node, environment, evaluate, stack, reporting, typescript } = options;
    const nameResult = node.name == null ? undefined : node.name.text;
    const _functionExpression = hasModifier(node, typescript.SyntaxKind.AsyncKeyword)
        ? async function functionExpression(...args) {
            // Prepare a lexical environment for the function context
            const localLexicalEnvironment = cloneLexicalEnvironment(environment);
            // Define a new binding for a return symbol within the environment
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: RETURN_SYMBOL, value: false, newBinding: true, reporting, node });
            // Define a new binding for the arguments given to the function
            // eslint-disable-next-line prefer-rest-params
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: "arguments", value: arguments, newBinding: true, reporting, node });
            if (this != null) {
                setInLexicalEnvironment({ env: localLexicalEnvironment, path: THIS_SYMBOL, value: this, newBinding: true, reporting, node });
            }
            // Evaluate the parameters based on the given arguments
            evaluateParameterDeclarations(Object.assign(Object.assign({}, options), { node: node.parameters, environment: localLexicalEnvironment }), args);
            // If the body is a block, evaluate it as a statement
            if (node.body == null)
                return;
            evaluate.statement(node.body, localLexicalEnvironment);
            // If a 'return' has occurred within the block, pop the Stack and return that value
            if (pathInLexicalEnvironmentEquals(node, localLexicalEnvironment, true, RETURN_SYMBOL)) {
                return stack.pop();
            }
            // Otherwise, return 'undefined'. Nothing is returned from the function
            else
                return undefined;
        }
        : function functionExpression(...args) {
            // Prepare a lexical environment for the function context
            const localLexicalEnvironment = cloneLexicalEnvironment(environment);
            // Define a new binding for a return symbol within the environment
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: RETURN_SYMBOL, value: false, newBinding: true, reporting, node });
            // Define a new binding for the arguments given to the function
            // eslint-disable-next-line prefer-rest-params
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: "arguments", value: arguments, newBinding: true, reporting, node });
            if (this != null) {
                setInLexicalEnvironment({ env: localLexicalEnvironment, path: THIS_SYMBOL, value: this, newBinding: true, reporting, node });
            }
            // Evaluate the parameters based on the given arguments
            evaluateParameterDeclarations(Object.assign(Object.assign({}, options), { node: node.parameters, environment: localLexicalEnvironment }), args);
            // If the body is a block, evaluate it as a statement
            if (node.body == null)
                return;
            evaluate.statement(node.body, localLexicalEnvironment);
            // If a 'return' has occurred within the block, pop the Stack and return that value
            if (pathInLexicalEnvironmentEquals(node, localLexicalEnvironment, true, RETURN_SYMBOL)) {
                return stack.pop();
            }
            // Otherwise, return 'undefined'. Nothing is returned from the function
            else
                return undefined;
        };
    if (nameResult != null) {
        setInLexicalEnvironment({ env: environment, path: nameResult, value: _functionExpression.bind(_functionExpression), reporting, node });
    }
    _functionExpression.toString = () => `[Function${nameResult == null ? "" : `: ${nameResult}`}]`;
    // Make sure to use the Function that is contained within the Realm. Otherwise, 'instanceof' checks may fail
    // since this particular function comes from the executing context.
    Object.setPrototypeOf(_functionExpression, getFromLexicalEnvironment(node, environment, "Function").literal);
    return _functionExpression;
}

/**
 * An Error that can be thrown when a TryStatement is encountered without neither a catch {...} nor a finally {...} block
 */
class MissingCatchOrFinallyAfterTryError extends EvaluationError {
    constructor({ node, message = `Missing catch or finally after try` }) {
        super({ node, message });
    }
}

const TRY_SYMBOL = "[try]";

/**
 * Evaluates, or attempts to evaluate, a TryStatement
 *
 * @param options
 * @returns
 */
function evaluateTryStatement({ node, evaluate, environment, reporting, statementTraversalStack }) {
    const executeTry = () => {
        setInLexicalEnvironment({ env: environment, reporting, newBinding: true, node, path: TRY_SYMBOL, value: true });
        // The Block will declare an environment of its own
        evaluate.statement(node.tryBlock, environment);
    };
    const executeCatch = (ex) => {
        clearBindingFromLexicalEnvironment(environment, TRY_SYMBOL);
        // The CatchClause will declare an environment of its own
        evaluate.nodeWithArgument(node.catchClause, environment, ex, statementTraversalStack);
    };
    const executeFinally = () => {
        clearBindingFromLexicalEnvironment(environment, TRY_SYMBOL);
        // The Block will declare an environment of its own
        evaluate.statement(node.finallyBlock, environment);
    };
    // A TryStatement must have either a catch or a finally block
    if (node.catchClause == null && node.finallyBlock == null) {
        throw new MissingCatchOrFinallyAfterTryError({ node });
    }
    // Follows the form: try {...} catch {...}
    else if (node.catchClause != null && node.finallyBlock == null) {
        try {
            executeTry();
        }
        catch (ex) {
            executeCatch(ex);
        }
    }
    // Follows the form: try {...} catch {...} finally {...}
    else if (node.catchClause != null && node.finallyBlock != null) {
        try {
            executeTry();
        }
        catch (ex) {
            executeCatch(ex);
        }
        finally {
            executeFinally();
        }
    }
    // Follows the form: try {...} finally {...}
    else if (node.catchClause == null && node.finallyBlock != null) {
        try {
            executeTry();
        }
        finally {
            executeFinally();
        }
    }
}

/**
 * A function that uses 'new Function' to auto-generate a class with a dynamic name and extended type
 */
function generateClassDeclaration({ name, extendedType, ctor = () => {
    // Noop
} }) {
    if (extendedType == null) {
        return new Function("ctor", `return class ${name == null ? "" : name} {constructor () {const ctorReturnValue = ctor.call(this, ...arguments); if (ctorReturnValue != null) return ctorReturnValue;}}`)(ctor);
    }
    else {
        return new Function("extendedType", "ctor", `return class ${name == null ? "" : name} extends extendedType {constructor () {super(...arguments); const ctorReturnValue = ctor.call(this, ...arguments); if (ctorReturnValue != null) return ctorReturnValue;}}`)(extendedType, ctor);
    }
}

/**
 * Evaluates, or attempts to evaluate, a ClassDeclaration
 */
function evaluateClassDeclaration({ node, environment, evaluate, stack, logger, reporting, typescript, statementTraversalStack }) {
    let extendedType;
    const ctorMember = node.members.find(typescript.isConstructorDeclaration);
    const otherMembers = node.members.filter(member => !typescript.isConstructorDeclaration(member));
    let ctor;
    if (ctorMember != null) {
        evaluate.declaration(ctorMember, environment, statementTraversalStack);
        ctor = stack.pop();
    }
    if (node.heritageClauses != null) {
        const extendsClause = node.heritageClauses.find(clause => clause.token === typescript.SyntaxKind.ExtendsKeyword);
        if (extendsClause != null) {
            const [firstExtendedType] = extendsClause.types;
            if (firstExtendedType != null) {
                extendedType = evaluate.expression(firstExtendedType.expression, environment, statementTraversalStack);
            }
        }
    }
    const name = node.name == null ? undefined : node.name.text;
    let classDeclaration = generateClassDeclaration({ name, extendedType, ctor });
    if (node.decorators != null) {
        for (const decorator of node.decorators) {
            evaluate.nodeWithArgument(decorator, environment, [classDeclaration], statementTraversalStack);
            classDeclaration = stack.pop();
        }
    }
    classDeclaration.toString = () => `[Class${name == null ? "" : `: ${name}`}]`;
    if (name != null) {
        setInLexicalEnvironment({ env: environment, path: name, value: classDeclaration, newBinding: true, reporting, node });
    }
    // Walk through all of the class members
    for (const member of otherMembers) {
        evaluate.nodeWithArgument(member, environment, hasModifier(member, typescript.SyntaxKind.StaticKeyword) ? classDeclaration : classDeclaration.prototype, statementTraversalStack);
    }
    logger.logHeritage(classDeclaration);
    stack.push(classDeclaration);
    logger.logStack(stack);
}

/**
 * Evaluates, or attempts to evaluate, a ConstructorDeclaration
 */
function evaluateConstructorDeclaration(options) {
    const { node, environment, evaluate, stack, reporting } = options;
    /**
     * An implementation of a constructor function
     */
    function constructor(...args) {
        // Don't concern yourself with calling super here as this constructor is called immediately after calling super() in another memory representation of a class
        // Prepare a lexical environment for the function context
        const localLexicalEnvironment = cloneLexicalEnvironment(environment);
        // Define a new binding for a return symbol within the environment
        setInLexicalEnvironment({ env: localLexicalEnvironment, path: RETURN_SYMBOL, value: false, newBinding: true, reporting, node });
        // Define a new binding for the arguments given to the function
        // eslint-disable-next-line prefer-rest-params
        setInLexicalEnvironment({ env: localLexicalEnvironment, path: "arguments", value: arguments, newBinding: true, reporting, node });
        if (this != null) {
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: THIS_SYMBOL, value: this, newBinding: true, reporting, node });
        }
        // Evaluate the parameters based on the given arguments
        evaluateParameterDeclarations(Object.assign(Object.assign({}, options), { node: node.parameters, environment: localLexicalEnvironment }), args, this);
        // If the body is a block, evaluate it as a statement
        if (node.body == null)
            return;
        evaluate.statement(node.body, localLexicalEnvironment);
        // If a 'return' has occurred within the block, pop the Stack and return that value
        if (pathInLexicalEnvironmentEquals(node, localLexicalEnvironment, true, RETURN_SYMBOL)) {
            return stack.pop();
        }
        // Otherwise, return 'undefined'. Nothing is returned from the function
        else
            return undefined;
    }
    constructor.toString = () => "[Function: constructor]";
    stack.push(constructor);
}

/**
 * Evaluates, or attempts to evaluate, a SuperExpression
 */
function evaluateSuperExpression({ node, environment }) {
    const match = getFromLexicalEnvironment(node, environment, SUPER_SYMBOL);
    return match == null ? undefined : match.literal;
}

/**
 * Evaluates, or attempts to evaluate, a SpreadElement, before applying it on the given parent
 */
function evaluateSpreadElement({ environment, node, evaluate, statementTraversalStack }) {
    return evaluate.expression(node.expression, environment, statementTraversalStack);
}

/**
 * Evaluates, or attempts to evaluate, a ClassExpression
 *
 * @param options
 * @returns
 */
function evaluateClassExpression({ node, environment, evaluate, stack, logger, reporting, statementTraversalStack, typescript }) {
    let extendedType;
    const ctorMember = node.members.find(typescript.isConstructorDeclaration);
    const otherMembers = node.members.filter(member => !typescript.isConstructorDeclaration(member));
    let ctor;
    if (ctorMember != null) {
        evaluate.declaration(ctorMember, environment, statementTraversalStack);
        ctor = stack.pop();
    }
    if (node.heritageClauses != null) {
        const extendsClause = node.heritageClauses.find(clause => clause.token === typescript.SyntaxKind.ExtendsKeyword);
        if (extendsClause != null) {
            const [firstExtendedType] = extendsClause.types;
            if (firstExtendedType != null) {
                extendedType = evaluate.expression(firstExtendedType.expression, environment, statementTraversalStack);
            }
        }
    }
    const name = node.name == null ? undefined : node.name.text;
    let classExpression = generateClassDeclaration({ name, extendedType, ctor });
    if (node.decorators != null) {
        for (const decorator of node.decorators) {
            evaluate.nodeWithArgument(decorator, environment, [classExpression], statementTraversalStack);
            classExpression = stack.pop();
        }
    }
    classExpression.toString = () => `[Class${name == null ? "" : `: ${name}`}]`;
    if (name != null) {
        setInLexicalEnvironment({ env: environment, path: name, value: classExpression, newBinding: true, reporting, node });
    }
    // Walk through all of the class members
    for (const member of otherMembers) {
        evaluate.nodeWithArgument(member, environment, hasModifier(member, typescript.SyntaxKind.StaticKeyword) ? classExpression : classExpression.prototype, statementTraversalStack);
    }
    logger.logHeritage(classExpression);
    return classExpression;
}

/**
 * Evaluates, or attempts to evaluate, a NullLiteral
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function evaluateNullLiteral(_options) {
    return null;
}

/**
 * Evaluates, or attempts to evaluate, a VoidExpression
 *
 * @param options
 * @returns
 */
function evaluateVoidExpression({ node, environment, evaluate, statementTraversalStack }) {
    evaluate.expression(node.expression, environment, statementTraversalStack);
    // The void operator evaluates the expression and then returns undefined
    return undefined;
}

/**
 * Evaluates, or attempts to evaluate, a TypeOfExpression
 */
function evaluateTypeOfExpression({ node, environment, evaluate, statementTraversalStack }) {
    return typeof evaluate.expression(node.expression, environment, statementTraversalStack);
}

/**
 * Evaluates, or attempts to evaluate, a BigIntLiteral
 */
function evaluateBigIntLiteral({ node, environment }) {
    // Use BigInt from the Realm instead of the executing context such that instanceof checks won't fail, etc.
    const _BigInt = getFromLexicalEnvironment(node, environment, "BigInt").literal;
    // BigInt allows taking in strings, but they must appear as BigInt literals (e.g. "2n" is not allowed, but "2" is)
    return _BigInt(node.text.endsWith("n") ? node.text.slice(0, -1) : node.text);
}

/**
 * Evaluates, or attempts to evaluate, an EnumDeclaration
 */
function evaluateEnumDeclaration({ node, environment, evaluate, statementTraversalStack, reporting, stack }) {
    // Create a new ObjectLiteral based on the Object implementation from the Realm since this must not be the same as in the parent executing context
    // Otherwise, instanceof checks would fail
    const objectCtor = getFromLexicalEnvironment(node, environment, "Object").literal;
    const enumDeclaration = objectCtor.create(objectCtor.prototype);
    const name = node.name.text;
    // Bind the Enum to the lexical environment as a new binding
    setInLexicalEnvironment({ env: environment, path: name, value: enumDeclaration, newBinding: true, reporting, node });
    for (const member of node.members) {
        evaluate.nodeWithArgument(member, environment, enumDeclaration, statementTraversalStack);
    }
    enumDeclaration.toString = () => `[Enum: ${name}]`;
    // Push the Enum declaration on to the Stack
    stack.push(enumDeclaration);
}

/**
 * Evaluates, or attempts to evaluate, a SourceFile as a namespace object
 */
function evaluateSourceFileAsNamespaceObject({ node, environment, evaluate, typeChecker, stack, statementTraversalStack }) {
    // Create a new ObjectLiteral based on the Object implementation from the Realm since this must not be the same as in the parent executing context
    // Otherwise, instanceof checks would fail
    const objectCtor = getFromLexicalEnvironment(node, environment, "Object").literal;
    const namespaceObject = objectCtor.create(objectCtor.prototype);
    const moduleSymbol = typeChecker.getSymbolAtLocation(node);
    if (moduleSymbol != null) {
        const exports = moduleSymbol.exports;
        if (exports != null) {
            for (const [identifier, symbol] of exports.entries()) {
                const valueDeclaration = symbol.valueDeclaration;
                if (valueDeclaration == null)
                    return;
                evaluate.declaration(valueDeclaration, environment, statementTraversalStack);
                namespaceObject[identifier] = stack.pop();
            }
        }
    }
    stack.push(namespaceObject);
}

/**
 * Evaluates, or attempts to evaluate, a ModuleDeclaration
 */
function evaluateModuleDeclaration(options) {
    options.stack.push(getImplementationForDeclarationWithinDeclarationFile(options));
}

/**
 * Evaluates, or attempts to evaluate, an ImportDeclaration (which is actually a Statement).
 * It will be a noop, since we rely on the TypeChecker to resolve symbols across SourceFiles,
 * rather than manually parsing and resolving imports/exports
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function evaluateImportDeclaration(_options) {
    // Noop
}

/**
 * Evaluates, or attempts to evaluate, a ThrowStatement
 */
function evaluateThrowStatement({ node, environment, evaluate, statementTraversalStack }) {
    throw evaluate.expression(node.expression, environment, statementTraversalStack);
}

/**
 * Evaluates, or attempts to evaluate, an ImportEqualsDeclaration (which is actually a Statement).
 * It will be a noop, since we rely on the TypeChecker to resolve symbols across SourceFiles,
 * rather than manually parsing and resolving imports/exports
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function evaluateImportEqualsDeclaration(_options) {
    // Noop
}

/**
 * An Error that can be thrown when the maximum amount of operations dictated by the policy is exceeded
 */
class MaxOpDurationExceededError extends PolicyError {
    constructor({ duration, node, message = `Maximum operation duration exceeded: ${duration}` }) {
        super({ violation: "maxOpDuration", message, node });
        this.duration = duration;
    }
}

/**
 * Evaluates, or attempts to evaluate, an AwaitExpression
 */
async function evaluateAwaitExpression({ node, environment, evaluate, policy, statementTraversalStack }) {
    // If a maximum duration for any operation is given, set a timeout that will throw a PolicyError when and if the duration is exceeded.
    const timeout = policy.maxOpDuration === Infinity
        ? undefined
        : setTimeout(() => {
            throw new MaxOpDurationExceededError({ duration: policy.maxOpDuration, node });
        }, policy.maxOpDuration);
    const result = evaluate.expression(node.expression, environment, statementTraversalStack);
    // Make sure to clear the timeout if it exists to avoid throwing unnecessarily
    if (timeout != null)
        clearTimeout(timeout);
    // Return the evaluated result
    return result;
}

/**
 * Evaluates, or attempts to evaluate, a ConditionalExpression
 */
function evaluateConditionalExpression({ node, environment, evaluate, statementTraversalStack }) {
    const conditionValue = evaluate.expression(node.condition, environment, statementTraversalStack);
    // We have to perform a loose boolean expression here to conform with actual spec behavior
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (conditionValue) {
        // Proceed with the truthy branch
        return evaluate.expression(node.whenTrue, environment, statementTraversalStack);
    }
    // Proceed with the falsy branch
    return evaluate.expression(node.whenFalse, environment, statementTraversalStack);
}

/**
 * Returns true if the given Node exists within a static context
 */
function inStaticContext(node, typescript) {
    let currentNode = node;
    while (currentNode != null && !typescript.isSourceFile(currentNode)) {
        if (hasModifier(currentNode, typescript.SyntaxKind.StaticKeyword))
            return true;
        currentNode = currentNode.parent;
    }
    return false;
}

/**
 * Evaluates, or attempts to evaluate, a MethodDeclaration, before setting it on the given parent
 */
function evaluateMethodDeclaration(options, parent) {
    const { node, environment, evaluate, stack, statementTraversalStack, reporting, typescript } = options;
    const nameResult = evaluate.nodeWithValue(node.name, environment, statementTraversalStack);
    const isStatic = inStaticContext(node, typescript);
    if (parent == null) {
        let updatedParent;
        if (typescript.isClassLike(node.parent)) {
            evaluate.declaration(node.parent, environment, statementTraversalStack);
            updatedParent = stack.pop();
        }
        else {
            updatedParent = evaluate.expression(node.parent, environment, statementTraversalStack);
        }
        stack.push(isStatic ? updatedParent[nameResult] : updatedParent.prototype[nameResult]);
        return;
    }
    const _methodDeclaration = hasModifier(node, typescript.SyntaxKind.AsyncKeyword)
        ? async function methodDeclaration(...args) {
            // Prepare a lexical environment for the function context
            const localLexicalEnvironment = cloneLexicalEnvironment(environment);
            // Define a new binding for a return symbol within the environment
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: RETURN_SYMBOL, value: false, newBinding: true, reporting, node });
            // Define a new binding for the arguments given to the function
            // eslint-disable-next-line prefer-rest-params
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: "arguments", value: arguments, newBinding: true, reporting, node });
            if (this != null) {
                setInLexicalEnvironment({ env: localLexicalEnvironment, path: THIS_SYMBOL, value: this, newBinding: true, reporting, node });
                // Set the 'super' binding, depending on whether or not we're inside a static context
                setInLexicalEnvironment({
                    env: localLexicalEnvironment,
                    path: SUPER_SYMBOL,
                    value: isStatic ? Object.getPrototypeOf(this) : Object.getPrototypeOf(this.constructor).prototype,
                    newBinding: true,
                    reporting,
                    node
                });
            }
            // Evaluate the parameters based on the given arguments
            evaluateParameterDeclarations(Object.assign(Object.assign({}, options), { node: node.parameters, environment: localLexicalEnvironment }), args);
            // If the body is a block, evaluate it as a statement
            if (node.body == null)
                return;
            evaluate.statement(node.body, localLexicalEnvironment);
            // If a 'return' has occurred within the block, pop the Stack and return that value
            if (pathInLexicalEnvironmentEquals(node, localLexicalEnvironment, true, RETURN_SYMBOL)) {
                return stack.pop();
            }
            // Otherwise, return 'undefined'. Nothing is returned from the function
            else
                return undefined;
        }
        : function methodDeclaration(...args) {
            // Prepare a lexical environment for the function context
            const localLexicalEnvironment = cloneLexicalEnvironment(environment);
            // Define a new binding for a return symbol within the environment
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: RETURN_SYMBOL, value: false, newBinding: true, reporting, node });
            // Define a new binding for the arguments given to the function
            // eslint-disable-next-line prefer-rest-params
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: "arguments", value: arguments, newBinding: true, reporting, node });
            if (this != null) {
                setInLexicalEnvironment({ env: localLexicalEnvironment, path: THIS_SYMBOL, value: this, newBinding: true, reporting, node });
                // Set the 'super' binding, depending on whether or not we're inside a static context
                setInLexicalEnvironment({
                    env: localLexicalEnvironment,
                    path: SUPER_SYMBOL,
                    value: isStatic ? Object.getPrototypeOf(this) : Object.getPrototypeOf(this.constructor).prototype,
                    newBinding: true,
                    reporting,
                    node
                });
            }
            // Evaluate the parameters based on the given arguments
            evaluateParameterDeclarations(Object.assign(Object.assign({}, options), { node: node.parameters, environment: localLexicalEnvironment }), args);
            // If the body is a block, evaluate it as a statement
            if (node.body == null)
                return;
            evaluate.statement(node.body, localLexicalEnvironment);
            // If a 'return' has occurred within the block, pop the Stack and return that value
            if (pathInLexicalEnvironmentEquals(node, localLexicalEnvironment, true, RETURN_SYMBOL)) {
                return stack.pop();
            }
            // Otherwise, return 'undefined'. Nothing is returned from the function
            else
                return undefined;
        };
    _methodDeclaration.toString = () => `[Method: ${nameResult}]`;
    // Make sure to use the Function that is contained within the Realm. Otherwise, 'instanceof' checks may fail
    // since this particular function comes from the executing context.
    Object.setPrototypeOf(_methodDeclaration, getFromLexicalEnvironment(node, environment, "Function").literal);
    parent[nameResult] = _methodDeclaration;
    if (node.decorators != null) {
        for (const decorator of node.decorators) {
            evaluate.nodeWithArgument(decorator, environment, [parent, nameResult], statementTraversalStack);
            // Pop the stack. We don't need the value it has left on the Stack
            stack.pop();
        }
    }
    // Also loop through parameters to use their decorators, if any
    if (node.parameters != null) {
        // 'this' is a special parameter which is removed from the emitted results
        const parameters = node.parameters.filter(param => !(typescript.isIdentifier(param.name) && param.name.text === "this"));
        for (let i = 0; i < parameters.length; i++) {
            const parameter = parameters[i];
            if (parameter.decorators != null) {
                for (const decorator of parameter.decorators) {
                    evaluate.nodeWithArgument(decorator, environment, [parent, nameResult, i], statementTraversalStack);
                    // Pop the stack. We don't need the value it has left on the Stack
                    stack.pop();
                }
            }
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a PropertyDeclaration, before applying it on the given parent
 */
function evaluatePropertyDeclaration({ environment, node, evaluate, statementTraversalStack, typescript, stack }, parent) {
    // Compute the property name
    const propertyNameResult = evaluate.nodeWithValue(node.name, environment, statementTraversalStack);
    if (parent == null) {
        evaluate.declaration(node.parent, environment, statementTraversalStack);
        const updatedParent = stack.pop();
        const isStatic = inStaticContext(node, typescript);
        stack.push(isStatic ? updatedParent[propertyNameResult] : updatedParent.prototype[propertyNameResult]);
        return;
    }
    parent[propertyNameResult] = node.initializer == null ? undefined : evaluate.expression(node.initializer, environment, statementTraversalStack);
    if (node.decorators != null) {
        for (const decorator of node.decorators) {
            evaluate.nodeWithArgument(decorator, environment, [parent, propertyNameResult], statementTraversalStack);
            // Pop the stack. We don't need the value it has left on the Stack
            stack.pop();
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a GetAccessorDeclaration, before setting it on the given parent
 */
function evaluateGetAccessorDeclaration({ node, environment, evaluate, stack, reporting, typescript, statementTraversalStack }, parent) {
    const nameResult = evaluate.nodeWithValue(node.name, environment, statementTraversalStack);
    const isStatic = inStaticContext(node, typescript);
    if (parent == null) {
        let updatedParent;
        if (typescript.isClassLike(node.parent)) {
            evaluate.declaration(node.parent, environment, statementTraversalStack);
            updatedParent = stack.pop();
        }
        else {
            updatedParent = evaluate.expression(node.parent, environment, statementTraversalStack);
        }
        stack.push(isStatic ? updatedParent[nameResult] : updatedParent.prototype[nameResult]);
        return;
    }
    /**
     * An implementation of the get accessor
     */
    function getAccessorDeclaration() {
        // Prepare a lexical environment for the function context
        const localLexicalEnvironment = cloneLexicalEnvironment(environment);
        // Define a new binding for a return symbol within the environment
        setInLexicalEnvironment({ env: localLexicalEnvironment, path: RETURN_SYMBOL, value: false, newBinding: true, reporting, node });
        // Define a new binding for the arguments given to the function
        // eslint-disable-next-line prefer-rest-params
        setInLexicalEnvironment({ env: localLexicalEnvironment, path: "arguments", value: arguments, newBinding: true, reporting, node });
        if (this != null) {
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: THIS_SYMBOL, value: this, newBinding: true, reporting, node });
            // Set the 'super' binding, depending on whether or not we're inside a static context
            setInLexicalEnvironment({
                env: localLexicalEnvironment,
                path: SUPER_SYMBOL,
                value: isStatic ? Object.getPrototypeOf(this) : Object.getPrototypeOf(this.constructor).prototype,
                newBinding: true,
                reporting,
                node
            });
        }
        // If the body is a block, evaluate it as a statement
        if (node.body == null)
            return;
        evaluate.statement(node.body, localLexicalEnvironment);
        // If a 'return' has occurred within the block, pop the Stack and return that value
        if (pathInLexicalEnvironmentEquals(node, localLexicalEnvironment, true, RETURN_SYMBOL)) {
            return stack.pop();
        }
        // Otherwise, return 'undefined'. Nothing is returned from the function
        else
            return undefined;
    }
    getAccessorDeclaration.toString = () => `[Get: ${nameResult}]`;
    let currentPropertyDescriptor = Object.getOwnPropertyDescriptor(parent, nameResult);
    if (currentPropertyDescriptor == null)
        currentPropertyDescriptor = {};
    Object.defineProperty(parent, nameResult, Object.assign(Object.assign({}, currentPropertyDescriptor), { configurable: true, get: getAccessorDeclaration }));
}

/**
 * Evaluates, or attempts to evaluate, a TypeAliasDeclaration
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function evaluateTypeAliasDeclaration(_options) {
    return;
}

/**
 * Evaluates, or attempts to evaluate, a TypeAliasDeclaration
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function evaluateInterfaceDeclaration(_options) {
    return;
}

/**
 * Will get a literal value for the given Node. If it doesn't succeed, the value will be 'undefined'
 */
function evaluateNode(_a) {
    var _b, _c, _d, _e, _f, _g;
    var { node } = _a, rest = __rest(_a, ["node"]);
    if (rest.typescript.isIdentifier(node)) {
        return evaluateIdentifier(Object.assign({ node }, rest));
    }
    else if ((_c = (_b = rest.typescript).isPrivateIdentifier) === null || _c === void 0 ? void 0 : _c.call(_b, node)) {
        return evaluateIdentifier(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isStringLiteralLike(node)) {
        return evaluateStringLiteral(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isNumericLiteral(node)) {
        return evaluateNumericLiteral(Object.assign({ node }, rest));
    }
    else if (isBooleanLiteral(node, rest.typescript)) {
        return evaluateBooleanLiteral(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isForOfStatement(node)) {
        return evaluateForOfStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isForInStatement(node)) {
        return evaluateForInStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isForStatement(node)) {
        return evaluateForStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isWhileStatement(node)) {
        return evaluateWhileStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isRegularExpressionLiteral(node)) {
        return evaluateRegularExpressionLiteral(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isObjectLiteralExpression(node)) {
        return evaluateObjectLiteralExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isAwaitExpression(node)) {
        return evaluateAwaitExpression(Object.assign({ node }, rest));
    }
    else if (((_e = (_d = rest.typescript).isTypeAssertionExpression) === null || _e === void 0 ? void 0 : _e.call(_d, node)) || rest.typescript.isTypeAssertion(node)) {
        return evaluateTypeAssertion(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isTemplateExpression(node)) {
        return evaluateTemplateExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isMethodDeclaration(node)) {
        return evaluateMethodDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isPropertyDeclaration(node)) {
        return evaluatePropertyDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isGetAccessorDeclaration(node)) {
        return evaluateGetAccessorDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isArrayLiteralExpression(node)) {
        return evaluateArrayLiteralExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isSourceFile(node)) {
        return evaluateSourceFileAsNamespaceObject(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isModuleDeclaration(node)) {
        return evaluateModuleDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isPrefixUnaryExpression(node)) {
        return evaluatePrefixUnaryExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isPostfixUnaryExpression(node)) {
        return evaluatePostfixUnaryExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isVariableStatement(node)) {
        return evaluateVariableStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isComputedPropertyName(node)) {
        return evaluateComputedPropertyName(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isVariableDeclarationList(node)) {
        return evaluateVariableDeclarationList(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isImportDeclaration(node)) {
        return evaluateImportDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isImportEqualsDeclaration(node)) {
        return evaluateImportEqualsDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isThrowStatement(node)) {
        return evaluateThrowStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isVariableDeclaration(node)) {
        return evaluateVariableDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isEnumDeclaration(node)) {
        return evaluateEnumDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isConstructorDeclaration(node)) {
        return evaluateConstructorDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isBinaryExpression(node)) {
        return evaluateBinaryExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isParenthesizedExpression(node)) {
        return evaluateParenthesizedExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isExpressionStatement(node)) {
        return evaluateExpressionStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isArrowFunction(node)) {
        return evaluateArrowFunctionExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isFunctionDeclaration(node)) {
        return evaluateFunctionDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isFunctionExpression(node)) {
        return evaluateFunctionExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isClassDeclaration(node)) {
        return evaluateClassDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isIfStatement(node)) {
        return evaluateIfStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isConditionalExpression(node)) {
        return evaluateConditionalExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isPropertyAccessExpression(node)) {
        return evaluatePropertyAccessExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isElementAccessExpression(node)) {
        return evaluateElementAccessExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isCallExpression(node)) {
        return evaluateCallExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isSwitchStatement(node)) {
        return evaluateSwitchStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isNewExpression(node)) {
        return evaluateNewExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isNonNullExpression(node)) {
        return evaluateNonNullExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isAsExpression(node)) {
        return evaluateAsExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isBlock(node)) {
        return evaluateBlock(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isClassExpression(node)) {
        return evaluateClassExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isSpreadElement(node)) {
        return evaluateSpreadElement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isTryStatement(node)) {
        return evaluateTryStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isReturnStatement(node)) {
        return evaluateReturnStatement(Object.assign({ node }, rest));
    }
    else if (isThisExpression(node, rest.typescript)) {
        return evaluateThisExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isVoidExpression(node)) {
        return evaluateVoidExpression(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isTypeOfExpression(node)) {
        return evaluateTypeOfExpression(Object.assign({ node }, rest));
    }
    else if (isSuperExpression(node, rest.typescript)) {
        return evaluateSuperExpression(Object.assign({ node }, rest));
    }
    else if (isNullLiteral(node, rest.typescript)) {
        return evaluateNullLiteral(Object.assign({ node }, rest));
    }
    else if ((_g = (_f = rest.typescript).isBigIntLiteral) === null || _g === void 0 ? void 0 : _g.call(_f, node)) {
        return evaluateBigIntLiteral(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isBreakStatement(node)) {
        return evaluateBreakStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isContinueStatement(node)) {
        return evaluateContinueStatement(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isTypeAliasDeclaration(node)) {
        return evaluateTypeAliasDeclaration(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isInterfaceDeclaration(node)) {
        return evaluateInterfaceDeclaration(Object.assign({ node }, rest));
    }
    throw new UnexpectedNodeError({ node, typescript: rest.typescript });
}

/**
 * Creates a StatementTraversalStack
 */
function createStatementTraversalStack() {
    return [];
}

/**
 * Will get a literal value for the given Statement. If it doesn't succeed, the value will be 'undefined'
 */
function evaluateStatement(options) {
    options.logger.logNode(options.node, options.typescript);
    // Create a new Statement traversal stack (since this is a new statement)
    options.statementTraversalStack = createStatementTraversalStack();
    evaluateNode(options);
}

/**
 * Will get a literal value for the given Expression. If it doesn't succeed, the value will be 'undefined'
 */
function evaluateExpression(options) {
    options.logger.logNode(options.node, options.typescript);
    const value = evaluateNode(options);
    // Report intermediate results
    if (options.reporting.reportIntermediateResults != null) {
        options.reporting.reportIntermediateResults({
            node: options.node,
            value
        });
    }
    return value;
}

/**
 * Will get a literal value for the given Declaration. If it doesn't succeed, the value will be 'undefined'
 */
function evaluateDeclaration(options) {
    options.logger.logNode(options.node, options.typescript);
    evaluateNode(options);
}

/**
 * Evaluates, or attempts to evaluate, a BindingName, based on an initializer
 */
function evaluateBindingName({ node, environment, evaluate, statementTraversalStack, reporting, typescript, logger }, rightHandValue) {
    var _a;
    // If the declaration binds a simple identifier, bind that text to the environment
    if (typescript.isIdentifier(node) || ((_a = typescript.isPrivateIdentifier) === null || _a === void 0 ? void 0 : _a.call(typescript, node))) {
        setInLexicalEnvironment({ env: environment, path: node.text, value: rightHandValue, newBinding: true, reporting, node });
        logger.logBinding(node.text, rightHandValue, "evaluateBindingName");
    }
    else {
        evaluate.nodeWithArgument(node, environment, rightHandValue, statementTraversalStack);
    }
}

/**
 * Evaluates, or attempts to evaluate, a SetAccessorDeclaration, before setting it on the given parent
 */
function evaluateSetAccessorDeclaration(options, parent) {
    const { node, environment, evaluate, statementTraversalStack, reporting, typescript } = options;
    const nameResult = evaluate.nodeWithValue(node.name, environment, statementTraversalStack);
    const isStatic = inStaticContext(node, typescript);
    /**
     * An implementation of the set accessor
     */
    function setAccessorDeclaration(...args) {
        // Prepare a lexical environment for the function context
        const localLexicalEnvironment = cloneLexicalEnvironment(environment);
        // Define a new binding for a return symbol within the environment
        setInLexicalEnvironment({ env: localLexicalEnvironment, path: RETURN_SYMBOL, value: false, newBinding: true, reporting, node });
        // Define a new binding for the arguments given to the function
        // eslint-disable-next-line prefer-rest-params
        setInLexicalEnvironment({ env: localLexicalEnvironment, path: "arguments", value: arguments, newBinding: true, reporting, node });
        if (this != null) {
            setInLexicalEnvironment({ env: localLexicalEnvironment, path: THIS_SYMBOL, value: this, newBinding: true, reporting, node });
            // Set the 'super' binding, depending on whether or not we're inside a static context
            setInLexicalEnvironment({
                env: localLexicalEnvironment,
                path: SUPER_SYMBOL,
                value: isStatic ? Object.getPrototypeOf(this) : Object.getPrototypeOf(this.constructor).prototype,
                newBinding: true,
                reporting,
                node
            });
        }
        // Evaluate the parameters based on the given arguments
        evaluateParameterDeclarations(Object.assign(Object.assign({}, options), { node: node.parameters, environment: localLexicalEnvironment }), args);
        // If the body is a block, evaluate it as a statement
        if (node.body == null)
            return;
        evaluate.statement(node.body, localLexicalEnvironment);
    }
    setAccessorDeclaration.toString = () => `[Set: ${nameResult}]`;
    let currentPropertyDescriptor = Object.getOwnPropertyDescriptor(parent, nameResult);
    if (currentPropertyDescriptor == null)
        currentPropertyDescriptor = {};
    Object.defineProperty(parent, nameResult, Object.assign(Object.assign({}, currentPropertyDescriptor), { configurable: true, set: setAccessorDeclaration }));
}

/**
 * Evaluates, or attempts to evaluate, a PropertyAssignment, before applying it on the given parent
 */
function evaluatePropertyAssignment({ environment, node, evaluate, statementTraversalStack }, parent) {
    const initializer = evaluate.expression(node.initializer, environment, statementTraversalStack);
    // Compute the property name
    const propertyNameResult = evaluate.nodeWithValue(node.name, environment, statementTraversalStack);
    parent[propertyNameResult] = initializer;
}

/**
 * Evaluates, or attempts to evaluate, a ParameterDeclaration
 */
function evaluateParameterDeclaration({ node, environment, evaluate, statementTraversalStack, logger }, boundArgument) {
    // Use the bound argument if it is given unless it is nullable and the node itself has an initializer
    const boundValue = boundArgument != null || node.initializer === undefined ? boundArgument : evaluate.expression(node.initializer, environment, statementTraversalStack);
    logger.logBinding(node.name.getText(), boundValue, "evaluateParameterDeclaration");
    evaluate.nodeWithArgument(node.name, environment, boundValue, statementTraversalStack);
}

/**
 * Evaluates, or attempts to evaluate, a ShorthandPropertyAssignment, before applying it on the given parent
 */
function evaluateShorthandPropertyAssignment({ environment, node }, parent) {
    const identifier = node.name.text;
    const match = getFromLexicalEnvironment(node, environment, identifier);
    if (match == null) {
        throw new UndefinedIdentifierError({ node: node.name });
    }
    parent[identifier] = match.literal;
}

/**
 * Evaluates, or attempts to evaluate, a SpreadAssignment, before applying it on the given parent
 */
function evaluateSpreadAssignment({ environment, node, evaluate, statementTraversalStack }, parent) {
    const entries = evaluate.expression(node.expression, environment, statementTraversalStack);
    Object.assign(parent, entries);
}

/**
 * Evaluates, or attempts to evaluate, an ArrayBindingPattern, based on an initializer
 */
function evaluateArrayBindingPattern({ node, evaluate, environment, statementTraversalStack }, rightHandValue) {
    const iterator = rightHandValue[Symbol.iterator]();
    let elementsCursor = 0;
    while (elementsCursor < node.elements.length) {
        const { done, value } = iterator.next();
        if (done === true)
            break;
        evaluate.nodeWithArgument(node.elements[elementsCursor++], environment, value, statementTraversalStack);
    }
}

/**
 * Evaluates, or attempts to evaluate, a BindingName, based on an BindingElement
 */
function evaluateBindingElement({ environment, node, evaluate, logger, reporting, typescript, statementTraversalStack }, rightHandValue) {
    var _a, _b, _c, _d;
    // Compute the initializer value of the BindingElement, if it has any, that is
    const bindingElementInitializer = node.initializer == null ? undefined : evaluate.expression(node.initializer, environment, statementTraversalStack);
    // If the element is directly references a property, but then aliases, store that alias in the environment.
    if ((typescript.isIdentifier(node.name) || ((_a = typescript.isPrivateIdentifier) === null || _a === void 0 ? void 0 : _a.call(typescript, node.name))) && node.propertyName != null) {
        // An element that is aliased cannot have a name that is anything other than an Identifier
        const aliasName = node.name.text;
        // Compute the property name
        const propertyNameResult = evaluate.nodeWithValue(node.propertyName, environment, statementTraversalStack);
        // Extract the property value from the initializer. If it is an ArrayBindingPattern, the rightHandValue will be assigned as-is to the identifier
        const propertyValue = typescript.isArrayBindingPattern(node.parent) ? rightHandValue : rightHandValue[propertyNameResult];
        // Fall back to using the initializer of the BindingElement if the property value is null-like and if it has one
        const propertyValueWithInitializerFallback = propertyValue != null ? propertyValue : bindingElementInitializer;
        setInLexicalEnvironment({
            env: environment,
            path: aliasName,
            value: propertyValueWithInitializerFallback,
            newBinding: true,
            node,
            reporting
        });
    }
    // If the name is a simple non-aliased identifier, it directly references, a property from the right-hand value
    else if ((typescript.isIdentifier(node.name) || ((_b = typescript.isPrivateIdentifier) === null || _b === void 0 ? void 0 : _b.call(typescript, node.name))) && node.propertyName == null) {
        // Compute the literal value of the name of the node
        const nameResult = node.name.text;
        // Extract the property value from the initializer. If it is an ArrayBindingPattern, the rightHandValue will be assigned as-is to the identifier
        const propertyValue = typescript.isArrayBindingPattern(node.parent) ? rightHandValue : rightHandValue[nameResult];
        // Fall back to using the initializer of the BindingElement if the property value is null-like and if it has one
        const propertyValueWithInitializerFallback = propertyValue != null ? propertyValue : bindingElementInitializer;
        logger.logBinding(node.name.text, propertyValueWithInitializerFallback);
        setInLexicalEnvironment({
            env: environment,
            path: node.name.text,
            value: propertyValueWithInitializerFallback,
            newBinding: true,
            node,
            reporting
        });
    }
    // Otherwise, the name is itself a BindingPattern, and the property it is destructuring will always be defined
    else if (!typescript.isIdentifier(node.name) && !((_c = typescript.isPrivateIdentifier) === null || _c === void 0 ? void 0 : _c.call(typescript, node.name)) && node.propertyName != null) {
        // Compute the property name
        const propertyNameResult = evaluate.nodeWithValue(node.propertyName, environment, statementTraversalStack);
        // Extract the property value from the initializer. If it is an ArrayBindingPattern, the rightHandValue will be assigned as-is to the identifier
        const propertyValue = typescript.isArrayBindingPattern(node.parent) ? rightHandValue : rightHandValue[propertyNameResult];
        // Fall back to using the initializer of the BindingElement if the property value is null-like and if it has one
        const propertyValueWithInitializerFallback = propertyValue != null ? propertyValue : bindingElementInitializer;
        // Evaluate the BindingPattern based on the narrowed property value
        evaluate.nodeWithArgument(node.name, environment, propertyValueWithInitializerFallback, statementTraversalStack);
    }
    // Otherwise, the name itself is a BindingPattern. This will happen for example if an ObjectBindingPattern occurs within an ArrayBindingPattern
    else if (!typescript.isIdentifier(node.name) && !((_d = typescript.isPrivateIdentifier) === null || _d === void 0 ? void 0 : _d.call(typescript, node.name)) && node.propertyName == null) {
        // Fall back to using the initializer of the BindingElement if the property value is null-like and if it has one
        const propertyValueWithInitializerFallback = rightHandValue != null ? rightHandValue : bindingElementInitializer;
        evaluate.nodeWithArgument(node.name, environment, propertyValueWithInitializerFallback, statementTraversalStack);
    }
}

/**
 * Evaluates, or attempts to evaluate, an ObjectBindingPattern, based on an initializer
 */
function evaluateObjectBindingPattern({ node, environment, evaluate, statementTraversalStack }, rightHandValue) {
    for (const element of node.elements) {
        evaluate.nodeWithArgument(element, environment, rightHandValue, statementTraversalStack);
    }
}

/**
 * Evaluates, or attempts to evaluate, a CaseBlock, based on a switch expression
 */
function evaluateCaseBlock({ node, evaluate, environment, reporting, statementTraversalStack }, switchExpression) {
    // Prepare a lexical environment for the case block
    const localEnvironment = cloneLexicalEnvironment(environment);
    // Define a new binding for a break symbol within the environment
    setInLexicalEnvironment({ env: localEnvironment, path: BREAK_SYMBOL, value: false, newBinding: true, reporting, node });
    for (const clause of node.clauses) {
        evaluate.nodeWithArgument(clause, localEnvironment, switchExpression, statementTraversalStack);
        // Check if a 'break', 'continue', or 'return' statement has been encountered, break the block
        if (pathInLexicalEnvironmentEquals(node, localEnvironment, true, BREAK_SYMBOL, CONTINUE_SYMBOL, RETURN_SYMBOL)) {
            break;
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a CaseClause, based on a switch expression
 */
function evaluateCaseClause({ node, evaluate, environment, statementTraversalStack }, switchExpression) {
    const expressionResult = evaluate.expression(node.expression, environment, statementTraversalStack);
    // Stop immediately if the expression doesn't match the switch expression
    if (expressionResult !== switchExpression)
        return;
    for (const statement of node.statements) {
        evaluate.statement(statement, environment);
        // Check if a 'break', 'continue', or 'return' statement has been encountered, break the block
        if (pathInLexicalEnvironmentEquals(node, environment, true, BREAK_SYMBOL, CONTINUE_SYMBOL, RETURN_SYMBOL)) {
            break;
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a DefaultClause, based on a switch expression
 */
function evaluateDefaultClause({ node, evaluate, environment }) {
    for (const statement of node.statements) {
        evaluate.statement(statement, environment);
        // Check if a 'break', 'continue', or 'return' statement has been encountered, break the block
        if (pathInLexicalEnvironmentEquals(node, environment, true, BREAK_SYMBOL, CONTINUE_SYMBOL, RETURN_SYMBOL)) {
            break;
        }
    }
}

/**
 * Evaluates, or attempts to evaluate, a CatchClause, based on a given Error
 */
function evaluateCatchClause({ node, evaluate, environment, statementTraversalStack }, ex) {
    // If a catch binding is provided, we must provide a local lexical environment for the CatchBlock
    const catchEnvironment = node.variableDeclaration == null ? environment : cloneLexicalEnvironment(environment);
    // Evaluate the catch binding, if any is provided
    if (node.variableDeclaration != null) {
        evaluate.nodeWithArgument(node.variableDeclaration, catchEnvironment, ex, statementTraversalStack);
    }
    // Evaluate the block
    evaluate.statement(node.block, catchEnvironment);
}

/**
 * Evaluates, or attempts to evaluate, a OmittedExpression
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function evaluateOmittedExpression(_options) {
    return undefined;
}

/**
 * Evaluates, or attempts to evaluate, a Decorator
 */
function evaluateDecorator({ node, environment, evaluate, stack, statementTraversalStack }, [parent, propertyName, index]) {
    const decoratorImplementation = evaluate.expression(node.expression, environment, statementTraversalStack);
    if (typeof decoratorImplementation !== "function") {
        throw new NotCallableError({
            node,
            value: decoratorImplementation,
            message: `${stringifyLiteral(decoratorImplementation)} is not a valid decorator implementation'`
        });
    }
    stack.push(__decorate([index != null ? __param(index, decoratorImplementation) : decoratorImplementation], parent, propertyName));
}

/**
 * Evaluates, or attempts to evaluate, an EnumMember
 */
function evaluateEnumMember({ node, typeChecker, evaluate, environment, statementTraversalStack }, parent) {
    const constantValue = typeChecker.getConstantValue(node);
    const propertyName = evaluate.nodeWithValue(node.name, environment, statementTraversalStack);
    // If it is a String enum, all keys will be initialized to strings
    if (typeof constantValue === "string") {
        parent[propertyName] = constantValue;
    }
    else {
        parent[(parent[propertyName] = constantValue)] = propertyName;
    }
}

/**
 * Evaluates a given node with the provided argument
 */
function evaluateNodeWithArgument(options, arg) {
    options.logger.logNode(options.node, options.typescript, "nodeWithArgument");
    const { node } = options, rest = __rest(options, ["node"]);
    if (rest.typescript.isGetAccessorDeclaration(node)) {
        return evaluateGetAccessorDeclaration(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isSetAccessorDeclaration(node)) {
        return evaluateSetAccessorDeclaration(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isPropertyAssignment(node)) {
        return evaluatePropertyAssignment(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isPropertyDeclaration(node)) {
        return evaluatePropertyDeclaration(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isParameter(node)) {
        return evaluateParameterDeclaration(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isEnumMember(node)) {
        return evaluateEnumMember(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isShorthandPropertyAssignment(node)) {
        return evaluateShorthandPropertyAssignment(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isDecorator(node)) {
        return evaluateDecorator(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isSpreadAssignment(node)) {
        return evaluateSpreadAssignment(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isMethodDeclaration(node)) {
        return evaluateMethodDeclaration(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isArrayBindingPattern(node)) {
        return evaluateArrayBindingPattern(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isBindingElement(node)) {
        return evaluateBindingElement(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isObjectBindingPattern(node)) {
        return evaluateObjectBindingPattern(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isVariableDeclaration(node)) {
        return evaluateVariableDeclaration(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isCaseBlock(node)) {
        return evaluateCaseBlock(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isCaseClause(node)) {
        return evaluateCaseClause(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isDefaultClause(node)) {
        return evaluateDefaultClause(Object.assign({ node }, rest));
    }
    else if (rest.typescript.isCatchClause(node)) {
        return evaluateCatchClause(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isBindingName(node)) {
        return evaluateBindingName(Object.assign({ node }, rest), arg);
    }
    else if (rest.typescript.isOmittedExpression(node)) {
        return evaluateOmittedExpression(Object.assign({ node }, rest));
    }
    throw new UnexpectedNodeError({ node, typescript: rest.typescript });
}

/**
 * Evaluates, or attempts to evaluate, a PropertyName
 */
function evaluatePropertyName({ environment, node, evaluate, typescript, statementTraversalStack }) {
    var _a;
    return (typescript.isComputedPropertyName(node)
        ? evaluate.expression(node.expression, environment, statementTraversalStack)
        : typescript.isIdentifier(node) || ((_a = typescript.isPrivateIdentifier) === null || _a === void 0 ? void 0 : _a.call(typescript, node))
            ? node.text
            : evaluate.expression(node, environment, statementTraversalStack));
}

/**
 * Evaluates a given node with the provided argument
 */
function evaluateNodeWithValue(options) {
    options.logger.logNode(options.node, options.typescript, "nodeWithValue");
    const { node } = options, rest = __rest(options, ["node"]);
    // Until #37135 is resolved, isPropertyName will return false for PrivateIdentifiers (even though they are actually PropertyNames)
    if (options.typescript.isPropertyName(node) || options.typescript.isPrivateIdentifier(node)) {
        return evaluatePropertyName(Object.assign({ node }, rest));
    }
    throw new UnexpectedNodeError({ node, typescript: options.typescript });
}

/**
 * Reports an error
 */
function reportError(reporting, error, node) {
    // Report the error if a reporter is hooked up
    if (reporting.reportErrors != null && !reporting.reportedErrorSet.has(error)) {
        reporting.reportedErrorSet.add(error);
        reporting.reportErrors({
            error: error,
            node: error instanceof EvaluationError ? error.node : node
        });
    }
}

/**
 * Creates a Node Evaluator
 */
function createNodeEvaluator({ typeChecker, typescript, policy, logger, stack, reporting, nextNode }) {
    let ops = 0;
    const handleNewNode = (node, statementTraversalStack) => {
        nextNode(node);
        // Increment the amount of encountered ops
        ops++;
        // Throw an error if the maximum amount of operations has been exceeded
        if (ops >= policy.maxOps) {
            throw new MaxOpsExceededError({ ops, node });
        }
        // Update the statementTraversalStack with the node's kind
        statementTraversalStack.push(node.kind);
        if (reporting.reportTraversal != null) {
            reporting.reportTraversal({ node });
        }
    };
    /**
     * Wraps an evaluation action with error reporting
     */
    const wrapWithErrorReporting = (environment, node, action) => {
        // If we're already inside of a try-block, simply execute the action and do nothing else
        if (pathInLexicalEnvironmentEquals(node, environment, true, TRY_SYMBOL)) {
            return action();
        }
        try {
            return action();
        }
        catch (ex) {
            // Report the Error
            reportError(reporting, ex, node);
            // Re-throw the error
            throw ex;
        }
    };
    const nodeEvaluator = {
        expression: (node, environment, statementTraversalStack) => wrapWithErrorReporting(environment, node, () => {
            handleNewNode(node, statementTraversalStack);
            return evaluateExpression(getEvaluatorOptions(node, environment, statementTraversalStack));
        }),
        statement: (node, environment) => wrapWithErrorReporting(environment, node, () => {
            const statementTraversalStack = createStatementTraversalStack();
            handleNewNode(node, statementTraversalStack);
            return evaluateStatement(getEvaluatorOptions(node, environment, statementTraversalStack));
        }),
        declaration: (node, environment, statementTraversalStack) => wrapWithErrorReporting(environment, node, () => {
            handleNewNode(node, statementTraversalStack);
            return evaluateDeclaration(getEvaluatorOptions(node, environment, statementTraversalStack));
        }),
        nodeWithArgument: (node, environment, arg, statementTraversalStack) => wrapWithErrorReporting(environment, node, () => {
            handleNewNode(node, statementTraversalStack);
            return evaluateNodeWithArgument(getEvaluatorOptions(node, environment, statementTraversalStack), arg);
        }),
        nodeWithValue: (node, environment, statementTraversalStack) => wrapWithErrorReporting(environment, node, () => {
            handleNewNode(node, statementTraversalStack);
            return evaluateNodeWithValue(getEvaluatorOptions(node, environment, statementTraversalStack));
        })
    };
    /**
     * Gets an IEvaluatorOptions object ready for passing to one of the evaluation functions
     */
    function getEvaluatorOptions(node, environment, statementTraversalStack) {
        return {
            typeChecker,
            typescript,
            policy,
            reporting,
            node,
            evaluate: nodeEvaluator,
            environment,
            stack,
            logger,
            statementTraversalStack
        };
    }
    return nodeEvaluator;
}

/**
 * Stringifies the given SyntaxKind
 */
function stringifySyntaxKind(kind, typescript) {
    if (kind === typescript.SyntaxKind.NumericLiteral)
        return "NumericLiteral";
    return typescript.SyntaxKind[kind];
}

/**
 * A simple logger for printing evaluation-related info
 */
class Logger {
    constructor(logLevel) {
        this.logLevel = logLevel;
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Logs info output if the log level allows it
     */
    logInfo(message) {
        if (this.logLevel < 10 /* INFO */)
            return;
        console.log(message);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Logs verbose output if the log level allows it
     */
    logVerbose(message) {
        if (this.logLevel < 20 /* VERBOSE */)
            return;
        console.log(message);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Logs debug output if the log level allows it
     */
    logDebug(message) {
        if (this.logLevel < 30 /* DEBUG */)
            return;
        console.log(message);
    }
    /**
     * Logs that a 'continue' keyword appeared within a statement
     */
    logContinue(node, typescript) {
        if (this.logLevel < 30 /* DEBUG */)
            return;
        console.log(`${chalk.yellow(`continue`)} encountered within ${chalk.yellow(stringifySyntaxKind(node.kind, typescript))}`);
    }
    /**
     * Logs that a 'break' keyword appeared within a statement
     */
    logBreak(node, typescript) {
        if (this.logLevel < 30 /* DEBUG */)
            return;
        console.log(`${chalk.yellow(`break`)} encountered within ${chalk.yellow(stringifySyntaxKind(node.kind, typescript))}`);
    }
    /**
     * Logs that a 'return' keyword appeared within a statement
     */
    logReturn(node, typescript) {
        if (this.logLevel < 30 /* DEBUG */)
            return;
        console.log(`${chalk.yellow(`return`)} encountered within ${chalk.yellow(stringifySyntaxKind(node.kind, typescript))}`);
    }
    /**
     * Logs the given result
     */
    logResult(result, intermediateContext) {
        if (this.logLevel < 10 /* INFO */)
            return;
        if (intermediateContext != null) {
            console.log(chalk.gray(`(intermediate value from context '${intermediateContext}'): `), chalk.green(`[RESULT]:`), this.compactValue(result));
        }
        else
            console.log(chalk.green(`[RESULT]:`), result);
    }
    /**
     * Logs the given evaluation
     */
    logNode(node, typescript, context) {
        if (this.logLevel < 30 /* DEBUG */)
            return;
        let headRaw = `[${stringifySyntaxKind(node.kind, typescript)}]`.padEnd(25);
        if (context != null)
            headRaw += chalk.cyan(`(${context})`);
        const tailRaw = node.getText();
        const head = chalk.yellow(headRaw);
        const tail = chalk.gray(tailRaw);
        console.log(head);
        console.log(tail);
    }
    /**
     * Logs the given binding
     */
    logBinding(lValue, rValue, scope) {
        if (this.logLevel < 20 /* VERBOSE */)
            return;
        console.log(`${scope == null ? "" : chalk.green(`(${scope}): `)}${chalk.red(lValue)} ->`, this.compactValue(rValue));
    }
    /**
     * Logs the heritage of a ClassDeclaration
     */
    logHeritage(classDeclaration) {
        if (this.logLevel < 30 /* DEBUG */)
            return;
        const parent = Object.getPrototypeOf(classDeclaration);
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (parent.toString().includes("[Class")) {
            console.log(`${chalk.cyan(classDeclaration.toString())} ${chalk.yellow("extends")} ${chalk.cyan(parent.toString())}`);
        }
    }
    /**
     * Logs the newest value has been pushed onto the Stack
     */
    logStack(stack) {
        if (this.logLevel < 30 /* DEBUG */)
            return;
        console.log(`Stack value: ${chalk.blue(stringifyLiteral(this.compactValue(stack.lastItem)))}`);
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * Logs the entire Traversal Stack
     */
    logStatementTraversalStack(stack, typescript) {
        if (this.logLevel < 30 /* DEBUG */)
            return;
        console.log(`[${stack.map(kind => chalk.blue(stringifySyntaxKind(kind, typescript))).join(", ")}]`);
    }
    /**
     * Makes a value compact so it is easier on the eyes when printing it
     */
    compactValue(value) {
        return inspect(value, { depth: 0, colors: true, compact: true, maxArrayLength: 5 });
    }
}

/**
 * Returns true if the given Node is an Expression.
 * Uses an internal non-exposed Typescript helper to decide whether or not the Node is an Expression
 */
function isExpression(node, typescript) {
    var _a;
    return typescript.isExpressionNode(node) || typescript.isIdentifier(node) || ((_a = typescript.isPrivateIdentifier) === null || _a === void 0 ? void 0 : _a.call(typescript, node));
}

/**
 * Returns true if the given Node is a Statement
 * Uses an internal non-exposed Typescript helper to decide whether or not the Node is an Expression
 */
function isStatement(node, typescript) {
    return typescript.isStatementButNotDeclaration(node);
}

/**
 * Creates a Stack
 *
 * @return
 */
function createStack() {
    const stack = [];
    return {
        /**
         * Gets an iterator for the Stack
         *
         * @return
         */
        [Symbol.iterator]() {
            return stack[Symbol.iterator]();
        },
        /**
         * Gets the length of the Stack
         *
         * @return
         */
        get length() {
            return stack.length;
        },
        /**
         * Gets the last item of the Stack
         *
         * @return
         */
        get lastItem() {
            return stack[stack.length - 1];
        },
        /**
         * Pushes the given StackEntries on to the Stack
         *
         * @param values
         * @return
         */
        push(...values) {
            return stack.push(...values);
        },
        /**
         * Pops the last item from the stack
         *
         * @return
         */
        pop() {
            return stack.pop();
        }
    };
}

/**
 * Returns true if the given Node is a Declaration
 * Uses an internal non-exposed Typescript helper to decide whether or not the Node is an Expression
 */
function isDeclaration(node, typescript) {
    return typescript.isDeclaration(node);
}

/**
 * Creates and returns a Set of Errors that has been seen and has been reported
 */
function createReportedErrorSet() {
    return new WeakSet();
}

/**
 * Will get a literal value for the given Expression, ExpressionStatement, or Declaration.
 */
function evaluate({ typeChecker, node, environment: { preset = EnvironmentPresetKind.NODE, extra = {} } = {}, typescript = TSModule, logLevel = 0 /* SILENT */, policy: { deterministic = false, network = false, console = false, maxOps = Infinity, maxOpDuration = Infinity, io = {
    read: true,
    write: false
}, process = {
    exit: false,
    spawnChild: false
} } = {}, reporting: reportingInput = {} }) {
    // Take the simple path first. This may be far more performant than building up an environment
    const simpleLiteralResult = evaluateSimpleLiteral(node, typescript);
    if (simpleLiteralResult.success)
        return simpleLiteralResult;
    // Otherwise, build an environment and get to work
    // Sanitize the evaluation policy based on the input options
    const policy = {
        deterministic,
        maxOps,
        maxOpDuration,
        network,
        console,
        io: {
            read: typeof io === "boolean" ? io : io.read,
            write: typeof io === "boolean" ? io : io.write
        },
        process: {
            exit: typeof process === "boolean" ? process : process.exit,
            spawnChild: typeof process === "boolean" ? process : process.spawnChild
        }
    };
    // Sanitize the Reporting options based on the input options
    const reporting = Object.assign(Object.assign({}, reportingInput), { reportedErrorSet: createReportedErrorSet() });
    // Prepare a reference to the Node that is currently being evaluated
    let currentNode = node;
    // Prepare a logger
    const logger = new Logger(logLevel);
    // Prepare the initial environment
    const initialEnvironment = createLexicalEnvironment({
        inputEnvironment: {
            preset,
            extra
        },
        policy,
        getCurrentNode: () => currentNode
    });
    // Prepare a Stack
    const stack = createStack();
    // Prepare a NodeEvaluator
    const nodeEvaluator = createNodeEvaluator({
        policy,
        typeChecker,
        typescript,
        logger,
        stack,
        reporting: reporting,
        nextNode: nextNode => (currentNode = nextNode)
    });
    try {
        let value;
        if (isExpression(node, typescript)) {
            value = nodeEvaluator.expression(node, initialEnvironment, createStatementTraversalStack());
        }
        else if (isStatement(node, typescript)) {
            nodeEvaluator.statement(node, initialEnvironment);
            value = stack.pop();
        }
        else if (isDeclaration(node, typescript)) {
            nodeEvaluator.declaration(node, initialEnvironment, createStatementTraversalStack());
            value = stack.pop();
        }
        // Otherwise, throw an UnexpectedNodeError
        else {
            // noinspection ExceptionCaughtLocallyJS
            throw new UnexpectedNodeError({ node, typescript });
        }
        // Log the value before returning
        logger.logResult(value);
        return {
            success: true,
            value
        };
    }
    catch (reason) {
        // Report the Error
        reportError(reporting, reason, node);
        return {
            success: false,
            reason
        };
    }
}

export { EnvironmentPresetKind, EvaluationError, IoError, MaxOpDurationExceededError, MaxOpsExceededError, MissingCatchOrFinallyAfterTryError, ModuleNotFoundError, NetworkError, NonDeterministicError, NotCallableError, PolicyError, ProcessError, UndefinedIdentifierError, UndefinedLeftValueError, UnexpectedNodeError, evaluate };
//# sourceMappingURL=index.js.map
