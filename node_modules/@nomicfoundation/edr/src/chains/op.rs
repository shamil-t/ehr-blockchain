use std::{str::FromStr, sync::Arc};

use edr_napi_core::{
    logger::Logger,
    provider::{SyncProvider, SyncProviderFactory},
    subscription::subscriber_callback_for_chain_spec,
};
use edr_op::{
    predeploys::{
        gas_price_oracle_code_ecotone, gas_price_oracle_code_fjord, gas_price_oracle_code_isthmus,
        l1_block_code_bedrock, l1_block_code_ecotone, l1_block_code_isthmus,
        GAS_PRICE_ORACLE_ADDRESS, L1_BLOCK_PREDEPLOY_ADDRESS,
    },
    OpChainSpec,
};
use edr_primitives::hex;
use edr_provider::time::CurrentTime;
use edr_solidity::contract_decoder::ContractDecoder;
use napi::{
    bindgen_prelude::{BigInt, Uint8Array},
    tokio::runtime,
};
use napi_derive::napi;
use parking_lot::RwLock;

use crate::{
    account::{AccountOverride, StorageSlot},
    provider::ProviderFactory,
};

pub struct OpProviderFactory;

impl SyncProviderFactory for OpProviderFactory {
    fn create_provider(
        &self,
        runtime: runtime::Handle,
        provider_config: edr_napi_core::provider::Config,
        logger_config: edr_napi_core::logger::Config,
        subscription_callback: edr_napi_core::subscription::Callback,
        contract_decoder: Arc<RwLock<ContractDecoder>>,
    ) -> napi::Result<Arc<dyn SyncProvider>> {
        let logger =
            Logger::<OpChainSpec, CurrentTime>::new(logger_config, Arc::clone(&contract_decoder))?;

        let provider_config =
            edr_provider::ProviderConfig::<edr_op::Hardfork>::try_from(provider_config)?;

        let provider = edr_provider::Provider::<OpChainSpec>::new(
            runtime.clone(),
            Box::new(logger),
            subscriber_callback_for_chain_spec::<OpChainSpec, CurrentTime>(subscription_callback),
            provider_config,
            contract_decoder,
            CurrentTime,
        )
        .map_err(|error| napi::Error::new(napi::Status::GenericFailure, error.to_string()))?;

        Ok(Arc::new(provider))
    }
}

/// Enumeration of supported OP hardforks.
#[napi]
pub enum OpHardfork {
    Bedrock = 100,
    Regolith = 101,
    Canyon = 102,
    Ecotone = 103,
    Fjord = 104,
    Granite = 105,
    Holocene = 106,
    Isthmus = 107,
}

impl From<OpHardfork> for edr_op::Hardfork {
    fn from(hardfork: OpHardfork) -> Self {
        match hardfork {
            OpHardfork::Bedrock => edr_op::Hardfork::BEDROCK,
            OpHardfork::Regolith => edr_op::Hardfork::REGOLITH,
            OpHardfork::Canyon => edr_op::Hardfork::CANYON,
            OpHardfork::Ecotone => edr_op::Hardfork::ECOTONE,
            OpHardfork::Fjord => edr_op::Hardfork::FJORD,
            OpHardfork::Granite => edr_op::Hardfork::GRANITE,
            OpHardfork::Holocene => edr_op::Hardfork::HOLOCENE,
            OpHardfork::Isthmus => edr_op::Hardfork::ISTHMUS,
        }
    }
}

impl FromStr for OpHardfork {
    type Err = napi::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            edr_op::hardfork::name::BEDROCK => Ok(OpHardfork::Bedrock),
            edr_op::hardfork::name::REGOLITH => Ok(OpHardfork::Regolith),
            edr_op::hardfork::name::CANYON => Ok(OpHardfork::Canyon),
            edr_op::hardfork::name::ECOTONE => Ok(OpHardfork::Ecotone),
            edr_op::hardfork::name::FJORD => Ok(OpHardfork::Fjord),
            edr_op::hardfork::name::GRANITE => Ok(OpHardfork::Granite),
            edr_op::hardfork::name::HOLOCENE => Ok(OpHardfork::Holocene),
            edr_op::hardfork::name::ISTHMUS => Ok(OpHardfork::Isthmus),
            _ => Err(napi::Error::new(
                napi::Status::InvalidArg,
                format!("The provided OP hardfork `{s}` is not supported."),
            )),
        }
    }
}

