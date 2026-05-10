use std::{str::FromStr, sync::Arc};

use edr_blockchain_fork::eips::{
    eip2935::{HISTORY_STORAGE_ADDRESS, HISTORY_STORAGE_UNSUPPORTED_BYTECODE},
    eip4788::{BEACON_ROOTS_ADDRESS, BEACON_ROOTS_BYTECODE},
};
use edr_chain_l1::L1ChainSpec;
use edr_napi_core::{
    logger::Logger,
    provider::{SyncProvider, SyncProviderFactory},
    subscription::subscriber_callback_for_chain_spec,
};
use edr_provider::time::CurrentTime;
use edr_solidity::contract_decoder::ContractDecoder;
use napi::{
    bindgen_prelude::{BigInt, Uint8Array},
    tokio::runtime,
};
use napi_derive::napi;
use parking_lot::RwLock;

use crate::{account::AccountOverride, provider::ProviderFactory};

pub struct L1ProviderFactory;

impl SyncProviderFactory for L1ProviderFactory {
    fn create_provider(
        &self,
        runtime: runtime::Handle,
        provider_config: edr_napi_core::provider::Config,
        logger_config: edr_napi_core::logger::Config,
        subscription_callback: edr_napi_core::subscription::Callback,
        contract_decoder: Arc<RwLock<ContractDecoder>>,
    ) -> napi::Result<Arc<dyn SyncProvider>> {
        let logger =
            Logger::<L1ChainSpec, CurrentTime>::new(logger_config, Arc::clone(&contract_decoder))?;

        let provider_config =
            edr_provider::ProviderConfig::<edr_chain_l1::Hardfork>::try_from(provider_config)?;

        let provider = edr_provider::Provider::<L1ChainSpec>::new(
            runtime.clone(),
            Box::new(logger),
            subscriber_callback_for_chain_spec::<L1ChainSpec, CurrentTime>(subscription_callback),
            provider_config,
            contract_decoder,
            CurrentTime,
        )
        .map_err(|error| napi::Error::new(napi::Status::GenericFailure, error.to_string()))?;

        Ok(Arc::new(provider))
    }
}

#[napi]
pub const L1_CHAIN_TYPE: &str = edr_chain_l1::CHAIN_TYPE;

#[napi(catch_unwind)]
pub fn l1_genesis_state(hardfork: SpecId) -> Vec<AccountOverride> {
    // Use closures for lazy execution
    let beacon_roots_account_constructor = || AccountOverride {
        address: Uint8Array::with_data_copied(BEACON_ROOTS_ADDRESS),
        balance: Some(BigInt::from(0u64)),
        nonce: Some(BigInt::from(0u64)),
        code: Some(Uint8Array::with_data_copied(&BEACON_ROOTS_BYTECODE)),
        storage: Some(Vec::new()),
    };

    let history_storage_account_constructor = || AccountOverride {
        address: Uint8Array::with_data_copied(HISTORY_STORAGE_ADDRESS),
        balance: Some(BigInt::from(0u64)),
        nonce: Some(BigInt::from(0u64)),
        code: Some(Uint8Array::with_data_copied(
            &HISTORY_STORAGE_UNSUPPORTED_BYTECODE,
        )),
        storage: Some(Vec::new()),
    };

    if hardfork < SpecId::Cancun {
        Vec::new()
    } else if hardfork < SpecId::Prague {
        vec![beacon_roots_account_constructor()]
    } else {
        vec![
            beacon_roots_account_constructor(),
            history_storage_account_constructor(),
        ]
    }
}

#[napi(catch_unwind)]
pub fn l1_provider_factory() -> ProviderFactory {
    let factory: Arc<dyn SyncProviderFactory> = Arc::new(L1ProviderFactory);
    factory.into()
}

