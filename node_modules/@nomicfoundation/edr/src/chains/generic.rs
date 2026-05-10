use std::sync::Arc;

use edr_generic::GenericChainSpec;
use edr_napi_core::{
    logger::Logger,
    provider::{SyncProvider, SyncProviderFactory},
    subscription::subscriber_callback_for_chain_spec,
};
use edr_provider::time::CurrentTime;
use edr_solidity::contract_decoder::ContractDecoder;
use napi::tokio::runtime;
use napi_derive::napi;
use parking_lot::RwLock;

use crate::provider::ProviderFactory;

pub struct GenericChainProviderFactory;

impl SyncProviderFactory for GenericChainProviderFactory {
    fn create_provider(
        &self,
        runtime: runtime::Handle,
        provider_config: edr_napi_core::provider::Config,
        logger_config: edr_napi_core::logger::Config,
        subscription_callback: edr_napi_core::subscription::Callback,
        contract_decoder: Arc<RwLock<ContractDecoder>>,
    ) -> napi::Result<Arc<dyn SyncProvider>> {
        let logger = Logger::<GenericChainSpec, CurrentTime>::new(
            logger_config,
            Arc::clone(&contract_decoder),
        )?;

        let provider_config =
            edr_provider::ProviderConfig::<edr_chain_l1::Hardfork>::try_from(provider_config)?;

        let provider = edr_provider::Provider::<GenericChainSpec>::new(
            runtime.clone(),
            Box::new(logger),
            subscriber_callback_for_chain_spec::<GenericChainSpec, CurrentTime>(
                subscription_callback,
            ),
            provider_config,
            contract_decoder,
            CurrentTime,
        )
        .map_err(|error| napi::Error::new(napi::Status::GenericFailure, error.to_string()))?;

        Ok(Arc::new(provider))
    }
}

#[napi]
pub const GENERIC_CHAIN_TYPE: &str = edr_generic::CHAIN_TYPE;

#[napi(catch_unwind)]
pub fn generic_chain_provider_factory() -> ProviderFactory {
    let factory: Arc<dyn SyncProviderFactory> = Arc::new(GenericChainProviderFactory);
    factory.into()
}
