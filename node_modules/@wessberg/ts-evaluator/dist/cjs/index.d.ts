import * as TS from "typescript";
declare const enum LogLevelKind {
    SILENT = 0,
    INFO = 10,
    VERBOSE = 20,
    DEBUG = 30
}
interface IEvaluateIOPolicy {
    read: boolean;
    write: boolean;
}
interface IEvaluateProcessPolicy {
    exit: boolean;
    spawnChild: boolean;
}
interface IEvaluatePolicy {
    io: boolean | IEvaluateIOPolicy;
    process: boolean | IEvaluateProcessPolicy;
    network: boolean;
    console: boolean;
    deterministic: boolean;
    maxOps: number;
    maxOpDuration: number;
}
interface IEvaluatePolicySanitized {
    io: IEvaluateIOPolicy;
    process: IEvaluateProcessPolicy;
    network: boolean;
    console: boolean;
    deterministic: boolean;
    maxOps: number;
    maxOpDuration: number;
}
declare enum EnvironmentPresetKind {
    NONE = "NONE",
    ECMA = "ECMA",
    BROWSER = "BROWSER",
    NODE = "NODE"
}
// eslint-disable-next-line @typescript-eslint/ban-types
type Literal = object | Function | string | number | boolean | symbol | bigint | null | undefined;
interface IndexLiteral {
    [key: string]: Literal;
}
interface IBindingReportEntry {
    path: string;
    value: unknown;
    node: TS.Node;
}
interface ITraversalReportEntry {
    node: TS.Node;
}
interface IIntermediateResultReportEntry {
    node: TS.Expression | TS.PrivateIdentifier;
    value: unknown;
}
interface IErrorReportEntry {
    node: TS.Node;
    error: Error;
}
type BindingReportCallback = (entry: IBindingReportEntry) => void | Promise<void>;
type ErrorReportCallback = (entry: IErrorReportEntry) => void | Promise<void>;
type IntermediateResultReportCallback = (entry: IIntermediateResultReportEntry) => void | Promise<void>;
type TraversalReportCallback = (entry: ITraversalReportEntry) => void | Promise<void>;
interface IReportingOptions {
    reportBindings: BindingReportCallback;
    reportTraversal: TraversalReportCallback;
    reportIntermediateResults: IntermediateResultReportCallback;
    reportErrors: ErrorReportCallback;
}
type ReportingOptions = Partial<IReportingOptions>;
interface LexicalEnvironment {
    parentEnv: LexicalEnvironment | undefined;
    env: IndexLiteral;
    preset?: EnvironmentPresetKind;
}
interface IEnvironment {
    preset: EnvironmentPresetKind;
    extra: LexicalEnvironment["env"];
}
interface IEvaluateOptions {
    node: TS.Statement | TS.Declaration | TS.Expression;
    typeChecker: TS.TypeChecker;
    typescript?: typeof TS;
    environment?: Partial<IEnvironment>;
    logLevel?: LogLevelKind;
    policy?: Partial<IEvaluatePolicy>;
    reporting?: ReportingOptions;
}
interface IEvaluationErrorOptions {
    node: TS.Node;
    message?: string;
}
/**
 * A Base class for EvaluationErrors
 */
declare class EvaluationError extends Error {
    /**
     * The node that caused or thew the error
     */
    readonly node: TS.Node;
    constructor({ node, message }: IEvaluationErrorOptions);
}
interface IEvaluateResultBase {
    success: boolean;
}
interface IEvaluateSuccessResult extends IEvaluateResultBase {
    success: true;
    value: unknown;
}
interface IEvaluateFailureResult extends IEvaluateResultBase {
    success: false;
    reason: EvaluationError;
}
type EvaluateResult = IEvaluateSuccessResult | IEvaluateFailureResult;
/**
 * Will get a literal value for the given Expression, ExpressionStatement, or Declaration.
 */
declare function evaluate({ typeChecker, node, environment: { preset, extra }, typescript, logLevel, policy: { deterministic, network, console, maxOps, maxOpDuration, io, process }, reporting: reportingInput }: IEvaluateOptions): EvaluateResult;
interface IMissingCatchOrFinallyAfterTryErrorOptions extends IEvaluationErrorOptions {
    node: TS.TryStatement;
}
/**
 * An Error that can be thrown when a TryStatement is encountered without neither a catch {...} nor a finally {...} block
 */
declare class MissingCatchOrFinallyAfterTryError extends EvaluationError {
    /**
     * The TryStatement that lacks a catch/finally block
     */
    readonly node: TS.TryStatement;
    constructor({ node, message }: IMissingCatchOrFinallyAfterTryErrorOptions);
}
interface IModuleNotFoundErrorOptions extends IEvaluationErrorOptions {
    path: string;
}
/**
 * An Error that can be thrown when a moduleSpecifier couldn't be resolved
 */
declare class ModuleNotFoundError extends EvaluationError {
    /**
     * The path/moduleName that could not be resolved
     */
    readonly path: string;
    constructor({ path, node, message }: IModuleNotFoundErrorOptions);
}
interface INotCallableErrorOptions extends IEvaluationErrorOptions {
    value: Literal;
}
/**
 * An Error that can be thrown when a value is attempted to be called, but isn't callable
 */
