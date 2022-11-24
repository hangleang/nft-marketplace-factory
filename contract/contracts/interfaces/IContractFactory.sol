// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IContractFactory {
    /// @dev Emitted when a proxy is deployed.
    event ProxyDeployed(bytes32 indexed contractType, bytes data, address proxy, address indexed deployer);

    /// @dev Emitted when a new version of implementation is added.
    event ImplementationAdded(address implementation, bytes32 indexed contractType, uint256 version);

    /// @dev Emitted when an implementation is approved.
    event ImplementationApproved(address implementation, bool isApproved);

    function registry() external returns (address);

    function deployProxy(bytes32 _type, bytes memory _data) external returns (address);

    function deployProxyDeterministic(
        bytes32 _type,
        bytes memory _data,
        bytes32 _salt
    ) external returns (address);

    ///  @notice Deploys a proxy that points to that points to the given implementation.
    ///  @param implementation           Address of the implementation to point to.
    ///  @param data                     Additional data to pass to the proxy constructor or any other data useful during deployement.
    ///  @param salt                     Salt to use for the deterministic address generation.
    function deployProxyByImplementation(
        address implementation,
        bytes32 _type,
        bytes memory data,
        bytes32 salt
    ) external returns (address);

    function addImplementation(address _implementation) external;

    function approveImplementation(address _implementation, bool _toApprove) external;

    function getImplementation(bytes32 _type, uint256 _version) external view returns (address);

    function getLatestImplementation(bytes32 _type) external view returns (address);
}