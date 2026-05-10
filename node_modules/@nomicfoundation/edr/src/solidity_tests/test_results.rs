use std::{
    borrow::Cow,
    fmt::{Debug, Formatter},
    sync::Arc,
};

use edr_solidity_tests::{
    constants::CHEATCODE_ADDRESS,
    executors::stack_trace::SolidityTestStackTraceResult,
    traces::{self, CallTraceArena, SparsedTraceArena},
};
use napi::{
    bindgen_prelude::{BigInt, Either3, Either4, Uint8Array},
    Either,
};
use napi_derive::napi;

use crate::{
    gas_report::GasReport,
    solidity_tests::{artifact::ArtifactId, config::IncludeTraces},
    trace::{
        solidity_stack_trace::{
            solidity_stack_trace_error_to_napi, solidity_stack_trace_heuristic_failed_to_napi,
            solidity_stack_trace_success_to_napi, SolidityStackTraceEntry,
        },
        u256_to_bigint,
    },
};

/// A grouping of value snapshot entries for a test.
#[napi(object)]
#[derive(Clone, Debug)]
pub struct ValueSnapshotGroup {
    /// The group name.
    pub name: String,
    /// The entries in the group.
    pub entries: Vec<ValueSnapshotEntry>,
}

/// An entry in a value snapshot group.
#[napi(object)]
#[derive(Clone, Debug)]
pub struct ValueSnapshotEntry {
    /// The name of the entry.
    pub name: String,
    /// The value of the entry.
    pub value: String,
}

/// See [`edr_solidity_tests::result::SuiteResult`]
#[napi]
#[derive(Clone, Debug)]
pub struct SuiteResult {
    /// The artifact id can be used to match input to result in the progress
    /// callback
    #[napi(readonly)]
    pub id: ArtifactId,
    /// See [`edr_solidity_tests::result::SuiteResult::duration`]
    #[napi(readonly)]
    pub duration_ns: BigInt,
    /// See [`edr_solidity_tests::result::SuiteResult::test_results`]
    #[napi(readonly)]
    pub test_results: Vec<TestResult>,
    /// See [`edr_solidity_tests::result::SuiteResult::warnings`]
    #[napi(readonly)]
    pub warnings: Vec<String>,
}

impl SuiteResult {
    pub fn new(
        id: edr_artifact::ArtifactId,
        suite_result: edr_solidity_tests::result::SuiteResult<String>,
        include_traces: IncludeTraces,
    ) -> Self {
        Self {
            id: id.into(),
            duration_ns: BigInt::from(suite_result.duration.as_nanos()),
            test_results: suite_result
                .test_results
                .into_iter()
                .map(|(name, test_result)| {
                    TestResult::new(
                        name,
                        test_result,
                        &suite_result.setup_traces,
                        include_traces,
                    )
                })
                .collect(),
            warnings: suite_result.warnings,
        }
    }
}

/// See [`edr_solidity_tests::result::TestResult`]
#[napi]
#[derive(Clone, Debug)]
pub struct TestResult {
    /// The name of the test.
    #[napi(readonly)]
    pub name: String,
    /// See [`edr_solidity_tests::result::TestResult::status`]
    #[napi(readonly)]
    pub status: TestStatus,
    /// See [`edr_solidity_tests::result::TestResult::reason`]
    #[napi(readonly)]
    pub reason: Option<String>,
    /// See [`edr_solidity_tests::result::TestResult::counterexample`]
    #[napi(readonly)]
    pub counterexample: Option<Either<BaseCounterExample, CounterExampleSequence>>,
    /// See [`edr_solidity_tests::result::TestResult::decoded_logs`]
    #[napi(readonly)]
    pub decoded_logs: Vec<String>,
    /// See [`edr_solidity_tests::result::TestResult::kind`]
    #[napi(readonly)]
    pub kind: Either3<StandardTestKind, FuzzTestKind, InvariantTestKind>,
    /// See [`edr_solidity_tests::result::TestResult::duration`]
    #[napi(readonly)]
    pub duration_ns: BigInt,
    /// Groups of value snapshot entries (incl. gas).
    ///
    /// Only present if the test runner collected scoped snapshots. Currently,
    /// this is always the case.
    #[napi(readonly)]
    pub value_snapshot_groups: Option<Vec<ValueSnapshotGroup>>,

    stack_trace_result: Option<Arc<SolidityTestStackTraceResult<String>>>,
    call_trace_arenas: Vec<SparsedTraceArena>,
}

