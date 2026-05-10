use std::{collections::HashMap, path::PathBuf};

use derive_more::Debug;
use edr_primitives::hex;
use edr_solidity_tests::{
    executors::invariant::InvariantConfig,
    fuzz::FuzzConfig,
    inspectors::cheatcodes::{CheatsConfigOptions, ExecutionContextConfig},
    TestFilterConfig,
};
use foundry_cheatcodes::{FsPermissions, RpcEndpointUrl, RpcEndpoints};
use napi::{
    bindgen_prelude::{BigInt, Uint8Array},
    tokio::runtime,
    Either, Status,
};
use napi_derive::napi;

use crate::{
    account::AccountOverride,
    cast::TryCast,
    config::ObservabilityConfig,
    serde::{
        serialize_optional_bigint_as_struct, serialize_optional_uint8array_as_hex,
        serialize_uint8array_as_hex,
    },
    solidity_tests::artifact::ArtifactId,
};

/// Solidity test runner configuration arguments exposed through the ffi.
/// Docs based on <https://book.getfoundry.sh/reference/config/testing>.
#[napi(object)]
#[derive(Debug, serde::Serialize)]
pub struct SolidityTestRunnerConfigArgs {
    /// The absolute path to the project root directory.
    /// Relative paths in cheat codes are resolved against this path.
    pub project_root: String,
    /// Configures the permissions of cheat codes that access the file system.
    pub fs_permissions: Option<Vec<PathPermission>>,
    /// Address labels for traces. Defaults to none.
    pub labels: Option<Vec<AddressLabel>>,
    /// Whether to enable isolation of calls. In isolation mode all top-level
    /// calls are executed as a separate transaction in a separate EVM
    /// context, enabling more precise gas accounting and transaction state
    /// changes.
    /// Defaults to false.
    pub isolate: Option<bool>,
    /// Whether or not to enable the ffi cheatcode.
    /// Warning: Enabling this cheatcode has security implications, as it allows
    /// tests to execute arbitrary programs on your computer.
    /// Defaults to false.
    pub ffi: Option<bool>,
    /// Allow expecting reverts with `expectRevert` at the same callstack depth
    /// as the test. Defaults to false.
    pub allow_internal_expect_revert: Option<bool>,
    /// The value of `msg.sender` in tests as hex string.
    /// Defaults to `0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38`.
    #[debug("{:?}", sender.as_ref().map(hex::encode))]
    #[serde(serialize_with = "serialize_optional_uint8array_as_hex")]
    pub sender: Option<Uint8Array>,
    /// The value of `tx.origin` in tests as hex string.
    /// Defaults to `0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38`.
    #[debug("{:?}", tx_origin.as_ref().map(hex::encode))]
    #[serde(serialize_with = "serialize_optional_uint8array_as_hex")]
    pub tx_origin: Option<Uint8Array>,
    /// The initial balance of the sender in tests.
    /// Defaults to `0xffffffffffffffffffffffff`.
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub initial_balance: Option<BigInt>,
    /// The value of `block.number` in tests.
    /// Defaults to `1`.
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub block_number: Option<BigInt>,
    /// The value of the `chainid` opcode in tests.
    /// Defaults to `31337`.
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub chain_id: Option<BigInt>,
    /// The hardfork to use for EVM execution.
    pub hardfork: String,
    /// The gas limit for each test case.
    /// Defaults to `9_223_372_036_854_775_807` (`i64::MAX`).
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub gas_limit: Option<BigInt>,
    /// The price of gas (in wei) in tests.
    /// Defaults to `0`.
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub gas_price: Option<BigInt>,
    /// The base fee per gas (in wei) in tests.
    /// Defaults to `0`.
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub block_base_fee_per_gas: Option<BigInt>,
    /// The value of `block.coinbase` in tests.
    /// Defaults to `0x0000000000000000000000000000000000000000`.
    #[serde(serialize_with = "serialize_optional_uint8array_as_hex")]
    #[debug("{:?}", block_coinbase.as_ref().map(hex::encode))]
    pub block_coinbase: Option<Uint8Array>,
    /// The value of `block.timestamp` in tests.
    /// Defaults to 1.
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub block_timestamp: Option<BigInt>,
    /// The value of `block.difficulty` in tests.
    /// Defaults to 0.
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub block_difficulty: Option<BigInt>,
    /// The `block.gaslimit` value during EVM execution.
    /// Defaults to none.
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub block_gas_limit: Option<BigInt>,
    /// Whether to disable the block gas limit.
    /// Defaults to false.
    pub disable_block_gas_limit: Option<bool>,
    /// Whether to enable the EIP-7825 (Osaka) transaction gas limit cap.
    /// Defaults to false.
    pub enable_tx_gas_limit_cap: Option<bool>,
    /// The memory limit of the EVM in bytes.
    /// Defaults to `33_554_432` (2^25 = 32MiB).
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub memory_limit: Option<BigInt>,
    /// The predeploys applied in local mode. Defaults to no predeploys.
    /// These should match the predeploys of the network in fork mode, so they
    /// aren't set in fork mode.
    /// The code must be set and non-empty. The nonce and the balance default to
    /// zero and storage defaults to empty.
    pub local_predeploys: Option<Vec<AccountOverride>>,
    /// If set, all tests are run in fork mode using this url or remote name.
    /// Defaults to none.
    pub eth_rpc_url: Option<String>,
    /// Pins the block number for the global state fork.
    #[serde(serialize_with = "serialize_optional_bigint_as_struct")]
    pub fork_block_number: Option<BigInt>,
    /// Map of RPC endpoints from chain name to RPC urls for fork cheat codes,
    /// e.g. `{ "optimism": "https://optimism.alchemyapi.io/v2/..." }`
    pub rpc_endpoints: Option<HashMap<String, String>>,
    /// Optional RPC cache path. If this is none, then no RPC calls will be
    /// cached, otherwise data is cached to `<rpc_cache_path>/<chain
    /// id>/<block number>`. Caching can be disabled for specific chains
    /// with `rpc_storage_caching`.
    pub rpc_cache_path: Option<String>,
    /// What RPC endpoints are cached. Defaults to all.
    pub rpc_storage_caching: Option<StorageCachingConfig>,
    /// The number of seconds to wait before `vm.prompt` reverts with a timeout.
    /// Defaults to 120.
    pub prompt_timeout: Option<u32>,
    /// Fuzz testing configuration.
    pub fuzz: Option<FuzzConfigArgs>,
    /// Invariant testing configuration.
    /// If an invariant config setting is not set, but a corresponding fuzz
    /// config value is set, then the fuzz config value will be used.
    pub invariant: Option<InvariantConfigArgs>,
    /// Whether to collect stack traces.
    pub collect_stack_traces: Option<CollectStackTraces>,
    /// Controls which test results should include execution traces. Defaults to
    /// None.
    pub include_traces: Option<IncludeTraces>,
    /// The configuration for the Solidity test runner's observability
    #[debug(skip)]
    #[serde(skip)]
    pub observability: Option<ObservabilityConfig>,
    /// A regex pattern to filter tests. If provided, only test methods that
    /// match the pattern will be executed and reported as a test result.
    pub test_pattern: Option<String>,
    /// Controls whether to generate a gas report after running the tests.
    /// Enabling this also enables collection of all traces and EVM isolation
    /// mode.
    /// Defaults to false.
    pub generate_gas_report: Option<bool>,
    /// Test function level config overrides.
    /// Defaults to none.
    pub test_function_overrides: Option<Vec<TestFunctionOverride>>,
    /// A list of EIP-712 canonical type definitions that can be referenced by
    /// type name in the `eip712HashType` and `eip712HashStruct` cheatcodes.
    ///
    /// Each entry is an independent, self-contained type definition. A
    /// definition that references nested struct types must inline those
    /// struct definitions, per the EIP-712 `encodeType` spec.
    ///
    /// Only the primary (leftmost) type of each entry is registered by name.
    /// Nested struct types referenced inside an entry are *not* registered
    /// under their own names. To look up a nested struct by name from a
    /// cheatcode, add it as a separate top-level entry whose primary type
    /// is the nested struct.
    ///
    /// The type of a struct is encoded as:
    ///
    /// `name ‖ "(" ‖ member₁ ‖ "," ‖ member₂ ‖ "," ‖ … ‖ memberₙ ")"`
    ///
    /// where each member is written as `type ‖ " " ‖ name`.
    ///
    /// Entries that fail to parse cause a startup error listing every bad
    /// entry.
    ///
    /// Example — to make both `Mail` and `Person` reachable by name:
    ///
    /// ```text
    /// "Mail(Person from,Person to,string contents)Person(address wallet,string name)"
    /// "Person(address wallet,string name)"
    /// ```
    ///
    /// With *only* the first entry, `vm.eip712HashType("Mail")` works but
    /// `vm.eip712HashType("Person")` fails with an unknown-type error.
    pub eip712_canonical_types: Option<Vec<String>>,
}