/// Identifier for the Ethereum spec.
#[napi]
#[derive(PartialEq, Eq, PartialOrd, Ord)]
pub enum SpecId {
    /// Frontier
    Frontier = 0,
    /// Frontier Thawing
    FrontierThawing = 1,
    /// Homestead
    Homestead = 2,
    /// DAO Fork
    DaoFork = 3,
    /// Tangerine
    Tangerine = 4,
    /// Spurious Dragon
    SpuriousDragon = 5,
    /// Byzantium
    Byzantium = 6,
    /// Constantinople
    Constantinople = 7,
    /// Petersburg
    Petersburg = 8,
    /// Istanbul
    Istanbul = 9,
    /// Muir Glacier
    MuirGlacier = 10,
    /// Berlin
    Berlin = 11,
    /// London
    London = 12,
    /// Arrow Glacier
    ArrowGlacier = 13,
    /// Gray Glacier
    GrayGlacier = 14,
    /// Merge
    Merge = 15,
    /// Shanghai
    Shanghai = 16,
    /// Cancun
    Cancun = 17,
    /// Prague
    Prague = 18,
    /// Osaka
    Osaka = 19,
}

impl FromStr for SpecId {
    type Err = napi::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            edr_chain_l1::chains::name::FRONTIER => Ok(SpecId::Frontier),
            edr_chain_l1::chains::name::FRONTIER_THAWING => Ok(SpecId::FrontierThawing),
            edr_chain_l1::chains::name::HOMESTEAD => Ok(SpecId::Homestead),
            edr_chain_l1::chains::name::DAO_FORK => Ok(SpecId::DaoFork),
            edr_chain_l1::chains::name::TANGERINE => Ok(SpecId::Tangerine),
            edr_chain_l1::chains::name::SPURIOUS_DRAGON => Ok(SpecId::SpuriousDragon),
            edr_chain_l1::chains::name::BYZANTIUM => Ok(SpecId::Byzantium),
            edr_chain_l1::chains::name::CONSTANTINOPLE => Ok(SpecId::Constantinople),
            edr_chain_l1::chains::name::PETERSBURG => Ok(SpecId::Petersburg),
            edr_chain_l1::chains::name::ISTANBUL => Ok(SpecId::Istanbul),
            edr_chain_l1::chains::name::MUIR_GLACIER => Ok(SpecId::MuirGlacier),
            edr_chain_l1::chains::name::BERLIN => Ok(SpecId::Berlin),
            edr_chain_l1::chains::name::LONDON => Ok(SpecId::London),
            edr_chain_l1::chains::name::ARROW_GLACIER => Ok(SpecId::ArrowGlacier),
            edr_chain_l1::chains::name::GRAY_GLACIER => Ok(SpecId::GrayGlacier),
            edr_chain_l1::chains::name::MERGE => Ok(SpecId::Merge),
            edr_chain_l1::chains::name::SHANGHAI => Ok(SpecId::Shanghai),
            edr_chain_l1::chains::name::CANCUN => Ok(SpecId::Cancun),
            edr_chain_l1::chains::name::PRAGUE => Ok(SpecId::Prague),
            edr_chain_l1::chains::name::OSAKA => Ok(SpecId::Osaka),
            _ => Err(napi::Error::new(
                napi::Status::InvalidArg,
                format!("The provided hardfork `{s}` is not supported."),
            )),
        }
    }
}

impl From<SpecId> for edr_chain_l1::Hardfork {
    fn from(value: SpecId) -> Self {
        match value {
            SpecId::Frontier => edr_chain_l1::Hardfork::FRONTIER,
            SpecId::FrontierThawing => edr_chain_l1::Hardfork::FRONTIER_THAWING,
            SpecId::Homestead => edr_chain_l1::Hardfork::HOMESTEAD,
            SpecId::DaoFork => edr_chain_l1::Hardfork::DAO_FORK,
            SpecId::Tangerine => edr_chain_l1::Hardfork::TANGERINE,
            SpecId::SpuriousDragon => edr_chain_l1::Hardfork::SPURIOUS_DRAGON,
            SpecId::Byzantium => edr_chain_l1::Hardfork::BYZANTIUM,
            SpecId::Constantinople => edr_chain_l1::Hardfork::CONSTANTINOPLE,
            SpecId::Petersburg => edr_chain_l1::Hardfork::PETERSBURG,
            SpecId::Istanbul => edr_chain_l1::Hardfork::ISTANBUL,
            SpecId::MuirGlacier => edr_chain_l1::Hardfork::MUIR_GLACIER,
            SpecId::Berlin => edr_chain_l1::Hardfork::BERLIN,
            SpecId::London => edr_chain_l1::Hardfork::LONDON,
            SpecId::ArrowGlacier => edr_chain_l1::Hardfork::ARROW_GLACIER,
            SpecId::GrayGlacier => edr_chain_l1::Hardfork::GRAY_GLACIER,
            SpecId::Merge => edr_chain_l1::Hardfork::MERGE,
            SpecId::Shanghai => edr_chain_l1::Hardfork::SHANGHAI,
            SpecId::Cancun => edr_chain_l1::Hardfork::CANCUN,
            SpecId::Prague => edr_chain_l1::Hardfork::PRAGUE,
            SpecId::Osaka => edr_chain_l1::Hardfork::OSAKA,
        }
    }
}

