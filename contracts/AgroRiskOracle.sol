// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ******************************************************************************
// RUTAS DE IMPORTACIÓN 
// ******************************************************************************
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol"; 
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol"; 
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_3_0/FunctionsClient.sol"; 
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

// ******************************************************************************

contract AgroRiskOracle is FunctionsClient, ConfirmedOwner {
    
    // [VARIABLES Y ENUMS]
    enum RiskStatus { LOW, MEDIUM, HIGH }
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    address private immutable i_link;
    uint32 private immutable i_gasLimit;
    bytes private i_source; 
    uint64 private immutable i_subscriptionId;
    AggregatorV3Interface private immutable i_priceFeed;
    mapping(address => RiskStatus) public s_riskStatus;

    // AÑADIDO: Variable para almacenar la dirección del Lending Pool
    address public lendingPoolAddress;

    event RiskCalculated(address indexed user, uint8 status, string message); 
    event RequestSent(bytes32 indexed requestId, uint64 subscriptionId);
    event RequestFulfilled(bytes32 indexed requestId, bytes response, bytes err);

    constructor(
        address router,
        address link,
        uint32 gasLimit,
        uint64 subscriptionId,
        bytes memory source, 
        address priceFeedAddress
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        i_link = link;
        i_gasLimit = gasLimit;
        i_subscriptionId = subscriptionId;
        i_source = source;
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // =================================================================
    // FUNCIONES DEL ORÁCULO
    // =================================================================

    function requestRiskCalculation() public onlyOwner returns (bytes32) {
        // ... (Lógica de requestRiskCalculation)
        
        s_lastRequestId = _sendRequest(
            i_source, 
            i_gasLimit,
            uint32(i_subscriptionId), 
            bytes32(0) 
        );

        emit RequestSent(s_lastRequestId, i_subscriptionId);

        return s_lastRequestId;
    }

    // [CALLBACK Y UTILIDADES]
    
    function _fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        s_lastRequestId = requestId;
        s_lastResponse = response;
        s_lastError = err;
        
        if (err.length > 0) {
            return;
        }
        
        uint8 riskCode = abi.decode(response, (uint8));
        
        RiskStatus calculatedStatus; 
        string memory message;

        if (riskCode == 0) {
            calculatedStatus = RiskStatus.LOW;
            message = unicode"Riesgo: BAJO - Préstamo apto para aprobación."; 
        } else if (riskCode == 1) {
            calculatedStatus = RiskStatus.MEDIUM;
            message = unicode"Riesgo: MEDIO - Revisión manual recomendada."; 
        } else if (riskCode == 2) {
            calculatedStatus = RiskStatus.HIGH;
            message = unicode"Riesgo: ALTO - Préstamo rechazado."; 
        } else {
            return;
        }

        emit RiskCalculated(address(0), uint8(calculatedStatus), message); 
    }
    
    // =================================================================
    // FUNCIÓN DE ENLACE (NUEVA FUNCIÓN)
    // =================================================================

    /// @notice Permite al dueño (Owner) configurar la dirección del Lending Pool.
    function setLendingPool(address _lendingPoolAddress) public onlyOwner {
        lendingPoolAddress = _lendingPoolAddress;
    }

    // =================================================================

    function withdrawLink(address recipient) public onlyOwner {
        LinkTokenInterface(i_link).transfer(recipient, LinkTokenInterface(i_link).balanceOf(address(this)));
    }

    function getLatestPrice() public view returns (int256) {
        (
            , 
            int256 price,
            ,
            ,
            
        ) = i_priceFeed.latestRoundData();
        return price; // <-- ¡Punto y coma añadido aquí!
    }
}