impl SolidityTestRunnerConfigArgs {
    /// Resolves the instance, converting it to a
    /// [`edr_napi_core::solidity::config::TestRunnerConfig`].
    pub fn resolve(
        self,
        env: &napi::Env,
        runtime: runtime::Handle,
    ) -> napi::Result<edr_napi_core::solidity::config::TestRunnerConfig> {
        let SolidityTestRunnerConfigArgs {
            project_root,
            fs_permissions,
            labels,
            isolate,
            ffi,
            allow_internal_expect_revert,
            sender,
            tx_origin,
            initial_balance,
            block_number,
            chain_id,
            hardfork,
            gas_limit,
            gas_price,
            block_base_fee_per_gas,
            block_coinbase,
            block_timestamp,
            block_difficulty,
            block_gas_limit,
            disable_block_gas_limit,
            enable_tx_gas_limit_cap,
            memory_limit,
            local_predeploys,
            eth_rpc_url,
            rpc_cache_path,
            fork_block_number,
            rpc_endpoints,
            rpc_storage_caching,
            prompt_timeout,
            fuzz,
            invariant,
            collect_stack_traces,
            include_traces,
            observability,
            test_pattern,
            generate_gas_report,
            test_function_overrides,
            eip712_canonical_types,
        } = self;

        let test_pattern = TestFilterConfig {
            test_pattern: test_pattern
                .as_ref()
                .map(|p| {
                    p.parse()
                        .map_err(|error| napi::Error::new(Status::InvalidArg, error))
                })
                .transpose()?,
        };

        let local_predeploys = local_predeploys
            .map(|local_predeploys| {
                local_predeploys
                    .into_iter()
                    .map(TryInto::try_into)
                    .collect::<Result<Vec<_>, _>>()
            })
            .transpose()?;

        let invariant: InvariantConfig = fuzz
            .as_ref()
            .map(|f| invariant.clone().unwrap_or_default().defaults_from_fuzz(f))
            .or(invariant)
            .map(TryFrom::try_from)
            .transpose()?
            .unwrap_or_default();

        let fuzz: FuzzConfig = fuzz.map(TryFrom::try_from).transpose()?.unwrap_or_default();

        let cheatcode = CheatsConfigOptions {
            // TODO https://github.com/NomicFoundation/edr/issues/657
            // If gas reporting or coverage is supported, take that into account here.
            execution_context: ExecutionContextConfig::Test,
            rpc_endpoints: rpc_endpoints
                .map(|endpoints| {
                    RpcEndpoints::new(
                        endpoints
                            .into_iter()
                            .map(|(chain, url)| (chain, RpcEndpointUrl::new(url))),
                    )
                })
                .unwrap_or_default(),
            rpc_cache_path: rpc_cache_path.map(PathBuf::from),
            rpc_storage_caching: rpc_storage_caching
                .map(TryFrom::try_from)
                .transpose()?
                .unwrap_or_default(),
            fs_permissions: FsPermissions::new(
                fs_permissions
                    .unwrap_or_default()
                    .into_iter()
                    .map(Into::into),
            ),
            prompt_timeout: prompt_timeout.map_or(120, Into::into),
            labels: labels
                .unwrap_or_default()
                .into_iter()
                .map(|AddressLabel { address, label }| Ok((address.try_cast()?, label)))
                .collect::<Result<_, napi::Error>>()?,
            seed: fuzz.seed,
            allow_internal_expect_revert: allow_internal_expect_revert.unwrap_or(false),
            functions_internal_expect_revert: test_function_overrides
                .as_ref()
                .map(|overrides| {
                    overrides
                        .iter()
                        .filter(|override_item| {
                            override_item
                                .config
                                .allow_internal_expect_revert
                                .unwrap_or_default()
                        })
                        .map(|override_item| override_item.identifier.clone().try_into())
                        .collect::<Result<_, _>>()
                })
                .transpose()?
                .unwrap_or_default(),
            eip712_types_by_name: foundry_cheatcodes::parse_eip712_canonical_types(
                eip712_canonical_types.unwrap_or_default(),
            )
            .map_err(|errors| {
                let msg = errors
                    .iter()
                    .map(ToString::to_string)
                    .collect::<Vec<_>>()
                    .join("; ");
                napi::Error::new(Status::InvalidArg, msg)
            })?,
        };

        let on_collected_coverage_fn = observability.map_or_else(
            || Ok(None),
            |observability| {
                observability
                    .resolve(env, runtime)
                    .map(|config| config.on_collected_coverage_fn)
            },
        )?;

        let config = edr_napi_core::solidity::config::TestRunnerConfig {
            project_root: project_root.into(),
            include_traces: include_traces.unwrap_or_default().into(),
            isolate,
            ffi,
            sender: sender.map(TryCast::try_cast).transpose()?,
            tx_origin: tx_origin.map(TryCast::try_cast).transpose()?,
            initial_balance: initial_balance.map(TryCast::try_cast).transpose()?,
            block_number: block_number.map(TryCast::try_cast).transpose()?,
            chain_id: chain_id.map(TryCast::try_cast).transpose()?,
            hardfork,
            gas_limit: gas_limit.map(TryCast::try_cast).transpose()?,
            gas_price: gas_price.map(TryCast::try_cast).transpose()?,
            block_base_fee_per_gas: block_base_fee_per_gas.map(TryCast::try_cast).transpose()?,
            block_coinbase: block_coinbase.map(TryCast::try_cast).transpose()?,
            block_timestamp: block_timestamp.map(TryCast::try_cast).transpose()?,
            block_difficulty: block_difficulty.map(TryCast::try_cast).transpose()?,
            block_gas_limit: block_gas_limit.map(TryCast::try_cast).transpose()?,
            disable_block_gas_limit,
            enable_tx_gas_limit_cap,
            memory_limit: memory_limit.map(TryCast::try_cast).transpose()?,
            local_predeploys,
            fork_url: eth_rpc_url,
            fork_block_number: fork_block_number.map(TryCast::try_cast).transpose()?,
            cheatcode,
            fuzz,
            invariant,
            collect_stack_traces: collect_stack_traces.map_or(
                edr_solidity_tests::CollectStackTraces::OnFailure,
                edr_solidity_tests::CollectStackTraces::from,
            ),
            on_collected_coverage_fn,
            test_pattern,
            generate_gas_report,
            test_function_overrides: test_function_overrides
                .map(|overrides| {
                    overrides
                        .into_iter()
                        .map(|override_item| {
                            Ok::<_, napi::Error>((
                                override_item.identifier.try_into()?,
                                override_item.config.into(),
                            ))
                        })
                        .collect::<Result<HashMap<_, _>, _>>()
                })
                .transpose()?,
        };

        Ok(config)
    }
}

