# 🚜 AgroFi Latam - RWA Lending Protocol

**AgroFi** is a Decentralized Finance (DeFi) protocol that enables farmers in Latin America to tokenize real-world assets (RWAs) like crops or land and use them as collateral for crypto loans.

It integrates **Chainlink Functions** (AI Risk Oracle) to dynamically adjust loan-to-value (LTV) ratios based on real-time risk assessment (weather, market prices, etc.).

---

## 🏗 Architecture

* **AgroToken (ERC-1155):** Represents tokenized Real World Assets.
* **AgroLendingPool:** The bank core. Handles deposits, loans, and liquidations.
* **AgroRiskOracle:** Integrating Chainlink Functions to fetch off-chain AI data.
* **AccessControl:** Secure role-based permission system (Admin, Oracle, User).

---

## 🌐 Deployment to Sepolia Testnet

This project is configured to run on the **Sepolia** testnet.

### Prerequisites
1.  Get Sepolia ETH from [Alchemy Faucet](https://sepoliafaucet.com).
2.  Create a Subscription at [functions.chain.link](https://functions.chain.link/).
3.  Fund your subscription with LINK tokens.
4.  Update `.env` with `CHAINLINK_SUB_ID`.

### Deploy Command
```bash
npx hardhat deploy --network sepolia