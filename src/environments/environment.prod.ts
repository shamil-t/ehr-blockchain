export const environment = {
  production: true,
  blockchain: {
    rpc_url: 'http://127.0.0.1:8545',
    chainId: 31337,
    networkName: 'Anvil Local'
  }
};

export const IPFS = {
  localIPFS: 'http://127.0.0.1:5001/api/v0',
  localIPFSGet: 'http://127.0.0.1:8080/ipfs/'
};
