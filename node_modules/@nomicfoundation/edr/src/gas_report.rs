use std::collections::HashMap;

use napi::bindgen_prelude::BigInt;
use napi_derive::napi;

#[napi(object)]
pub struct GasReport {
    pub contracts: HashMap<String, ContractGasReport>,
}

#[napi(object)]
pub struct ContractGasReport {
    pub deployments: Vec<DeploymentGasReport>,
    pub functions: HashMap<String, Vec<FunctionGasReport>>,
}

#[napi]
pub enum GasReportExecutionStatus {
    Success,
    Revert,
    Halt,
}

#[napi(object)]
pub struct DeploymentGasReport {
    pub gas: BigInt,
    pub size: BigInt,
    pub runtime_size: BigInt,
    pub status: GasReportExecutionStatus,
}

#[napi(object)]
pub struct FunctionGasReport {
    pub gas: BigInt,
    pub status: GasReportExecutionStatus,
    /// The proxy delegation chain for this call, if the called contract is a
    /// proxy. Contains contract identifiers from outermost proxy to final
    /// implementation, e.g. `["Proxy", "Implementation"]`.
    /// Empty if the call is not through a proxy.
    pub proxy_chain: Vec<String>,
}

impl From<edr_gas_report::GasReport> for GasReport {
    fn from(value: edr_gas_report::GasReport) -> Self {
        Self {
            contracts: value
                .into_inner()
                .into_iter()
                .map(|(k, v)| (k, v.into()))
                .collect(),
        }
    }
}

impl From<edr_gas_report::ContractGasReport> for ContractGasReport {
    fn from(value: edr_gas_report::ContractGasReport) -> Self {
        Self {
            deployments: value.deployments.into_iter().map(Into::into).collect(),
            functions: value
                .functions
                .into_iter()
                .map(|(k, v)| {
                    let function_reports = v.into_iter().map(FunctionGasReport::from).collect();
                    (k, function_reports)
                })
                .collect(),
        }
    }
}

impl From<edr_gas_report::GasReportExecutionStatus> for GasReportExecutionStatus {
    fn from(value: edr_gas_report::GasReportExecutionStatus) -> Self {
        match value {
            edr_gas_report::GasReportExecutionStatus::Success => Self::Success,
            edr_gas_report::GasReportExecutionStatus::Revert => Self::Revert,
            edr_gas_report::GasReportExecutionStatus::Halt => Self::Halt,
        }
    }
}

impl From<edr_gas_report::DeploymentGasReport> for DeploymentGasReport {
    fn from(value: edr_gas_report::DeploymentGasReport) -> Self {
        Self {
            gas: BigInt::from(value.gas),
            size: BigInt::from(value.size),
            runtime_size: BigInt::from(value.runtime_size),
            status: value.status.into(),
        }
    }
}

impl From<edr_gas_report::FunctionGasReport> for FunctionGasReport {
    fn from(value: edr_gas_report::FunctionGasReport) -> Self {
        Self {
            gas: BigInt::from(value.gas),
            status: value.status.into(),
            proxy_chain: value.proxy_chain,
        }
    }
}