/// Fuzz testing configuration
#[napi(object)]
#[derive(Clone, Debug, Default, serde::Serialize)]
pub struct FuzzConfigArgs {
    /// Path where fuzz failures are recorded and replayed if set.
    pub failure_persist_dir: Option<String>,
    /// Name of the file to record fuzz failures, defaults to `failures`.
    pub failure_persist_file: Option<String>,
    /// The amount of fuzz runs to perform for each fuzz test case. Higher
    /// values gives more confidence in results at the cost of testing
    /// speed.
    /// Defaults to 256.
    pub runs: Option<u32>,
    /// The maximum number of combined inputs that may be rejected before the
    /// test as a whole aborts. “Global” filters apply to the whole test
    /// case. If the test case is rejected, the whole thing is regenerated.
    /// Defaults to 65536.
    pub max_test_rejects: Option<u32>,
    /// Hexadecimal string.
    /// Optional seed for the fuzzing RNG algorithm.
    /// Defaults to None.
    pub seed: Option<String>,
    /// Integer between 0 and 100.
    /// The weight of the dictionary. A higher dictionary weight will bias the
    /// fuzz inputs towards “interesting” values, e.g. boundary values like
    /// type(uint256).max or contract addresses from your environment.
    /// Defaults to 40.
    pub dictionary_weight: Option<u32>,
    /// The flag indicating whether to include values from storage.
    /// Defaults to true.
    pub include_storage: Option<bool>,
    /// The flag indicating whether to include push bytes values.
    /// Defaults to true.
    pub include_push_bytes: Option<bool>,
    /// Show `console.log` in fuzz test.
    /// Defaults to false.
    pub show_logs: Option<bool>,
    /// Optional timeout (in seconds) for each property test.
    /// Defaults to none (no timeout).
    pub timeout: Option<u32>,
}

