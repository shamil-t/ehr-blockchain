use napi::{bindgen_prelude::BigInt, JsFunction};
use napi_derive::napi;

/// Configuration for subscriptions.
#[napi(object)]
pub struct SubscriptionConfig {
    /// Callback to be called when a new event is received.
    #[napi(ts_type = "(event: SubscriptionEvent) => void")]
    pub subscription_callback: JsFunction,
}

impl From<edr_napi_core::subscription::Config> for SubscriptionConfig {
    fn from(config: edr_napi_core::subscription::Config) -> Self {
        Self {
            subscription_callback: config.subscription_callback,
        }
    }
}

impl From<SubscriptionConfig> for edr_napi_core::subscription::Config {
    fn from(config: SubscriptionConfig) -> Self {
        Self {
            subscription_callback: config.subscription_callback,
        }
    }
}

#[napi(object)]
pub struct SubscriptionEvent {
    pub filter_id: BigInt,
    pub result: serde_json::Value,
}
