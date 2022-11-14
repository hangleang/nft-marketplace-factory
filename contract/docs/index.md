# Solidity API

## TokenFactory

_TokenFactory contract definition
ITokenFactory: TokenFactory contract interface which contains data structs, event definitions, functions signature
ERC2771Context: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
Multicall: batch together multiple calls in a single external call
AccessControlEnumerable: implement role-based access control mechanisms, more robust than Ownable
PlatformFee: extend to enable platform fee in marketplace_

### CREATOR_ROLE

```solidity
bytes32 CREATOR_ROLE
```

_Only CREATOR_ROLE holders._

### MAX_BPS

```solidity
uint16 MAX_BPS
```

_The max bps of the contract. So, 10_000 == 100 %_

### tokenBeacons

```solidity
mapping(enum ITokenFactory.TokenType => address) tokenBeacons
```

_Token Type => address of the token implemetation._

### tokens

```solidity
mapping(uint256 => address) tokens
```

_UID => address of the instance of token proxy_

### nextTokenUid

```solidity
uint256 nextTokenUid
```

_The UID of the next token proxy to be created_

### trustedForwarder

```solidity
address trustedForwarder
```

_array of trust forwarders_

### isValidBPS

```solidity
modifier isValidBPS(uint256 _bps)
```

### constructor

```solidity
constructor(address _trustedForwarder, uint256 _platformFeeBps, address _platformFeeRecipient) public
```

### newToken

```solidity
function newToken(enum ITokenFactory.TokenType tokenType, address _defaultAdmin, string _name, string _symbol, string _contractURI, address _primarySaleRecipient, address _royaltyRecipient, uint128 _royaltyBps) external returns (address token)
```

### newToken

```solidity
function newToken(enum ITokenFactory.TokenType tokenType, bytes data) external returns (address token)
```

### _newToken

```solidity
function _newToken(enum ITokenFactory.TokenType tokenType, bytes data) internal returns (address token)
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

## ERC2771ContextUpgradeable

_Context variant with ERC2771 support._

### _trustedForwarder

```solidity
mapping(address => bool) _trustedForwarder
```

### __ERC2771Context_init

```solidity
function __ERC2771Context_init(address[] trustedForwarder) internal
```

### __ERC2771Context_init_unchained

```solidity
function __ERC2771Context_init_unchained(address[] trustedForwarder) internal
```

### isTrustedForwarder

```solidity
function isTrustedForwarder(address forwarder) public view virtual returns (bool)
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

### __gap

```solidity
uint256[49] __gap
```

## ERC1155Drop

_ERC1155Drop contract definition
Initializable: a base contract to aid in writing UPGRADEABLE contracts
IERC1155Drop: ERC1155Drop contract interface which contains data structs, event definitions, functions signature
ERC1155Upgradeable: Non-Fungible Token Standard
ReentrancyGuardUpgradeable: prevent reentrant calls to a function
ERC2771ContextUpgradeable: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
MulticallUpgradeable: batch together multiple calls in a single external call
AccessControlEnumerableUpgradeable: implement role-based access control mechanisms, more robust than Ownable
PlatformFee, PrimarySale, Royalty & OpenseaComp: as extensions_

### CONTRACT_TYPE

```solidity
bytes32 CONTRACT_TYPE
```

### VERSION

```solidity
uint256 VERSION
```

### contractURI

```solidity
string contractURI
```

_Contract level metadata._

### name

```solidity
string name
```

_Token name_

### symbol

```solidity
string symbol
```

_Token symbol_

### TRANSFER_ROLE

```solidity
bytes32 TRANSFER_ROLE
```

_Only TRANSFER_ROLE holders can have tokens transferred from or to them, during restricted transfers._

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

_Only MINTER_ROLE holders can sign off on `MintRequest`s._

### MAX_BPS

```solidity
uint16 MAX_BPS
```

_The max bps of the contract. So, 10_000 == 100 %_

### nextTokenIdToMint

```solidity
uint256 nextTokenIdToMint
```

_The next token ID of the NFT to "lazy mint"._

### baseURIIndices

```solidity
uint256[] baseURIIndices
```

_Largest tokenId of each batch of tokens with the same baseURI_

### baseURI

```solidity
mapping(uint256 => string) baseURI
```

@dev Mapping from 'Largest tokenId of a batch of tokens with the same baseURI'
      to base URI for the respective batch of tokens.

### totalSupply

```solidity
mapping(uint256 => uint256) totalSupply
```

_Mapping from token ID => total circulating supply of tokens with that ID._

### maxTotalSupply

```solidity
mapping(uint256 => uint256) maxTotalSupply
```

_Mapping from token ID => maximum possible total circulating supply of tokens with that ID._

### claimCondition

```solidity
mapping(uint256 => struct IClaimCondition.ClaimConditionList) claimCondition
```

_Mapping from token ID => the set of all claim conditions, at any given moment, for tokens of the token ID._

### saleRecipient

```solidity
mapping(uint256 => address) saleRecipient
```

_Mapping from token ID => the address of the recipient of primary sales._

### walletClaimCount

```solidity
mapping(uint256 => mapping(address => uint256)) walletClaimCount
```

_Mapping from token ID => claimer wallet address => total number of NFTs of the token ID a wallet has claimed._

### maxWalletClaimCount

```solidity
mapping(uint256 => uint256) maxWalletClaimCount
```

_Mapping from token ID => the max number of NFTs of the token ID a wallet can claim._

### isValidBPS

```solidity
modifier isValidBPS(uint256 _bps)
```

### initialize

```solidity
function initialize(address _defaultAdmin, string _name, string _symbol, string _contractURI, address[] _trustedForwarders, address _primarySaleRecipient, address _royaltyRecipient, uint128 _royaltyBps, uint128 _platformFeeBps, address _platformFeeRecipient) external
```

_Initiliazes the contract, like a constructor._

### contractType

```solidity
function contractType() external pure returns (bytes32)
```

_Returns the module type of the contract._

### contractVersion

```solidity
function contractVersion() external pure returns (uint8)
```

_Returns the version of the contract._

### setContractURI

```solidity
function setContractURI(string _uri) external
```

_Lets a module admin set the URI for contract-level metadata._

### uri

```solidity
function uri(uint256 _tokenId) public view returns (string)
```

_Returns the URI for a given tokenId._

### lazyMint

```solidity
function lazyMint(uint256 _amount, string _baseURIForTokens) external
```

@dev Lets an account with `MINTER_ROLE` lazy mint 'n' NFTs.
      The URIs for each token is the provided `_baseURIForTokens` + `{tokenId}`.

### burn

```solidity
function burn(address account, uint256 id, uint256 value) public virtual
```

_Lets a token owner burn the tokens they own (i.e. destroy for good)_

### burnBatch

```solidity
function burnBatch(address account, uint256[] ids, uint256[] values) public virtual
```

_Lets a token owner burn multiple tokens they own at once (i.e. destroy for good)_

### claim

```solidity
function claim(address _receiver, uint256 _tokenId, uint256 _quantity, address _currency, uint256 _pricePerToken, bytes32[] _proofs, uint256 _proofMaxAllowance) external payable
```

_Lets an account claim a given quantity of NFTs, of a single tokenId._

### setClaimConditions

```solidity
function setClaimConditions(uint256 _tokenId, struct IClaimCondition.ClaimCondition[] _phases, bool _resetClaimEligibility) external
```

_Lets a contract admin (account with `DEFAULT_ADMIN_ROLE`) set claim conditions, for a tokenId._

### verifyClaimMerkleProof

```solidity
function verifyClaimMerkleProof(uint256 _conditionId, address _claimer, uint256 _tokenId, uint256 _quantity, bytes32[] _proofs, uint256 _proofMaxAllowance) public view returns (bool validMerkleProof, uint256 merkleProofIndex)
```

_Checks whether a claimer meets the claim condition's allowlist criteria._

### verifyClaim

```solidity
function verifyClaim(uint256 _conditionId, address _claimer, uint256 _tokenId, uint256 _quantity, address _currency, uint256 _pricePerToken, bool verifyMaxQuantityPerTransaction) public view
```

_Checks a request to claim NFTs against the active claim condition's criteria._

### getActiveClaimConditionId

```solidity
function getActiveClaimConditionId(uint256 _tokenId) public view returns (uint256)
```

_At any given moment, returns the uid for the active claim condition, for a given tokenId._

### getClaimTimestamp

```solidity
function getClaimTimestamp(uint256 _tokenId, uint256 _conditionId, address _claimer) public view returns (uint256 lastClaimTimestamp, uint256 nextValidClaimTimestamp)
```

_Returns the timestamp for when a claimer is eligible for claiming NFTs again._

### getClaimConditionById

```solidity
function getClaimConditionById(uint256 _tokenId, uint256 _conditionId) external view returns (struct IClaimCondition.ClaimCondition condition)
```

_Returns the claim condition at the given uid._

### setWalletClaimCount

```solidity
function setWalletClaimCount(uint256 _tokenId, address _claimer, uint256 _count) external
```

_Lets a contract admin set a claim count for a wallet._

### setMaxWalletClaimCount

```solidity
function setMaxWalletClaimCount(uint256 _tokenId, uint256 _count) external
```

_Lets a contract admin set a maximum number of NFTs of a tokenId that can be claimed by any wallet._

### setMaxTotalSupply

```solidity
function setMaxTotalSupply(uint256 _tokenId, uint256 _maxTotalSupply) external
```

_Lets a module admin set a max total supply for token._

### setSaleRecipientForToken

```solidity
function setSaleRecipientForToken(uint256 _tokenId, address _saleRecipient) external
```

_Lets a contract admin set the recipient for all primary sales._

### _collectClaimPrice

```solidity
function _collectClaimPrice(uint256 _quantityToClaim, address _currency, uint256 _pricePerToken, uint256 _tokenId) internal
```

_Collects and distributes the primary sale value of NFTs being claimed._

### _transferClaimedTokens

```solidity
function _transferClaimedTokens(address _to, uint256 _conditionId, uint256 _tokenId, uint256 _quantityBeingClaimed) internal
```

_Transfers the NFTs being claimed._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_See {ERC1155-_beforeTokenTransfer}._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

## ERC721Drop