impl TryFrom<FuzzConfigArgs> for FuzzConfig {
    type Error = napi::Error;

    fn try_from(value: FuzzConfigArgs) -> Result<Self, Self::Error> {
        let FuzzConfigArgs {
            failure_persist_dir,
            failure_persist_file,
            runs,
            max_test_rejects,
            seed,
            dictionary_weight,
            include_storage,
            include_push_bytes,
            show_logs,
            timeout,
        } = value;

        let failure_persist_dir = failure_persist_dir.map(PathBuf::from);
        let failure_persist_file = failure_persist_file.unwrap_or_else(|| "failures".to_string());
        let seed = seed
            .map(|s| {
                s.parse().map_err(|_err| {
                    napi::Error::new(Status::InvalidArg, format!("Invalid seed value: {s}"))
                })
            })
            .transpose()?;

        let mut fuzz = FuzzConfig {
            seed,
            failure_persist_dir,
            failure_persist_file,
            // TODO https://github.com/NomicFoundation/edr/issues/657
            gas_report_samples: 0,
            timeout,
            ..FuzzConfig::default()
        };

        if let Some(runs) = runs {
            fuzz.runs = runs;
        }

        if let Some(max_test_rejects) = max_test_rejects {
            fuzz.max_test_rejects = max_test_rejects;
        }

        if let Some(dictionary_weight) = dictionary_weight {
            fuzz.dictionary.dictionary_weight = dictionary_weight;
        }

        if let Some(include_storage) = include_storage {
            fuzz.dictionary.include_storage = include_storage;
        }

        if let Some(include_push_bytes) = include_push_bytes {
            fuzz.dictionary.include_push_bytes = include_push_bytes;
        }

        if let Some(show_logs) = show_logs {
            fuzz.show_logs = show_logs;
        }

        Ok(fuzz)
    }
}