/// The stack trace result
#[napi(object)]
pub struct StackTrace {
    /// Enum tag for JS.
    #[napi(ts_type = "\"StackTrace\"")]
    pub kind: &'static str,
    /// The stack trace entries
    pub entries: Vec<SolidityStackTraceEntry>,
}

/// We couldn't generate stack traces, because an unexpected error occurred.
#[napi(object)]
pub struct UnexpectedError {
    /// Enum tag for JS.
    #[napi(ts_type = "\"UnexpectedError\"")]
    pub kind: &'static str,
    /// The error message from the unexpected error.
    pub error_message: String,
}

/// We couldn't generate stack traces, because the stack trace generation
/// heuristics failed due to an unknown reason.
#[napi(object)]
pub struct HeuristicFailed {
    /// Enum tag for JS.
    #[napi(ts_type = "\"HeuristicFailed\"")]
    pub kind: &'static str,
}

/// We couldn't generate stack traces, because the test execution is unsafe to
/// replay due to indeterminism. This can be caused by either specifying a fork
/// url without a fork block number in the test runner config or using impure
/// cheatcodes.
#[napi(object)]
pub struct UnsafeToReplay {
    /// Enum tag for JS.
    #[napi(ts_type = "\"UnsafeToReplay\"")]
    pub kind: &'static str,
    /// Indeterminism due to specifying a fork url without a fork block number
    /// in the test runner config.
    pub global_fork_latest: bool,
    /// The list of executed impure cheatcode signatures. We collect function
    /// signatures instead of function names as whether a cheatcode is impure
    /// can depend on the arguments it takes (e.g. `createFork` without a second
    /// argument means implicitly fork from “latest”). Example signature:
    /// `function createSelectFork(string calldata urlOrAlias) external returns
    /// (uint256 forkId);`.
    pub impure_cheatcodes: Vec<String>,
}

#[napi]
impl TestResult {
    /// Compute the error stack trace.
    /// The result is either the stack trace or the reason why we couldn't
    /// generate the stack trace.
    /// Returns null if the test status is succeeded or skipped.
    /// Cannot throw.
    #[napi]
    pub fn stack_trace(
        &self,
    ) -> Option<Either4<StackTrace, UnexpectedError, HeuristicFailed, UnsafeToReplay>> {
        self.stack_trace_result.as_ref().map(|stack_trace_result| {
            match stack_trace_result.as_ref() {
                SolidityTestStackTraceResult::Success(stack_trace) => {
                    Either4::A(solidity_stack_trace_success_to_napi(stack_trace))
                }
                SolidityTestStackTraceResult::Error(error) => {
                    Either4::B(solidity_stack_trace_error_to_napi(error))
                }
                SolidityTestStackTraceResult::HeuristicFailed => {
                    Either4::C(solidity_stack_trace_heuristic_failed_to_napi())
                }
                SolidityTestStackTraceResult::UnsafeToReplay {
                    global_fork_latest,
                    impure_cheatcodes,
                } => Either4::D(UnsafeToReplay {
                    kind: "UnsafeToReplay",
                    global_fork_latest: *global_fork_latest,
                    // napi-rs would clone `&'static str` under the hood anyway, so no performance
                    // hit from `Cow::into_owned`.
                    impure_cheatcodes: impure_cheatcodes
                        .iter()
                        .cloned()
                        .map(Cow::into_owned)
                        .collect(),
                }),
            }
        })
    }

    /// Constructs the execution traces for the test. Returns an empty array if
    /// traces for this test were not requested according to
    /// [`crate::solidity_tests::config::SolidityTestRunnerConfigArgs::include_traces`]. Otherwise, returns
    /// an array of the root calls of the trace, which always includes the test
    /// call itself and may also include the setup call if there is one
    /// (identified by the function name `setUp`).
    #[napi]
    pub fn call_traces(&self) -> Vec<CallTrace> {
        self.call_trace_arenas
            .iter()
            .map(|arena| CallTrace::from_arena_node(&arena.resolve_arena(), 0))
            .collect()
    }
}