_ERC721Drop contract definition
Initializable: a base contract to aid in writing UPGRADEABLE contracts
IERC721Drop: ERC721Drop contract interface which contains data structs, event definitions, functions signature
ERC721EnumerableUpgradeable: Non-Fungible Token Standard
ReentrancyGuardUpgradeable: prevent reentrant calls to a function
ERC2771ContextUpgradeable: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
MulticallUpgradeable: batch together multiple calls in a single external call
AccessControlEnumerableUpgradeable: implement role-based access control mechanisms, more robust than Ownable
PlatformFee, PrimarySale, Royalty & OpenseaComp: as extensions_

### CONTRACT_TYPE

```solidity
bytes32 CONTRACT_TYPE
```

### VERSION

```solidity
uint256 VERSION
```

### contractURI

```solidity
string contractURI
```

_Contract level metadata._

### TRANSFER_ROLE

```solidity
bytes32 TRANSFER_ROLE
```

_Only TRANSFER_ROLE holders can have tokens transferred from or to them, during restricted transfers._

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

_Only MINTER_ROLE holders can sign off on `MintRequest`s._

### MAX_BPS

```solidity
uint16 MAX_BPS
```

_The max bps of the contract. So, 10_000 == 100 %_

### nextTokenIdToMint

```solidity
uint256 nextTokenIdToMint
```

_The next token ID of the NFT to "lazy mint"._

### nextTokenIdToClaim

```solidity
uint256 nextTokenIdToClaim
```

_The next token ID of the NFT that can be claimed._

### maxWalletClaimCount

```solidity
uint256 maxWalletClaimCount
```

_The max number of NFTs a wallet can claim._

### maxTotalSupply

```solidity
uint256 maxTotalSupply
```

_Global max total supply of NFTs._

### baseURIIndices

```solidity
uint256[] baseURIIndices
```

_Largest tokenId of each batch of tokens with the same baseURI_

### claimCondition

```solidity
struct IClaimCondition.ClaimConditionList claimCondition
```

_The set of all claim conditions, at any given moment._

### encryptedData

```solidity
mapping(uint256 => bytes) encryptedData
```

@dev Mapping from 'Largest tokenId of a batch of 'delayed-reveal' tokens with
      the same baseURI' to encrypted base URI for the respective batch of tokens.

### walletClaimCount

```solidity
mapping(address => uint256) walletClaimCount
```

_Mapping from address => total number of NFTs a wallet has claimed._

### baseURI

```solidity
mapping(uint256 => string) baseURI
```

@dev Mapping from 'Largest tokenId of a batch of tokens with the same baseURI'
      to base URI for the respective batch of tokens.

### isValidBPS

```solidity
modifier isValidBPS(uint256 _bps)
```

### initialize

```solidity
function initialize(address _defaultAdmin, string _name, string _symbol, string _contractURI, address[] _trustedForwarders, address _primarySaleRecipient, address _royaltyRecipient, uint128 _royaltyBps, uint128 _platformFeeBps, address _platformFeeRecipient) external
```

_Initiliazes the contract, like a constructor._

### contractType

```solidity
function contractType() external pure returns (bytes32)
```

_Returns the module type of the contract._

### contractVersion

```solidity
function contractVersion() external pure returns (uint8)
```

_Returns the version of the contract._

### setContractURI

```solidity
function setContractURI(string _uri) external
```

_Lets a module admin set the URI for contract-level metadata._

### tokenURI

```solidity
function tokenURI(uint256 _tokenId) public view returns (string)
```

_Returns the URI for a given tokenId._

### lazyMint

```solidity
function lazyMint(uint256 _amount, string _baseURIForTokens, bytes _data) external
```

@dev Lets an account with `MINTER_ROLE` lazy mint 'n' NFTs.
      The URIs for each token is the provided `_baseURIForTokens` + `{tokenId}`.

### reveal

```solidity
function reveal(uint256 index, bytes _key) external returns (string revealedURI)
```

_Lets an account with `MINTER_ROLE` reveal the URI for a batch of 'delayed-reveal' NFTs._

### burn

```solidity
function burn(uint256 tokenId) public virtual
```

_Burns `tokenId`. See {ERC721-_burn}._

### claim

```solidity
function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, bytes32[] _proofs, uint256 _proofMaxAllowance) external payable
```

_Lets an account claim NFTs._

### setClaimConditions

```solidity
function setClaimConditions(struct IClaimCondition.ClaimCondition[] _phases, bool _resetClaimEligibility) external
```

_Lets a contract admin (account with `DEFAULT_ADMIN_ROLE`) set claim conditions._

### verifyClaimMerkleProof

```solidity
function verifyClaimMerkleProof(uint256 _conditionId, address _claimer, uint256 _quantity, bytes32[] _proofs, uint256 _proofMaxAllowance) public view returns (bool validMerkleProof, uint256 merkleProofIndex)
```

_Checks whether a claimer meets the claim condition's allowlist criteria._

### verifyClaim

```solidity
function verifyClaim(uint256 _conditionId, address _claimer, uint256 _quantity, address _currency, uint256 _pricePerToken, bool verifyMaxQuantityPerTransaction) public view
```

_Checks a request to claim NFTs against the active claim condition's criteria._

### getActiveClaimConditionId

```solidity
function getActiveClaimConditionId() public view returns (uint256)
```

_At any given moment, returns the uid for the active claim condition._

### getClaimTimestamp

```solidity
function getClaimTimestamp(uint256 _conditionId, address _claimer) public view returns (uint256 lastClaimTimestamp, uint256 nextValidClaimTimestamp)
```

_Returns the timestamp for when a claimer is eligible for claiming NFTs again._

### getClaimConditionById

```solidity
function getClaimConditionById(uint256 _conditionId) external view returns (struct IClaimCondition.ClaimCondition condition)
```

_Returns the claim condition at the given uid._

### getBaseURICount

```solidity
function getBaseURICount() external view returns (uint256)
```

_Returns the amount of stored baseURIs_

### setWalletClaimCount

```solidity
function setWalletClaimCount(address _claimer, uint256 _count) external
```

_Lets a contract admin set a claim count for a wallet._

### setMaxWalletClaimCount

```solidity
function setMaxWalletClaimCount(uint256 _count) external
```

_Lets a contract admin set a maximum number of NFTs that can be claimed by any wallet._

### setMaxTotalSupply

```solidity
function setMaxTotalSupply(uint256 _maxTotalSupply) external
```

_Lets a contract admin set the global maximum supply for collection's NFTs._

### _collectClaimPrice

```solidity
function _collectClaimPrice(uint256 _quantityToClaim, address _currency, uint256 _pricePerToken) internal
```

_Collects and distributes the primary sale value of NFTs being claimed._

### _transferClaimedTokens

```solidity
function _transferClaimedTokens(address _to, uint256 _conditionId, uint256 _quantityBeingClaimed) internal
```

_Transfers the NFTs being claimed._

### encryptDecrypt

```solidity
function encryptDecrypt(bytes data, bytes key) public pure returns (bytes result)
```

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

_See {ERC721-_beforeTokenTransfer}._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

## PlatformFee

### MAX_BPS

```solidity
uint256 MAX_BPS
```

_Max BPS_

### _platformFeeRecipient

```solidity
address _platformFeeRecipient
```

_The adress that receives all primary sales value._

### _platformFeeBps

```solidity
uint128 _platformFeeBps
```

_The % of primary sales collected by the contract as fees._

### isValidBPS

```solidity
modifier isValidBPS(uint256 _bps)
```

### constructor

```solidity
constructor(address _recipient, uint128 _bps) internal
```

### platformFeeRecipient

```solidity
function platformFeeRecipient() public view virtual returns (address)
```

_Returns the address of the platform fee recipient._

### platformFeeBps

```solidity
function platformFeeBps() public view virtual returns (uint128)
```

_Returns the % of platform fee collected by the contract as fees._

### getPlatformFeeInfo

```solidity
function getPlatformFeeInfo() external view virtual returns (address, uint16)
```

_Returns the platform fee bps and recipient._

### setPlatformFeeInfo

```solidity
function setPlatformFeeInfo(address _recipient, uint256 _bps) external virtual
```

_Lets a module admin update the fees on primary sales._

### _setPlatformFeeInfo

```solidity
function _setPlatformFeeInfo(address _recipient, uint128 _bps) internal virtual
```

## IOpenseaComp

### owner

```solidity
function owner() external view returns (address)
```

_Returns the owner of the contract._

### setOwner

```solidity
function setOwner(address _newOwner) external
```

_Lets a module admin set a new owner for the contract. The new owner must be a module admin._

### OwnerUpdated

```solidity
event OwnerUpdated(address prevOwner, address newOwner)
```

_Emitted when a new Owner is set._

## IPlatformFee

### getPlatformFeeInfo

```solidity
function getPlatformFeeInfo() external view returns (address, uint16)
```

_Returns the platform fee bps and recipient._

### setPlatformFeeInfo

```solidity
function setPlatformFeeInfo(address _platformFeeRecipient, uint256 _platformFeeBps) external
```

_Lets a module admin update the fees on primary sales._

### PlatformFeeInfoUpdated

```solidity
event PlatformFeeInfoUpdated(address platformFeeRecipient, uint256 platformFeeBps)
```

_Emitted when fee on primary sales is updated._

## IPrimarySale

### primarySaleRecipient

```solidity
function primarySaleRecipient() external view returns (address)
```

_The adress that receives all primary sales value._

### setPrimarySaleRecipient

```solidity
function setPrimarySaleRecipient(address _saleRecipient) external
```

_Lets a module admin set the default recipient of all primary sales._

### PrimarySaleRecipientUpdated

```solidity
event PrimarySaleRecipientUpdated(address recipient)
```

_Emitted when a new sale recipient is set._

## IRoyalty

### RoyaltyInfo

```solidity
struct RoyaltyInfo {
  address recipient;
  uint256 bps;
}
```

### getDefaultRoyaltyInfo

```solidity
function getDefaultRoyaltyInfo() external view returns (address, uint16)
```

_Returns the royalty recipient and fee bps._

### setDefaultRoyaltyInfo

```solidity
function setDefaultRoyaltyInfo(address _royaltyRecipient, uint256 _royaltyBps) external
```

_Lets a module admin update the royalty bps and recipient._

### setRoyaltyInfoForToken

```solidity
function setRoyaltyInfoForToken(uint256 tokenId, address recipient, uint256 bps) external
```

_Lets a module admin set the royalty recipient for a particular token Id._

### getRoyaltyInfoForToken

```solidity
function getRoyaltyInfoForToken(uint256 tokenId) external view returns (address, uint16)
```

_Returns the royalty recipient for a particular token Id._

### DefaultRoyalty

