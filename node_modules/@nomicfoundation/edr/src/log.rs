use napi::bindgen_prelude::Uint8Array;
use napi_derive::napi;

/// Ethereum execution log.
#[napi(object)]
pub struct ExecutionLog {
    pub address: Uint8Array,
    pub topics: Vec<Uint8Array>,
    pub data: Uint8Array,
}

impl From<&edr_receipt::log::ExecutionLog> for ExecutionLog {
    fn from(value: &edr_receipt::log::ExecutionLog) -> Self {
        let topics = value
            .topics()
            .iter()
            .map(Uint8Array::with_data_copied)
            .collect();

        let data = Uint8Array::with_data_copied(&value.data.data);

        Self {
            address: Uint8Array::with_data_copied(value.address),
            topics,
            data,
        }
    }
}