declare class NotCallableError extends EvaluationError {
    /**
     * The non-callable value
     */
    readonly value: Literal;
    constructor({ value, node, message }: INotCallableErrorOptions);
}
interface IPolicyErrorOptions extends IEvaluationErrorOptions {
    violation: keyof IEvaluatePolicySanitized;
}
/**
 * An Error that can be thrown when a policy is violated
 */
declare class PolicyError extends EvaluationError {
    /**
     * The kind of policy violation encountered
     */
    readonly violation: keyof IEvaluatePolicySanitized;
    constructor({ violation, node, message }: IPolicyErrorOptions);
}
interface IUndefinedIdentifierErrorOptions extends IEvaluationErrorOptions {
    node: TS.Identifier | TS.PrivateIdentifier;
}
/**
 * An Error that can be thrown when an undefined identifier is encountered
 */
declare class UndefinedIdentifierError extends EvaluationError {
    /**
     * The identifier that is undefined in the context that created this error
     */
    readonly node: TS.Identifier | TS.PrivateIdentifier;
    constructor({ node, message }: IUndefinedIdentifierErrorOptions);
}
interface IUndefinedLeftValueErrorOptions extends IEvaluationErrorOptions {
}
/**
 * An Error that can be thrown when an undefined leftValue is encountered
 */
declare class UndefinedLeftValueError extends EvaluationError {
    constructor({ node, message }: IUndefinedLeftValueErrorOptions);
}
interface IUnexpectedNodeErrorOptions extends IEvaluationErrorOptions {
    typescript: typeof TS;
}
/**
 * An Error that can be thrown when an unexpected node is encountered
 */
declare class UnexpectedNodeError extends EvaluationError {
    constructor({ node, typescript, message }: IUnexpectedNodeErrorOptions);
}
interface IIoErrorOptions extends IEvaluationErrorOptions {
    kind: keyof IEvaluateIOPolicy;
}
/**
 * An Error that can be thrown when an IO operation is attempted to be executed that is in violation of the context policy
 */
declare class IoError extends PolicyError {
    /**
     * The kind of IO operation that was violated
     */
    readonly kind: keyof IEvaluateIOPolicy;
    constructor({ node, kind, message }: IIoErrorOptions);
}
interface IMaxOpsExceededErrorOptions extends IEvaluationErrorOptions {
    ops: number;
}
/**
 * An Error that can be thrown when the maximum amount of operations dictated by the policy is exceeded
 */
declare class MaxOpsExceededError extends PolicyError {
    /**
     * The amount of operations performed before creating this error instance
     */
    readonly ops: number;
    constructor({ ops, node, message }: IMaxOpsExceededErrorOptions);
}
interface IMaxOpDurationExceededErrorOptions extends IEvaluationErrorOptions {
    duration: number;
}
/**
 * An Error that can be thrown when the maximum amount of operations dictated by the policy is exceeded
 */
declare class MaxOpDurationExceededError extends PolicyError {
    /**
     * The total duration of an operation that was being performed before exceeding the limit
     */
    readonly duration: number;
    constructor({ duration, node, message }: IMaxOpDurationExceededErrorOptions);
}
interface INetworkErrorOptions extends IEvaluationErrorOptions {
    operation: string;
}
/**
 * An Error that can be thrown when a network operation is attempted to be executed that is in violation of the context policy
 */
declare class NetworkError extends PolicyError {
    /**
     * The kind of operation that was attempted to be performed but was in violation of the policy
     */
    readonly operation: string;
    constructor({ operation, node, message }: INetworkErrorOptions);
}
interface INonDeterministicErrorOptions extends IEvaluationErrorOptions {
    operation: string;
}
/**
 * An Error that can be thrown when something nondeterministic is attempted to be evaluated and has been disallowed to be so
 */
declare class NonDeterministicError extends PolicyError {
    /**
     * The kind of operation that was attempted to be performed but was in violation of the policy
     */
    readonly operation: string;
    constructor({ operation, node, message }: INonDeterministicErrorOptions);
}
interface IProcessErrorOptions extends IEvaluationErrorOptions {
    kind: keyof IEvaluateProcessPolicy;
}
/**
 * An Error that can be thrown when a Process operation is attempted to be executed that is in violation of the context policy
 */
declare class ProcessError extends PolicyError {
    /**
     * The kind of process operation that was violated
     */
    readonly kind: keyof IEvaluateProcessPolicy;
    constructor({ kind, node, message }: IProcessErrorOptions);
}
export { evaluate, EvaluateResult, IEvaluateOptions, LogLevelKind, EnvironmentPresetKind, IEnvironment, EvaluationError, MissingCatchOrFinallyAfterTryError, ModuleNotFoundError, NotCallableError, PolicyError, UndefinedIdentifierError, UndefinedLeftValueError, UnexpectedNodeError, IoError, MaxOpsExceededError, MaxOpDurationExceededError, NetworkError, NonDeterministicError, ProcessError, BindingReportCallback, IReportingOptions, ReportingOptions };
