// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AgroToken is ERC1155, Ownable {
    string public name = "AgroFi Latam RWA";
    string public symbol = "AGRO";
    uint256 public currentAssetId;

    struct ActivoReal {
        string nombre;
        uint256 valorTotal;
        uint256 fracciones;
    }

    mapping(uint256 => ActivoReal) public detallesActivo;

    constructor() ERC1155("") Ownable(msg.sender) {}

    function tokenizarHectarea(
        string memory _nombre,
        uint256 _valorTotal,
        uint256 _cantidadFracciones
    ) public onlyOwner {
        detallesActivo[currentAssetId] = ActivoReal({
            nombre: _nombre,
            valorTotal: _valorTotal,
            fracciones: _cantidadFracciones
        });

        _mint(msg.sender, currentAssetId, _cantidadFracciones, "");
        currentAssetId++;
    }

    function uri(uint256 _id) public pure override returns (string memory) {
        return string(abi.encodePacked("https://api.agrofi.com/metadata/", Strings.toString(_id)));
    }
}