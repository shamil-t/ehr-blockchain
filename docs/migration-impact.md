Migration Impact Document

Purpose
This document outlines the impact and recommended steps for migrating wallet and provider-related code (e.g., moving to WalletConnect, introducing ethers.Web3Provider, upgrading ethers.js, or decoupling MetaMask dependency).

Areas affected
1) Provider abstraction
- Current: BrowserProvider(window.ethereum) in wallet.service.ts
- Migration: if switching to Web3Provider or WalletConnectProvider, the WalletService must be refactored to accept multiple provider types and expose a consistent API (getSigner, listAccounts, request, on/off event handlers).

2) Signer & Contract code
- Current: ehr-contract.service constructs new Contract(address, ABI, signer)
- Migration: keep Contract usage but ensure signer shape (address property, send tx semantics) matches. Ethers v6 BrowserProvider and Web3Provider semantics differ slightly; add adapter layer to normalize.

3) Events & listeners
- Current: accountsChanged implemented; chainChanged missing
- Migration: add chainChanged handling (both for MetaMask and other providers). Ensure event interface compatibility across providers (WalletConnect may emit different events).

4) UX & Connect flow
- Current: no explicit connect flow; relies on provider.listAccounts
- Migration: implement explicit connect() that triggers provider.request({ method: 'eth_requestAccounts' }) or equivalent for WalletConnect.

5) Transaction confirmations
- Current: contract method calls returned/awaited but no tx.wait()
- Migration: adopt consistent pattern: tx = await contract.method(...); receipt = await tx.wait(); handle confirmations and errors, and make UI reflect pending/confirmed states.

6) Read-only fallback providers
- Introduce a read-only RPC provider (Alchemy/Infura/Local Anvil RPC) for read operations when no wallet is connected or to reduce reliance on MetaMask for reads. This requires adding environment variables and handling fallback provider resolution.

7) Tests & CI
- Add unit tests that mock WalletAdapter for wallet interactions and simulate accountsChanged/chainChanged events.
- Integration tests should include provider mocks for contract calls and transaction lifecycles.

Migration checklist (practical)
- [ ] Design WalletAdapter interface with methods: connect(), disconnect(), getProvider(), getSigner(), listAccounts(), on(event, cb), off(event, cb), request(args).
- [ ] Implement MetaMaskAdapter (wraps window.ethereum + BrowserProvider) and WalletConnectAdapter as needed.
- [ ] Refactor WalletService to use WalletAdapter; update imports across app.
- [ ] Update EhrContractService to accept either signer or readonly provider; separate read-only calls from write calls.
- [ ] Add chainChanged listener and validation; add network-switch helper using wallet_switchEthereumChain when appropriate.
- [ ] Ensure all contract write calls call tx.wait() and propagate transaction status to UI via UiFeedbackService.
- [ ] Update README with new setup steps for MetaMask and any new provider options; include env variable docs for fallback RPC.
- [ ] Add tests mocking adapters and asserting behavior for account/network changes and tx confirmations.

Backward compatibility notes
- Keep current BrowserProvider path as a supported adapter to avoid breaking existing workflows.
- If upgrading ethers.js major version, review Contract and Provider API changes (naming/return types) and test thoroughly.

Estimated effort
- Small refactor (1-2 dev days): Add explicit connect, tx.wait(), and chainChanged handler.
- Medium effort (2-4 dev days): Implement WalletAdapter abstraction and read-only fallback provider.
- Larger effort (5+ days): Full multi-provider support (WalletConnect, deep testing, CI integration).

End of document
