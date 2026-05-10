export function mapEvent(event: {
    Type: number;
    ID: string;
    Extra: string;
    Responses: {
        ID: string;
        Addrs: string[];
    }[];
}): import('ipfs-core-types/src/dht').QueryEvent;
export type PeerId = import('@libp2p/interface-peer-id').PeerId;
export type Multiaddr = import('@multiformats/multiaddr').Multiaddr;
//# sourceMappingURL=map-event.d.ts.map