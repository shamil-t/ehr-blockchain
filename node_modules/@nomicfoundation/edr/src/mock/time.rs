use std::sync::Arc;

use edr_chain_spec::ChainSpec;
use edr_chain_spec_block::BlockChainSpec;
use edr_chain_spec_rpc::RpcBlockChainSpec;
use edr_generic::GenericChainSpec;
use edr_napi_core::logger::Logger;
use edr_primitives::B256;
use napi::{bindgen_prelude::BigInt, tokio::runtime, Env, JsObject};
use napi_derive::napi;

use crate::{
    cast::TryCast as _,
    config::{resolve_configs, ConfigResolution, ProviderConfig},
    contract_decoder::ContractDecoder,
    logger::LoggerConfig,
    provider::Provider,
    subscription::SubscriptionConfig,
};

#[napi]
pub struct MockTime {
    inner: Arc<edr_provider::time::MockTime>,
}

#[napi]
impl MockTime {
    #[doc = "Creates a new instance of `MockTime` with the current time."]
    #[napi(factory, catch_unwind)]
    pub fn now() -> Self {
        Self {
            inner: Arc::new(edr_provider::time::MockTime::now()),
        }
    }

    #[doc = "Adds the specified number of seconds to the current time."]
    #[napi(catch_unwind)]
    pub fn add_seconds(&self, seconds: BigInt) -> napi::Result<()> {
        let seconds = seconds.try_cast()?;

        self.inner.add_seconds(seconds);
        Ok(())
    }
}

#[doc = "Creates a provider with a mock timer."]
#[doc = "For testing purposes."]
#[napi(catch_unwind, ts_return_type = "Promise<Provider>")]
pub fn create_provider_with_mock_timer(
    env: Env,
    provider_config: ProviderConfig,
    logger_config: LoggerConfig,
    subscription_config: SubscriptionConfig,
    contract_decoder: &ContractDecoder,
    time: &MockTime,
) -> napi::Result<JsObject> {
    let (deferred, promise) = env.create_deferred()?;

    macro_rules! try_or_reject_promise {
        ($expr:expr) => {
            match $expr {
                Ok(value) => value,
                Err(error) => {
                    deferred.reject(error);
                    return Ok(promise);
                }
            }
        };
    }

    let runtime = runtime::Handle::current();

    let ConfigResolution {
        logger_config,
        provider_config,
        subscription_callback,
    } = try_or_reject_promise!(resolve_configs(
        &env,
        runtime.clone(),
        provider_config,
        logger_config,
        subscription_config,
    ));

    let contract_decoder = Arc::clone(contract_decoder.as_inner());
    let timer = Arc::clone(&time.inner);

    runtime.clone().spawn_blocking(move || {
        // Using a closure to limit the scope, allowing us to use `?` for error
        // handling. This is necessary because the result of the closure is used
        // to resolve the deferred promise.
        let create_provider = move || -> napi::Result<Provider> {
            let logger = Logger::<GenericChainSpec, Arc<edr_provider::time::MockTime>>::new(
                logger_config,
                Arc::clone(&contract_decoder),
            )?;

            let provider_config =
                edr_provider::ProviderConfig::<edr_chain_l1::Hardfork>::try_from(provider_config)?;

            let provider =
                edr_provider::Provider::<GenericChainSpec, Arc<edr_provider::time::MockTime>>::new(
                    runtime.clone(),
                    Box::new(logger),
                    Box::new(move |event| {
                        let event = edr_napi_core::subscription::SubscriptionEvent::new::<
                            <GenericChainSpec as BlockChainSpec>::Block,
                            <GenericChainSpec as RpcBlockChainSpec>::RpcBlock<B256>,
                            <GenericChainSpec as ChainSpec>::SignedTransaction,
                        >(event);

                        subscription_callback.call(event);
                    }),
                    provider_config,
                    Arc::clone(&contract_decoder),
                    timer,
                )
                .map_err(|error| napi::Error::from_reason(error.to_string()))?;

            Ok(Provider::new(
                Arc::new(provider),
                runtime,
                contract_decoder,
                #[cfg(feature = "scenarios")]
                None,
            ))
        };

        let result = create_provider();
        deferred.resolve(|_env| result);
    });

    Ok(promise)
}
