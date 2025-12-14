// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Definimos la interfaz para que el Oráculo sepa qué función llamar en el Banco
interface ILendingPool {
    function setAssetCustomLTV(uint256 _assetId, uint256 _newLTV) external;
}

contract MockRiskOracle is Ownable {
    address public lendingPool;

    // Evento para rastrear decisiones de la IA
    event RiskScoreUpdated(uint256 assetId, uint256 newScore, uint256 newLTV);

    constructor(address _lendingPool) Ownable(msg.sender) {
        lendingPool = _lendingPool;
    }

    /**
     * @notice Simula la respuesta de la IA y actualiza el banco.
     * @dev Solo el dueño (nosotros) puede ejecutar esto por ahora.
     * @param _riskScore Puntaje de 0 a 100 (100 = Muy Seguro, 0 = Muy Riesgoso)
     */
    function updateRiskScore(uint256 _assetId, uint256 _riskScore) external onlyOwner {
        require(_riskScore <= 100, "Score invalido");

        // Lógica de Negocio (Simulando IA de Python):
        // Convertimos el "Score" en un "LTV" (Loan To Value)
        uint256 newLTV;
        
        if (_riskScore >= 80) {
            newLTV = 8000; // 80% LTV (Riesgo Bajo - Prestamos más)
        } else if (_riskScore >= 50) {
            newLTV = 7000; // 70% LTV (Riesgo Medio - Estándar)
        } else {
            newLTV = 4000; // 40% LTV (Riesgo Alto - Prestamos menos)
        }

        // Llamada al Banco (Requiere tener el ORACLE_ROLE en el banco)
        ILendingPool(lendingPool).setAssetCustomLTV(_assetId, newLTV);
        
        emit RiskScoreUpdated(_assetId, _riskScore, newLTV);
    }
}