impl TestResult {
    fn new(
        name: String,
        test_result: edr_solidity_tests::result::TestResult<String>,
        setup_traces: &edr_solidity_tests::traces::SetupTraces,
        include_traces: IncludeTraces,
    ) -> Self {
        let include_trace = include_traces == IncludeTraces::All
            || (include_traces == IncludeTraces::Failing && test_result.status.is_failure());

        Self {
            name,
            status: test_result.status.into(),
            reason: test_result.reason,
            counterexample: test_result
                .counterexample
                .map(|counterexample| match counterexample {
                    edr_solidity_tests::fuzz::CounterExample::Single(counterexample) => {
                        Either::A(BaseCounterExample::from(counterexample))
                    }
                    edr_solidity_tests::fuzz::CounterExample::Sequence(
                        original_size,
                        counterexamples,
                    ) => Either::B(CounterExampleSequence {
                        original_sequence_size: u64::try_from(original_size)
                            .expect("usize fits into u64")
                            .into(),
                        sequence: counterexamples
                            .into_iter()
                            .map(BaseCounterExample::from)
                            .collect(),
                    }),
                }),
            decoded_logs: test_result.decoded_logs,
            kind: match test_result.kind {
                edr_solidity_tests::result::TestKind::Unit { gas: gas_consumed } => {
                    Either3::A(StandardTestKind {
                        consumed_gas: BigInt::from(gas_consumed),
                    })
                }
                edr_solidity_tests::result::TestKind::Fuzz {
                    runs,
                    mean_gas,
                    median_gas,
                } => Either3::B(FuzzTestKind {
                    // usize as u64 is always safe
                    runs: BigInt::from(runs as u64),
                    mean_gas: BigInt::from(mean_gas),
                    median_gas: BigInt::from(median_gas),
                }),
                edr_solidity_tests::result::TestKind::Invariant {
                    runs,
                    calls,
                    reverts,
                    metrics,
                    failed_corpus_replays,
                } => Either3::C(InvariantTestKind {
                    // usize as u64 is always safe
                    runs: BigInt::from(runs as u64),
                    calls: BigInt::from(calls as u64),
                    reverts: BigInt::from(reverts as u64),
                    metrics: metrics
                        .into_iter()
                        .map(|(name, metric)| {
                            (
                                name,
                                InvariantMetrics {
                                    calls: BigInt::from(metric.calls as u64),
                                    reverts: BigInt::from(metric.reverts as u64),
                                    discards: BigInt::from(metric.discards as u64),
                                },
                            )
                        })
                        .collect(),
                    failed_corpus_replays: BigInt::from(failed_corpus_replays as u64),
                }),
            },
            duration_ns: BigInt::from(test_result.duration.as_nanos()),
            value_snapshot_groups: Some(
                test_result
                    .value_snapshots
                    .into_iter()
                    .map(|(group_name, entries)| ValueSnapshotGroup {
                        name: group_name,
                        entries: entries
                            .into_iter()
                            .map(|(name, value)| ValueSnapshotEntry { name, value })
                            .collect(),
                    })
                    .collect(),
            ),
            stack_trace_result: test_result.stack_trace_result.map(Arc::new),
            call_trace_arenas: if include_trace {
                setup_traces
                    .iter()
                    .filter(|(k, _)| *k != traces::SetupTraceKind::Deployment)
                    .map(|(_, arena)| arena.clone())
                    .chain(test_result.execution_traces)
                    .collect()
            } else {
                Vec::new()
            },
        }
    }
}

#[derive(Debug)]
#[napi(string_enum)]
#[doc = "The result of a test execution."]
pub enum TestStatus {
    #[doc = "Test success"]
    Success,
    #[doc = "Test failure"]
    Failure,
    #[doc = "Test skipped"]
    Skipped,
}

impl From<edr_solidity_tests::result::TestStatus> for TestStatus {
    fn from(value: edr_solidity_tests::result::TestStatus) -> Self {
        match value {
            edr_solidity_tests::result::TestStatus::Success => Self::Success,
            edr_solidity_tests::result::TestStatus::Failure => Self::Failure,
            edr_solidity_tests::result::TestStatus::Skipped => Self::Skipped,
        }
    }
}

/// See [`edr_solidity_tests::result::TestKind::Unit`]
#[napi(object)]
#[derive(Debug, Clone)]
pub struct StandardTestKind {
    /// The gas consumed by the test.
    #[napi(readonly)]
    pub consumed_gas: BigInt,
}

/// See [`edr_solidity_tests::result::TestKind::Fuzz`]
#[napi(object)]
#[derive(Debug, Clone)]
pub struct FuzzTestKind {
    /// See [`edr_solidity_tests::result::TestKind::Fuzz`]
    #[napi(readonly)]
    pub runs: BigInt,
    /// See [`edr_solidity_tests::result::TestKind::Fuzz`]
    #[napi(readonly)]
    pub mean_gas: BigInt,
    /// See [`edr_solidity_tests::result::TestKind::Fuzz`]
    #[napi(readonly)]
    pub median_gas: BigInt,
}

