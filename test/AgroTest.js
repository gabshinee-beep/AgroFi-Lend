const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgroToken System", function () {
  it("Debe permitir tokenizar una granja y medir el GAS", async function () {
    // 1. Setup
    const [owner] = await ethers.getSigners();
    const AgroToken = await ethers.getContractFactory("AgroToken");
    const contrato = await AgroToken.deploy();

    // 2. Acción: Tokenizar "Granja Café Villa Rica"
    // Valor: $50,000 | Fracciones: 100
    const tx = await contrato.tokenizarHectarea("Granja Cafe Villa Rica", 50000, 100);
    
    // 3. Esperar confirmación y medir GAS
    const receipt = await tx.wait();
    console.log("⛽ Gas usado para tokenizar:", receipt.gasUsed.toString());

    // 4. Verificación (Assert)
    // El ID 0 debería tener los datos correctos
    const datos = await contrato.detallesActivo(0);
    expect(datos.nombre).to.equal("Granja Cafe Villa Rica");
    expect(datos.valorTotal).to.equal(50000);
    
    // El dueño debería tener 100 tokens del ID 0
    const balance = await contrato.balanceOf(owner.address, 0);
    expect(balance).to.equal(100);
  });
});