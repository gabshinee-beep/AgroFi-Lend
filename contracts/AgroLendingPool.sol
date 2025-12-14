// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract AgroLendingPool is ReentrancyGuard, Pausable, Ownable, ERC1155Holder {
    
    IERC20 public immutable usdcToken;       
    IERC1155 public immutable agroToken;     

    // 1 Fraccion = $500 USDC (Con 6 decimales)
    uint256 public constant VALOR_POR_FRACCION = 500 * 1e6; 
    
    // Intereses: 5% Anual
    uint256 public constant INTEREST_RATE_BP = 500; // 500 bp = 5%
    uint256 public constant SECONDS_PER_YEAR = 31536000;
    uint256 public constant BASIS_POINTS = 10000;

    struct Loan {
        uint256 collateralAmount; 
        uint256 principal;        
        uint256 startTime;        
        bool isActive;            
    }

    mapping(address => mapping(uint256 => Loan)) public loans;
    uint256 public baseLTV = 7000; // 70%

    event LoanTaken(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount);
    event LoanLiquidated(address indexed user, address indexed liquidator);

    constructor(address _usdc, address _agroToken) Ownable(msg.sender) {
        usdcToken = IERC20(_usdc);
        agroToken = IERC1155(_agroToken);
    }

    // --- FUNCION PRINCIPAL: DEPOSITAR Y PEDIR ---
    function depositAndBorrow(uint256 _assetId, uint256 _amountCollateral) external nonReentrant whenNotPaused {
        require(!loans[msg.sender][_assetId].isActive, "Prestamo activo existente");
        
        // 1. Traer la garantia (RWA)
        agroToken.safeTransferFrom(msg.sender, address(this), _assetId, _amountCollateral, "");

        // 2. Calcular cuanto prestar
        uint256 assetValue = _amountCollateral * VALOR_POR_FRACCION;
        uint256 borrowAmount = (assetValue * baseLTV) / BASIS_POINTS;

        // 3. Guardar datos
        loans[msg.sender][_assetId] = Loan({
            collateralAmount: _amountCollateral,
            principal: borrowAmount,
            startTime: block.timestamp,
            isActive: true
        });

        // 4. Dar dinero
        require(usdcToken.balanceOf(address(this)) >= borrowAmount, "Sin liquidez");
        usdcToken.transfer(msg.sender, borrowAmount);
        
        emit LoanTaken(msg.sender, borrowAmount);
    }

    // --- FUNCION PAGAR ---
    function repayLoan(uint256 _assetId) external nonReentrant {
        Loan memory loan = loans[msg.sender][_assetId];
        require(loan.isActive, "No hay prestamo");

        // Calcular Interes
        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 interest = (loan.principal * INTEREST_RATE_BP * timeElapsed) / (SECONDS_PER_YEAR * BASIS_POINTS);
        uint256 totalDue = loan.principal + interest;

        // Cobrar
        usdcToken.transferFrom(msg.sender, address(this), totalDue);

        // Devolver Garantia
        agroToken.safeTransferFrom(address(this), msg.sender, _assetId, loan.collateralAmount, "");

        delete loans[msg.sender][_assetId];
        emit LoanRepaid(msg.sender, totalDue);
    }

    // --- FUNCION LIQUIDAR (SIMPLIFICADA) ---
    function liquidate(address _user, uint256 _assetId) external onlyOwner {
        Loan memory loan = loans[_user][_assetId];
        require(loan.isActive, "No activo");
        
        // En MVP, el admin se queda la garantia
        agroToken.safeTransferFrom(address(this), msg.sender, _assetId, loan.collateralAmount, "");
        delete loans[_user][_assetId];
        
        emit LoanLiquidated(_user, msg.sender);
    }

    // Helper para el test
    function getTotalDue(address _user, uint256 _assetId) external view returns (uint256) {
        Loan memory loan = loans[_user][_assetId];
        if (!loan.isActive) return 0;
        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 interest = (loan.principal * INTEREST_RATE_BP * timeElapsed) / (SECONDS_PER_YEAR * BASIS_POINTS);
        return loan.principal + interest;
    }
    
    // Helper para liquidacion
    function checkHealth(address _user, uint256 _assetId) public view returns (bool) {
         // Logica simplificada para el test: Siempre true a menos que forcemos liquidacion manual
         return loans[_user][_assetId].isActive;
    }
}