Authentication Dependency Analysis

Overview
Authentication and role-based navigation are implemented by checking on-chain role state for the currently connected wallet address. The system relies on MetaMask as the single source of identity.

Key flows
- Account discovery
  - wallet.service.getConnectedAccount() uses provider.listAccounts() and sets connectedAccount (Angular signal).
  - Many components and services read walletService.connectedAccount() and react via effects to drive routing and UI state.

- Role validation
  - EhrContractService.isAdmin/isDoctor/isPatient call contract.isUser(account) (on-chain) to determine roles.
  - Results are used to gate navigation (redirect to register, dashboard, or root) and to display user-specific UI.

Tight coupling concerns
- No independent authentication layer: there is no server-side session, JWT, or signature-based auth flow. If wallet is not present or not connected, user cannot be authenticated.
- Implicit connect: absence of an explicit eth_requestAccounts call means initial account may be empty; UI components assume connectedAccount has a meaningful value and may redirect unexpectedly.
- No network checks: role checks assume the contract is deployed on the network MetaMask is connected to. If MetaMask is on another network, isUser calls may fail or return defaults.
- No transaction confirmation handling: operations that change state (addUser/addDoctor/addPatient) return immediately from contract call; without waiting for confirmations, UI can show success prematurely.

Security considerations
- Relying solely on client-side MetaMask state for authorization is acceptable for a dApp UX, but consider combining with server-side verification (e.g., signed-message-based JWT) for actions requiring additional auditability or cross-session persistence.
- Ensure contract calls (especially admin-only actions) properly use Solidity access control; client-side checks are convenience only.

Recommendations
- Add explicit connect flow (eth_requestAccounts) and a connect button in the UI; prevent role checks until connect completes.
- Add chain validation and explicit network requirement messaging (e.g., require localhost:8545/Anvil or a testnet) and optionally attempt wallet_switchEthereumChain when possible.
- Add tx.wait() usage to ensure UI waits for on-chain confirmations before showing success and triggering post-transaction reads (events/state update).
- Consider optional hybrid auth: when user connects, prompt to sign a nonce and exchange signed message for a server-side short-lived token (JWT) to enable session persistence and safer backend API access.

Impact of missing pieces
- Without eth_requestAccounts and chain checks, users may be redirected or shown register flows incorrectly.
- Lack of server-side auth prevents cross-device session continuity and makes testing certain flows harder.
