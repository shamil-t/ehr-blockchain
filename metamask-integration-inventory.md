MetaMask Integration Inventory

Scope: entire repository (shamil-t/ehr-blockchain). Findings below are derived from code inspection.

1) Direct MetaMask / provider usage
- window.ethereum
  - src\app\services\wallet.service.ts: checks window.ethereum and listens to accountsChanged.
- ethers.BrowserProvider
  - src\app\services\wallet.service.ts: new BrowserProvider(window.ethereum)
- No usage found for ethers.Web3Provider.

2) Account retrieval and state
- provider.listAccounts()[0].address used to populate connectedAccount (wallet.service.ts:getConnectedAccount).
- connectedAccount implemented as an Angular WritableSignal and consumed across components.
- No explicit eth_requestAccounts or provider.request({ method: 'eth_requestAccounts' }) to initiate user connection.

3) Event listeners
- accountsChanged handled in src\app\services\wallet.service.ts (updates signer/provider, connectedAccount, and navigates).
- No chainChanged (network change) listener detected.

4) Transaction signing & confirmation
- Signer retrieved via provider.getSigner() (wallet.service.ts:getSigner).
- Contracts created with signer: src\app\services\ehr-contract.service.ts (new Contract(CONTRACT_ADDRESS, ABI, signer)).
- Contract methods (e.g., addUser/addDoctor/addPatient) are invoked and awaited but code does not call tx.wait() to explicitly wait for confirmations.

5) UI ties and messaging
- UI components read walletService.connectedAccount() (admin, doctor, patient dashboards, patient register).
- User-facing prompts for transactions: "Please confirm MetaMask Transaction" (src\app\admin\services\doctor.service.ts).
- Authentication gating (isAdmin/isDoctor/isPatient) depends on on-chain contract responses (ehr-contract.service.ts).

6) Missing or incomplete items
- No explicit connect UI or connect() function to trigger MetaMask permission prompt.
- No chain detection, chain validation, or wallet_switchEthereumChain logic.
- No explicit disconnect or cleanup API.
- No tests referencing or mocking MetaMask.
- No environment variables (Alchemy/Infura) for provider fallbacks — project expects local Anvil node.

7) Docs
- README.md mentions MetaMask but contains no detailed setup or connection instructions.

Recommendations (short)
- Add connect() that calls eth_requestAccounts and expose connect/disconnect methods.
- Add chainChanged listener and network validation (and optional chain-switch handling).
- Await transaction receipts via tx.wait() and update UI on confirmation/failure.
- Add README section with MetaMask setup, network expectations (Anvil/localhost), and troubleshooting tips.
