// scripts/01_deploy_tokens.cjs - Versión Final Limpia

const { ethers } = require("hardhat");

async function main() {
    console.log("=================================================");
    console.log("💎 RE-INTENTO DESPLIEGUE MOCKUSDC - ETHERS PURO");
    console.log("=================================================");

    // 1. MockUSDC (YA DESPLEGADO) 
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();

    console.log(`✅ MockUSDC (mUSDC) desplegado en: ${mockUSDCAddress}`);
    
    console.log("\n⚠️ ¡IMPORTANTE! Dirección Final:");
    console.log(`MockUSDC: ${mockUSDCAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});