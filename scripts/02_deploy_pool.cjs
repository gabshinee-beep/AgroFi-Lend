// scripts/02_deploy_pool.cjs
const { ethers } = require("hardhat");
require("dotenv").config();

// Estas direcciones se leen del archivo .env
const ORACLE_ADDRESS = process.env.AGRO_RISK_ORACLE_ADDRESS;
const USDC_ADDRESS = process.env.MOCK_USDC_ADDRESS;

async function main() {
    // CAMBIO CLAVE: Usamos getSigners en lugar de getNamedAccounts
    const [deployer] = await ethers.getSigners();
    
    console.log("=================================================");
    console.log("💰 DESPLIEGUE MANUAL DEL LENDING POOL (BANCO)...");
    console.log(`📡 Usando deployer: ${deployer.address}`);
    console.log("=================================================");

    if (!ORACLE_ADDRESS || !USDC_ADDRESS) {
        throw new Error("AGRO_RISK_ORACLE_ADDRESS o MOCK_USDC_ADDRESS no están configuradas en .env");
    }

    // 1. OBTENER FACTORY DEL CONTRATO
    const LendingPoolFactory = await ethers.getContractFactory("AgroLendingPool");
    
    // 2. DESPLIEGUE CON ARGUMENTOS (Oracle y USDC)
    console.log("Desplegando contrato... por favor espera.");
    const lendingPool = await LendingPoolFactory.deploy(ORACLE_ADDRESS, USDC_ADDRESS);
    
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();

    console.log(`\n✅ LendingPool desplegado en: ${lendingPoolAddress}`);
    console.log(`⚠️ ¡COPIA ESTA DIRECCIÓN PARA VERIFICAR!`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});