```solidity
event DefaultRoyalty(address newRoyaltyRecipient, uint256 newRoyaltyBps)
```

_Emitted when royalty info is updated._

### RoyaltyForToken

```solidity
event RoyaltyForToken(uint256 tokenId, address royaltyRecipient, uint256 royaltyBps)
```

_Emitted when royalty recipient for tokenId is set_

## OpenseaCompUpgradeable

### _owner

```solidity
address _owner
```

_Owner of the contract (purpose: OpenSea compatibility, etc.)_

### __OpenseaComp_init

```solidity
function __OpenseaComp_init(address _admin) internal
```

_Initializes the contract setting the deployer as the initial owner._

### __OpenseaComp_init_unchained

```solidity
function __OpenseaComp_init_unchained(address _admin) internal
```

### owner

```solidity
function owner() public view virtual returns (address)
```

_Returns the address of the current owner._

### setOwner

```solidity
function setOwner(address _newOwner) public virtual
```

_Lets a module admin set a new owner for the contract. The new owner must be a module admin.
Can only be called by the module owner._

### _setOwner

```solidity
function _setOwner(address _newOwner) internal virtual
```

_Lets a module admin set a new owner for the contract. The new owner must be a module admin.
Internal function without access restriction._

## PlatformFeeUpgradeable

### MAX_BPS

```solidity
uint256 MAX_BPS
```

_Max BPS_

### _platformFeeRecipient

```solidity
address _platformFeeRecipient
```

_The adress that receives all primary sales value._

### _platformFeeBps

```solidity
uint128 _platformFeeBps
```

_The % of primary sales collected by the contract as fees._

### isValidBPS

```solidity
modifier isValidBPS(uint256 _bps)
```

### __PlatformFee_init

```solidity
function __PlatformFee_init(address _recipient, uint128 _bps) internal
```

_Initializes the contract setting the given args as platform fee info._

### __PlatformFee_init_unchained

```solidity
function __PlatformFee_init_unchained(address _recipient, uint128 _bps) internal
```

### platformFeeRecipient

```solidity
function platformFeeRecipient() public view virtual returns (address)
```

_Returns the address of the platform fee recipient._

### platformFeeBps

```solidity
function platformFeeBps() public view virtual returns (uint128)
```

_Returns the % of platform fee collected by the contract as fees._

### getPlatformFeeInfo

```solidity
function getPlatformFeeInfo() external view virtual returns (address, uint16)
```

_Returns the platform fee bps and recipient._

### setPlatformFeeInfo

```solidity
function setPlatformFeeInfo(address _recipient, uint256 _bps) external virtual
```

_Lets a module admin update the fees on primary sales._

### _setPlatformFeeInfo

```solidity
function _setPlatformFeeInfo(address _recipient, uint128 _bps) internal virtual
```

## PrimarySaleUpgradeable

### _primarySaleRecipient

```solidity
address _primarySaleRecipient
```

_The adress that receives all primary sales value._

### __PrimarySale_init

```solidity
function __PrimarySale_init(address _saleRecipient) internal
```

_Initializes the contract setting the given address as primarySaleRecipient._

### __PrimarySale_init_unchained

```solidity
function __PrimarySale_init_unchained(address _saleRecipient) internal
```

### primarySaleRecipient

```solidity
function primarySaleRecipient() public view virtual returns (address)
```

_Returns the address of the primary sale recipient._

### setPrimarySaleRecipient

```solidity
function setPrimarySaleRecipient(address _saleRecipient) public virtual
```

_Lets a module admin set the default recipient of all primary sales.
Can only be called by the module owner._

### _setPrimarySaleRecipient

```solidity
function _setPrimarySaleRecipient(address _saleRecipient) internal virtual
```

_Lets a module admin set the default recipient of all primary sales.
Internal function without access restriction._

## RoyaltyUpgradeable

### MAX_BPS

```solidity
uint256 MAX_BPS
```

_Max BPS_

### royaltyRecipient

```solidity
address royaltyRecipient
```

_The recipient of who gets the royalty._

### royaltyBps

```solidity
uint128 royaltyBps
```

_The percentage of royalty how much royalty in basis points._

### royaltyInfoForToken

```solidity
mapping(uint256 => struct IRoyalty.RoyaltyInfo) royaltyInfoForToken
```

_Token ID => royalty recipient and bps for token_

### isValidBPS

```solidity
modifier isValidBPS(uint256 _bps)
```

### __Royalty_init

```solidity
function __Royalty_init(address _royaltyRecipient, uint128 _royaltyBps) internal
```

_Initializes the contract setting the given args as royalty fee info._

### __Royalty_init_unchained

```solidity
function __Royalty_init_unchained(address _royaltyRecipient, uint128 _royaltyBps) internal
```

### setDefaultRoyaltyInfo

```solidity
function setDefaultRoyaltyInfo(address _royaltyRecipient, uint256 _royaltyBps) external virtual
```

_Lets a module admin update the royalty bps and recipient.
Can only be called by the module owner._

### setRoyaltyInfoForToken

```solidity
function setRoyaltyInfoForToken(uint256 _tokenId, address _recipient, uint256 _bps) external virtual
```

_Lets a module admin set the royalty recipient for a particular token Id._

### getDefaultRoyaltyInfo

```solidity
function getDefaultRoyaltyInfo() public view virtual returns (address, uint16)
```

_Returns the platform fee bps and recipient._

### getRoyaltyInfoForToken

```solidity
function getRoyaltyInfoForToken(uint256 _tokenId) public view virtual returns (address, uint16)
```

_Returns the royalty recipient for a particular token Id._

### royaltyInfo

```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice) external view virtual returns (address receiver, uint256 royaltyAmount)
```

_See EIP-2981_

### _setDefaultRoyaltyInfo

```solidity
function _setDefaultRoyaltyInfo(address _royaltyRecipient, uint256 _royaltyBps) internal virtual
```

_Lets a module admin update the royalty bps and recipient.
Internal function without access restriction._

### _setRoyaltyInfoForToken

```solidity
function _setRoyaltyInfoForToken(uint256 _tokenId, address _recipient, uint256 _bps) internal virtual
```

_Lets a module admin set the royalty recipient for a particular token Id.
Internal function without access restriction._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

## IMetadata

### contractType

```solidity
function contractType() external pure returns (bytes32)
```

_Returns the module type of the contract._

### contractVersion

```solidity
function contractVersion() external pure returns (uint8)
```

_Returns the version of the contract._

### contractURI

```solidity
function contractURI() external view returns (string)
```

_Returns the metadata URI of the contract._

### setContractURI

```solidity
function setContractURI(string _uri) external
```

@dev Sets contract URI for the storefront-level metadata of the contract.
      Only module admin can call this function.

## ITokenFactory

### TokenType

```solidity
enum TokenType {
  ERC721Token,
  ERC1155Token,
  ERC721Drop,
  ERC1155Drop
}
```

### TokenCreated

```solidity
event TokenCreated(enum ITokenFactory.TokenType tokenType, address token)
```

### newToken

```solidity
function newToken(enum ITokenFactory.TokenType tokenType, address _defaultAdmin, string _name, string _symbol, string _contractURI, address _primarySaleRecipient, address _royaltyRecipient, uint128 _royaltyBps) external returns (address token)
```

### newToken

```solidity
function newToken(enum ITokenFactory.TokenType tokenType, bytes data) external returns (address token)
```

## IWETH

### deposit

```solidity
function deposit() external payable
```

### withdraw

```solidity
function withdraw(uint256 amount) external
```

## IClaimCondition

### ClaimCondition

```solidity
struct ClaimCondition {
  uint256 startTimestamp;
  uint256 maxClaimableSupply;
  uint256 supplyClaimed;
  uint256 quantityLimitPerTransaction;
  uint256 waitTimeInSecondsBetweenClaims;
  bytes32 merkleRoot;
  uint256 pricePerToken;
  address currency;
}
```

### ClaimConditionList

```solidity
struct ClaimConditionList {
  uint256 currentStartId;
  uint256 count;
  mapping(uint256 => struct IClaimCondition.ClaimCondition) phases;
  mapping(uint256 => mapping(address => uint256)) limitLastClaimTimestamp;
  mapping(uint256 => struct BitMapsUpgradeable.BitMap) limitMerkleProofClaim;
}
```

## IERC1155Drop

### TokensClaimed

```solidity
event TokensClaimed(uint256 claimConditionIndex, uint256 tokenId, address claimer, address receiver, uint256 quantityClaimed)
```

_Emitted when tokens are claimed._

### TokensLazyMinted

```solidity
event TokensLazyMinted(uint256 startTokenId, uint256 endTokenId, string baseURI)
```

_Emitted when tokens are lazy minted._

### MaxTotalSupplyUpdated

```solidity
event MaxTotalSupplyUpdated(uint256 tokenId, uint256 maxTotalSupply)
```

_Emitted when the global max supply of a token is updated._

### WalletClaimCountUpdated

```solidity
event WalletClaimCountUpdated(uint256 tokenId, address wallet, uint256 count)
```

_Emitted when the wallet claim count for a given tokenId and address is updated._

### MaxWalletClaimCountUpdated

```solidity
event MaxWalletClaimCountUpdated(uint256 tokenId, uint256 count)
```

_Emitted when the max wallet claim count for a given tokenId is updated._

### SaleRecipientForTokenUpdated

```solidity
event SaleRecipientForTokenUpdated(uint256 tokenId, address saleRecipient)
```

_Emitted when the sale recipient for a particular tokenId is updated._

### lazyMint

```solidity
function lazyMint(uint256 amount, string baseURIForTokens) external
```

@notice Lets an account with `MINTER_ROLE` lazy mint 'n' NFTs.
         The URIs for each token is the provided `_baseURIForTokens` + `{tokenId}`.

 @param amount           The amount of NFTs to lazy mint.
 @param baseURIForTokens The URI for the NFTs to lazy mint.

### claim

```solidity
function claim(address receiver, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, bytes32[] proofs, uint256 proofMaxAllowance) external payable
```

@notice Lets an account claim a given quantity of NFTs.

 @param receiver                       The receiver of the NFTs to claim.
 @param tokenId                        The unique ID of the token to claim.
 @param quantity                       The quantity of NFTs to claim.
 @param currency                       The currency in which to pay for the claim.
 @param pricePerToken                  The price per token to pay for the claim.
 @param proofs                         The proof of the claimer's inclusion in the merkle root allowlist
                                       of the claim conditions that apply.
 @param proofMaxAllowance   (Optional) The maximum number of NFTs an address included in an
                                       allowlist can claim.

