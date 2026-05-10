use std::sync::Arc;

use edr_decoder_revert::RevertDecoder;
use edr_napi_core::{provider::SyncProviderFactory, solidity};
use edr_primitives::HashMap;
use edr_solidity_tests::{
    multi_runner::{SuiteResultAndArtifactId, TestContract, TestContracts},
    TestFilterConfig,
};
use napi::{
    threadsafe_function::{
        ErrorStrategy, ThreadSafeCallContext, ThreadsafeFunction, ThreadsafeFunctionCallMode,
    },
    tokio::{runtime, sync::Mutex as AsyncMutex},
    Env, JsFunction, JsObject,
};
use napi_derive::napi;
use tracing_subscriber::{prelude::*, EnvFilter, Registry};

use crate::{
    config::{resolve_configs, ConfigResolution, ProviderConfig, TracingConfigWithBuffers},
    contract_decoder::ContractDecoder,
    logger::LoggerConfig,
    provider::{Provider, ProviderFactory},
    solidity_tests::{
        artifact::{Artifact, ArtifactId},
        config::SolidityTestRunnerConfigArgs,
        factory::SolidityTestRunnerFactory,
        test_results::{SolidityTestResult, SuiteResult},
        LinkingOutput,
    },
    subscription::SubscriptionConfig,
};

#[napi]
pub struct EdrContext {
    inner: Arc<AsyncMutex<Context>>,
}

#[napi]
impl EdrContext {
    /// Creates a new [`EdrContext`] instance. Should only be called once!
    #[napi(catch_unwind, constructor)]
    pub fn new() -> napi::Result<Self> {
        let context = Context::new()?;

        Ok(Self {
            inner: Arc::new(AsyncMutex::new(context)),
        })
    }

    /// Constructs a new provider with the provided configuration.
    #[napi(catch_unwind, ts_return_type = "Promise<Provider>")]
    pub fn create_provider(
        &self,
        env: Env,
        chain_type: String,
        provider_config: ProviderConfig,
        logger_config: LoggerConfig,
        subscription_config: SubscriptionConfig,
        contract_decoder: &ContractDecoder,
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

        #[cfg(feature = "scenarios")]
        let scenario_file =
            try_or_reject_promise!(runtime.clone().block_on(crate::scenarios::scenario_file(
                chain_type.clone(),
                provider_config.clone(),
                logger_config.enable,
            )));

        let factory = {
            // TODO: https://github.com/NomicFoundation/edr/issues/760
            // TODO: Don't block the JS event loop
            let context = runtime.block_on(async { self.inner.lock().await });

            try_or_reject_promise!(context.get_provider_factory(&chain_type))
        };

        let contract_decoder = Arc::clone(contract_decoder.as_inner());
        runtime.clone().spawn_blocking(move || {
            let result = factory
                .create_provider(
                    runtime.clone(),
                    provider_config,
                    logger_config,
                    subscription_callback,
                    Arc::clone(&contract_decoder),
                )
                .map(|provider| {
                    Provider::new(
                        provider,
                        runtime,
                        contract_decoder,
                        #[cfg(feature = "scenarios")]
                        scenario_file,
                    )
                });

            deferred.resolve(|_env| result);
        });

        Ok(promise)
    }

    /// Registers a new provider factory for the provided chain type.
    #[napi(catch_unwind)]
    pub async fn register_provider_factory(
        &self,
        chain_type: String,
        factory: &ProviderFactory,
    ) -> napi::Result<()> {
        let mut context = self.inner.lock().await;
        context.register_provider_factory(chain_type, factory.as_inner().clone());
        Ok(())
    }

    #[napi(catch_unwind)]
    pub async fn register_solidity_test_runner_factory(
        &self,
        chain_type: String,
        factory: &SolidityTestRunnerFactory,
    ) -> napi::Result<()> {
        let mut context = self.inner.lock().await;
        context.register_solidity_test_runner(chain_type, factory.as_inner().clone());
        Ok(())
    }

