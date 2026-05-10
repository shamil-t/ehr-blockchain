use edr_precompile::PrecompileFn;
use edr_primitives::Address;
use napi::bindgen_prelude::Uint8Array;
use napi_derive::napi;

#[napi]
#[derive(Clone)]
pub struct Precompile {
    address: Address,
    precompile_fn: PrecompileFn,
}

impl Precompile {
    pub fn new(address: Address, precompile_fn: PrecompileFn) -> Self {
        Self {
            address,
            precompile_fn,
        }
    }

    /// Returns the address and precompile function as a tuple.
    pub fn to_tuple(&self) -> (Address, PrecompileFn) {
        (self.address, self.precompile_fn)
    }
}

impl From<edr_precompile::Precompile> for Precompile {
    fn from(value: edr_precompile::Precompile) -> Self {
        Self {
            address: *value.address(),
            precompile_fn: value.into_precompile(),
        }
    }
}

#[napi]
impl Precompile {
    /// Returns the address of the precompile.
    #[napi(catch_unwind, getter)]
    pub fn address(&self) -> Uint8Array {
        Uint8Array::with_data_copied(self.address)
    }
}

/// [RIP-7212](https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md#specification)
/// secp256r1 precompile.
#[napi(catch_unwind)]
pub fn precompile_p256_verify() -> Precompile {
    Precompile::from(edr_precompile::secp256r1::P256VERIFY)
}