### setClaimConditions

```solidity
function setClaimConditions(uint256 tokenId, struct IClaimCondition.ClaimCondition[] phases, bool resetClaimEligibility) external
```

@notice Lets a contract admin (account with `DEFAULT_ADMIN_ROLE`) set claim conditions.

 @param tokenId               The token ID for which to set mint conditions.
 @param phases                Claim conditions in ascending order by `startTimestamp`.
 @param resetClaimEligibility Whether to reset `limitLastClaimTimestamp` and
                              `limitMerkleProofClaim` values when setting new
                              claim conditions.

## IERC721Drop

### TokensClaimed

```solidity
event TokensClaimed(uint256 claimConditionIndex, address claimer, address receiver, uint256 startTokenId, uint256 quantityClaimed)
```

_Emitted when tokens are claimed._

### TokensLazyMinted

```solidity
event TokensLazyMinted(uint256 startTokenId, uint256 endTokenId, string baseURI, bytes encryptedBaseURI)
```

_Emitted when tokens are lazy minted._

### NFTRevealed

```solidity
event NFTRevealed(uint256 startTokenId, uint256 endTokenId, string revealedURI)
```

_Emitted when the URI for a batch of 'delayed-reveal' NFTs is revealed._

### MaxTotalSupplyUpdated

```solidity
event MaxTotalSupplyUpdated(uint256 maxTotalSupply)
```

_Emitted when the global max supply of tokens is updated._

### WalletClaimCountUpdated

```solidity
event WalletClaimCountUpdated(address wallet, uint256 count)
```

_Emitted when the wallet claim count for an address is updated._

### MaxWalletClaimCountUpdated

```solidity
event MaxWalletClaimCountUpdated(uint256 count)
```

_Emitted when the global max wallet claim count is updated._

### lazyMint

```solidity
function lazyMint(uint256 amount, string baseURIForTokens, bytes encryptedBaseURI) external
```

@notice Lets an account with `MINTER_ROLE` lazy mint 'n' NFTs.
         The URIs for each token is the provided `_baseURIForTokens` + `{tokenId}`.

 @param amount           The amount of NFTs to lazy mint.
 @param baseURIForTokens The URI for the NFTs to lazy mint. If lazy minting
                          'delayed-reveal' NFTs, the is a URI for NFTs in the
                          un-revealed state.
 @param encryptedBaseURI If lazy minting 'delayed-reveal' NFTs, this is the
                          result of encrypting the URI of the NFTs in the revealed
                          state.

### claim

```solidity
function claim(address receiver, uint256 quantity, address currency, uint256 pricePerToken, bytes32[] proofs, uint256 proofMaxAllowance) external payable
```

@notice Lets an account claim a given quantity of NFTs.

 @param receiver                       The receiver of the NFTs to claim.
 @param quantity                       The quantity of NFTs to claim.
 @param currency                       The currency in which to pay for the claim.
 @param pricePerToken                  The price per token to pay for the claim.
 @param proofs                         The proof of the claimer's inclusion in the merkle root allowlist
                                       of the claim conditions that apply.
 @param proofMaxAllowance   (Optional) The maximum number of NFTs an address included in an
                                       allowlist can claim.

### setClaimConditions

```solidity
function setClaimConditions(struct IClaimCondition.ClaimCondition[] phases, bool resetClaimEligibility) external
```

@notice Lets a contract admin (account with `DEFAULT_ADMIN_ROLE`) set claim conditions.

 @param phases                Claim conditions in ascending order by `startTimestamp`.
 @param resetClaimEligibility Whether to reset `limitLastClaimTimestamp` and
                              `limitMerkleProofClaim` values when setting new
                              claim conditions.

## IERC1155Token

### MintRequest

```solidity
struct MintRequest {
  address to;
  address royaltyRecipient;
  uint256 royaltyBps;
  address primarySaleRecipient;
  uint256 tokenId;
  string uri;
  uint256 quantity;
  uint256 pricePerToken;
  address currency;
  uint128 validityStartTimestamp;
  uint128 validityEndTimestamp;
  bytes32 uid;
}
```

### TokensMinted

```solidity
event TokensMinted(address mintedTo, uint256 tokenIdMinted, string uri, uint256 quantityMinted)
```

_Emitted when an account with MINTER_ROLE mints an NFT._

### TokensMintedWithSignature

```solidity
event TokensMintedWithSignature(address signer, address mintedTo, uint256 tokenIdMinted, struct IERC1155Token.MintRequest mintRequest)
```

_Emitted when tokens are minted._

### verify

```solidity
function verify(struct IERC1155Token.MintRequest req, bytes signature) external view returns (bool success, address signer)
```

@notice Verifies that a mint request is signed by an account holding
        MINTER_ROLE (at the time of the function call).

 @param req The mint request.
 @param signature The signature produced by an account signing the mint request.

 returns (success, signer) Result of verification and the recovered address.

### mintTo

```solidity
function mintTo(address to, uint256 tokenId, string uri, uint256 amount) external
```

@notice Lets an account with MINTER_ROLE mint an NFT.

 @param to The address to mint the NFT to.
 @param tokenId The tokenId of the NFTs to mint
 @param uri The URI to assign to the NFT.
 @param amount The number of copies of the NFT to mint.

### mintWithSignature

```solidity
function mintWithSignature(struct IERC1155Token.MintRequest req, bytes signature) external payable
```

@notice Mints an NFT according to the provided mint request.

 @param req The mint request.
 @param signature he signature produced by an account signing the mint request.

## IERC721Token

### MintRequest

```solidity
struct MintRequest {
  address to;
  address royaltyRecipient;
  uint256 royaltyBps;
  address primarySaleRecipient;
  string uri;
  uint256 price;
  address currency;
  uint128 validityStartTimestamp;
  uint128 validityEndTimestamp;
  bytes32 uid;
}
```

### TokensMinted

```solidity
event TokensMinted(address mintedTo, uint256 tokenIdMinted, string uri)
```

_Emitted when an account with MINTER_ROLE mints an NFT._

### TokensMintedWithSignature

```solidity
event TokensMintedWithSignature(address signer, address mintedTo, uint256 tokenIdMinted, struct IERC721Token.MintRequest mintRequest)
```

_Emitted when tokens are minted._

### verify

```solidity
function verify(struct IERC721Token.MintRequest req, bytes signature) external view returns (bool success, address signer)
```

@notice Verifies that a mint request is signed by an account holding
        MINTER_ROLE (at the time of the function call).

 @param req The mint request.
 @param signature The signature produced by an account signing the mint request.

 returns (success, signer) Result of verification and the recovered address.

### mintTo

```solidity
function mintTo(address to, string uri) external returns (uint256)
```

@notice Lets an account with MINTER_ROLE mint an NFT.

 @param to The address to mint the NFT to.
 @param uri The URI to assign to the NFT.

 @return tokenId of the NFT minted.

### mintWithSignature

```solidity
function mintWithSignature(struct IERC721Token.MintRequest req, bytes signature) external payable returns (uint256)
```

@notice Mints an NFT according to the provided mint request.

 @param req The mint request.
 @param signature he signature produced by an account signing the mint request.

## CurrencyTransferLib

### NATIVE_TOKEN

```solidity
address NATIVE_TOKEN
```

_The address interpreted as native token of the chain._

### transferCurrency

```solidity
function transferCurrency(address _currency, address _from, address _to, uint256 _amount) internal
```

_Transfers a given amount of currency._

### transferCurrencyWithWrapper

```solidity
function transferCurrencyWithWrapper(address _currency, address _from, address _to, uint256 _amount, address _nativeTokenWrapper) internal
```

_Transfers a given amount of currency. (With native token wrapping)_

### safeTransferERC20

```solidity
function safeTransferERC20(address _currency, address _from, address _to, uint256 _amount) internal
```

_Transfer `amount` of ERC20 token from `from` to `to`._

### safeTransferNativeToken

```solidity
function safeTransferNativeToken(address to, uint256 value) internal
```

_Transfers `amount` of native token to `to`._

### safeTransferNativeTokenWithWrapper

```solidity
function safeTransferNativeTokenWithWrapper(address to, uint256 value, address _nativeTokenWrapper) internal
```

_Transfers `amount` of native token to `to`. (With native token wrapping)_

## FeeType

### PRIMARY_SALE

```solidity
uint256 PRIMARY_SALE
```

### MARKET_SALE

```solidity
uint256 MARKET_SALE
```

### SPLIT

```solidity
uint256 SPLIT
```

## MerkleProof

_These functions deal with verification of Merkle Trees proofs.

The proofs can be generated using the JavaScript library
https://github.com/miguelmota/merkletreejs[merkletreejs].
Note: the hashing algorithm should be keccak256 and pair sorting should be enabled.

See `test/utils/cryptography/MerkleProof.test.js` for some examples.

Source: https://github.com/ensdomains/governance/blob/master/contracts/MerkleProof.sol_

### verify

```solidity
function verify(bytes32[] proof, bytes32 root, bytes32 leaf) internal pure returns (bool, uint256)
```

_Returns true if a `leaf` can be proved to be a part of a Merkle tree
defined by `root`. For this, a `proof` must be provided, containing
sibling hashes on the branch from the leaf to the root of the tree. Each
pair of leaves and each pair of pre-images are assumed to be sorted._

## ERC1155Token

_ERC1155Token contract definition
Initializable: a base contract to aid in writing UPGRADEABLE contracts
IERC1155Token: ERC1155 contract interface which contains data structs, event definitions, functions signature
ReentrancyGuardUpgradeable: prevent reentrant calls to a function
ERC2771ContextUpgradeable: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
MulticallUpgradeable: batch together multiple calls in a single external call
AccessControlEnumerableUpgradeable: implement role-based access control mechanisms, more robust than Ownable
EIP712Upgradeable: a standard for hashing and signing of typed structured data
ERC1155Upgradeable: the basic standard multi-token
PlatformFee, PrimarySale, Royalty & OpenseaComp: as extensions_

### CONTRACT_TYPE

```solidity
bytes32 CONTRACT_TYPE
```

### VERSION

```solidity
uint256 VERSION
```

### contractURI

```solidity
string contractURI
```

_Contract level metadata._

### name

```solidity
string name
```

_Token name_

### symbol

```solidity
string symbol
```

_Token symbol_

### TYPEHASH

```solidity
bytes32 TYPEHASH
```

### TRANSFER_ROLE