    /// Executes Solidity tests
    ///
    /// The function will return a promise that resolves to a
    /// [`SolidityTestResult`].
    ///
    /// Arguments:
    /// - `chainType`: the same chain type that was passed to
    ///   `registerProviderFactory`.
    /// - `artifacts`: the project's compilation output artifacts. It's
    ///   important to include include all artifacts here, otherwise cheatcodes
    ///   that access artifacts and other functionality (e.g. auto-linking, gas
    ///   reports) can break.
    /// - `testSuites`: the test suite ids that specify which test suites to
    ///   execute. The test suite artifacts must be present in `artifacts`.
    /// - `configArgs`: solidity test runner configuration. See the struct docs
    ///   for details.
    /// - `tracingConfig`: the build infos used for stack trace generation.
    ///   These are lazily parsed and it's important that they're passed as
    ///   Uint8 arrays for performance.
    /// - `onTestSuiteCompletedCallback`: The progress callback will be called
    ///   with the results of each test suite as soon as it finished executing.
    #[allow(clippy::too_many_arguments)]
    #[napi(catch_unwind, ts_return_type = "Promise<SolidityTestResult>")]
    pub fn run_solidity_tests(
        &self,
        env: Env,
        chain_type: String,
        artifacts: Vec<Artifact>,
        test_suites: Vec<ArtifactId>,
        config_args: SolidityTestRunnerConfigArgs,
        tracing_config: TracingConfigWithBuffers,
        #[napi(ts_arg_type = "(result: SuiteResult) => void")]
        on_test_suite_completed_callback: JsFunction,
    ) -> napi::Result<JsObject> {
        let (deferred, promise) = env.create_deferred()?;

        let on_test_suite_completed_callback: ThreadsafeFunction<_, ErrorStrategy::Fatal> =
            match on_test_suite_completed_callback.create_threadsafe_function(
                // Unbounded queue size
                0,
                |ctx: ThreadSafeCallContext<SuiteResult>| Ok(vec![ctx.value]),
            ) {
                Ok(value) => value,
                Err(error) => {
                    deferred.reject(error);
                    return Ok(promise);
                }
            };

        let test_filter: Arc<TestFilterConfig> =
            Arc::new(match config_args.try_get_test_filter() {
                Ok(test_filter) => test_filter,
                Err(error) => {
                    deferred.reject(error);
                    return Ok(promise);
                }
            });

        let runtime = runtime::Handle::current();
        let config = match config_args.resolve(&env, runtime.clone()) {
            Ok(config) => config,
            Err(error) => {
                deferred.reject(error);
                return Ok(promise);
            }
        };

        let context = self.inner.clone();
        runtime.clone().spawn(async move {
            macro_rules! try_or_reject_deferred {
                ($expr:expr) => {
                    match $expr {
                        Ok(value) => value,
                        Err(error) => {
                            deferred.reject(error);
                            return;
                        }
                    }
                };
            }
            let factory = {
                let context = context.lock().await;
                try_or_reject_deferred!(context.solidity_test_runner_factory(&chain_type).await)
            };

            let linking_output =
                try_or_reject_deferred!(LinkingOutput::link(&config.project_root, artifacts));

            // Build revert decoder from ABIs of all artifacts.
            let abis = linking_output
                .known_contracts
                .iter()
                .map(|(_, contract)| &contract.abi);

            let revert_decoder = RevertDecoder::new().with_abis(abis);

            let test_suites = try_or_reject_deferred!(test_suites
                .into_iter()
                .map(edr_artifact::ArtifactId::try_from)
                .collect::<Result<Vec<_>, _>>());

            let contracts = try_or_reject_deferred!(test_suites
                .iter()
                .map(|artifact_id| {
                    let contract_data = linking_output
                        .known_contracts
                        .get(artifact_id)
                        .ok_or_else(|| {
                            napi::Error::new(
                                napi::Status::GenericFailure,
                                format!("Unknown contract: {}", artifact_id.identifier()),
                            )
                        })?;

                    let bytecode = contract_data.bytecode.clone().ok_or_else(|| {
                        napi::Error::new(
                            napi::Status::GenericFailure,
                            format!(
                                "No bytecode for test suite contract: {}",
                                artifact_id.identifier()
                            ),
                        )
                    })?;

                    let test_contract = TestContract {
                        abi: contract_data.abi.clone(),
                        bytecode,
                    };

                    Ok((artifact_id.clone(), test_contract))
                })
                .collect::<napi::Result<TestContracts>>());

            let include_traces = config.include_traces.into();

            let runtime_for_factory = runtime.clone();
            let test_runner = try_or_reject_deferred!(runtime
                .clone()
                .spawn_blocking(move || {
                    factory.create_test_runner(
                        runtime_for_factory,
                        config,
                        contracts,
                        linking_output.known_contracts,
                        linking_output.libs_to_deploy,
                        revert_decoder,
                        tracing_config.into(),
                    )
                })
                .await
                .expect("Failed to join test runner factory thread"));

            let runtime_for_runner = runtime.clone();
            let test_result = try_or_reject_deferred!(runtime
                .clone()
                .spawn_blocking(move || {
                    test_runner.run_tests(
                        runtime_for_runner,
                        test_filter,
                        Arc::new(
                            move |SuiteResultAndArtifactId {
                                      artifact_id,
                                      result,
                                  }| {
                                let suite_result =
                                    SuiteResult::new(artifact_id, result, include_traces);

                                let status = on_test_suite_completed_callback
                                    .call(suite_result, ThreadsafeFunctionCallMode::Blocking);

                                // This should always succeed since we're using an unbounded queue.
                                // We add an assertion for
                                // completeness.
                                assert_eq!(
                            status,
                            napi::Status::Ok,
                            "Failed to call on_test_suite_completed_callback with status: {status}"
                        );
                            },
                        ),
                    )
                })
                .await
                .expect("Failed to join test runner thread"));

            deferred.resolve(move |_env| Ok(SolidityTestResult::from(test_result)));
        });

        Ok(promise)
    }
}

