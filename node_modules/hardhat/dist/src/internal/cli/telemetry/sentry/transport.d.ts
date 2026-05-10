import type { Envelope, Transport, TransportMakeRequestResponse } from "@sentry/core";
/**
 * Creates a detached process transport.
 *
 * This transport spawns a detached process synchronously and sends the envelope
 * from there.
 *
 * This means that the Hardhat process doesn't have to wait for the request
 * to finish before exiting, flushing the transport, not closing the client.
 *
 * This is meant to be use as THE main transport in Hardhat.
 *
 * @param dsn The DSN to use to send the envelope to Sentry.
 * @param release The release/version of Hardhat.
 * @param environment The environment of Hardhat.
 * @param configPath The path to the config file.
 */
export declare function createDetachedProcessTransport(dsn: string, release: string, environment: string, getConfigPath: () => string | undefined): Transport;
/**
 * This is a `fetch`-backed transport that sends the envelope to Sentry's
 * backend.
 *
 * This is meant to be the fallback transport that is used in the detached
 * process that backs the other transport.
 *
 * If you use this transport, you should call `close` on the client before
 * exiting the process.
 */
export declare function createHttpTransport(dsn: string): Transport;
/**
 * Sends an envelope to Sentry's backend.
 *
 * This function is used both in the subprocess (to send envelopes received
 * from the main process) and as the core implementation for the
 * `createHttpTransport` transport.
 */
export declare function sendEnvelopeToSentryBackend(dsn: string, envelope: Envelope): Promise<TransportMakeRequestResponse>;
//# sourceMappingURL=transport.d.ts.map