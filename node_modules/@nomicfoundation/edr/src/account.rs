use derive_more::Debug;
use edr_primitives::{hex, Address, HashMap, U256};
use edr_solidity_tests::{backend::Predeploy, revm::state::AccountInfo};
use edr_state_api::EvmStorageSlot;
use napi::bindgen_prelude::{BigInt, Uint8Array};
use napi_derive::napi;

use crate::{
    cast::TryCast,
    serde::{
        serialize_bigint_as_struct, serialize_optional_bigint_as_struct,
        serialize_optional_uint8array_as_hex, serialize_uint8array_as_hex,
    },
};

/// Specification of overrides for an account and its storage.
#[napi(object)]
#[derive(Clone, Debug, serde::Serialize)]
pub struct AccountOverride {
    /// The account's address
    #[debug("{}", hex::encode(address))]
    #[serde(serialize_with = "serialize_uint8array_as_hex")]
    pub address: Uint8Array,
    /// If present, the overwriting balance.
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub balance: Option<BigInt>,
    /// If present, the overwriting nonce.
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub nonce: Option<BigInt>,
    /// If present, the overwriting code.
    #[debug("{:?}", code.as_ref().map(hex::encode))]
    #[serde(serialize_with = "serialize_optional_uint8array_as_hex")]
    pub code: Option<Uint8Array>,
    /// BEWARE: This field is not supported yet. See <https://github.com/NomicFoundation/edr/issues/911>
    ///
    /// If present, the overwriting storage.
    pub storage: Option<Vec<StorageSlot>>,
}

impl TryFrom<AccountOverride> for (Address, edr_provider::AccountOverride) {
    type Error = napi::Error;

    fn try_from(value: AccountOverride) -> Result<Self, Self::Error> {
        let AccountOverride {
            address,
            balance,
            nonce,
            code,
            storage,
        } = value;
        let storage = storage
            .map(|storage| {
                storage
                    .into_iter()
                    .map(|StorageSlot { index, value }| {
                        let value = value.try_cast()?;
                        let slot = EvmStorageSlot::new(value, 0);

                        let index: U256 = index.try_cast()?;
                        Ok((index, slot))
                    })
                    .collect::<napi::Result<_>>()
            })
            .transpose()?;

        let account_override = edr_provider::AccountOverride {
            balance: balance.map(TryCast::try_cast).transpose()?,
            nonce: nonce.map(TryCast::try_cast).transpose()?,
            code: code.map(TryCast::try_cast).transpose()?,
            storage,
        };

        let address: Address = address.try_cast()?;

        Ok((address, account_override))
    }
}

impl TryFrom<AccountOverride> for Predeploy {
    type Error = napi::Error;

    fn try_from(value: AccountOverride) -> Result<Self, Self::Error> {
        let (address, account_override) = value.try_into()?;

        let storage = account_override.storage.unwrap_or_else(HashMap::default);
        let balance = account_override.balance.unwrap_or(U256::ZERO);
        let nonce = account_override.nonce.unwrap_or(0);
        let code = account_override.code.ok_or_else(|| {
            napi::Error::from_reason(format!("Predeploy with address '{address}' must have code"))
        })?;

        if code.is_empty() {
            return Err(napi::Error::from_reason(
                "Predeploy with address '{address}' must have non-empty code",
            ));
        }
        let code_hash = code.hash_slow();

        let account_info = AccountInfo {
            balance,
            nonce,
            code_hash,
            code: Some(code),
        };

        Ok(Self {
            address,
            account_info,
            storage,
        })
    }
}

/// A description of a storage slot's state.
#[napi(object)]
#[derive(Clone, Debug, serde::Serialize)]
pub struct StorageSlot {
    /// The storage slot's index
    #[serde(serialize_with = "serialize_bigint_as_struct")]
    pub index: BigInt,
    /// The storage slot's value
    #[serde(serialize_with = "serialize_bigint_as_struct")]
    pub value: BigInt,
}