pub struct Context {
    provider_factories: HashMap<String, Arc<dyn SyncProviderFactory>>,
    solidity_test_runner_factories: HashMap<String, Arc<dyn solidity::SyncTestRunnerFactory>>,
    #[cfg(feature = "tracing")]
    _tracing_write_guard: tracing_flame::FlushGuard<std::io::BufWriter<std::fs::File>>,
}

impl Context {
    /// Creates a new [`Context`] instance. Should only be called once!
    pub fn new() -> napi::Result<Self> {
        let fmt_layer = tracing_subscriber::fmt::layer()
            .with_file(true)
            .with_line_number(true)
            .with_thread_ids(true)
            .with_target(false)
            .with_level(true)
            .with_filter(EnvFilter::from_default_env());

        let subscriber = Registry::default().with(fmt_layer);

        #[cfg(feature = "tracing")]
        let (flame_layer, guard) = {
            let (flame_layer, guard) = tracing_flame::FlameLayer::with_file("tracing.folded")
                .map_err(|err| {
                    napi::Error::new(
                        napi::Status::GenericFailure,
                        format!("Failed to create tracing.folded file with error: {err:?}"),
                    )
                })?;

            let flame_layer = flame_layer.with_empty_samples(false);
            (flame_layer, guard)
        };

        #[cfg(feature = "tracing")]
        let subscriber = subscriber.with(flame_layer);

        if let Err(error) = tracing::subscriber::set_global_default(subscriber) {
            println!(
                "Failed to set global tracing subscriber with error: {error}\n\
                Please only initialize EdrContext once per process to avoid this error."
            );
        }

        Ok(Self {
            provider_factories: HashMap::default(),
            solidity_test_runner_factories: HashMap::default(),
            #[cfg(feature = "tracing")]
            _tracing_write_guard: guard,
        })
    }

    /// Registers a new provider factory for the provided chain type.
    pub fn register_provider_factory(
        &mut self,
        chain_type: String,
        factory: Arc<dyn SyncProviderFactory>,
    ) {
        self.provider_factories.insert(chain_type, factory);
    }

    pub fn register_solidity_test_runner(
        &mut self,
        chain_type: String,
        factory: Arc<dyn solidity::SyncTestRunnerFactory>,
    ) {
        self.solidity_test_runner_factories
            .insert(chain_type, factory);
    }

    /// Tries to create a new provider for the provided chain type and
    /// configuration.
    pub fn get_provider_factory(
        &self,
        chain_type: &str,
    ) -> napi::Result<Arc<dyn SyncProviderFactory>> {
        if let Some(factory) = self.provider_factories.get(chain_type) {
            Ok(Arc::clone(factory))
        } else {
            Err(napi::Error::new(
                napi::Status::GenericFailure,
                "Provider for provided chain type does not exist",
            ))
        }
    }

    pub async fn solidity_test_runner_factory(
        &self,
        chain_type: &str,
    ) -> napi::Result<Arc<dyn solidity::SyncTestRunnerFactory>> {
        if let Some(factory) = self.solidity_test_runner_factories.get(chain_type) {
            Ok(Arc::clone(factory))
        } else {
            Err(napi::Error::new(
                napi::Status::GenericFailure,
                "Solidity test runner for provided chain type does not exist",
            ))
        }
    }
}
