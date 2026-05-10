//! Rewrite of `hardhat-network/provider/return-data.ts` from Hardhat.

use alloy_sol_types::SolError;
use napi::bindgen_prelude::{BigInt, Uint8Array};
use napi_derive::napi;

// Built-in error types
// See <https://docs.soliditylang.org/en/v0.8.26/control-structures.html#error-handling-assert-require-revert-and-exceptions>
alloy_sol_types::sol! {
  error Error(string);
  error Panic(uint256);
}

#[napi]
pub struct ReturnData {
    #[napi(readonly)]
    pub value: Uint8Array,
    selector: Option<[u8; 4]>,
}

#[napi]
impl ReturnData {
    #[napi(catch_unwind, constructor)]
    pub fn new(value: Uint8Array) -> Self {
        let selector = value
            .get(0..4)
            .map(|selector| selector.try_into().expect("selector is 4 bytes"));

        Self { value, selector }
    }

    #[napi(catch_unwind)]
    pub fn is_empty(&self) -> bool {
        self.value.is_empty()
    }

    pub fn matches_selector(&self, selector: impl AsRef<[u8]>) -> bool {
        self.selector
            .is_some_and(|value| value == selector.as_ref())
    }

    #[napi(catch_unwind)]
    pub fn is_error_return_data(&self) -> bool {
        self.selector == Some(Error::SELECTOR)
    }

    #[napi(catch_unwind)]
    pub fn is_panic_return_data(&self) -> bool {
        self.selector == Some(Panic::SELECTOR)
    }

    #[napi(catch_unwind)]
    pub fn decode_error(&self) -> napi::Result<String> {
        if self.is_empty() {
            return Ok(String::new());
        }

        if !self.is_error_return_data() {
            return Err(napi::Error::new(
                napi::Status::InvalidArg,
                "VM Exception while processing transaction: Expected return data to be a Error(string)",
            ));
        }

        let result = Error::abi_decode(&self.value[..]).map_err(|_err| {
            napi::Error::new(
                napi::Status::InvalidArg,
                "VM Exception while processing transaction: Expected return data to contain a valid string",
            )
        })?;

        Ok(result.0)
    }

    #[napi(catch_unwind)]
    pub fn decode_panic(&self) -> napi::Result<BigInt> {
        if !self.is_panic_return_data() {
            return Err(napi::Error::new(
                napi::Status::InvalidArg,
                "VM Exception while processing transaction: Expected return data to be a Panic(uint256)",
            ));
        }

        let result = Panic::abi_decode(&self.value[..]).map_err(|_err| {
            napi::Error::new(
                napi::Status::InvalidArg,
                "VM Exception while processing transaction: Expected return data to contain a valid uint256",
            )
        })?;

        Ok(BigInt {
            sign_bit: false,
            words: result.0.as_limbs().to_vec(),
        })
    }
}
