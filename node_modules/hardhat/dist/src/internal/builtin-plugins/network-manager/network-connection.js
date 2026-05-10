export class NetworkConnectionImplementation {
    id;
    networkName;
    networkConfig;
    chainType;
    #provider;
    #closeConnection;
    static async create(id, networkName, chainType, networkConfig, closeConnection, createProvider) {
        const networkConnection = new NetworkConnectionImplementation(id, networkName, chainType, networkConfig, closeConnection);
        const provider = await createProvider(networkConnection);
        networkConnection.#setProvider(provider);
        return networkConnection;
    }
    constructor(id, networkName, chainType, networkConfig, closeConnection) {
        this.id = id;
        this.networkName = networkName;
        this.chainType = chainType;
        this.networkConfig = networkConfig;
        this.#closeConnection = closeConnection;
        this.close = this.close.bind(this);
    }
    get provider() {
        return this.#provider;
    }
    #setProvider(provider) {
        this.#provider = provider;
    }
    async close() {
        await this.#closeConnection(this);
    }
}
//# sourceMappingURL=network-connection.js.map