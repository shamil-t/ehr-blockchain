use std::sync::Arc;

use edr_napi_core::provider::SyncProviderFactory;
use napi_derive::napi;

#[napi]
pub struct ProviderFactory {
    inner: Arc<dyn SyncProviderFactory>,
}

impl ProviderFactory {
    /// Returns a reference to the inner provider factory.
    pub fn as_inner(&self) -> &Arc<dyn SyncProviderFactory> {
        &self.inner
    }
}

impl From<Arc<dyn SyncProviderFactory>> for ProviderFactory {
    fn from(inner: Arc<dyn SyncProviderFactory>) -> Self {
        Self { inner }
    }
}