/// Tries to parse the provided string to create a [`SpecId`] instance.
///
/// Returns an error if the string does not match any known hardfork.
#[napi(catch_unwind)]
pub fn l1_hardfork_from_string(hardfork: String) -> napi::Result<SpecId> {
    hardfork.parse()
}

#[napi(catch_unwind)]
pub fn l1_hardfork_to_string(harfork: SpecId) -> &'static str {
    match harfork {
        SpecId::Frontier => edr_chain_l1::chains::name::FRONTIER,
        SpecId::FrontierThawing => edr_chain_l1::chains::name::FRONTIER_THAWING,
        SpecId::Homestead => edr_chain_l1::chains::name::HOMESTEAD,
        SpecId::DaoFork => edr_chain_l1::chains::name::DAO_FORK,
        SpecId::Tangerine => edr_chain_l1::chains::name::TANGERINE,
        SpecId::SpuriousDragon => edr_chain_l1::chains::name::SPURIOUS_DRAGON,
        SpecId::Byzantium => edr_chain_l1::chains::name::BYZANTIUM,
        SpecId::Constantinople => edr_chain_l1::chains::name::CONSTANTINOPLE,
        SpecId::Petersburg => edr_chain_l1::chains::name::PETERSBURG,
        SpecId::Istanbul => edr_chain_l1::chains::name::ISTANBUL,
        SpecId::MuirGlacier => edr_chain_l1::chains::name::MUIR_GLACIER,
        SpecId::Berlin => edr_chain_l1::chains::name::BERLIN,
        SpecId::London => edr_chain_l1::chains::name::LONDON,
        SpecId::ArrowGlacier => edr_chain_l1::chains::name::ARROW_GLACIER,
        SpecId::GrayGlacier => edr_chain_l1::chains::name::GRAY_GLACIER,
        SpecId::Merge => edr_chain_l1::chains::name::MERGE,
        SpecId::Shanghai => edr_chain_l1::chains::name::SHANGHAI,
        SpecId::Cancun => edr_chain_l1::chains::name::CANCUN,
        SpecId::Prague => edr_chain_l1::chains::name::PRAGUE,
        SpecId::Osaka => edr_chain_l1::chains::name::OSAKA,
    }
}

/// Returns the latest supported OP hardfork.
///
/// The returned value will be updated after each network upgrade.
#[napi]
pub fn l1_hardfork_latest() -> SpecId {
    SpecId::Osaka
}

macro_rules! export_spec_id {
    ($($variant:ident),*) => {
        $(
            #[napi]
            pub const $variant: &str = edr_chain_l1::chains::name::$variant;
        )*
    };
}

export_spec_id!(
    FRONTIER,
    FRONTIER_THAWING,
    HOMESTEAD,
    DAO_FORK,
    TANGERINE,
    SPURIOUS_DRAGON,
    BYZANTIUM,
    CONSTANTINOPLE,
    PETERSBURG,
    ISTANBUL,
    MUIR_GLACIER,
    BERLIN,
    LONDON,
    ARROW_GLACIER,
    GRAY_GLACIER,
    MERGE,
    SHANGHAI,
    CANCUN,
    PRAGUE,
    OSAKA
);
