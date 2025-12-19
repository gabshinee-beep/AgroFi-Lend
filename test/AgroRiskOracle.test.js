const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgroRiskOracle Direct Tests", function () {
  it("Debe permitir actualizar y leer el riesgo correctamente", async function () {
    const [owner] = await ethers.getSigners();
    const Oracle = await ethers.getContractFactory("AgroRiskOracle");
    const oracle = await Oracle.deploy(); 
    
    // Probamos la función principal
    await oracle.updateRiskScore(1, 85);
    expect(await oracle.getRiskScore(1)).to.equal(85);
  });
});