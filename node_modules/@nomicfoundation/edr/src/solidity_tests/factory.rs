use std::sync::Arc;

use edr_napi_core::solidity::SyncTestRunnerFactory;
use napi_derive::napi;

#[napi]
pub struct SolidityTestRunnerFactory {
    inner: Arc<dyn SyncTestRunnerFactory>,
}

impl SolidityTestRunnerFactory {
    /// Returns a reference to the inner test runner factory.
    pub fn as_inner(&self) -> &Arc<dyn SyncTestRunnerFactory> {
        &self.inner
    }
}

impl From<Arc<dyn SyncTestRunnerFactory>> for SolidityTestRunnerFactory {
    fn from(inner: Arc<dyn SyncTestRunnerFactory>) -> Self {
        Self { inner }
    }
}