/// Tries to parse the provided string to create an [`OpHardfork`]
/// instance.
///
/// Returns an error if the string does not match any known hardfork.
#[napi(catch_unwind)]
pub fn op_hardfork_from_string(hardfork: String) -> napi::Result<OpHardfork> {
    hardfork.parse()
}

/// Returns the string representation of the provided OP hardfork.
#[napi(catch_unwind)]
pub fn op_hardfork_to_string(hardfork: OpHardfork) -> &'static str {
    match hardfork {
        OpHardfork::Bedrock => edr_op::hardfork::name::BEDROCK,
        OpHardfork::Regolith => edr_op::hardfork::name::REGOLITH,
        OpHardfork::Canyon => edr_op::hardfork::name::CANYON,
        OpHardfork::Ecotone => edr_op::hardfork::name::ECOTONE,
        OpHardfork::Fjord => edr_op::hardfork::name::FJORD,
        OpHardfork::Granite => edr_op::hardfork::name::GRANITE,
        OpHardfork::Holocene => edr_op::hardfork::name::HOLOCENE,
        OpHardfork::Isthmus => edr_op::hardfork::name::ISTHMUS,
    }
}

/// Returns the latest supported OP hardfork.
///
/// The returned value will be updated after each network upgrade.
#[napi(catch_unwind)]
pub fn op_latest_hardfork() -> OpHardfork {
    OpHardfork::Isthmus
}

#[napi]
pub const OP_CHAIN_TYPE: &str = edr_op::CHAIN_TYPE;