/// See [`edr_solidity_tests::fuzz::FuzzCase`]
#[napi(object)]
#[derive(Clone)]
pub struct FuzzCase {
    /// The calldata used for this fuzz test
    #[napi(readonly)]
    pub calldata: Uint8Array,
    /// Consumed gas
    #[napi(readonly)]
    pub gas: BigInt,
    /// The initial gas stipend for the transaction
    #[napi(readonly)]
    pub stipend: BigInt,
}

impl Debug for FuzzCase {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("FuzzCase")
            .field("gas", &self.gas)
            .field("stipend", &self.stipend)
            .finish()
    }
}

/// See [`edr_solidity_tests::result::TestKind::Invariant`]
#[napi(object)]
#[derive(Debug, Clone)]
pub struct InvariantTestKind {
    /// See [`edr_solidity_tests::result::TestKind::Invariant`]
    #[napi(readonly)]
    pub runs: BigInt,
    /// See [`edr_solidity_tests::result::TestKind::Invariant`]
    #[napi(readonly)]
    pub calls: BigInt,
    /// See [`edr_solidity_tests::result::TestKind::Invariant`]
    #[napi(readonly)]
    pub reverts: BigInt,
    /// See [`edr_solidity_tests::result::TestKind::Invariant`]
    #[napi(readonly)]
    pub metrics: std::collections::HashMap<String, InvariantMetrics>,
    /// See [`edr_solidity_tests::result::TestKind::Invariant`]
    #[napi(readonly)]
    pub failed_corpus_replays: BigInt,
}

/// See [`edr_solidity_tests::result::InvariantMetrics`]
#[napi(object)]
#[derive(Debug, Clone)]
pub struct InvariantMetrics {
    // Count of fuzzed selector calls.
    #[napi(readonly)]
    pub calls: BigInt,
    // Count of fuzzed selector reverts.
    #[napi(readonly)]
    pub reverts: BigInt,
    // Count of fuzzed selector discards (through assume cheatcodes).
    #[napi(readonly)]
    pub discards: BigInt,
}

/// Original sequence size and sequence of calls used as a counter example
/// for invariant tests.
#[napi(object)]
#[derive(Clone, Debug)]
pub struct CounterExampleSequence {
    /// The original sequence size before shrinking.
    pub original_sequence_size: BigInt,
    /// The shrunk counterexample sequence.
    pub sequence: Vec<BaseCounterExample>,
}

/// See [`edr_solidity_tests::fuzz::BaseCounterExample`]
#[napi(object)]
#[derive(Clone)]
pub struct BaseCounterExample {
    /// See [`edr_solidity_tests::fuzz::BaseCounterExample::sender`]
    #[napi(readonly)]
    pub sender: Option<Uint8Array>,
    /// See [`edr_solidity_tests::fuzz::BaseCounterExample::addr`]
    #[napi(readonly)]
    pub address: Option<Uint8Array>,
    /// See [`edr_solidity_tests::fuzz::BaseCounterExample::calldata`]
    #[napi(readonly)]
    pub calldata: Uint8Array,
    /// See [`edr_solidity_tests::fuzz::BaseCounterExample::contract_name`]
    #[napi(readonly)]
    pub contract_name: Option<String>,
    /// See [`edr_solidity_tests::fuzz::BaseCounterExample::signature`]
    #[napi(readonly)]
    pub signature: Option<String>,
    /// See [`edr_solidity_tests::fuzz::BaseCounterExample::args`]
    #[napi(readonly)]
    pub args: Option<String>,
}

impl Debug for BaseCounterExample {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("BaseCounterExample")
            .field("contract_name", &self.contract_name)
            .field("signature", &self.signature)
            .field("args", &self.args)
            .finish()
    }
}

impl From<edr_solidity_tests::fuzz::BaseCounterExample> for BaseCounterExample {
    fn from(value: edr_solidity_tests::fuzz::BaseCounterExample) -> Self {
        Self {
            sender: value.sender.map(Uint8Array::with_data_copied),
            address: value.addr.map(Uint8Array::with_data_copied),
            calldata: Uint8Array::with_data_copied(value.calldata),
            contract_name: value.contract_name,
            signature: value.signature,
            args: value.args,
        }
    }
}