impl SolidityTestRunnerConfigArgs {
    pub fn try_get_test_filter(&self) -> napi::Result<TestFilterConfig> {
        let test_pattern = self
            .test_pattern
            .as_ref()
            .map(|p| {
                p.parse()
                    .map_err(|e| napi::Error::new(Status::InvalidArg, e))
            })
            .transpose()?;
        Ok(TestFilterConfig { test_pattern })
    }
}

/// Invariant testing configuration.
#[napi(object)]
#[derive(Clone, Debug, Default, serde::Serialize)]
pub struct InvariantConfigArgs {
    /// Path where invariant failures are recorded and replayed if set.
    pub failure_persist_dir: Option<String>,
    /// The number of runs that must execute for each invariant test group.
    /// Defaults to 256.
    pub runs: Option<u32>,
    /// The number of calls executed to attempt to break invariants in one run.
    /// Defaults to 500.
    pub depth: Option<u32>,
    /// Fails the invariant fuzzing if a revert occurs.
    /// Defaults to false.
    pub fail_on_revert: Option<bool>,
    /// Overrides unsafe external calls when running invariant tests, useful for
    /// e.g. performing reentrancy checks.
    /// Defaults to false.
    pub call_override: Option<bool>,
    /// Integer between 0 and 100.
    /// The weight of the dictionary. A higher dictionary weight will bias the
    /// fuzz inputs towards “interesting” values, e.g. boundary values like
    /// type(uint256).max or contract addresses from your environment.
    /// Defaults to 40.
    pub dictionary_weight: Option<u32>,
    /// The flag indicating whether to include values from storage.
    /// Defaults to true.
    pub include_storage: Option<bool>,
    /// The flag indicating whether to include push bytes values.
    /// Defaults to true.
    pub include_push_bytes: Option<bool>,
    /// The maximum number of attempts to shrink a failed the sequence. Shrink
    /// process is disabled if set to 0.
    /// Defaults to 5000.
    pub shrink_run_limit: Option<u32>,
    /// The maximum number of rejects via `vm.assume` which can be encountered
    /// during a single invariant run.
    /// Defaults to 65536.
    pub max_assume_rejects: Option<u32>,
    /// Optional timeout (in seconds) for each invariant test.
    /// Defaults to none (no timeout).
    pub timeout: Option<u32>,
}

impl InvariantConfigArgs {
    /// Fill in fields from the fuzz config if they are not set.
    fn defaults_from_fuzz(mut self, fuzz: &FuzzConfigArgs) -> Self {
        let FuzzConfigArgs {
            failure_persist_dir,
            runs,
            dictionary_weight,
            include_storage,
            include_push_bytes,
            // These aren't used in the invariant config.
            failure_persist_file: _,
            max_test_rejects: _,
            seed: _,
            show_logs: _,
            timeout,
        } = fuzz;

        if self.failure_persist_dir.is_none() {
            self.failure_persist_dir.clone_from(failure_persist_dir);
        }

        if self.runs.is_none() {
            self.runs = *runs;
        }

        if self.dictionary_weight.is_none() {
            self.dictionary_weight = *dictionary_weight;
        }

        if self.include_storage.is_none() {
            self.include_storage = *include_storage;
        }

        if self.include_push_bytes.is_none() {
            self.include_push_bytes = *include_push_bytes;
        }

        if self.timeout.is_none() {
            self.timeout = *timeout;
        }

        self
    }
}

