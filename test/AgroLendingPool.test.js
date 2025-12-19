const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgroFi Senior System con IA", function () {
  let agroToken, usdc, pool, oracle;
  let owner, user;
  const ASSET_ID = 0;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    
    // 1. Deploys
    const AgroToken = await ethers.getContractFactory("AgroToken");
    agroToken = await AgroToken.deploy();
    
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    
    const Pool = await ethers.getContractFactory("AgroLendingPool");
    pool = await Pool.deploy(await usdc.getAddress(), await agroToken.getAddress());
    
    const Oracle = await ethers.getContractFactory("MockRiskOracle");
    oracle = await Oracle.deploy(await pool.getAddress());

    // --- SETUP DE SEGURIDAD ---
    const ORACLE_ROLE = await pool.ORACLE_ROLE();
    await pool.grantRole(ORACLE_ROLE, await oracle.getAddress());
    // El owner también actúa como Oracle para tests de límites
    await pool.grantRole(ORACLE_ROLE, owner.address);

    // --- SETUP DE FONDOS ---
    await usdc.transfer(await pool.getAddress(), ethers.parseUnits("50000", 6));
    await usdc.mintFaucet(); 
    await usdc.transfer(user.address, ethers.parseUnits("10000", 6));

    // --- SETUP DE RWA ---
    await agroToken.tokenizarHectarea("Granja Test", 50000, 100); 
    await agroToken.safeTransferFrom(owner.address, user.address, ASSET_ID, 100, "0x");
  });

  it("1. Debe permitir pedir prestado con LTV Default (70%)", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);
    await pool.connect(user).depositAndBorrow(ASSET_ID, 10);
    const balance = await usdc.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseUnits("13500", 6)); 
  });

  it("2. ORÁCULO: IA detecta bajo riesgo -> Sube préstamo (80%)", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);
    await oracle.updateRiskScore(ASSET_ID, 90);
    expect(await pool.getLTV(ASSET_ID)).to.equal(8000);
    await pool.connect(user).depositAndBorrow(ASSET_ID, 10);
    const balance = await usdc.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseUnits("14000", 6));
  });

  it("3. ORÁCULO: IA detecta ALTO riesgo -> Baja préstamo (40%)", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);
    await oracle.updateRiskScore(ASSET_ID, 20);
    expect(await pool.getLTV(ASSET_ID)).to.equal(4000);
    await pool.connect(user).depositAndBorrow(ASSET_ID, 10);
    const balance = await usdc.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseUnits("12000", 6));
  });

  it("4. SEGURIDAD: Un hacker no puede cambiar el LTV", async function () {
    await expect(pool.connect(user).setAssetCustomLTV(ASSET_ID, 9000)).to.be.reverted; 
  });

  it("5. REPAY: Debe permitir devolver el préstamo usando repayLoan", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);
    await pool.connect(user).depositAndBorrow(ASSET_ID, 10);
    
    const totalDue = await pool.getTotalDue(user.address, ASSET_ID);
    // Aprobamos un margen extra para intereses por paso del tiempo
    await usdc.connect(user).approve(await pool.getAddress(), totalDue + 100n);
    
    await expect(pool.connect(user).repayLoan(ASSET_ID)).to.emit(pool, "LoanRepaid");
    const rwaBalance = await agroToken.balanceOf(user.address, ASSET_ID);
    expect(rwaBalance).to.equal(100); 
  });

  it("6. LIQUIDATE: El Admin debe poder liquidar una deuda activa", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);
    await pool.connect(user).depositAndBorrow(ASSET_ID, 10);
    await expect(pool.connect(owner).liquidate(user.address, ASSET_ID)).to.emit(pool, "LoanLiquidated");
    const loan = await pool.loans(user.address, ASSET_ID);
    expect(loan.isActive).to.equal(false);
  });

  it("7. SEGURIDAD: No se puede liquidar algo que no existe", async function () {
    await expect(pool.connect(owner).liquidate(user.address, 999)).to.be.revertedWith("No activo");
  });

  it("8. LÍMITES: No debe permitir un LTV mayor al 90% (Cubre línea 120)", async function () {
    await expect(
        pool.connect(owner).setAssetCustomLTV(ASSET_ID, 9500)
    ).to.be.revertedWith("LTV muy alto (Max 90%)");
  });

  it("9. RESTRICCIONES: No debe permitir doble préstamo sobre el mismo activo", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);
    await pool.connect(user).depositAndBorrow(ASSET_ID, 10);
    await expect(
        pool.connect(user).depositAndBorrow(ASSET_ID, 10)
    ).to.be.revertedWith("Prestamo activo existente");
  });
});