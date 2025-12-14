const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("👨‍🌾 Deploying with:", deployer.address);

  // 1. Deploy Tokens
  const AgroToken = await hre.ethers.getContractFactory("AgroToken");
  const agroToken = await AgroToken.deploy();
  await agroToken.waitForDeployment();
  console.log("✅ AgroToken:", await agroToken.getAddress());

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("✅ MockUSDC:", await usdc.getAddress());

  // 2. Deploy Pool
  const Pool = await hre.ethers.getContractFactory("AgroLendingPool");
  const pool = await Pool.deploy(await usdc.getAddress(), await agroToken.getAddress());
  await pool.waitForDeployment();
  console.log("🏦 LendingPool:", await pool.getAddress());

  // 3. Setup (Dar dinero al banco)
  await usdc.transfer(await pool.getAddress(), hre.ethers.parseUnits("50000", 6));
  console.log("💰 Pool fondeado");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});