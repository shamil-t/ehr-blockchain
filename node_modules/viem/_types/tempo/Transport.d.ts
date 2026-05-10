import type { LocalAccount } from '../accounts/types.js';
import { type Transport } from '../clients/transports/createTransport.js';
type RelayProxyParameters = {
    /** Policy for how the relay should handle sponsored transactions. Defaults to `'sign-only'`. */
    policy?: 'sign-only' | 'sign-and-broadcast' | undefined;
};
export type FeePayer = Transport<typeof withFeePayer.type>;
export type Relay = Transport<typeof withRelay.type>;
/**
 * Creates a relay transport that routes requests between
 * the default transport or the relay transport.
 *
 * All `eth_fillTransaction` requests are sent to the relay with the request's
 * `feePayer` value preserved so the relay can decide whether to sponsor the transaction.
 *
 * The policy parameter controls how the relay handles sponsored transactions:
 * - `'sign-only'`: Relay co-signs the transaction and returns it to the client transport, which then broadcasts it via the default transport
 * - `'sign-and-broadcast'`: Relay co-signs and broadcasts the transaction directly
 *
 * @param defaultTransport - The default transport to use.
 * @param relayTransport - The relay transport to use.
 * @param parameters - Configuration parameters.
 * @returns A relay transport.
 */
export declare function withRelay(defaultTransport: Transport, relayTransport: Transport, parameters?: withRelay.Parameters): withRelay.ReturnValue;
export declare namespace withRelay {
    const type = "relay";
    type Parameters = RelayProxyParameters;
    type ReturnValue = Relay;
}
/** @deprecated Use `withRelay` instead. */
export declare function withFeePayer(defaultTransport: Transport, relayTransport: Transport, parameters?: withFeePayer.Parameters): withFeePayer.ReturnValue;
export declare namespace withFeePayer {
    const type = "feePayer";
    type Parameters = {
        /** Policy for how the fee payer should handle transactions. Defaults to `'sign-only'`. */
        policy?: 'sign-only' | 'sign-and-broadcast' | undefined;
    };
    type ReturnValue = FeePayer;
}
/**
 * Creates a transport that instruments a compatibility layer for
 * `wallet_` RPC actions (`sendCalls`, `getCallsStatus`, etc).
 *
 * @param transport - Transport to wrap.
 * @returns Transport.
 */
export declare function walletNamespaceCompat(transport: Transport, options: walletNamespaceCompat.Parameters): Transport;
export declare namespace walletNamespaceCompat {
    type Parameters = {
        account: LocalAccount;
    };
}
export {};
//# sourceMappingURL=Transport.d.ts.map