impl From<InvariantConfigArgs> for InvariantConfig {
    fn from(value: InvariantConfigArgs) -> Self {
        let InvariantConfigArgs {
            failure_persist_dir,
            runs,
            depth,
            fail_on_revert,
            call_override,
            dictionary_weight,
            include_storage,
            include_push_bytes,
            shrink_run_limit,
            max_assume_rejects,
            timeout,
        } = value;

        let failure_persist_dir = failure_persist_dir.map(PathBuf::from);

        let mut invariant = InvariantConfig {
            failure_persist_dir,
            // TODO https://github.com/NomicFoundation/edr/issues/657
            gas_report_samples: 0,
            timeout,
            ..InvariantConfig::default()
        };

        if let Some(runs) = runs {
            invariant.runs = runs;
        }

        if let Some(depth) = depth {
            invariant.depth = depth;
        }

        if let Some(fail_on_revert) = fail_on_revert {
            invariant.fail_on_revert = fail_on_revert;
        }

        if let Some(call_override) = call_override {
            invariant.call_override = call_override;
        }

        if let Some(dictionary_weight) = dictionary_weight {
            invariant.dictionary.dictionary_weight = dictionary_weight;
        }

        if let Some(include_storage) = include_storage {
            invariant.dictionary.include_storage = include_storage;
        }

        if let Some(include_push_bytes) = include_push_bytes {
            invariant.dictionary.include_push_bytes = include_push_bytes;
        }

        if let Some(shrink_run_limit) = shrink_run_limit {
            invariant.shrink_run_limit = shrink_run_limit;
        }

        if let Some(max_assume_rejects) = max_assume_rejects {
            invariant.max_assume_rejects = max_assume_rejects;
        }

        invariant
    }
}

/// Settings to configure caching of remote RPC endpoints.
#[napi(object)]
#[derive(Clone, Debug, serde::Serialize)]
pub struct StorageCachingConfig {
    /// Chains to cache. Either all or none or a list of chain names, e.g.
    /// ["optimism", "mainnet"].
    pub chains: Either<CachedChains, Vec<String>>,
    /// Endpoints to cache. Either all or remote or a regex.
    pub endpoints: Either<CachedEndpoints, String>,
}

impl Default for StorageCachingConfig {
    fn default() -> Self {
        Self {
            chains: Either::A(CachedChains::default()),
            endpoints: Either::A(CachedEndpoints::default()),
        }
    }
}

impl TryFrom<StorageCachingConfig> for foundry_cheatcodes::StorageCachingConfig {
    type Error = napi::Error;

    fn try_from(value: StorageCachingConfig) -> Result<Self, Self::Error> {
        let chains = match value.chains {
            Either::A(chains) => chains.into(),
            Either::B(chains) => {
                let chains = chains
                    .into_iter()
                    .map(|c| {
                        c.parse()
                            .map_err(|c| napi::Error::new(Status::InvalidArg, c))
                    })
                    .collect::<Result<_, _>>()?;
                foundry_cheatcodes::CachedChains::Chains(chains)
            }
        };
        let endpoints = match value.endpoints {
            Either::A(endpoints) => endpoints.into(),
            Either::B(regex) => {
                let regex = regex.parse().map_err(|_err| {
                    napi::Error::new(Status::InvalidArg, format!("Invalid regex: {regex}"))
                })?;
                foundry_cheatcodes::CachedEndpoints::Pattern(regex)
            }
        };
        Ok(Self { chains, endpoints })
    }
}

/// What chains to cache
#[napi]
#[derive(Debug, Default, serde::Serialize)]
pub enum CachedChains {
    /// Cache all chains
    #[default]
    All,
    /// Don't cache anything
    None,
}

impl From<CachedChains> for foundry_cheatcodes::CachedChains {
    fn from(value: CachedChains) -> Self {
        match value {
            CachedChains::All => foundry_cheatcodes::CachedChains::All,
            CachedChains::None => foundry_cheatcodes::CachedChains::None,
        }
    }
}

/// What endpoints to enable caching for
#[napi]
#[derive(Debug, Default, serde::Serialize)]
pub enum CachedEndpoints {
    /// Cache all endpoints
    #[default]
    All,
    /// Only cache non-local host endpoints
    Remote,
}

impl From<CachedEndpoints> for foundry_cheatcodes::CachedEndpoints {
    fn from(value: CachedEndpoints) -> Self {
        match value {
            CachedEndpoints::All => foundry_cheatcodes::CachedEndpoints::All,
            CachedEndpoints::Remote => foundry_cheatcodes::CachedEndpoints::Remote,
        }
    }
}

/// Represents an access permission to a single path
#[napi(object)]
#[derive(Clone, Debug, serde::Serialize)]
pub struct PathPermission {
    /// Permission level to access the `path`
    pub access: FsAccessPermission,
    /// The targeted path guarded by the permission
    pub path: String,
}

impl From<PathPermission> for foundry_cheatcodes::PathPermission {
    fn from(value: PathPermission) -> Self {
        let PathPermission { access, path } = value;
        Self {
            access: access.into(),
            path: path.into(),
        }
    }
}

/**
 * Determines the level of file system access for the given path.
 *
 * Exact path matching is used for file permissions. Prefix matching is used
 * for directory permissions.
 *
 * Giving write access to configuration files, source files or executables
 * in a project is considered dangerous, because it can be used by malicious
 * Solidity dependencies to escape the EVM sandbox. It is therefore
 * recommended to give write access to specific safe files only. If write
 * access to a directory is needed, please make sure that it doesn't contain
 * configuration files, source files or executables neither in the top level
 * directory, nor in any subdirectories.
 */