/// Object representing a call in an execution trace, including contract
/// creation.
#[napi(object)]
pub struct CallTrace {
    /// The kind of call or contract creation this represents.
    pub kind: CallKind,
    /// Whether the call succeeded or reverted.
    pub success: bool,
    /// Whether the call is a cheatcode.
    pub is_cheatcode: bool,
    /// The amount of gas that was consumed.
    pub gas_used: BigInt,
    /// The amount of native token that was included with the call.
    pub value: BigInt,
    /// The target address of the call.
    pub address: String,
    /// The name of the contract that is the target of the call, if known.
    pub contract: Option<String>,
    /// The input (calldata) to the call. If it encodes a known function call,
    /// it will be decoded into the function name and a list of arguments.
    /// For example, `{ name: "ownerOf", arguments: ["1"] }`. Note that the
    /// function name may also be any of the special `fallback` and `receive`
    /// functions. Otherwise, it will be provided as a raw byte array.
    pub inputs: Either<DecodedTraceParameters, Uint8Array>,
    /// The output of the call. This will be a decoded human-readable
    /// representation of the value if the function is known, otherwise a
    /// raw byte array.
    pub outputs: Either<String, Uint8Array>,
    /// Interleaved subcalls and event logs. Use `kind` to check if each member
    /// of the array is a call or log trace.
    pub children: Vec<Either<CallTrace, LogTrace>>,
}

/// Object representing an event log in an execution trace.
#[napi(object)]
pub struct LogTrace {
    /// A constant to help discriminate the union `CallTrace | LogTrace`.
    pub kind: LogKind,
    /// If the log is a known event (based on its first topic), it will be
    /// decoded into the event name and list of named parameters. For
    /// example, `{ name: "Log", arguments: ["value: 1"] }`. Otherwise, it
    /// will be provided as an array where all but the last element are the
    /// log topics, and the last element is the log data.
    pub parameters: Either<DecodedTraceParameters, Vec<Uint8Array>>,
}

/// The various kinds of call frames possible in the EVM.
#[napi]
#[derive(Debug)]
pub enum CallKind {
    /// Regular call that may change state.
    Call = 0,
    /// Variant of `DelegateCall` that doesn't preserve sender or value in the
    /// frame.
    CallCode = 1,
    /// Call that executes the code of the target in the context of the caller.
    DelegateCall = 2,
    /// Regular call that may not change state.
    StaticCall = 3,
    /// Contract creation.
    Create = 4,
}

/// Kind marker for log traces.
#[napi]
#[derive(Debug)]
pub enum LogKind {
    /// Single kind of log.
    Log = 5,
    // NOTE: The discriminants of LogKind and CallKind must be disjoint.
}

/// Decoded function call or event.
#[napi(object)]
pub struct DecodedTraceParameters {
    /// The name of a function or an event.
    pub name: String,
    /// The arguments of the function call or the event, in their human-readable
    /// representations.
    pub arguments: Vec<String>,
}

impl CallTrace {
    /// Instantiates a `CallTrace` with the details from a node and the supplied
    /// children.
    fn new(node: &traces::CallTraceNode, children: Vec<Either<CallTrace, LogTrace>>) -> Self {
        let contract = node
            .trace
            .decoded
            .as_ref()
            .and_then(|decoded| decoded.label.clone());
        let address = node.trace.address.to_checksum(None);

        let inputs = match &node
            .trace
            .decoded
            .as_ref()
            .and_then(|decoded| decoded.call_data.as_ref())
        {
            Some(traces::DecodedCallData { signature, args }) => {
                let name = signature
                    .split('(')
                    .next()
                    .expect("invalid function signature")
                    .to_string();
                let arguments = args.clone();
                Either::A(DecodedTraceParameters { name, arguments })
            }
            None => Either::B(node.trace.data.as_ref().into()),
        };

        let outputs = match node
            .trace
            .decoded
            .as_ref()
            .and_then(|decoded| decoded.return_data.as_ref())
        {
            Some(outputs) => Either::A(outputs.clone()),
            None => {
                if node.kind().is_any_create() && node.trace.success {
                    Either::A(format!("{} bytes of code", node.trace.output.len()))
                } else {
                    Either::B(node.trace.output.as_ref().into())
                }
            }
        };

        Self {
            kind: node.kind().into(),
            success: node.trace.success,
            is_cheatcode: node.trace.address == CHEATCODE_ADDRESS,
            gas_used: node.trace.gas_used.into(),
            value: u256_to_bigint(&node.trace.value),
            contract,
            address,
            inputs,
            outputs,
            children,
        }
    }

