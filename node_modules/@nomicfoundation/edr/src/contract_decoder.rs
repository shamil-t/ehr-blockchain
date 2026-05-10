use std::sync::Arc;

use napi_derive::napi;
use parking_lot::RwLock;

use crate::config::TracingConfigWithBuffers;

#[napi]
pub struct ContractDecoder {
    inner: Arc<RwLock<edr_solidity::contract_decoder::ContractDecoder>>,
}

#[napi]
impl ContractDecoder {
    #[doc = "Creates an empty instance."]
    #[napi(constructor, catch_unwind)]
    // Following TS convention for the constructor without arguments to be `new()`.
    #[allow(clippy::new_without_default)]
    pub fn new() -> Self {
        Self {
            inner: Arc::default(),
        }
    }

    #[doc = "Creates a new instance with the provided configuration."]
    #[napi(factory, catch_unwind)]
    pub fn with_contracts(config: TracingConfigWithBuffers) -> napi::Result<Self> {
        let build_info_config = edr_solidity::artifacts::BuildInfoConfig::parse_from_buffers(
            (&edr_napi_core::solidity::config::TracingConfigWithBuffers::from(config)).into(),
        )
        .map_err(|error| napi::Error::from_reason(error.to_string()))?;

        let contract_decoder =
            edr_solidity::contract_decoder::ContractDecoder::new(&build_info_config).map_or_else(
                |error| Err(napi::Error::from_reason(error.to_string())),
                |contract_decoder| Ok(Arc::new(RwLock::new(contract_decoder))),
            )?;

        Ok(Self {
            inner: contract_decoder,
        })
    }
}

impl ContractDecoder {
    /// Returns a reference to the inner contract decoder.
    pub fn as_inner(&self) -> &Arc<RwLock<edr_solidity::contract_decoder::ContractDecoder>> {
        &self.inner
    }
}

impl From<Arc<RwLock<edr_solidity::contract_decoder::ContractDecoder>>> for ContractDecoder {
    fn from(
        contract_decoder: Arc<RwLock<edr_solidity::contract_decoder::ContractDecoder>>,
    ) -> Self {
        Self {
            inner: contract_decoder,
        }
    }
}