```solidity
bytes32 TRANSFER_ROLE
```

_Only TRANSFER_ROLE holders can have tokens transferred from or to them, during restricted transfers._

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

_Only MINTER_ROLE holders can sign off on `MintRequest`s._

### MAX_BPS

```solidity
uint16 MAX_BPS
```

_The max bps of the contract. So, 10_000 == 100 %_

### nextTokenIdToMint

```solidity
uint256 nextTokenIdToMint
```

_The next token ID of the NFT to mint._

### minted

```solidity
mapping(bytes32 => bool) minted
```

_Mapping from mint request UID => whether the mint request is processed._

### _tokenURI

```solidity
mapping(uint256 => string) _tokenURI
```

### totalSupply

```solidity
mapping(uint256 => uint256) totalSupply
```

_Token ID => total circulating supply of tokens with that ID._

### isValidBPS

```solidity
modifier isValidBPS(uint256 _bps)
```

### initialize

```solidity
function initialize(address _defaultAdmin, string _name, string _symbol, string _contractURI, address[] _trustedForwarders, address _primarySaleRecipient, address _royaltyRecipient, uint128 _royaltyBps, uint128 _platformFeeBps, address _platformFeeRecipient) external
```

_Initiliazes the contract, like a constructor._

### contractType

```solidity
function contractType() external pure returns (bytes32)
```

_Returns the module type of the contract._

### contractVersion

```solidity
function contractVersion() external pure returns (uint8)
```

_Returns the version of the contract._

### setContractURI

```solidity
function setContractURI(string _uri) external
```

_Lets a module admin set the URI for contract-level metadata._

### uri

```solidity
function uri(uint256 _tokenId) public view returns (string)
```

_Returns the URI for a tokenId_

### mintTo

```solidity
function mintTo(address _to, uint256 _tokenId, string _uri, uint256 _amount) external
```

_Lets an account with MINTER_ROLE mint an NFT._

### burn

```solidity
function burn(address account, uint256 id, uint256 value) public virtual
```

_Lets a token owner burn the tokens they own (i.e. destroy for good)_

### burnBatch

```solidity
function burnBatch(address account, uint256[] ids, uint256[] values) public virtual
```

_Lets a token owner burn multiple tokens they own at once (i.e. destroy for good)_

### mintWithSignature

```solidity
function mintWithSignature(struct IERC1155Token.MintRequest _req, bytes _signature) external payable
```

_Mints an NFT according to the provided mint request._

### verifyRequest

```solidity
function verifyRequest(struct IERC1155Token.MintRequest _req, bytes _signature) internal returns (address)
```

_Verifies that a mint request is valid._

### verify

```solidity
function verify(struct IERC1155Token.MintRequest _req, bytes _signature) public view returns (bool, address)
```

_Verifies that a mint request is signed by an account holding MINTER_ROLE (at the time of the function call)._

### _mintTo

```solidity
function _mintTo(address _to, string _uri, uint256 _tokenId, uint256 _amount) internal
```

_Mints an NFT to `to`_

### _collectPrice

```solidity
function _collectPrice(struct IERC1155Token.MintRequest _req) internal
```

_Collects and distributes the primary sale value of tokens being claimed._

### _recoverAddress

```solidity
function _recoverAddress(struct IERC1155Token.MintRequest _req, bytes _signature) internal view returns (address)
```

_Returns the address of the signer of the mint request._

### _encodeRequest

```solidity
function _encodeRequest(struct IERC1155Token.MintRequest _req) internal pure returns (bytes)
```

_Resolves 'stack too deep' error in `recoverAddress`._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data) internal virtual
```

_See {ERC1155-_beforeTokenTransfer}._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

## ERC721Token

_ERC721Token contract definition
Initializable: a base contract to aid in writing UPGRADEABLE contracts
IERC721Token: ERC721 contract interface which contains data structs, event definitions, functions signature
ReentrancyGuardUpgradeable: prevent reentrant calls to a function
ERC2771ContextUpgradeable: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
MulticallUpgradeable: batch together multiple calls in a single external call
AccessControlEnumerableUpgradeable: implement role-based access control mechanisms, more robust than Ownable
EIP712Upgradeable: a standard for hashing and signing of typed structured data
ERC721EnumerableUpgradeable: Non-Fungible Token Standard
PlatformFee, PrimarySale, Royalty & OpenseaComp: as extensions_

### CONTRACT_TYPE

```solidity
bytes32 CONTRACT_TYPE
```

### VERSION

```solidity
uint256 VERSION
```

### TYPEHASH

```solidity
bytes32 TYPEHASH
```

### TRANSFER_ROLE

```solidity
bytes32 TRANSFER_ROLE
```

_Only TRANSFER_ROLE holders can have tokens transferred from or to them, during restricted transfers._

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

_Only MINTER_ROLE holders can sign off on `MintRequest`s._

### MAX_BPS

```solidity
uint16 MAX_BPS
```

_The max bps of the contract. So, 10_000 == 100 %_

### contractURI

```solidity
string contractURI
```

_Contract level metadata._

### nextTokenIdToMint

```solidity
uint256 nextTokenIdToMint
```

_The token ID of the next token to mint._

### minted

```solidity
mapping(bytes32 => bool) minted
```

_Mapping from mint request UID => whether the mint request is processed._

### uri

```solidity
mapping(uint256 => string) uri
```

_Mapping from tokenId => URI_

### isValidBPS

```solidity
modifier isValidBPS(uint256 _bps)
```

### initialize

```solidity
function initialize(address _defaultAdmin, string _name, string _symbol, string _contractURI, address[] _trustedForwarders, address _primarySaleRecipient, address _royaltyRecipient, uint128 _royaltyBps, uint128 _platformFeeBps, address _platformFeeRecipient) external
```

_Initiliazes the contract, like a constructor._

### contractType

```solidity
function contractType() external pure returns (bytes32)
```

_Returns the module type of the contract._

### contractVersion

```solidity
function contractVersion() external pure returns (uint8)
```

_Returns the version of the contract._

### setContractURI

```solidity
function setContractURI(string _uri) external
```

_Lets a module admin set the URI for contract-level metadata._

### tokenURI

```solidity
function tokenURI(uint256 _tokenId) public view returns (string)
```

_Returns the URI for a tokenId_

### mintTo

```solidity
function mintTo(address _to, string _uri) external returns (uint256)
```

_Lets an account with MINTER_ROLE mint an NFT._

### mintWithSignature

```solidity
function mintWithSignature(struct IERC721Token.MintRequest _req, bytes _signature) external payable returns (uint256 tokenIdMinted)
```

_Mints an NFT according to the provided mint request._

### burn

```solidity
function burn(uint256 tokenId) public virtual
```

_Burns `tokenId`. See {ERC721-_burn}._

### verify

```solidity
function verify(struct IERC721Token.MintRequest _req, bytes _signature) public view returns (bool, address)
```

_Verifies that a mint request is signed by an account holding MINTER_ROLE (at the time of the function call)._

### _mintTo

```solidity
function _mintTo(address _to, string _uri) internal returns (uint256 tokenId)
```

_Mints an NFT to `to`_

### verifyRequest

```solidity
function verifyRequest(struct IERC721Token.MintRequest _req, bytes _signature) internal returns (address)
```

_Verifies that a mint request is valid._

### _recoverAddress

```solidity
function _recoverAddress(struct IERC721Token.MintRequest _req, bytes _signature) internal view returns (address)
```

_Returns the address of the signer of the mint request._

### _hash

```solidity
function _hash(struct IERC721Token.MintRequest _req) internal view returns (bytes32 digest)
```

_Return the digest hash of the mint request._

### _encodeRequest

```solidity
function _encodeRequest(struct IERC721Token.MintRequest _req) internal pure returns (bytes)
```

_Resolves 'stack too deep' error in `recoverAddress`._

### _collectPrice

```solidity
function _collectPrice(struct IERC721Token.MintRequest _req) internal
```

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
```

_See {ERC721-_beforeTokenTransfer}._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

## ContractFactory

_ContractFactory contract definition
IContractFactory: ContractFactory contract interface which contains data structs, event definitions, functions signature
ERC2771Context: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
Multicall: batch together multiple calls in a single external call
AccessControlEnumerable: implement role-based access control mechanisms, more robust than Ownable_

### FACTORY_ROLE

```solidity
bytes32 FACTORY_ROLE
```

_Only FACTORY_ROLE holders can approve/unapprove implementations for proxies to point to._

### registry

```solidity
address registry
```

_The contract registry address_

### approvals

```solidity
mapping(address => bool) approvals
```

_mapping of implementation address to deployment approval_

### currentVersion

```solidity
mapping(bytes32 => uint256) currentVersion
```

_mapping of implementation address to implementation added version_

### implementations

```solidity
mapping(bytes32 => mapping(uint256 => address)) implementations
```

_mapping of contract type to contract version to implementation address_

### deployers

```solidity
mapping(address => address) deployers
```

_mapping of proxy address to deployer address_

### constructor

```solidity
constructor(address _trustForwarder, address _registry) public
```

### deployProxy

```solidity
function deployProxy(bytes32 _type, bytes _data) external returns (address)
```

_Deploys a proxy that points to the latest version of the given contract type._

### deployProxyDeterministic

```solidity
function deployProxyDeterministic(bytes32 _type, bytes _data, bytes32 _salt) public returns (address)
```

@dev Deploys a proxy at a deterministic address by taking in `salt` as a parameter.
      Proxy points to the latest version of the given contract type.

### deployProxyByImplementation

```solidity
function deployProxyByImplementation(address _implementation, bytes _data, bytes32 _salt) public returns (address deployedProxy)
```

_Deploys a proxy that points to the given implementation._

### addImplementation

```solidity
function addImplementation(address _implementation) external
```

_Lets a contract admin set the address of a contract type x version._

### approveImplementation

```solidity
function approveImplementation(address _implementation, bool _toApprove) external
```

_Lets a contract admin approve a specific contract for deployment._

### getImplementation

```solidity
function getImplementation(bytes32 _type, uint256 _version) external view returns (address)
```

_Returns the implementation given a contract type and version._

### getLatestImplementation

```solidity
function getLatestImplementation(bytes32 _type) external view returns (address)
```

_Returns the latest implementation given a contract type._

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

## ContractRegistry

_ContractRegistry contract definition
IContractRegistry: ContractRegistry contract interface which contains data structs, event definitions, functions signature
ERC2771Context: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
Multicall: batch together multiple calls in a single external call
AccessControlEnumerable: implement role-based access control mechanisms, more robust than Ownable_

