const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AgroFi Senior System con IA", function () {
  let agroToken, usdc, pool, oracle;
  let owner, user;
  const ASSET_ID = 0;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    
    // Deploys
    const AgroToken = await ethers.getContractFactory("AgroToken");
    agroToken = await AgroToken.deploy();
    
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    
    const Pool = await ethers.getContractFactory("AgroLendingPool");
    pool = await Pool.deploy(await usdc.getAddress(), await agroToken.getAddress());
    
    const Oracle = await ethers.getContractFactory("MockRiskOracle");
    oracle = await Oracle.deploy(await pool.getAddress());

    // --- SETUP DE SEGURIDAD ---
    // Dar Rol de Oráculo al contrato MockRiskOracle
    const ORACLE_ROLE = await pool.ORACLE_ROLE();
    await pool.grantRole(ORACLE_ROLE, await oracle.getAddress());

    // --- SETUP DE FONDOS ---
    await usdc.transfer(await pool.getAddress(), ethers.parseUnits("50000", 6));
    await usdc.mintFaucet(); // Owner recibe
    await usdc.transfer(user.address, ethers.parseUnits("2000", 6));

    // --- SETUP DE RWA ---
    // Tokenizar y dar al usuario
    await agroToken.tokenizarHectarea("Granja Test", 50000, 100); 
    await agroToken.safeTransferFrom(owner.address, user.address, ASSET_ID, 100, "0x");
  });

  it("1. Debe permitir pedir prestado con LTV Default (70%)", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);
    
    // 10 fracciones ($5,000) al 70% = $3,500
    await pool.connect(user).depositAndBorrow(ASSET_ID, 10);
    
    const balance = await usdc.balanceOf(user.address);
    // Tenía 2000 + 3500 = 5500
    expect(balance).to.equal(ethers.parseUnits("5500", 6));
  });

  it("2. ORÁCULO: IA detecta bajo riesgo -> Sube préstamo (80%)", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);

    // LA IA ENTRA EN ACCIÓN: Score 90
    await oracle.updateRiskScore(ASSET_ID, 90);
    
    // Verificamos que el contrato actualizó el dato
    expect(await pool.getLTV(ASSET_ID)).to.equal(8000);

    // 10 fracciones ($5,000) al 80% = $4,000
    await pool.connect(user).depositAndBorrow(ASSET_ID, 10);

    const balance = await usdc.balanceOf(user.address);
    // Tenía 2000 + 4000 = 6000
    expect(balance).to.equal(ethers.parseUnits("6000", 6));
  });

  it("3. ORÁCULO: IA detecta ALTO riesgo -> Baja préstamo (40%)", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);

    // LA IA ENTRA EN ACCIÓN: Score 20 (Mal clima)
    await oracle.updateRiskScore(ASSET_ID, 20);
    
    expect(await pool.getLTV(ASSET_ID)).to.equal(4000);

    // 10 fracciones ($5,000) al 40% = $2,000
    await pool.connect(user).depositAndBorrow(ASSET_ID, 10);

    const balance = await usdc.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseUnits("4000", 6));
  });

  it("4. SEGURIDAD: Un hacker no puede cambiar el LTV", async function () {
    // Intentar llamar setAssetCustomLTV sin ser el oráculo
    await expect(
      pool.connect(user).setAssetCustomLTV(ASSET_ID, 9000)
    ).to.be.reverted; // AccessControl lo bloquea
  });
});