// In contrast to the functions in the `#[napi] impl XYZ` block,
// the free functions `#[napi] pub fn` are exported by napi-rs but
// are considered dead code in the (lib test) target.
// For now, we silence the relevant warnings, as we need to mimick
// the original API while we rewrite the stack trace refinement to Rust.
#![cfg_attr(test, allow(dead_code))]

use std::sync::Arc;

use edr_chain_spec::EvmHaltReason;
use edr_primitives::bytecode::opcode::OpCode;
use edr_tracing::BeforeMessage;
use napi::bindgen_prelude::{BigInt, Either3, Uint8Array};
use napi_derive::napi;

use crate::result::ExecutionResult;

mod library_utils;

mod debug;
mod exit;
mod model;
mod return_data;
pub mod solidity_stack_trace;

#[napi(object)]
pub struct TracingMessage {
    /// Sender address
    #[napi(readonly)]
    pub caller: Uint8Array,

    /// Recipient address. None if it is a Create message.
    #[napi(readonly)]
    pub to: Option<Uint8Array>,

    /// Whether it's a static call
    #[napi(readonly)]
    pub is_static_call: bool,

    /// Transaction gas limit
    #[napi(readonly)]
    pub gas_limit: BigInt,

    /// Depth of the message
    #[napi(readonly)]
    pub depth: u8,

    /// Input data of the message
    #[napi(readonly)]
    pub data: Uint8Array,

    /// Value sent in the message
    #[napi(readonly)]
    pub value: BigInt,

    /// Address of the code that is being executed. Can be different from `to`
    /// if a delegate call is being done.
    #[napi(readonly)]
    pub code_address: Option<Uint8Array>,

    /// Code of the contract that is being executed.
    #[napi(readonly)]
    pub code: Option<Uint8Array>,
}

impl From<&BeforeMessage> for TracingMessage {
    fn from(value: &BeforeMessage) -> Self {
        // Deconstruct to make sure all fields are handled
        let BeforeMessage {
            depth,
            caller,
            to,
            is_static_call,
            gas_limit,
            data,
            value,
            code_address,
            code,
        } = value;

        let data = Uint8Array::with_data_copied(data);

        let code = code
            .as_ref()
            .map(|code| Uint8Array::with_data_copied(code.original_bytes()));

        TracingMessage {
            caller: Uint8Array::with_data_copied(caller),
            to: to.as_ref().map(Uint8Array::with_data_copied),
            gas_limit: BigInt::from(*gas_limit),
            is_static_call: *is_static_call,
            depth: *depth as u8,
            data,
            value: BigInt {
                sign_bit: false,
                words: value.into_limbs().to_vec(),
            },
            code_address: code_address.as_ref().map(Uint8Array::with_data_copied),
            code,
        }
    }
}

#[napi(object)]
pub struct TracingStep {
    /// Call depth
    #[napi(readonly)]
    pub depth: u8,
    /// The program counter
    #[napi(readonly)]
    pub pc: BigInt,
    /// The executed op code
    #[napi(readonly)]
    pub opcode: String,
    /// The entries on the stack. It only contains the top element unless
    /// verbose tracing is enabled. The vector is empty if there are no elements
    /// on the stack.
    #[napi(readonly)]
    pub stack: Vec<BigInt>,
    /// The memory at the step. None if verbose tracing is disabled.
    #[napi(readonly)]
    pub memory: Option<Uint8Array>,
}

impl TracingStep {
    pub fn new(step: &edr_tracing::Step) -> Self {
        let stack = step.stack.full().map_or_else(
            || {
                step.stack
                    .top()
                    .map(u256_to_bigint)
                    .map_or_else(Vec::default, |top| vec![top])
            },
            |stack| stack.iter().map(u256_to_bigint).collect(),
        );
        let memory = step.memory.as_ref().map(Uint8Array::with_data_copied);

        Self {
            depth: step.depth as u8,
            pc: BigInt::from(u64::from(step.pc)),
            opcode: OpCode::name_by_op(step.opcode).to_string(),
            stack,
            memory,
        }
    }
}

pub(crate) fn u256_to_bigint(v: &edr_primitives::U256) -> BigInt {
    BigInt {
        sign_bit: false,
        words: v.into_limbs().to_vec(),
    }
}

#[napi(object)]
pub struct TracingMessageResult {
    /// Execution result
    #[napi(readonly)]
    pub execution_result: ExecutionResult,
}

#[napi]
#[derive(Clone)]
pub struct RawTrace {
    inner: Arc<edr_tracing::Trace<EvmHaltReason>>,
}

impl From<Arc<edr_tracing::Trace<EvmHaltReason>>> for RawTrace {
    fn from(value: Arc<edr_tracing::Trace<EvmHaltReason>>) -> Self {
        Self { inner: value }
    }
}

#[napi]
impl RawTrace {
    #[napi(getter)]
    pub fn trace(&self) -> Vec<Either3<TracingMessage, TracingStep, TracingMessageResult>> {
        self.inner
            .messages
            .iter()
            .map(|message| match message {
                edr_tracing::TraceMessage::Before(message) => {
                    Either3::A(TracingMessage::from(message))
                }
                edr_tracing::TraceMessage::Step(step) => Either3::B(TracingStep::new(step)),
                edr_tracing::TraceMessage::After(message) => Either3::C(TracingMessageResult {
                    execution_result: ExecutionResult::from(message),
                }),
            })
            .collect()
    }
}
