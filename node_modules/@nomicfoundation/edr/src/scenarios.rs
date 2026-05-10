use std::time::{SystemTime, UNIX_EPOCH};

use edr_scenarios::ScenarioConfig;
use napi::tokio::{fs::File, io::AsyncWriteExt, sync::Mutex};
use rand::{distributions::Alphanumeric, Rng};

const SCENARIO_FILE_PREFIX: &str = "EDR_SCENARIO_PREFIX";

/// Creates a scenario file with the provided configuration.
pub async fn scenario_file(
    chain_type: String,
    provider_config: edr_napi_core::provider::Config,
    logger_enabled: bool,
) -> napi::Result<Option<Mutex<File>>> {
    if let Ok(scenario_prefix) = std::env::var(SCENARIO_FILE_PREFIX) {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        let suffix = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(4)
            .map(char::from)
            .collect::<String>();

        let mut scenario_file =
            File::create(format!("{scenario_prefix}_{timestamp}_{suffix}.json")).await?;

        let config = ScenarioConfig {
            chain_type: Some(chain_type),
            logger_enabled,
            provider_config: provider_config.try_into()?,
        };
        let mut line = serde_json::to_string(&config)?;
        line.push('\n');
        scenario_file.write_all(line.as_bytes()).await?;

        Ok(Some(Mutex::new(scenario_file)))
    } else {
        Ok(None)
    }
}

/// Writes a JSON-RPC request to the scenario file.
pub async fn write_request(scenario_file: &Mutex<File>, request: &str) -> napi::Result<()> {
    let mut line = request.to_string();
    line.push('\n');
    {
        let mut scenario_file = scenario_file.lock().await;
        scenario_file.write_all(line.as_bytes()).await?;
    }
    Ok(())
}
