pub mod artifact;
pub mod cheatcode_errors;
pub mod config;
pub mod factory;
pub mod l1;
#[cfg(feature = "op")]
pub mod op;
pub mod runner;
pub mod test_results;

use std::path::Path;

use edr_primitives::Bytes;
use edr_solidity::linker::{LinkOutput, Linker};
use edr_solidity_tests::{constants::LIBRARY_DEPLOYER, contracts::ContractsByArtifact};
use foundry_compilers::artifacts::Libraries;

use crate::solidity_tests::artifact::Artifact;

pub(crate) struct LinkingOutput {
    pub libs_to_deploy: Vec<Bytes>,
    pub known_contracts: ContractsByArtifact,
}

impl LinkingOutput {
    pub fn link(project_root: &Path, artifacts: Vec<Artifact>) -> napi::Result<Self> {
        let artifact_contracts = artifacts
            .into_iter()
            .map(|artifact| Ok((artifact.id.try_into()?, artifact.contract.try_into()?)))
            .collect::<napi::Result<Vec<_>>>()?;

        let linker = Linker::new(project_root, artifact_contracts);

        let LinkOutput {
            libraries,
            libs_to_deploy,
        } = linker
            .link_with_nonce_or_address(
                Libraries::default(),
                LIBRARY_DEPLOYER,
                0,
                linker.contracts.keys(),
            )
            .map_err(|error| napi::Error::from_reason(error.to_string()))?;

        let linked_contracts = linker
            .get_linked_artifacts(&libraries)
            .map_err(|error| napi::Error::from_reason(error.to_string()))?;

        let known_contracts = ContractsByArtifact::new(linked_contracts);

        Ok(LinkingOutput {
            libs_to_deploy,
            known_contracts,
        })
    }
}
