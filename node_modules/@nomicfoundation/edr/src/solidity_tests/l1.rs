use std::{collections::BTreeMap, sync::Arc};

use edr_artifact::ArtifactId;
use edr_decoder_revert::RevertDecoder;
use edr_napi_core::solidity::{
    config::{TestRunnerConfig, TracingConfigWithBuffers},
    SyncTestRunner, SyncTestRunnerFactory,
};
use edr_primitives::Bytes;
use edr_solidity_tests::{
    contracts::ContractsByArtifact,
    evm_context::L1EvmBuilder,
    multi_runner::TestContract,
    revm::context::{BlockEnv, TxEnv},
    MultiContractRunner,
};
use napi::tokio;
use napi_derive::napi;

use crate::solidity_tests::{factory::SolidityTestRunnerFactory, runner::LazyContractDecoder};

struct L1TestRunnerFactory;

impl SyncTestRunnerFactory for L1TestRunnerFactory {
    fn create_test_runner(
        &self,
        runtime: tokio::runtime::Handle,
        config: TestRunnerConfig,
        contracts: BTreeMap<ArtifactId, TestContract>,
        known_contracts: ContractsByArtifact,
        libs_to_deploy: Vec<Bytes>,
        revert_decoder: RevertDecoder,
        tracing_config: TracingConfigWithBuffers,
    ) -> napi::Result<Box<dyn SyncTestRunner>> {
        let contract_decoder = LazyContractDecoder::new(tracing_config);

        let runner = tokio::task::block_in_place(|| {
            runtime
                .block_on(MultiContractRunner::<
                    BlockEnv,
                    (),
                    L1EvmBuilder,
                    edr_chain_l1::HaltReason,
                    edr_chain_l1::Hardfork,
                    _,
                    edr_chain_l1::InvalidTransaction,
                    TxEnv,
                >::new(
                    config.try_into()?,
                    contracts,
                    known_contracts,
                    libs_to_deploy,
                    contract_decoder,
                    revert_decoder,
                ))
                .map_err(|err| {
                    napi::Error::new(
                        napi::Status::GenericFailure,
                        format!("Failed to create multi contract runner: {err}"),
                    )
                })
        })?;

        Ok(Box::new(runner))
    }
}

#[napi(catch_unwind)]
pub fn l1_solidity_test_runner_factory() -> SolidityTestRunnerFactory {
    let factory: Arc<dyn SyncTestRunnerFactory> = Arc::new(L1TestRunnerFactory);
    factory.into()
}
