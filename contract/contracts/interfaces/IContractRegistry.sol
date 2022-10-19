// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IContractRegistry {
    event Added(address indexed deployer, address indexed deployment);
    event Deleted(address indexed deployer, address indexed deployment);

    /// @notice Add a deployment for a deployer.
    function add(
        address _deployer,
        address _deployment
    ) external;

    /// @notice Remove a deployment for a deployer.
    function remove(
        address _deployer,
        address _deployment
    ) external;

    /// @notice Get all deployments for a deployer.
    function getDeployments(address _deployer) external view returns (address[] memory deployments);

    /// @notice Get the total number of deployments for a deployer.
    function count(address _deployer) external view returns (uint256 deploymentCount);
}