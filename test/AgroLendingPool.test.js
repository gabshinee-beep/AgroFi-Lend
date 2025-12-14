const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AgroLendingPool Senior MVP", function () {
  let agroToken, usdc, pool, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    
    // Deploys
    const AgroToken = await ethers.getContractFactory("AgroToken");
    agroToken = await AgroToken.deploy();
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    const Pool = await ethers.getContractFactory("AgroLendingPool");
    pool = await Pool.deploy(await usdc.getAddress(), await agroToken.getAddress());

    // Setup: Fondeo
    await usdc.transfer(await pool.getAddress(), ethers.parseUnits("50000", 6));
    await usdc.mintFaucet();
    await usdc.transfer(user.address, ethers.parseUnits("1000", 6));
    
    // Setup: Tokenizar
    await agroToken.tokenizarHectarea("Granja Demo", 50000, 100);
    await agroToken.safeTransferFrom(owner.address, user.address, 0, 100, "0x");
  });

  it("ESCENARIO 1: Depósito y Préstamo Exitoso", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);
    await pool.connect(user).depositAndBorrow(0, 10); // 10 fracciones
    
    // 10 fracciones * $500 = $5000. LTV 70% = $3500 prestado
    const balance = await usdc.balanceOf(user.address);
    expect(balance).to.be.above(ethers.parseUnits("3500", 6));
  });

  it("ESCENARIO 2: Repago con Intereses", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);
    await pool.connect(user).depositAndBorrow(0, 10);
    
    // Avanzar 1 año
    await time.increase(31536000); 

    // Aprobar pago (3500 + 5% interes aprox)
    await usdc.connect(user).approve(await pool.getAddress(), ethers.parseUnits("5000", 6));
    await pool.connect(user).repayLoan(0);

    // Verificar que recupero sus tokens
    expect(await agroToken.balanceOf(user.address, 0)).to.equal(100);
  });

  it("ESCENARIO 3: Fallo sin Approval", async function () {
    await expect(pool.connect(user).depositAndBorrow(0, 10)).to.be.reverted;
  });

  it("ESCENARIO 4: Liquidación Admin", async function () {
    await agroToken.connect(user).setApprovalForAll(await pool.getAddress(), true);
    await pool.connect(user).depositAndBorrow(0, 10);
    
    // El admin liquida
    await pool.connect(owner).liquidate(user.address, 0);
    
    // El admin se queda con los tokens
    expect(await agroToken.balanceOf(owner.address, 0)).to.be.above(0);
  });
});