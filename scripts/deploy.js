const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("👨‍🌾 Deploying with account:", deployer.address);

  // 1. Deploy Contratos Base
  const AgroToken = await hre.ethers.getContractFactory("AgroToken");
  const agroToken = await AgroToken.deploy();
  await agroToken.waitForDeployment();
  console.log("✅ AgroToken:", await agroToken.getAddress());

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("✅ MockUSDC:", await usdc.getAddress());

  // 2. Deploy Lending Pool (El Banco)
  const Pool = await hre.ethers.getContractFactory("AgroLendingPool");
  const pool = await Pool.deploy(await usdc.getAddress(), await agroToken.getAddress());
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("🏦 LendingPool:", poolAddress);

  // 3. Deploy Oracle (El Cerebro)
  const Oracle = await hre.ethers.getContractFactory("MockRiskOracle");
  const oracle = await Oracle.deploy(poolAddress);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("🔮 Oracle:", oracleAddress);

  // 4. SEGURIDAD CRÍTICA: Conceder ROL, NO Ownership
  // Obtenemos el hash del rol desde el contrato
  const ORACLE_ROLE = await pool.ORACLE_ROLE();
  // Le damos ese rol a la dirección del Oráculo
  await pool.grantRole(ORACLE_ROLE, oracleAddress);
  console.log("🔐 Rol de Oráculo concedido correctamente (AccessControl)");

  // 5. Setup Inicial para pruebas manuales
  // Fondear Pool con $50,000
  await usdc.transfer(poolAddress, hre.ethers.parseUnits("50000", 6));
  
  // Crear una granja de prueba (ID 0)
  await agroToken.tokenizarHectarea("Granja Demo", 50000, 1000); 
  
  // El usuario aprueba al banco para mover sus tokens
  await agroToken.setApprovalForAll(poolAddress, true);

  // 6. Prueba en Vivo: La IA actualiza el riesgo
  console.log("🤖 IA actualizando riesgo...");
  await oracle.updateRiskScore(0, 90); // Score 90 = LTV 80%
  
  // Verificamos si el banco escuchó a la IA
  const newLTV = await pool.getLTV(0);
  console.log("📊 Nuevo LTV on-chain:", newLTV.toString(), "(Debería ser 8000)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});