    /// Creates a tree of `CallTrace` rooted at some node in a trace arena.
    pub(crate) fn from_arena_node(arena: &CallTraceArena, arena_index: usize) -> Self {
        struct StackItem {
            visited: bool,
            parent_stack_index: Option<usize>,
            arena_index: usize,
            child_traces: Vec<Option<CallTrace>>,
        }

        let mut stack = Vec::new();

        stack.push(StackItem {
            visited: false,
            arena_index,
            parent_stack_index: None,
            child_traces: Vec::new(),
        });

        loop {
            // We will break out of the loop before the stack goes empty.
            let mut item = stack.pop().unwrap();
            let node = arena
                .nodes()
                .get(item.arena_index)
                .expect("Arena index should be valid");

            if item.visited {
                let mut logs = node
                    .logs
                    .iter()
                    .map(|log| Some(LogTrace::from(log)))
                    .collect::<Vec<_>>();

                let children = node
                    .ordering
                    .iter()
                    .filter_map(|ord| match *ord {
                        traces::TraceMemberOrder::Log(i) => {
                            let log = logs
                                .get_mut(i)
                                .expect("Log index should be valid")
                                .take()
                                .unwrap();
                            Some(Either::B(log))
                        }
                        traces::TraceMemberOrder::Call(i) => {
                            let child_trace = item
                                .child_traces
                                .get_mut(i)
                                .expect("Child trace index should be valid")
                                .take()
                                .unwrap();
                            Some(Either::A(child_trace))
                        }
                        traces::TraceMemberOrder::Step(_) => None,
                    })
                    .collect();

                let trace = CallTrace::new(node, children);

                if let Some(parent_stack_index) = item.parent_stack_index {
                    let parent = stack
                        .get_mut(parent_stack_index)
                        .expect("Parent stack index should be valid");
                    parent.child_traces.push(Some(trace));
                } else {
                    return trace;
                }
            } else {
                item.visited = true;
                item.child_traces.reserve(node.children.len());

                stack.push(item);

                let top_index = Some(stack.len() - 1);

                // Push children in reverse order to result in linear traversal of the arena for
                // cache efficiency, on the assumption that the arena contains a pre-order
                // traversal of the trace.
                stack.extend(node.children.iter().rev().map(|&arena_index| StackItem {
                    visited: false,
                    parent_stack_index: top_index,
                    arena_index,
                    child_traces: Vec::new(),
                }));
            }
        }
    }
}

impl From<&traces::CallLog> for LogTrace {
    fn from(log: &traces::CallLog) -> Self {
        let decoded_log = log
            .decoded
            .as_ref()
            .and_then(|decoded| decoded.name.clone().zip(decoded.params.as_ref()));

        let parameters = decoded_log.map_or_else(
            || {
                let raw_log = &log.raw_log;
                let mut params = Vec::with_capacity(raw_log.topics().len() + 1);
                params.extend(raw_log.topics().iter().map(|topic| topic.as_slice().into()));
                params.push(log.raw_log.data.as_ref().into());
                Either::B(params)
            },
            |(name, params)| {
                let arguments = params
                    .iter()
                    .map(|(name, value)| format!("{name}: {value}"))
                    .collect();
                Either::A(DecodedTraceParameters { name, arguments })
            },
        );

        Self {
            kind: LogKind::Log,
            parameters,
        }
    }
}

impl From<traces::CallKind> for CallKind {
    fn from(value: traces::CallKind) -> Self {
        match value {
            traces::CallKind::Call => CallKind::Call,
            traces::CallKind::StaticCall => CallKind::StaticCall,
            traces::CallKind::CallCode => CallKind::CallCode,
            traces::CallKind::DelegateCall => CallKind::DelegateCall,
            traces::CallKind::Create | traces::CallKind::Create2 => CallKind::Create,

            // We do not support these EVM features.
            traces::CallKind::AuthCall => {
                unreachable!("Unsupported EVM features")
            }
        }
    }
}

/// The result of a Solidity test run.
#[napi(object)]
pub struct SolidityTestResult {
    /// Gas report, if it was generated.
    #[napi(readonly)]
    pub gas_report: Option<GasReport>,
}

impl From<edr_solidity_tests::multi_runner::SolidityTestResult> for SolidityTestResult {
    fn from(value: edr_solidity_tests::multi_runner::SolidityTestResult) -> Self {
        Self {
            gas_report: value.gas_report.map(GasReport::from),
        }
    }
}