#[napi(catch_unwind)]
pub fn op_genesis_state(hardfork: OpHardfork) -> Vec<AccountOverride> {
    let l1_block_code = l1_block_code(hardfork.into());
    let l1_block = AccountOverride {
        address: Uint8Array::with_data_copied(L1_BLOCK_PREDEPLOY_ADDRESS),
        balance: Some(BigInt::from(0u64)),
        nonce: Some(BigInt::from(0u64)),
        code: Some(l1_block_code),
        storage: Some(l1_block_storage(hardfork.into())),
    };

    /* The rest of the predeploys use a stubbed bytecode that reverts with a
               message indicating that the predeploy is not supported. For each of
               them, the Solidity code that generates the bytecode is:

    // SPDX-License-Identifier: Unlicense
    pragma solidity ^0.8.0;

    contract NotSupported {
        fallback() external payable {
            revert("Predeploy <PredeployName> is not supported.");
        }
    }
            */
    let stubbed_predeploys_data = vec![
        (
            "LegacyMessagePasser",
            hex!("4200000000000000000000000000000000000000"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b60006048602f8360bf565b91507f5072656465706c6f79204c65676163794d65737361676550617373657220697360008301527f206e6f7420737570706f727465642e00000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea26469706673582212206ba272e31c33ce6fe2612b534c5aa5ed8905e1bed8a757ff1a74cc06509a17f664736f6c63430008000033",
        ),
        (
            "DeployerWhitelist",
            hex!("4200000000000000000000000000000000000002"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b60006048602d8360bf565b91507f5072656465706c6f79204465706c6f79657257686974656c697374206973206e60008301527f6f7420737570706f727465642e000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea26469706673582212206af5fc0549e5db963a08cb2864cbbf5c4e27efb08219fc0e29bda83f84b121ac64736f6c63430008000033",
        ),
        (
            "LegacyERC20ETH",
            hex!("DeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b60006048602a8360bf565b91507f5072656465706c6f79204c65676163794552433230455448206973206e6f742060008301527f737570706f727465642e000000000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea264697066735822122054e7f9d6c12400d5b4b67aed39be8c44a8b1461519e96a0e7764c69417239c7964736f6c63430008000033",
        ),
        (
            "WETH9",
            hex!("4200000000000000000000000000000000000006"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b6000604860218360bf565b91507f5072656465706c6f79205745544839206973206e6f7420737570706f7274656460008301527f2e000000000000000000000000000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea2646970667358221220860ec43d585e1b040780713555b6fc492d748c73586bdb8f2b9af441c4452dbf64736f6c63430008000033",
        ),
        (
            "L2CrossDomainMessenger",
            hex!("4200000000000000000000000000000000000007"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b6000604860328360bf565b91507f5072656465706c6f79204c3243726f7373446f6d61696e4d657373656e67657260008301527f206973206e6f7420737570706f727465642e00000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea26469706673582212200fadec69889de49a1a3a14d4e7e477e00921681e12650f510863d0077c16f58864736f6c63430008000033",
        ),
        (
            "L2StandardBridge",
            hex!("4200000000000000000000000000000000000010"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b60006048602c8360bf565b91507f5072656465706c6f79204c325374616e64617264427269646765206973206e6f60008301527f7420737570706f727465642e00000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea2646970667358221220ce5c24ee894b04d974b95cd204ab35f85906430ba6f49d1ea70d3d0c9c204cb764736f6c63430008000033",
        ),
        (
            "SequencerFeeVault",
            hex!("4200000000000000000000000000000000000011"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b60006048602d8360bf565b91507f5072656465706c6f792053657175656e6365724665655661756c74206973206e60008301527f6f7420737570706f727465642e000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea26469706673582212203990ed752a94bb02bd5162fef116c1b62079e8207c5164b3ae5a115f5cf0b31164736f6c63430008000033",
        ),
        (
            "OptimismMintableERC20Factory",
            hex!("4200000000000000000000000000000000000012"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b6000604860388360bf565b91507f5072656465706c6f79204f7074696d69736d4d696e7461626c6545524332304660008301527f6163746f7279206973206e6f7420737570706f727465642e00000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea2646970667358221220240605543d69b93641a24f1d153969c3969089a04a162fc9f18f95de926b385564736f6c63430008000033",
        ),
        (
            "L1BlockNumber",
            hex!("4200000000000000000000000000000000000013"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b6000604860298360bf565b91507f5072656465706c6f79204c31426c6f636b4e756d626572206973206e6f74207360008301527f7570706f727465642e00000000000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea264697066735822122099ba6da366313d162bab19a497fab2200808ddd24935b9f8be496c3622110b1164736f6c63430008000033",
        ),
        (
            "GovernanceToken",
            hex!("4200000000000000000000000000000000000042"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b60006048602b8360bf565b91507f5072656465706c6f7920476f7665726e616e6365546f6b656e206973206e6f7460008301527f20737570706f727465642e0000000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea26469706673582212205a22322e97c15d3a28eb86abac215ed31bcf6e0cf562e2679ce5fb3495953cfc64736f6c63430008000033",
        ),
        (
            "L2ToL1MessagePasser",
            hex!("4200000000000000000000000000000000000016"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b60006048602f8360bf565b91507f5072656465706c6f79204c32546f4c314d65737361676550617373657220697360008301527f206e6f7420737570706f727465642e00000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea26469706673582212205b2ed2ecc932d0e4a45e97ae7ac256e58848453ac06733b27890587962871a1864736f6c63430008000033",
        ),
        (
            "L2ERC721Bridge",
            hex!("4200000000000000000000000000000000000014"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b60006048602a8360bf565b91507f5072656465706c6f79204c32455243373231427269646765206973206e6f742060008301527f737570706f727465642e000000000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea26469706673582212203f9de306b34383b29e9dfb174fd424d7e11d31e8859d0e96a2aa3a46609e826c64736f6c63430008000033",
        ),
        (
            "OptimismMintableERC721Factory",
            hex!("4200000000000000000000000000000000000017"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b6000604860398360bf565b91507f5072656465706c6f79204f7074696d69736d4d696e7461626c6545524337323160008301527f466163746f7279206973206e6f7420737570706f727465642e000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea264697066735822122033131ae0c34f3246f5031971388431bd1dfb1b92d6b08d92a0a905911c1eeeeb64736f6c63430008000033",
        ),
        (
            "ProxyAdmin",
            hex!("4200000000000000000000000000000000000018"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b6000604860268360bf565b91507f5072656465706c6f792050726f787941646d696e206973206e6f74207375707060008301527f6f727465642e00000000000000000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea2646970667358221220c7b191ff1b21c73fb6a26fd1e972d6844631a700b7a316ca2d9e04905af44dbb64736f6c63430008000033",
        ),
        (
            "BaseFeeVault",
            hex!("4200000000000000000000000000000000000019"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b6000604860288360bf565b91507f5072656465706c6f7920426173654665655661756c74206973206e6f7420737560008301527f70706f727465642e0000000000000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea2646970667358221220535ae2b8a6393c0be4de1dce095f5e17fc0c7a46b40ac7793db894328f1799e764736f6c63430008000033",
        ),
        (
            "L1FeeVault",
            hex!("420000000000000000000000000000000000001a"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b6000604860268360bf565b91507f5072656465706c6f79204c314665655661756c74206973206e6f74207375707060008301527f6f727465642e00000000000000000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea2646970667358221220dac6ab093c79da782b6e98ec67c48758f6c1cb80cba58e080c114a9b8c93befc64736f6c63430008000033",
        ),
        (
            "SchemaRegistry",
            hex!("4200000000000000000000000000000000000020"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060a1565b60405180910390fd5b60006048602a8360bf565b91507f5072656465706c6f7920536368656d615265676973747279206973206e6f742060008301527f737570706f727465642e000000000000000000000000000000000000000000006020830152604082019050919050565b6000602082019050818103600083015260b881603d565b9050919050565b60008282526020820190509291505056fea2646970667358221220b3daf5355920b581943cabb92a7cc67123467fdd1b054cb0c5f0e587c08da1be64736f6c63430008000033",
        ),
        (
            "EAS",
            hex!("4200000000000000000000000000000000000021"),
            "0x60806040526040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401603490607b565b60405180910390fd5b60006048601f836099565b91507f5072656465706c6f7920454153206973206e6f7420737570706f727465642e006000830152602082019050919050565b60006020820190508181036000830152609281603d565b9050919050565b60008282526020820190509291505056fea2646970667358221220afa6c1aa54a8b3f4f979e1297db5838a94353f3b77b5ecc164da19db26ea89f564736f6c63430008000033",
        ),
        (
            "OperatorFeeVault",
            hex!("0x420000000000000000000000000000000000001b"),
            "0x60806040526040517f08c379a000000000000000000000000000000000000000000000000000000000815260040160349060b9565b60405180910390fd5b5f82825260208201905092915050565b7f5072656465706c6f79204f70657261746f724665655661756c74206973206e6f5f8201527f7420737570706f727465642e0000000000000000000000000000000000000000602082015250565b5f60a5602c83603d565b915060ae82604d565b604082019050919050565b5f6020820190508181035f83015260ce81609b565b905091905056fea2646970667358221220dc3131d0ea77326c36012aee5dd9a870b6f07d76e6f55c8029da9d70a83f50c364736f6c634300081e0033",
        ),
    ];

    let stubbed_predeploys = stubbed_predeploys_data
        .iter()
        .map(|(name, address, code)| AccountOverride {
            address: address.into(),
            balance: Some(BigInt::from(0u64)),
            nonce: Some(BigInt::from(0u64)),
            code: Some(
                hex::decode(code)
                    .unwrap_or_else(|e| panic!("The bytecode for the {name} predeploy should be a valid hex string, got error: {e}"))
                    .into(),
            ),
            storage: Some(vec![]),
        });

    let predeploys = vec![gas_price_oracle_override(hardfork.into()), l1_block];

    predeploys.into_iter().chain(stubbed_predeploys).collect()
}

#[napi(catch_unwind)]
pub fn op_provider_factory() -> ProviderFactory {
    let factory: Arc<dyn SyncProviderFactory> = Arc::new(OpProviderFactory);
    factory.into()
}

fn gas_price_oracle_override(hardfork: edr_op::Hardfork) -> AccountOverride {
    if hardfork >= edr_op::Hardfork::ISTHMUS {
        gas_price_oracle_isthmus()
    } else if hardfork >= edr_op::Hardfork::FJORD {
        gas_price_oracle_fjord()
    } else {
        gas_price_oracle_ecotone()
    }
}

fn gas_price_oracle_ecotone() -> AccountOverride {
    AccountOverride {
        address: Uint8Array::with_data_copied(GAS_PRICE_ORACLE_ADDRESS),
        balance: None,
        nonce: None,
        code: Some(gas_price_oracle_code_ecotone().into()),
        storage: Some(vec![StorageSlot {
            index: BigInt::from(0u64),
            // bool isEcotone = true
            value: BigInt::from(
                0x0000000000000000000000000000000000000000000000000000000000000001u64,
            ),
        }]),
    }
}

fn gas_price_oracle_fjord() -> AccountOverride {
    AccountOverride {
        address: Uint8Array::with_data_copied(GAS_PRICE_ORACLE_ADDRESS),
        balance: None,
        nonce: None,
        code: Some(gas_price_oracle_code_fjord().into()),
        storage: Some(vec![StorageSlot {
            index: BigInt::from(0u64),
            // bool isEcotone = true
            // bool isFjord = true
            value: BigInt::from(
                0x0000000000000000000000000000000000000000000000000000000000000101u64,
            ),
        }]),
    }
}

fn gas_price_oracle_isthmus() -> AccountOverride {
    AccountOverride {
        address: Uint8Array::with_data_copied(GAS_PRICE_ORACLE_ADDRESS),
        balance: None,
        nonce: None,
        code: Some(gas_price_oracle_code_isthmus().into()),
        storage: Some(vec![StorageSlot {
            index: BigInt::from(0u64),
            // bool isEcotone = true
            // bool isFjord = true
            // bool isIsthmus = true
            value: BigInt::from(
                0x0000000000000000000000000000000000000000000000000000000000010101u64,
            ),
        }]),
    }
}
fn l1_block_storage(hardfork: edr_op::Hardfork) -> Vec<StorageSlot> {
    let mut base_storage = vec![
        StorageSlot {
            index: BigInt::from(0u64),
            // uint64 public number = 1
            // uint64 public timestamp = 1
            value: BigInt {
                words: vec![
                    0x0000000000000001_u64, // least significative
                    0x0000000000000001_u64,
                ],
                sign_bit: false,
            },
        },
        StorageSlot {
            index: BigInt::from(1u64),
            // uint256 baseFee = 10 gwei
            value: BigInt::from(0x00000002540be400_u64),
        },
        StorageSlot {
            index: BigInt::from(2u64),
            // bytes32 hash = 0
            value: BigInt::from(0u64),
        },
        StorageSlot {
            index: BigInt::from(3u64),
            // uint64 sequenceNumber = 0
            // uint32 blobBaseFeeScalar = 1014213
            // uint32 baseFeeScalar = 5227
            value: BigInt {
                words: vec![
                    0x0000000000000000_u64, // least significative
                    0x0000000000000000_u64,
                    0x00000000000f79c5_u64,
                    0x000000000000146b_u64,
                ],
                sign_bit: false,
            },
        },
        StorageSlot {
            index: BigInt::from(4u64),
            // bytes32 batcherHash = 0
            value: BigInt::from(0u64),
        },
        StorageSlot {
            index: BigInt::from(5u64),
            // uint256 l1FeeOverhead = 0
            value: BigInt::from(0u64),
        },
        StorageSlot {
            index: BigInt::from(6u64),
            // uint256 l1FeeScalar = 0
            value: BigInt::from(0u64),
        },
        StorageSlot {
            index: BigInt::from(7u64),
            // uint256 blobBaseFee = 10 gwei
            value: BigInt::from(0x00000002540be400_u64),
        },
    ];
    if hardfork >= edr_op::Hardfork::ISTHMUS {
        base_storage.push(StorageSlot {
            // Operator fee parameters
            index: BigInt::from(8u64),
            value: BigInt::from(0u64),
        });
    }
    base_storage
}

fn l1_block_code(hardfork: edr_op::Hardfork) -> Uint8Array {
    if hardfork >= edr_op::Hardfork::ISTHMUS {
        l1_block_code_isthmus().into()
    } else if hardfork >= edr_op::Hardfork::ECOTONE {
        l1_block_code_ecotone().into()
    } else {
        l1_block_code_bedrock().into()
    }
}

macro_rules! export_spec_id {
    ($($variant:ident,)*) => {
        $(
            #[napi]
            pub const $variant: &str = edr_op::hardfork::name::$variant;
        )*
    };
}

export_spec_id! {
    BEDROCK,
    REGOLITH,
    CANYON,
    ECOTONE,
    FJORD,
    GRANITE,
    HOLOCENE,
    ISTHMUS,
}
