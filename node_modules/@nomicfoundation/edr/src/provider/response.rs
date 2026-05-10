use edr_solidity::solidity_stack_trace::StackTraceCreationResult;
use napi::{bindgen_prelude::Either3, Either};
use napi_derive::napi;

use crate::{
    solidity_tests::test_results::{CallTrace, HeuristicFailed, StackTrace, UnexpectedError},
    trace::solidity_stack_trace::{
        solidity_stack_trace_error_to_napi, solidity_stack_trace_heuristic_failed_to_napi,
        solidity_stack_trace_success_to_napi,
    },
};

#[napi]
pub struct Response {
    inner: edr_napi_core::spec::Response,
}

impl From<edr_napi_core::spec::Response> for Response {
    fn from(value: edr_napi_core::spec::Response) -> Self {
        Self { inner: value }
    }
}

#[napi]
impl Response {
    #[doc = "Returns the response data as a JSON string or a JSON object."]
    #[napi(catch_unwind, getter)]
    pub fn data(&self) -> Either<String, serde_json::Value> {
        self.inner.data.clone()
    }

    #[doc = "Compute the error stack trace. Return the stack trace if it can be decoded, otherwise returns none. Throws if there was an error computing the stack trace."]
    #[napi(catch_unwind)]
    pub fn stack_trace(&self) -> Option<Either3<StackTrace, UnexpectedError, HeuristicFailed>> {
        self.inner
            .stack_trace_result
            .as_ref()
            .map(|stack_trace_result| match stack_trace_result {
                StackTraceCreationResult::Success(stack_trace) => {
                    Either3::A(solidity_stack_trace_success_to_napi(stack_trace))
                }
                StackTraceCreationResult::Error(error) => {
                    Either3::B(solidity_stack_trace_error_to_napi(error))
                }
                StackTraceCreationResult::HeuristicFailed => {
                    Either3::C(solidity_stack_trace_heuristic_failed_to_napi())
                }
            })
    }

    /// Constructs the execution traces for the request. Returns an empty array
    /// if traces are not enabled for this provider according to
    /// [`crate::solidity_tests::config::SolidityTestRunnerConfigArgs::include_traces`]. Otherwise, returns
    /// an array of the root calls of the trace, which always includes the
    /// request's call itself.
    #[napi(catch_unwind)]
    pub fn call_traces(&self) -> Vec<CallTrace> {
        self.inner
            .call_trace_arenas
            .iter()
            .map(|call_trace_arena| CallTrace::from_arena_node(call_trace_arena, 0))
            .collect()
    }

    // TODO(#1288): Add backwards compatibility layer for Hardhat 2
    // #[doc = "Returns the raw traces of executed contracts. This maybe contain
    // zero or more traces."] #[napi(catch_unwind, getter)]
    // pub fn traces(&self) -> Vec<RawTrace> {
    //     self.inner
    //         .call_trace_arenas
    //         .iter()
    //         .map(|trace| RawTrace::from(trace.clone()))
    //         .collect()
    // }
}
