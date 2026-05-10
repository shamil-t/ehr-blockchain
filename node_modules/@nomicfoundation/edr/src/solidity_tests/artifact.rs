use std::{
    borrow::Cow,
    collections::{BTreeMap, HashMap},
};

use napi_derive::napi;

/// A compilation artifact.
#[derive(Clone, Debug)]
#[napi(object)]
pub struct Artifact {
    /// The identifier of the artifact.
    pub id: ArtifactId,
    /// The test contract.
    pub contract: ContractData,
}

/// The identifier of a Solidity contract.
#[derive(Clone, Debug, serde::Serialize)]
#[napi(object)]
pub struct ArtifactId {
    /// The name of the contract.
    pub name: String,
    /// Original source file path.
    pub source: String,
    /// The solc semver string.
    pub solc_version: String,
}

impl From<edr_artifact::ArtifactId> for ArtifactId {
    fn from(value: edr_artifact::ArtifactId) -> Self {
        Self {
            name: value.name,
            source: value.source.to_string_lossy().to_string(),
            solc_version: value.version.to_string(),
        }
    }
}

impl TryFrom<ArtifactId> for edr_artifact::ArtifactId {
    type Error = napi::Error;

    fn try_from(value: ArtifactId) -> napi::Result<Self> {
        Ok(edr_artifact::ArtifactId {
            name: value.name,
            source: value.source.parse().map_err(|_err| {
                napi::Error::new(napi::Status::GenericFailure, "Invalid source path")
            })?,
            version: value.solc_version.parse().map_err(|_err| {
                napi::Error::new(napi::Status::GenericFailure, "Invalid solc semver string")
            })?,
        })
    }
}

/// A test contract to execute.
#[derive(Clone, Debug)]
#[napi(object)]
pub struct ContractData {
    /// Contract ABI as json string.
    pub abi: String,
    /// Contract creation code as hex string. It can be missing if the contract
    /// is ABI only.
    pub bytecode: Option<String>,
    /// The link references of the deployment bytecode.
    pub link_references: Option<HashMap<String, HashMap<String, Vec<LinkReference>>>>,
    /// Contract runtime code as hex string. It can be missing if the contract
    /// is ABI only.
    pub deployed_bytecode: Option<String>,
    /// The link references of the deployed bytecode.
    pub deployed_link_references: Option<HashMap<String, HashMap<String, Vec<LinkReference>>>>,
}

impl TryFrom<ContractData> for foundry_compilers::artifacts::CompactContractBytecode {
    type Error = napi::Error;

    fn try_from(contract: ContractData) -> napi::Result<Self> {
        Ok(foundry_compilers::artifacts::CompactContractBytecode {
            abi: Some(serde_json::from_str(&contract.abi).map_err(|_err| {
                napi::Error::new(napi::Status::GenericFailure, "Invalid JSON ABI")
            })?),
            bytecode: contract
                .bytecode
                .map(|bytecode| {
                    let link_references =
                        convert_link_references(contract.link_references.unwrap_or_default());
                    let object = convert_bytecode(bytecode, !link_references.is_empty())?;
                    Ok::<_, napi::Error>(foundry_compilers::artifacts::CompactBytecode {
                        object,
                        source_map: None,
                        link_references,
                    })
                })
                .transpose()?,
            deployed_bytecode: contract
                .deployed_bytecode
                .map(|deployed_bytecode| {
                    let link_references = convert_link_references(
                        contract.deployed_link_references.unwrap_or_default(),
                    );
                    let object = convert_bytecode(deployed_bytecode, !link_references.is_empty())?;
                    let compact_bytecode = foundry_compilers::artifacts::CompactBytecode {
                        object,
                        source_map: None,
                        link_references,
                    };
                    Ok::<_, napi::Error>(foundry_compilers::artifacts::CompactDeployedBytecode {
                        bytecode: Some(compact_bytecode),
                        immutable_references: BTreeMap::default(),
                    })
                })
                .transpose()?,
        })
    }
}

impl TryFrom<ContractData> for foundry_compilers::artifacts::CompactContractBytecodeCow<'static> {
    type Error = napi::Error;

    fn try_from(contract: ContractData) -> napi::Result<Self> {
        let c: foundry_compilers::artifacts::CompactContractBytecode = contract.try_into()?;
        Ok(foundry_compilers::artifacts::CompactContractBytecodeCow {
            abi: c.abi.map(Cow::Owned),
            bytecode: c.bytecode.map(Cow::Owned),
            deployed_bytecode: c.deployed_bytecode.map(Cow::Owned),
        })
    }
}

// The order of link references as supplied through the NAPI interface doesn't
// matter, but the order can matter downstream for deterministic address
// generation.
fn convert_link_references(
    link_references: HashMap<String, HashMap<String, Vec<LinkReference>>>,
) -> BTreeMap<String, BTreeMap<String, Vec<foundry_compilers::artifacts::Offsets>>> {
    link_references
        .into_iter()
        .map(|(file, libraries)| {
            let lib_map = libraries
                .into_iter()
                .map(|(library_name, references)| {
                    let offsets = references.into_iter().map(Into::into).collect();
                    (library_name, offsets)
                })
                .collect();
            (file, lib_map)
        })
        .collect()
}

fn convert_bytecode(
    bytecode: String,
    needs_linking: bool,
) -> napi::Result<foundry_compilers::artifacts::BytecodeObject> {
    if needs_linking {
        Ok(foundry_compilers::artifacts::BytecodeObject::Unlinked(
            bytecode,
        ))
    } else {
        let bytes = bytecode.parse().map_err(|err| {
            let message = format!("Hex decoding error while parsing bytecode: '{err}'. Maybe forgot to pass link references for a contract that needs linking?");
            napi::Error::from_reason(message)
        })?;
        Ok(foundry_compilers::artifacts::BytecodeObject::Bytecode(
            bytes,
        ))
    }
}

#[derive(Clone, Debug)]
#[napi(object)]
pub struct LinkReference {
    pub start: u32,
    pub length: u32,
}

impl From<LinkReference> for foundry_compilers::artifacts::Offsets {
    fn from(value: LinkReference) -> Self {
        Self {
            start: value.start,
            length: value.length,
        }
    }
}