#[napi]
#[derive(Debug, serde::Serialize)]
pub enum FsAccessPermission {
    /// Allows reading and writing the file
    ReadWriteFile,
    /// Only allows reading the file
    ReadFile,
    /// Only allows writing the file
    WriteFile,
    /// Allows reading and writing all files in the directory and its
    /// subdirectories
    DangerouslyReadWriteDirectory,
    /// Allows reading all files in the directory and its subdirectories
    ReadDirectory,
    /// Allows writing all files in the directory and its subdirectories
    DangerouslyWriteDirectory,
}

impl From<FsAccessPermission> for foundry_cheatcodes::FsAccessPermission {
    fn from(value: FsAccessPermission) -> Self {
        match value {
            FsAccessPermission::ReadWriteFile => {
                foundry_cheatcodes::FsAccessPermission::ReadWriteFile
            }
            FsAccessPermission::ReadFile => foundry_cheatcodes::FsAccessPermission::ReadFile,
            FsAccessPermission::WriteFile => foundry_cheatcodes::FsAccessPermission::WriteFile,
            FsAccessPermission::DangerouslyReadWriteDirectory => {
                foundry_cheatcodes::FsAccessPermission::DangerouslyReadWriteDirectory
            }
            FsAccessPermission::ReadDirectory => {
                foundry_cheatcodes::FsAccessPermission::ReadDirectory
            }
            FsAccessPermission::DangerouslyWriteDirectory => {
                foundry_cheatcodes::FsAccessPermission::DangerouslyWriteDirectory
            }
        }
    }
}

#[napi(object)]
#[derive(Clone, Debug, serde::Serialize)]
pub struct AddressLabel {
    /// The address to label
    #[serde(serialize_with = "serialize_uint8array_as_hex")]
    #[debug("{}", hex::encode(address))]
    pub address: Uint8Array,
    /// The label to assign to the address
    pub label: String,
}

/// A type that controls when stack traces are collected.
#[napi]
#[derive(Debug, serde::Serialize)]
pub enum CollectStackTraces {
    /// Always collects stack traces, adding performance overhead.
    Always,
    /// Only collects stack traces upon failure, re-executing the test. This
    /// minimizes performance overhead.
    ///
    /// Not all tests can be re-executed since certain cheatcodes contain
    /// non-deterministic side-effects.
    OnFailure,
}

impl From<CollectStackTraces> for edr_solidity_tests::CollectStackTraces {
    fn from(value: CollectStackTraces) -> Self {
        match value {
            CollectStackTraces::Always => edr_solidity_tests::CollectStackTraces::Always,
            CollectStackTraces::OnFailure => edr_solidity_tests::CollectStackTraces::OnFailure,
        }
    }
}

/// Configuration that controls whether execution traces are decoded and
/// included in results.
///
/// This can either be for Solidity test results or provider transaction
/// execution results.
#[napi]
#[derive(Debug, Default, PartialEq, Eq, serde::Serialize)]
pub enum IncludeTraces {
    /// No traces will be included at all.
    #[default]
    None,
    /// Traces will be included only on the results of failed tests or
    /// execution.
    Failing,
    /// Traces will be included for all test results or executed transactions.
    All,
}

impl From<IncludeTraces> for edr_solidity::config::IncludeTraces {
    fn from(value: IncludeTraces) -> Self {
        match value {
            IncludeTraces::None => edr_solidity::config::IncludeTraces::None,
            IncludeTraces::Failing => edr_solidity::config::IncludeTraces::Failing,
            IncludeTraces::All => edr_solidity::config::IncludeTraces::All,
        }
    }
}

impl From<edr_solidity::config::IncludeTraces> for IncludeTraces {
    fn from(value: edr_solidity::config::IncludeTraces) -> Self {
        match value {
            edr_solidity::config::IncludeTraces::None => IncludeTraces::None,
            edr_solidity::config::IncludeTraces::Failing => IncludeTraces::Failing,
            edr_solidity::config::IncludeTraces::All => IncludeTraces::All,
        }
    }
}