### REGISTRAR_ROLE

```solidity
bytes32 REGISTRAR_ROLE
```

_Only REGISTRAR_ROLE holders can add/remove deployments of the proxy contract._

### _deployments

```solidity
mapping(address => struct EnumerableSet.AddressSet) _deployments
```

_Deployer address => List of deployment addresses_

### constructor

```solidity
constructor(address _trustForwarder) public
```

### add

```solidity
function add(address _deployer, address _deployment) external
```

Add a deployment for a deployer.

### remove

```solidity
function remove(address _deployer, address _deployment) external
```

Remove a deployment for a deployer.

### getDeployments

```solidity
function getDeployments(address _deployer) external view returns (address[] deployments)
```

Get all deployments for a deployer.

### count

```solidity
function count(address _deployer) external view returns (uint256 deploymentCount)
```

Get the total number of deployments for a deployer.

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

## GreeterError

```solidity
error GreeterError()
```

Greeter error

_this used for testing purpose_

## Greeter

explain to an end user what this does

_explain to a developer any extra details_

### greeting

```solidity
string greeting
```

Greeting message

### constructor

```solidity
constructor(string _greeting) public
```

The constructor of Greeter smart contract

_this will set greeting to `_greeting`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _greeting | string | The initial greeting message |

### greet

```solidity
function greet() public view returns (string)
```

View function to show greeting message

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | Return the greeting message |

### setGreeting

```solidity
function setGreeting(string _greeting) public
```

Set greeting to the given `_greeting`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _greeting | string | the greeting message to set |

### throwError

```solidity
function throwError() external pure
```

experiment function to throw error

## Marketplace

_Marketplace contract definition
IMarketplace: Marketplace contract interface which contains data structs, event definitions, functions signature
Initializable: a base contract to aid in writing UPGRADEABLE contracts
UUPSUpgradeable: allow to perform an upgrade of an ERC1967Proxy using UUPS proxies.
ReentrancyGuardUpgradeable: prevent reentrant calls to a function
ERC2771ContextUpgradeable: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
AccessControlEnumerableUpgradeable: implement role-based access control mechanisms, more robust than Ownable
IERC721ReceiverUpgradeable: NFT token receiver interface (IERC721)
IERC1155ReceiverUpgradeable: Semi-fungible token receiver interface (IERC1155)_

### CONTRACT_TYPE

```solidity
bytes32 CONTRACT_TYPE
```

### VERSION

```solidity
uint256 VERSION
```

### LISTER_ROLE

```solidity
bytes32 LISTER_ROLE
```

_Only lister role holders can create listings, when listings are restricted by lister address._

### ASSET_ROLE

```solidity
bytes32 ASSET_ROLE
```

_Only assets from NFT contracts with asset role can be listed, when listings are restricted by asset address._

### MAX_BPS

```solidity
uint16 MAX_BPS
```

_The max bps of the contract. So, 10_000 == 100 %_

### STARTTIME_BUFFER

```solidity
uint256 STARTTIME_BUFFER
```

_The time buffer start listing in the past_

### nativeTokenWrapper

```solidity
address nativeTokenWrapper
```

_The address of the native token wrapper contract._

### contractURI

```solidity
string contractURI
```

_Contract level metadata._

### totalListings

```solidity
uint256 totalListings
```

_Total number of listings ever created in the marketplace._

### timeBuffer

```solidity
uint64 timeBuffer
```

@dev The amount of time added to an auction's 'endTime', if a bid is made within `timeBuffer`
      seconds of the existing `endTime`. Default: 15 minutes.

### bidBufferBps

```solidity
uint64 bidBufferBps
```

_The minimum % increase required from the previous winning bid. Default: 5%._

### listings

```solidity
mapping(uint256 => struct IMarketplace.Listing) listings
```

_Mapping from uid of listing => listing info._

### offers

```solidity
mapping(uint256 => mapping(address => struct IMarketplace.Offer)) offers
```

_Mapping from uid of a direct listing => offeror address => offer made to the direct listing by the respective offeror._

### winningBid

```solidity
mapping(uint256 => struct IMarketplace.Offer) winningBid
```

_Mapping from uid of an auction listing => current winning bid in an auction._

### onlyListingCreator

```solidity
modifier onlyListingCreator(uint256 _listingId)
```

_Checks whether caller is a listing creator._

### onlyExistingListing

```solidity
modifier onlyExistingListing(uint256 _listingId)
```

_Checks whether a listing exists._

### constructor

```solidity
constructor(address _nativeTokenWrapper) public
```

### initialize

```solidity
function initialize(address _defaultAdmin, string _contractURI, address[] _trustedForwarders, address _platformFeeRecipient, uint256 _platformFeeBps) external
```

_Initiliazes the contract, like a constructor._

### receive

```solidity
receive() external payable
```

_Lets the contract receives native tokens from `nativeTokenWrapper` withdraw._

### contractType

```solidity
function contractType() external pure returns (bytes32)
```

_Returns the type of the contract._

### contractVersion

```solidity
function contractVersion() external pure returns (uint8)
```

_Returns the version of the contract._

### setContractURI

```solidity
function setContractURI(string _uri) external
```

_Lets a module admin set the URI for contract-level metadata._

### onERC1155Received

```solidity
function onERC1155Received(address, address, uint256, uint256, bytes) public virtual returns (bytes4)
```

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address, address, uint256[], uint256[], bytes) public virtual returns (bytes4)
```

### onERC721Received

```solidity
function onERC721Received(address, address, uint256, bytes) external pure returns (bytes4)
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

### createListing

```solidity
function createListing(struct IMarketplace.ListingParameters _params) external
```

_Lets a token owner list tokens for sale: Direct Listing or Auction._

### updateListing

```solidity
function updateListing(uint256 _listingId, uint256 _quantityToList, uint256 _reservePricePerToken, uint256 _buyoutPricePerToken, address _currencyToAccept, uint256 _startTime, uint256 _secondsUntilEndTime) external
```

_Lets a listing's creator edit the listing's parameters._

### cancelDirectListing

```solidity
function cancelDirectListing(uint256 _listingId) external
```

_Lets a direct listing creator cancel their listing._

### buy

```solidity
function buy(uint256 _listingId, address _buyFor, uint256 _quantityToBuy, address _currency, uint256 _totalPrice) external payable
```

_Lets an account buy a given quantity of tokens from a direct listing._

### acceptOffer

```solidity
function acceptOffer(uint256 _listingId, address _offeror, address _currency, uint256 _pricePerToken) external
```

_Lets a listing's creator accept an offer for their direct listing._

### executeSale

```solidity
function executeSale(struct IMarketplace.Listing _targetListing, address _payer, address _receiver, address _currency, uint256 _currencyAmountToTransfer, uint256 _listingTokenAmountToTransfer) internal
```

_Performs a direct listing sale._

### offer

```solidity
function offer(uint256 _listingId, uint256 _quantityWanted, address _currency, uint256 _pricePerToken, uint256 _expirationTimestamp) external payable
```

_Lets an account make an offer to a direct listing._

### handleOffer

```solidity
function handleOffer(struct IMarketplace.Listing _targetListing, struct IMarketplace.Offer _newOffer) internal
```

_Processes a new offer to a direct listing._

### handleBid

```solidity
function handleBid(struct IMarketplace.Listing _targetListing, struct IMarketplace.Offer _incomingBid) internal
```

_Processes an incoming bid in an auction._

### isNewWinningBid

```solidity
function isNewWinningBid(uint256 _reserveAmount, uint256 _currentWinningBidAmount, uint256 _incomingBidAmount) internal view returns (bool isValidNewBid)
```

_Checks whether an incoming bid is the new current highest bid._

### closeAuction

```solidity
function closeAuction(uint256 _listingId, address _closeFor) external
```

_Lets an account close an auction for eit her the (1) winning bidder, or (2) auction creator._

### _cancelAuction

```solidity
function _cancelAuction(struct IMarketplace.Listing _targetListing) internal
```

_Cancels an auction._

### _closeAuctionForAuctionCreator

```solidity
function _closeAuctionForAuctionCreator(struct IMarketplace.Listing _targetListing, struct IMarketplace.Offer _winningBid) internal
```

_Closes an auction for an auction creator; distributes winning bid amount to auction creator._

### _closeAuctionForBidder

```solidity
function _closeAuctionForBidder(struct IMarketplace.Listing _targetListing, struct IMarketplace.Offer _winningBid) internal
```

_Closes an auction for the winning bidder; distributes auction items to the winning bidder._

### setAuctionBuffers

```solidity
function setAuctionBuffers(uint256 _timeBuffer, uint256 _bidBufferBps) external
```

_Lets a contract admin set auction buffers._

### transferListingTokens

```solidity
function transferListingTokens(enum IMarketplace.TokenType tokenType, address _assetContract, address _from, address _to, uint256 _tokenId, uint256 _quantity) internal
```

_Transfers tokens listed for sale in a direct or auction listing._

### payout

```solidity
function payout(address _payer, address _payee, address _currencyToUse, uint256 _totalPayoutAmount, struct IMarketplace.Listing _listing) internal
```

_Pays out stakeholders in a sale._

### validateOwnershipAndApproval

```solidity
function validateOwnershipAndApproval(enum IMarketplace.TokenType _tokenType, address _tokenOwner, address _assetContract, uint256 _tokenId, uint256 _quantity) internal view
```

_Validates that `_tokenOwner` owns and has approved Market to transfer NFTs._

### validateERC20BalAndAllowance

```solidity
function validateERC20BalAndAllowance(address _addrToCheck, address _currency, uint256 _currencyAmountToCheckAgainst) internal view
```

_Validates that `_addrToCheck` owns and has approved markeplace to transfer the appropriate amount of currency_

### validateDirectListingSale

```solidity
function validateDirectListingSale(struct IMarketplace.Listing _listing, address _payer, uint256 _quantityToBuy, address _currency, uint256 settledTotalPrice) internal
```

_Validates conditions of a direct listing sale._

### getTokenType

```solidity
function getTokenType(address _assetContract) internal view returns (enum IMarketplace.TokenType tokenType)
```

_Returns the interface supported by a contract._

### getSafeQuantity

```solidity
function getSafeQuantity(enum IMarketplace.TokenType _tokenType, uint256 _quantityToCheck) internal pure returns (uint256 safeQuantity)
```

