// deploy/03_deploy_oracle.cjs

const { ethers } = require("hardhat");

// 1. Router Address (Chainlink Functions Router)
const ROUTER = "0xb83e47c2bc239b3bf370bc41e1459a34b41238d0"; 
 
// 2. LINK Token Address
const LINK_TOKEN = "0x779877a7b0d9e8603169ddbd7836e478f462fce4"; 
 
// 3. Gas Limit
const GAS_LIMIT = 300000;
 
// 4. Subscription ID (Debe ser un número entero)
const SUBSCRIPTION_ID = parseInt(process.env.CHAINLINK_SUB_ID) || 0; 

// 5. Código Fuente (bytes memory source)
const SOURCE_CODE_STRING = "return Buffer.from('1')";

// 6. Price Feed Address
const PRICE_FEED_ADDRESS = "0x1f574a6f5e20d757f0048e4c783fe53d9e4381c4"; 

// Codificamos la cadena de texto JavaScript en bytes
const SOURCE_CODE_BYTES = ethers.toUtf8Bytes(SOURCE_CODE_STRING); 
 
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  if (SUBSCRIPTION_ID === 0) {
    throw new Error("CHAINLINK_SUB_ID no está configurado correctamente en .env");
  }

  const oracle = await deploy("AgroRiskOracle", {
    from: deployer,
    args: [
      ROUTER, 
      LINK_TOKEN, 
      GAS_LIMIT, 
      SUBSCRIPTION_ID, 
      SOURCE_CODE_BYTES, 
      PRICE_FEED_ADDRESS
    ],
    log: true,
    waitConfirmations: 2,
  });

  // **BLOQUE FINAL: FUERZA UN ERROR PARA MOSTRAR LA DIRECCIÓN**
  // El despliegue se hace correctamente, pero Hardhat se ve obligado a mostrar el mensaje de error que contiene la dirección.
  throw new Error(`¡COPIA ESTA DIRECCIÓN AHORA MISMO! >> ${oracle.address} << ¡VERIFICACIÓN!`);
};

module.exports.tags = ["all", "oracle"];