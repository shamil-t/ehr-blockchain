Contract / Signer Dependency Inventory

Summary
This document identifies code locations that depend on an injected MetaMask signer and the impact surface for contract interactions.

Primary dependencies
- Provider abstraction
  - src\app\services\wallet.service.ts
    - Uses ethers.BrowserProvider(window.ethereum)
    - Exposes getWalletProvider(), getSigner(), getConnectedAccount(), getAccountBalance().
    - Relies on provider.listAccounts() to discover addresses.

- Signer usage
  - src\app\services\wallet.service.ts:getSigner -> provider.getSigner() returns a JsonRpcSigner used for transaction signing.

- Contracts created with signer
  - src\app\services\ehr-contract.service.ts
    - getContract() obtains signer via walletService.getSigner() and constructs: new Contract(CONTRACT_ADDRESS, ABI, signer)
    - Contract methods used: isUser, addUser/addDoctor/addPatient, getAllDoctors, getPatientProfile, getDoctorProfile, validateContract uses provider.getCode(...)

Runtime assumptions and constraints
- Assumes window.ethereum is present and that BrowserProvider.getSigner() yields a signer with an accessible "address" property.
- Assumes provider.listAccounts() returns at least one account; if not, connectedAccount may be empty and auth checks fail.
- Transactions returned by contract calls are awaited but not explicitly confirmed using TransactionResponse.wait(). This means UI may assume success earlier than chain-confirmed state.

Potential fragility points
- Contract creation tied to signer.address caching (ehr-contract.service.ts tracks signerAddress). If signer changes, contract is re-created, but logic depends on signer.address being present.
- validateContract() calls getCode(this.ehrContract.target). If Contract shape or property names differ across ethers versions, this could break.
- No provider fallback (e.g., JSON-RPC via Alchemy/Infura) for read-only calls; read operations currently use the same BrowserProvider tied to MetaMask.

Recommendations
- Centralize provider & signer initialization behind a WalletAdapter interface to support alternate providers and improve testability.
- Ensure contract-invoking methods return TransactionResponse and explicitly call tx.wait(confirmations?) where confirmation is required before updating UI/state.
- Add read-only provider fallback so read operations (isUser/getAllDoctors/etc.) can function without a connected signer (optional readonly provider).