_Enforces quantity == 1 if tokenType is TokenType.ERC721._

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal virtual
```

_Function that should revert when `msg.sender` is not authorized to upgrade the contract. Called by
{upgradeTo} and {upgradeToAndCall}.

Normally, this function will use an xref:access.adoc[access control] modifier such as {Ownable-onlyOwner}.

```solidity
function _authorizeUpgrade(address) internal override onlyOwner {}
```_

### _isListingCreator

```solidity
function _isListingCreator(uint256 _listingId) internal view
```

### _isListingExists

```solidity
function _isListingExists(uint256 _listingId) internal view
```

## BatchMintMetadata

### batchIds

```solidity
uint256[] batchIds
```

_Largest tokenId of each batch of tokens with the same baseURI._

### baseURI

```solidity
mapping(uint256 => string) baseURI
```

_Mapping from id of a batch of tokens => to base URI for the respective batch of tokens._

### getBaseURICount

```solidity
function getBaseURICount() public view returns (uint256)
```

@notice         Returns the count of batches of NFTs.
 @dev            Each batch of tokens has an in ID and an associated `baseURI`.
                 See {batchIds}.

### getBatchIdAtIndex

```solidity
function getBatchIdAtIndex(uint256 _index) public view returns (uint256)
```

@notice         Returns the ID for the batch of tokens the given tokenId belongs to.
 @dev            See {getBaseURICount}.
 @param _index   ID of a token.

### _getBatchId

```solidity
function _getBatchId(uint256 _tokenId) internal view returns (uint256 batchId, uint256 index)
```

_Returns the id for the batch of tokens the given tokenId belongs to._

### _getBaseURI

```solidity
function _getBaseURI(uint256 _tokenId) internal view returns (string)
```

_Returns the baseURI for a token. The intended metadata URI for the token is baseURI + tokenId._

### _setBaseURI

```solidity
function _setBaseURI(uint256 _batchId, string _baseURI) internal
```

_Sets the base URI for the batch of tokens with the given batchId._

### _batchMintMetadata

```solidity
function _batchMintMetadata(uint256 _startId, uint256 _amountToMint, string _baseURIForTokens) internal returns (uint256 nextTokenIdToMint, uint256 batchId)
```

_Mints a batch of tokenIds and associates a common baseURI to all those Ids._

## DelayedReveal

### encryptedData

```solidity
mapping(uint256 => bytes) encryptedData
```

_Mapping from tokenId of a batch of tokens => to delayed reveal data._

### _getEncryptedData

```solidity
function _getEncryptedData(uint256 _batchId) internal view returns (bytes data)
```

_Get the delayed reveal data by a batchId._

### _setEncryptedData

```solidity
function _setEncryptedData(uint256 _batchId, bytes _encryptedData) internal
```

_Sets the delayed reveal data for a batchId._

### getRevealURI

```solidity
function getRevealURI(uint256 _batchId, bytes _key) public view returns (string revealedURI)
```

@notice             Returns revealed URI for a batch of NFTs.
 @dev                Reveal encrypted base URI for `_batchId` with caller/admin's `_key` used for encryption.
                     Reverts if there's no encrypted URI for `_batchId`.
                     See {encryptDecrypt}.

 @param _batchId     ID of the batch for which URI is being revealed.
 @param _key         Secure key used by caller/admin for encryption of baseURI.

 @return revealedURI Decrypted base URI.

### encryptDecrypt

```solidity
function encryptDecrypt(bytes data, bytes key) public pure returns (bytes result)
```

@notice         Encrypt/decrypt data on chain.
 @dev            Encrypt/decrypt given `data` with `key`. Uses inline assembly.
                 See: https://ethereum.stackexchange.com/questions/69825/decrypt-message-on-chain

 @param data     Bytes of data to encrypt/decrypt.
 @param key      Secure key used by caller for encryption/decryption.

 @return result  Output after encryption/decryption of given data.

### isEncryptedBatch

```solidity
function isEncryptedBatch(uint256 _batchId) public view returns (bool)
```

@notice         Returns whether the relvant batch of NFTs is subject to a delayed reveal.
 @dev            Returns `true` if `_batchId`'s base URI is encrypted.
 @param _batchId ID of a batch of NFTs.

## LazyMint

### nextTokenIdToLazyMint

```solidity
uint256 nextTokenIdToLazyMint
```

The tokenId assigned to the next new NFT to be lazy minted.

### lazyMint

```solidity
function lazyMint(uint256 _amount, string _baseURIForTokens, bytes _extraData) public virtual returns (uint256 batchId)
```

@notice Lazy mints a given amount of NFTs.

 @param _amount           The number of NFTs to lazy mint.

 @param _baseURIForTokens The base URI for the 'n' number of NFTs being lazy minted, where the metadata for each
                         of those NFTs is `${baseURIForTokens}/${tokenId}`.

 @param _extraData        Additional bytes data to be used at the discretion of the consumer of the contract.

 @return batchId         A unique integer identifier for the batch of NFTs lazy minted together.

### _canLazyMint

```solidity
function _canLazyMint() internal view virtual returns (bool)
```

_Returns whether lazy minting can be performed in the given execution context._

## OpenseaComp

### _owner

```solidity
address _owner
```

_Owner of the contract (purpose: OpenSea compatibility, etc.)_

### constructor

```solidity
constructor(address _admin) internal
```

### owner

```solidity
function owner() public view virtual returns (address)
```

_Returns the address of the current owner._

### setOwner

```solidity
function setOwner(address _newOwner) public virtual
```

_Lets a module admin set a new owner for the contract. The new owner must be a module admin.
Can only be called by the module owner._

### _setOwner

```solidity
function _setOwner(address _newOwner) internal virtual
```

_Lets a module admin set a new owner for the contract. The new owner must be a module admin.
Internal function without access restriction._

## PrimarySale

### _primarySaleRecipient

```solidity
address _primarySaleRecipient
```

_The adress that receives all primary sales value._

### constructor

```solidity
constructor(address _saleRecipient) internal
```

### primarySaleRecipient

```solidity
function primarySaleRecipient() public view virtual returns (address)
```

_Returns the address of the primary sale recipient._

### setPrimarySaleRecipient

```solidity
function setPrimarySaleRecipient(address _saleRecipient) public virtual
```

_Lets a module admin set the default recipient of all primary sales.
Can only be called by the module owner._

### _setPrimarySaleRecipient

```solidity
function _setPrimarySaleRecipient(address _saleRecipient) internal virtual
```

_Lets a module admin set the default recipient of all primary sales.
Internal function without access restriction._

## Royalty

### MAX_BPS

```solidity
uint256 MAX_BPS
```

_Max BPS_

### royaltyRecipient

```solidity
address royaltyRecipient
```

_The recipient of who gets the royalty._

### royaltyBps

```solidity
uint128 royaltyBps
```

_The percentage of royalty how much royalty in basis points._

### royaltyInfoForToken

```solidity
mapping(uint256 => struct IRoyalty.RoyaltyInfo) royaltyInfoForToken
```

_Token ID => royalty recipient and bps for token_

### isValidBPS

```solidity
modifier isValidBPS(uint256 _bps)
```

### constructor

```solidity
constructor(address _royaltyRecipient, uint128 _royaltyBps) internal
```

### setDefaultRoyaltyInfo

```solidity
function setDefaultRoyaltyInfo(address _royaltyRecipient, uint256 _royaltyBps) external virtual
```

_Lets a module admin update the royalty bps and recipient.
Can only be called by the module owner._

### setRoyaltyInfoForToken

```solidity
function setRoyaltyInfoForToken(uint256 _tokenId, address _recipient, uint256 _bps) public virtual
```

_Lets a module admin set the royalty recipient for a particular token Id._

### getDefaultRoyaltyInfo

```solidity
function getDefaultRoyaltyInfo() public view virtual returns (address, uint16)
```

_Returns the platform fee bps and recipient._

### getRoyaltyInfoForToken

```solidity
function getRoyaltyInfoForToken(uint256 _tokenId) public view virtual returns (address, uint16)
```

_Returns the royalty recipient for a particular token Id._

### royaltyInfo

```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice) external view virtual returns (address receiver, uint256 royaltyAmount)
```

_See EIP-2981_

### _setDefaultRoyaltyInfo

```solidity
function _setDefaultRoyaltyInfo(address _royaltyRecipient, uint256 _royaltyBps) internal virtual
```

_Lets a module admin update the royalty bps and recipient.
Internal function without access restriction._

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

## IDelayedReveal

### TokenURIRevealed

```solidity
event TokenURIRevealed(uint256 index, string revealedURI)
```

_Emitted when tokens are revealed._

### reveal

```solidity
function reveal(uint256 identifier, bytes key) external returns (string revealedURI)
```

@notice Reveals a batch of delayed reveal NFTs.

 @param identifier The ID for the batch of delayed-reveal NFTs to reveal.

 @param key        The key with which the base URI for the relevant batch of NFTs was encrypted.

### encryptDecrypt

```solidity
function encryptDecrypt(bytes data, bytes key) external pure returns (bytes result)
```

@notice Performs XOR encryption/decryption.

 @param data The data to encrypt. In the case of delayed-reveal NFTs, this is the "revealed" state
             base URI of the relevant batch of NFTs.

 @param key  The key with which to encrypt data

## ILazyMint

### TokensLazyMinted

```solidity
event TokensLazyMinted(uint256 startTokenId, uint256 endTokenId, string baseURI, bytes encryptedBaseURI)
```

_Emitted when tokens are lazy minted._

### lazyMint

```solidity
function lazyMint(uint256 _amount, string _baseURIForTokens, bytes _extraData) external returns (uint256 batchId)
```

@notice Lazy mints a given amount of NFTs.

 @param _amount           The number of NFTs to lazy mint.

 @param _baseURIForTokens The base URI for the 'n' number of NFTs being lazy minted, where the metadata for each
                         of those NFTs is `${baseURIForTokens}/${tokenId}`.

 @param _extraData        Additional bytes data to be used at the discretion of the consumer of the contract.

 @return batchId         A unique integer identifier for the batch of NFTs lazy minted together.

## IContractFactory

### ProxyDeployed

```solidity
event ProxyDeployed(address implementation, address proxy, address deployer)
```

_Emitted when a proxy is deployed._

### ImplementationAdded

```solidity
event ImplementationAdded(address implementation, bytes32 contractType, uint256 version)
```

_Emitted when a new version of implementation is added._

### ImplementationApproved

```solidity
event ImplementationApproved(address implementation, bool isApproved)
```

_Emitted when an implementation is approved._

### registry

```solidity
function registry() external returns (address)
```

### deployProxy

```solidity
function deployProxy(bytes32 _type, bytes _data) external returns (address)
```

### deployProxyDeterministic

```solidity
function deployProxyDeterministic(bytes32 _type, bytes _data, bytes32 _salt) external returns (address)
```

### deployProxyByImplementation

```solidity
function deployProxyByImplementation(address implementation, bytes data, bytes32 salt) external returns (address)
```

@notice Deploys a proxy that points to that points to the given implementation.
 @param implementation           Address of the implementation to point to.
 @param data                     Additional data to pass to the proxy constructor or any other data useful during deployement.
 @param salt                     Salt to use for the deterministic address generation.

### addImplementation

```solidity
function addImplementation(address _implementation) external
```

### approveImplementation

```solidity
function approveImplementation(address _implementation, bool _toApprove) external
```

### getImplementation

```solidity
function getImplementation(bytes32 _type, uint256 _version) external view returns (address)
```

### getLatestImplementation

```solidity
function getLatestImplementation(bytes32 _type) external view returns (address)
```

## IContractRegistry

### Added

```solidity
event Added(address deployer, address deployment)
```

### Deleted

```solidity
event Deleted(address deployer, address deployment)
```

### add

```solidity
function add(address _deployer, address _deployment) external
```

Add a deployment for a deployer.

### remove

```solidity
function remove(address _deployer, address _deployment) external
```

Remove a deployment for a deployer.

### getDeployments

```solidity
function getDeployments(address _deployer) external view returns (address[] deployments)
```

Get all deployments for a deployer.

### count

```solidity
function count(address _deployer) external view returns (uint256 deploymentCount)
```

Get the total number of deployments for a deployer.

## IMarketplace

### TokenType

```solidity
enum TokenType {
  ERC1155,
  ERC721
}
```

### ListingType

```solidity
enum ListingType {
  Direct,
  Auction
}
```

### Offer

```solidity
struct Offer {
  uint256 listingId;
  address offeror;
  uint256 quantityWanted;
  address currency;
  uint256 pricePerToken;
  uint256 expirationTimestamp;
}
```

### ListingParameters

```solidity
struct ListingParameters {
  address assetContract;
  uint256 tokenId;
  uint256 startTime;
  uint256 secondsUntilEndTime;
  uint256 quantityToList;
  address currencyToAccept;
  uint256 reservePricePerToken;
  uint256 buyoutPricePerToken;
  enum IMarketplace.ListingType listingType;
}
```

### Listing

```solidity
struct Listing {
  uint256 listingId;
  address tokenOwner;
  address assetContract;
  uint256 tokenId;
  uint256 startTime;
  uint256 endTime;
  uint256 quantity;
  address currency;
  uint256 reservePricePerToken;
  uint256 buyoutPricePerToken;
  enum IMarketplace.TokenType tokenType;
  enum IMarketplace.ListingType listingType;
}
```

### ListingAdded

```solidity
event ListingAdded(uint256 listingId, address assetContract, address lister, struct IMarketplace.Listing listing)
```

_Emitted when a new listing is created._

### ListingUpdated

```solidity
event ListingUpdated(uint256 listingId, address listingCreator)
```

_Emitted when the parameters of a listing are updated._

### ListingRemoved

```solidity
event ListingRemoved(uint256 listingId, address listingCreator)
```

_Emitted when a listing is cancelled._

### NewSale

```solidity
event NewSale(uint256 listingId, address assetContract, address lister, address buyer, uint256 quantityBought, uint256 totalPricePaid)
```

_Emitted when a buyer buys from a direct listing, or a lister accepts some
     buyer's offer to their direct listing._

### NewOffer

```solidity
event NewOffer(uint256 listingId, address offeror, enum IMarketplace.ListingType listingType, uint256 quantityWanted, uint256 totalOfferAmount, address currency)
```

_Emitted when (1) a new offer is made to a direct listing, or (2) when a new bid is made in an auction._

### AuctionClosed

```solidity
event AuctionClosed(uint256 listingId, address closer, bool cancelled, address auctionCreator, address winningBidder)
```

_Emitted when an auction is closed._

### AuctionBuffersUpdated

```solidity
event AuctionBuffersUpdated(uint256 timeBuffer, uint256 bidBufferBps)
```

_Emitted when auction buffers are updated._

### createListing

```solidity
function createListing(struct IMarketplace.ListingParameters _params) external
```

@notice Lets a token owner list tokens (ERC 721 or ERC 1155) for sale in a direct listing, or an auction.

 @dev NFTs to list for sale in an auction are escrowed in Marketplace. For direct listings, the contract
      only checks whether the listing's creator owns and has approved Marketplace to transfer the NFTs to list.

 @param _params The parameters that govern the listing to be created.

### updateListing

```solidity
function updateListing(uint256 _listingId, uint256 _quantityToList, uint256 _reservePricePerToken, uint256 _buyoutPricePerToken, address _currencyToAccept, uint256 _startTime, uint256 _secondsUntilEndTime) external
```

@notice Lets a listing's creator edit the listing's parameters. A direct listing can be edited whenever.
         An auction listing cannot be edited after the auction has started.

 @param _listingId            The uid of the lisitng to edit.

 @param _quantityToList       The amount of NFTs to list for sale in the listing. For direct lisitngs, the contract
                              only checks whether the listing creator owns and has approved Marketplace to transfer
                              `_quantityToList` amount of NFTs to list for sale. For auction listings, the contract
                              ensures that exactly `_quantityToList` amount of NFTs to list are escrowed.

 @param _reservePricePerToken For direct listings: this value is ignored. For auctions: the minimum bid amount of
                              the auction is `reservePricePerToken * quantityToList`

 @param _buyoutPricePerToken  For direct listings: interpreted as 'price per token' listed. For auctions: if
                              `buyoutPricePerToken` is greater than 0, and a bidder's bid is at least as great as
                              `buyoutPricePerToken * quantityToList`, the bidder wins the auction, and the auction
                              is closed.

 @param _currencyToAccept     For direct listings: the currency in which a buyer must pay the listing's fixed price
                              to buy the NFT(s). For auctions: the currency in which the bidders must make bids.

 @param _startTime            The unix timestamp after which listing is active. For direct listings:
                              'active' means NFTs can be bought from the listing. For auctions,
                              'active' means bids can be made in the auction.

 @param _secondsUntilEndTime  No. of seconds after the provided `_startTime`, after which the listing is inactive.
                              For direct listings: 'inactive' means NFTs cannot be bought from the listing.
                              For auctions: 'inactive' means bids can no longer be made in the auction.

### cancelDirectListing

```solidity
function cancelDirectListing(uint256 _listingId) external
```

@notice Lets a direct listing creator cancel their listing.

 @param _listingId The unique Id of the lisitng to cancel.

### buy

```solidity
function buy(uint256 _listingId, address _buyFor, uint256 _quantity, address _currency, uint256 _totalPrice) external payable
```

@notice Lets someone buy a given quantity of tokens from a direct listing by paying the fixed price.

 @param _listingId The uid of the direct lisitng to buy from.
 @param _buyFor The receiver of the NFT being bought.
 @param _quantity The amount of NFTs to buy from the direct listing.
 @param _currency The currency to pay the price in.
 @param _totalPrice The total price to pay for the tokens being bought.

 @dev A sale will fail to execute if either:
         (1) buyer does not own or has not approved Marketplace to transfer the appropriate
             amount of currency (or hasn't sent the appropriate amount of native tokens)

         (2) the lister does not own or has removed Markeplace's
             approval to transfer the tokens listed for sale.

### offer

```solidity
function offer(uint256 _listingId, uint256 _quantityWanted, address _currency, uint256 _pricePerToken, uint256 _expirationTimestamp) external payable
```

@notice Lets someone make an offer to a direct listing or bid in an auction.

 @dev Each (address, listing ID) pair maps to a single unique offer. So e.g. if a buyer makes
      makes two offers to the same direct listing, the last offer is counted as the buyer's
      offer to that listing.

 @param _listingId        The unique ID of the lisitng to make an offer/bid to.

 @param _quantityWanted   For auction listings: the 'quantity wanted' is the total amount of NFTs
                          being auctioned, regardless of the value of `_quantityWanted` passed.
                          For direct listings: `_quantityWanted` is the quantity of NFTs from the
                          listing, for which the offer is being made.

 @param _currency         For auction listings: the 'currency of the bid' is the currency accepted
                          by the auction, regardless of the value of `_currency` passed. For direct
                          listings: this is the currency in which the offer is made.

 @param _pricePerToken    For direct listings: offered price per token. For auction listings: the bid
                          amount per token. The total offer/bid amount is `_quantityWanted * _pricePerToken`.

 @param _expirationTimestamp For aution listings: inapplicable. For direct listings: The timestamp after which
                             the seller can no longer accept the offer.

### acceptOffer

```solidity
function acceptOffer(uint256 _listingId, address _offeror, address _currency, uint256 _totalPrice) external
```

Lets a listing's creator accept an offer to their direct listing.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _listingId | uint256 | The unique ID of the listing for which to accept the offer. |
| _offeror | address | The address of the buyer whose offer is to be accepted. |
| _currency | address | The currency of the offer that is to be accepted. |
| _totalPrice | uint256 | The total price of the offer that is to be accepted. |

### closeAuction

```solidity
function closeAuction(uint256 _listingId, address _closeFor) external
```

@notice Lets any account close an auction on behalf of either the (1) auction's creator, or (2) winning bidder.
             For (1): The auction creator is sent the the winning bid amount.
             For (2): The winning bidder is sent the auctioned NFTs.

 @param _listingId The uid of the listing (the auction to close).
 @param _closeFor For whom the auction is being closed - the auction creator or winning bidder.

## MinimalForwarderMock

### constructor

```solidity
constructor() public
```

## WETH

### Deposit

```solidity
event Deposit(address account, uint256 amount)
```

### Withdrawal

```solidity
event Withdrawal(address account, uint256 amount)
```

### constructor

```solidity
constructor() public
```

### receive

```solidity
receive() external payable
```

### deposit

```solidity
function deposit() public payable
```

### withdraw

```solidity
function withdraw(uint256 _amount) public
```

## ERC20Test

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint(address to, uint256 amount) external
```

## ERC721Test

### nextTokenIdToMint

```solidity
uint256 nextTokenIdToMint
```

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint(address _receiver, uint256 _amount) external
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

