# AgroFi-Lend 🌾🏦 | DeFi for Agriculture

AgroFi-Lend es un protocolo de préstamos descentralizados (DeFi) diseñado para transformar el acceso al crédito en el sector agrícola peruano. Utiliza activos del mundo real (RWA) y oráculos de riesgo para conectar a agricultores con liquidez global.

## 📈 Métricas de Calidad y Seguridad
Para garantizar la integridad de los fondos, el protocolo ha sido sometido a pruebas exhaustivas:
- **Smart Contract Coverage:** **97.5%** (Lógica de préstamos, intereses y liquidaciones verificada).
- **Security Standards:** Implementación de `ReentrancyGuard`, `AccessControl` y `Pausable` de OpenZeppelin.
- **Oracle Integration:** Evaluación de riesgo climática/crediticia dinámica mediante Oráculos.

## 🚀 Contratos Verificados (Sepolia Testnet)
| Contrato | Dirección (Etherscan) |
| :--- | :--- |
| **AgroLendingPool** | [0x18De...8FE5](https://sepolia.etherscan.io/address/0x18De5c527a3350D11D035562d222Ea4A13EF8FE5#code) |
| **AgroRiskOracle** | [0x6554...4Acb](https://sepolia.etherscan.io/address/0x65545fa5F4732a6eb69123A810F81e2c534D4Acb#code) |
| **Mock USDC** | [0x6810...F1C9](https://sepolia.etherscan.io/address/0x681078F1139C2DD2362440C327218611690BF1C9#code) |

## 🇵🇪 El Problema que Resolvemos
En Perú, los pequeños agricultores enfrentan tasas de interés de hasta el 40% anual o la exclusión total del sistema financiero. **AgroFi-Lend** permite colateralizar hectáreas tokenizadas (RWA) para obtener préstamos en USDC con tasas justas, ajustando el LTV (Loan-to-Value) automáticamente según el riesgo detectado por la IA del Oráculo.

## 🛠️ Stack Técnico
- **Solidity ^0.8.20**: Smart contracts optimizados.
- **Hardhat & Solidity-Coverage**: Entorno de desarrollo y auditoría de tests.
- **Chainlink**: Arquitectura de Oráculos para datos externos.
- **ERC-1155**: Tokenización de activos agrícolas fraccionados.

## Instalación y Tests
```bash
npm install
npx hardhat test
npx hardhat coverage