/// Test function level config override.
#[napi(object)]
#[derive(Clone, Debug, Default, serde::Serialize)]
pub struct TestFunctionConfigOverride {
    /// Allow expecting reverts with `expectRevert` at the same callstack depth
    /// as the test.
    pub allow_internal_expect_revert: Option<bool>,
    /// Whether to enable isolation of calls for the test. In isolation mode all
    /// top-level calls are executed as a separate transaction in a separate
    /// EVM context, enabling more precise gas accounting and transaction
    /// state changes.
    /// Ignored when gas reporting is enabled, as isolation is required for
    /// accurate gas measurements.
    pub isolate: Option<bool>,
    /// The EVM version to use for this test, e.g. "Cancun". This will override
    /// the global EVM version.
    pub evm_version: Option<String>,
    /// Configuration override for fuzz testing.
    pub fuzz: Option<FuzzConfigOverride>,
    /// Configuration override for invariant testing.
    pub invariant: Option<InvariantConfigOverride>,
}

impl From<TestFunctionConfigOverride> for edr_solidity_tests::TestFunctionConfigOverride {
    fn from(value: TestFunctionConfigOverride) -> Self {
        Self {
            allow_internal_expect_revert: value.allow_internal_expect_revert,
            isolate: value.isolate,
            evm_version: value.evm_version,
            fuzz: value.fuzz.map(Into::into),
            invariant: value.invariant.map(Into::into),
        }
    }
}

/// Test function override configuration.
#[napi(object)]
#[derive(Clone, Debug, serde::Serialize)]
pub struct TestFunctionOverride {
    /// The test function identifier.
    pub identifier: TestFunctionIdentifier,
    /// The configuration override.
    pub config: TestFunctionConfigOverride,
}

/// Test function identifier.
#[napi(object)]
#[derive(Clone, Debug, serde::Serialize)]
pub struct TestFunctionIdentifier {
    /// The contract artifact id.
    pub contract_artifact: ArtifactId,
    /// The function selector as hex string.
    pub function_selector: String,
}

impl TryFrom<TestFunctionIdentifier> for foundry_cheatcodes::TestFunctionIdentifier {
    type Error = napi::Error;

    fn try_from(value: TestFunctionIdentifier) -> napi::Result<Self> {
        Ok(foundry_cheatcodes::TestFunctionIdentifier {
            contract_artifact: value.contract_artifact.try_into()?,
            function_selector: value.function_selector,
        })
    }
}

/// Timeout configuration.
/// Note: This wrapper is needed to avoid ambiguity with NAPI conversion.
#[napi(object)]
#[derive(Clone, Debug, Default, serde::Serialize)]
pub struct TimeoutConfig {
    /// Optional timeout (in seconds).
    pub time: Option<u32>,
}

impl From<TimeoutConfig> for edr_solidity_tests::TimeoutConfig {
    fn from(value: TimeoutConfig) -> Self {
        Self { time: value.time }
    }
}

/// Test function or test contract level fuzz config override.
#[napi(object)]
#[derive(Clone, Debug, Default, serde::Serialize)]
pub struct FuzzConfigOverride {
    /// The number of test cases that must execute for each property test.
    pub runs: Option<u32>,
    /// The maximum number of test case rejections allowed by proptest, to be
    /// encountered during usage of `vm.assume` cheatcode. This will be used
    /// to set the `max_global_rejects` value in proptest test runner config.
    /// `max_local_rejects` option isn't exposed here since we're not using
    /// `prop_filter`.
    pub max_test_rejects: Option<u32>,
    /// show `console.log` in fuzz test, defaults to `false`.
    pub show_logs: Option<bool>,
    /// Optional timeout (in seconds) for each property test.
    pub timeout: Option<TimeoutConfig>,
}

impl From<FuzzConfigOverride> for edr_solidity_tests::FuzzConfigOverride {
    fn from(value: FuzzConfigOverride) -> Self {
        Self {
            runs: value.runs,
            max_test_rejects: value.max_test_rejects,
            show_logs: value.show_logs,
            timeout: value.timeout.map(Into::into),
        }
    }
}

/// Test function or test contract level invariant config override.
#[napi(object)]
#[derive(Clone, Debug, Default, serde::Serialize)]
pub struct InvariantConfigOverride {
    /// The number of runs that must execute for each invariant test group.
    pub runs: Option<u32>,
    /// The number of calls executed to attempt to break invariants in one run.
    pub depth: Option<u32>,
    /// Fails the invariant fuzzing if a revert occurs.
    pub fail_on_revert: Option<bool>,
    /// Allows overriding an unsafe external call when running invariant tests.
    /// eg. reentrancy checks
    pub call_override: Option<bool>,
    /// Optional timeout (in seconds) for each invariant test.
    pub timeout: Option<TimeoutConfig>,
}

impl From<InvariantConfigOverride> for edr_solidity_tests::InvariantConfigOverride {
    fn from(value: InvariantConfigOverride) -> Self {
        Self {
            runs: value.runs,
            depth: value.depth,
            fail_on_revert: value.fail_on_revert,
            call_override: value.call_override,
            timeout: value.timeout.map(Into::into),
        }
    }
}
