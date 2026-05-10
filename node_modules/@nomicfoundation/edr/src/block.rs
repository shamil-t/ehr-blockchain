use napi::bindgen_prelude::BigInt;
use napi_derive::napi;

use crate::cast::TryCast;

/// Information about the blob gas used in a block.
#[napi(object)]
pub struct BlobGas {
    /// The total amount of blob gas consumed by the transactions within the
    /// block.
    pub gas_used: BigInt,
    /// The running total of blob gas consumed in excess of the target, prior to
    /// the block. Blocks with above-target blob gas consumption increase this
    /// value, blocks with below-target blob gas consumption decrease it
    /// (bounded at 0).
    pub excess_gas: BigInt,
}

impl TryFrom<BlobGas> for edr_block_header::BlobGas {
    type Error = napi::Error;

    fn try_from(value: BlobGas) -> Result<Self, Self::Error> {
        Ok(Self {
            gas_used: BigInt::try_cast(value.gas_used)?,
            excess_gas: BigInt::try_cast(value.excess_gas)?,
        })
    }
}
