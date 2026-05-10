use std::collections::HashMap;

use napi::bindgen_prelude::{BigInt, Uint8Array};
use napi_derive::napi;

// False positive: imported by HH2
#[allow(dead_code)]
#[napi(object)]
pub struct DebugTraceResult {
    pub pass: bool,
    pub gas_used: BigInt,
    pub output: Option<Uint8Array>,
    pub struct_logs: Vec<DebugTraceLogItem>,
}

#[napi(object)]
pub struct DebugTraceLogItem {
    /// Program Counter
    pub pc: BigInt,
    // Op code
    pub op: u8,
    /// Gas left before executing this operation as hex number.
    pub gas: String,
    /// Gas cost of this operation as hex number.
    pub gas_cost: String,
    /// Array of all values (hex numbers) on the stack
    pub stack: Option<Vec<String>>,
    /// Depth of the call stack
    pub depth: BigInt,
    /// Size of memory array
    pub mem_size: BigInt,
    /// Name of the operation
    pub op_name: String,
    /// Description of an error as a hex string.
    pub error: Option<String>,
    /// Array of all allocated values as hex strings.
    pub memory: Option<Vec<String>>,
    /// Map of all stored values with keys and values encoded as hex strings.
    pub storage: Option<HashMap<String, String>>,
}
