use std::sync::{Mutex, OnceLock};

use edr_chain_spec::HaltReasonTrait;
use edr_napi_core::solidity::config::TracingConfigWithBuffers;
use edr_solidity::{
    artifacts::BuildInfoConfigWithBuffers,
    contract_decoder::{
        ContractDecoder, ContractDecoderError, NestedTraceDecoder, NestedTraceDecoderMut as _,
    },
    nested_trace::NestedTrace,
};
use parking_lot::RwLock;

/// Only parses the tracing config which is very expensive if the contract
/// decoder is used.
#[derive(Debug)]
pub(crate) struct LazyContractDecoder {
    // We need the `Mutex`, because `Uint8Array` is not `Sync`
    tracing_config: Mutex<TracingConfigWithBuffers>,
    // Storing the result so that we can propagate the error
    contract_decoder: OnceLock<Result<RwLock<ContractDecoder>, ContractDecoderError>>,
}

impl LazyContractDecoder {
    pub fn new(tracing_config: TracingConfigWithBuffers) -> Self {
        Self {
            tracing_config: Mutex::new(tracing_config),
            contract_decoder: OnceLock::new(),
        }
    }
}

impl<HaltReasonT: HaltReasonTrait> NestedTraceDecoder<HaltReasonT> for LazyContractDecoder {
    fn try_to_decode_nested_trace(
        &self,
        nested_trace: NestedTrace<HaltReasonT>,
    ) -> Result<NestedTrace<HaltReasonT>, ContractDecoderError> {
        self.contract_decoder
            .get_or_init(|| {
                let tracing_config = self
                    .tracing_config
                    .lock()
                    .expect("Can't get poisoned, because only called once");
                edr_solidity::artifacts::BuildInfoConfig::parse_from_buffers(
                    BuildInfoConfigWithBuffers::from(&*tracing_config),
                )
                .map_err(|err| ContractDecoderError::Initialization(err.to_string()))
                .and_then(|config| ContractDecoder::new(&config).map(RwLock::new))
            })
            .as_ref()
            .map_err(Clone::clone)
            .and_then(|decoder| decoder.write().try_to_decode_nested_trace_mut(nested_trace))
    }
}
