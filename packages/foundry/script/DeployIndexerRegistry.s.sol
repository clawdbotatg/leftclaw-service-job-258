// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/IndexerRegistry.sol";

contract DeployIndexerRegistry is Script {
    function run() external {
        address treasury = 0xCfB32a7d01Ca2B4B538C83B2b38656D3502D76EA;
        vm.startBroadcast();
        IndexerRegistry registry = new IndexerRegistry(treasury);
        console.log("IndexerRegistry deployed at:", address(registry));
        vm.stopBroadcast();
    }
}
