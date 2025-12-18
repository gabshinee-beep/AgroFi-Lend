// 04_setup_permissions.cjs
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    // ==========================================================
    // 1. CARGA DE CUENTAS Y CONTRATOS
    // ==========================================================
    const [deployer] = await ethers.getSigners();
    const DEPLOYER_ADDRESS = deployer.address;

    // Obtener direcciones de entorno (del archivo .env)
    const POOL_ADDRESS = process.env.LENDING_POOL_ADDRESS;
    const ORACLE_ADDRESS = process.env.AGRO_RISK_ORACLE_ADDRESS;

    if (!POOL_ADDRESS || !ORACLE_ADDRESS) {
        throw new Error("Missing LENDING_POOL_ADDRESS or AGRO_RISK_ORACLE_ADDRESS in .env");
    }

    // Cargar artefactos de contrato
    const LendingPool = await ethers.getContractFactory("AgroLendingPool", deployer);
    const AgroRiskOracle = await ethers.getContractFactory("AgroRiskOracle", deployer);

    const lendingPool = await LendingPool.attach(POOL_ADDRESS);
    const agroRiskOracle = await AgroRiskOracle.attach(ORACLE_ADDRESS);

    console.log("=================================================");
    console.log("🔗 CONFIGURACIÓN DE PERMISOS FINALES...");
    console.log(`📡 Usando deployer: ${DEPLOYER_ADDRESS}`);
    console.log("=================================================");

    // ==========================================================
    // 2. CONFIGURACIÓN DEL LENDING POOL (Permitir que el Oráculo escriba)
    // ==========================================================
    console.log(`\nConfigurando Lending Pool (${POOL_ADDRESS})...`);

    // Definir el rol de Oráculo (es un hash constante)
    const ORACLE_ROLE = await lendingPool.ORACLE_ROLE();
    
    // 1. Asignar el ORACLE_ROLE al Oráculo.
    console.log(`Asignando ORACLE_ROLE (${ORACLE_ROLE}) al Oráculo...`);

    if (!(await lendingPool.hasRole(ORACLE_ROLE, ORACLE_ADDRESS))) {
        const txGrantRole = await lendingPool.grantRole(ORACLE_ROLE, ORACLE_ADDRESS);
        await txGrantRole.wait();
        console.log(`✅ Rol de Oráculo otorgado al Oráculo en tx: ${txGrantRole.hash}`);
    } else {
        console.log("✅ Rol de Oráculo ya asignado.");
    }


    // ==========================================================
    // 3. CONFIGURACIÓN DEL ORÁCULO (Decirle al Oráculo dónde está el Pool)
    // ==========================================================
    console.log(`\nConfigurando Oráculo (${ORACLE_ADDRESS})...`);

    // CORRECCIÓN: Forzamos el gasLimit y la sintaxis para evitar errores de estimación.
    
    console.log("-> Ejecutando setLendingPool para garantizar el enlace (con gas forzado)...");
    
    // Llamamos a la función de configuración (setLendingPool).
    const txSetPool = await agroRiskOracle.setLendingPool(POOL_ADDRESS, {
        gasLimit: 4000000 // Límite de gas forzado
    }); 
    await txSetPool.wait();
    
    // MENSAJE DE ÉXITO FINAL:
    console.log(`✅ Lending Pool configurado en el Oráculo en tx: ${txSetPool.hash}`);
    
    console.log("\n=================================================");
    console.log("🚀 ¡DESPLIEGUE FINALIZADO Y PERMISOS CONFIGURADOS!");
    console.log("=================================================");
} // <--- CIERRE DE LA FUNCIÓN main()

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});