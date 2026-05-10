//! Port of `hardhat-network/stack-traces/debug.ts` from Hardhat.

use napi::bindgen_prelude::Either25;
use napi_derive::napi;

use super::solidity_stack_trace::{RevertErrorStackTraceEntry, SolidityStackTrace};
use crate::trace::return_data::ReturnData;

#[napi(catch_unwind)]
fn print_stack_trace(trace: SolidityStackTrace) -> napi::Result<()> {
    let entry_values = trace
        .into_iter()
        .map(|entry| match entry {
            Either25::A(entry) => serde_json::to_value(entry),
            Either25::B(entry) => serde_json::to_value(entry),
            Either25::C(entry) => serde_json::to_value(entry),
            Either25::D(entry) => serde_json::to_value(entry),
            Either25::F(entry) => serde_json::to_value(entry),
            Either25::G(entry) => serde_json::to_value(entry),
            Either25::H(entry) => serde_json::to_value(entry),
            Either25::I(entry) => serde_json::to_value(entry),
            Either25::J(entry) => serde_json::to_value(entry),
            Either25::K(entry) => serde_json::to_value(entry),
            Either25::L(entry) => serde_json::to_value(entry),
            Either25::M(entry) => serde_json::to_value(entry),
            Either25::N(entry) => serde_json::to_value(entry),
            Either25::O(entry) => serde_json::to_value(entry),
            Either25::P(entry) => serde_json::to_value(entry),
            Either25::Q(entry) => serde_json::to_value(entry),
            Either25::R(entry) => serde_json::to_value(entry),
            Either25::S(entry) => serde_json::to_value(entry),
            Either25::T(entry) => serde_json::to_value(entry),
            Either25::U(entry) => serde_json::to_value(entry),
            Either25::V(entry) => serde_json::to_value(entry),
            Either25::W(entry) => serde_json::to_value(entry),
            Either25::X(entry) => serde_json::to_value(entry),
            Either25::Y(entry) => serde_json::to_value(entry),
            // Decode the error message from the return data
            Either25::E(entry @ RevertErrorStackTraceEntry { .. }) => {
                use serde::de::Error;

                let decoded_error_msg = ReturnData::new(entry.return_data.clone())
                    .decode_error()
                    .map_err(|e| {
                    serde_json::Error::custom(format_args!("Error decoding return data: {e}"))
                })?;

                let mut value = serde_json::to_value(entry)?;
                if let Some(obj) = value.as_object_mut() {
                    obj.insert("message".to_string(), decoded_error_msg.into());
                }
                Ok(value)
            }
        })
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| napi::Error::from_reason(format!("Error converting to JSON: {e}")))?;

    println!("{}", serde_json::to_string_pretty(&entry_values)?);

    Ok(())
}
