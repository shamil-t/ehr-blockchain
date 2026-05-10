use edr_instrument::coverage::{self, Version};
use napi::bindgen_prelude::Uint8Array;
use napi_derive::napi;

#[napi(object)]
pub struct InstrumentationResult {
    /// The generated source code with coverage instrumentation.
    #[napi(readonly)]
    pub source: String,
    /// The metadata for each instrumented code segment.
    #[napi(readonly)]
    pub metadata: Vec<InstrumentationMetadata>,
}

impl TryFrom<edr_instrument::coverage::InstrumentationResult> for InstrumentationResult {
    type Error = usize;

    fn try_from(
        value: edr_instrument::coverage::InstrumentationResult,
    ) -> Result<Self, Self::Error> {
        let metadata = value
            .metadata
            .into_iter()
            .map(InstrumentationMetadata::try_from)
            .collect::<Result<Vec<_>, _>>()?;

        Ok(InstrumentationResult {
            source: value.source,
            metadata,
        })
    }
}

#[napi(object)]
pub struct InstrumentationMetadata {
    /// The tag that identifies the instrumented code. Tags are
    /// deterministically generated from the source code, source id, and
    /// Solidity version.
    #[napi(readonly)]
    pub tag: Uint8Array,
    /// The kind of instrumented code. Currently, the only supported kind
    /// is "statement".
    #[napi(readonly)]
    pub kind: String,
    /// The starting position of the instrumented code - including trivia such
    /// as whitespace - in the source code, in UTF-16 code units.
    #[napi(readonly)]
    pub start_utf16: i64,
    /// The ending position of the instrumented code - including trivia such as
    /// whitespace - in the source code, in UTF-16 code units.
    #[napi(readonly)]
    pub end_utf16: i64,
}

impl TryFrom<edr_instrument::coverage::InstrumentationMetadata> for InstrumentationMetadata {
    type Error = usize;

    fn try_from(
        value: edr_instrument::coverage::InstrumentationMetadata,
    ) -> Result<Self, Self::Error> {
        let start_utf16 = value
            .start_utf16
            .try_into()
            .map_err(|_error| value.start_utf16)?;
        let end_utf16 = value
            .end_utf16
            .try_into()
            .map_err(|_error| value.end_utf16)?;

        Ok(InstrumentationMetadata {
            tag: Uint8Array::with_data_copied(value.tag),
            kind: value.kind.to_owned(),
            start_utf16,
            end_utf16,
        })
    }
}

/// The instrumentation coverage library file name.
#[napi]
pub const COVERAGE_LIBRARY_FILE_NAME: &str = coverage::LIBRARY_FILE_NAME;

/// Adds per-statement coverage instrumentation to the given Solidity source
/// code.
#[napi(catch_unwind)]
pub fn add_statement_coverage_instrumentation(
    source_code: String,
    source_id: String,
    solidity_version: String,
) -> napi::Result<InstrumentationResult> {
    let solidity_version = Version::parse(&solidity_version).map_err(|error| {
        napi::Error::new(
            napi::Status::InvalidArg,
            format!("Invalid Solidity version: {error}"),
        )
    })?;

    let instrumented = coverage::instrument_code(&source_code, &source_id, solidity_version)
        .map_err(|error| napi::Error::new(napi::Status::GenericFailure, error))?;

    instrumented.try_into().map_err(|location| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("Cannot represent source locations in JavaScript: {location}."),
        )
    })
}

/// Retrieves the latest version of `Solidity` supported for instrumentation.
#[napi(catch_unwind)]
pub fn latest_supported_solidity_version() -> String {
    edr_instrument::LATEST_SUPPORTED_SOLIDITY_VERSION.to_string()
}
