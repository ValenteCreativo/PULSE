// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal, auditable native-MON purchase primitive for PULSE intelligence products.
/// @dev This is independent of x402; a later adapter may verify x402 before calling purchase.
contract PulseIntelligenceMarket {
    struct Product {
        uint96 priceWei;
        bool active;
    }

    address public immutable owner;
    mapping(bytes32 => Product) public products;
    mapping(bytes32 => bool) public redeemedPurchaseIds;

    error NotOwner();
    error ProductInactive(bytes32 productId);
    error WrongAmount(uint256 expected, uint256 received);
    error PurchaseAlreadyRedeemed(bytes32 purchaseId);
    error ZeroIdentifier();
    error TransferFailed();

    event ProductConfigured(bytes32 indexed productId, uint96 priceWei, bool active);
    event IntelligencePurchased(
        address indexed buyer,
        bytes32 indexed topicId,
        bytes32 indexed productId,
        uint256 amount,
        bytes32 purchaseId
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function configureProduct(bytes32 productId, uint96 priceWei, bool active) external onlyOwner {
        if (productId == bytes32(0) || priceWei == 0) revert ZeroIdentifier();
        products[productId] = Product({priceWei: priceWei, active: active});
        emit ProductConfigured(productId, priceWei, active);
    }

    /// @notice Records exactly one purchase redemption and emits the Envio-indexable entitlement event.
    function purchase(bytes32 productId, bytes32 topicId, bytes32 purchaseId) external payable {
        if (topicId == bytes32(0) || purchaseId == bytes32(0)) revert ZeroIdentifier();
        Product memory product = products[productId];
        if (!product.active) revert ProductInactive(productId);
        if (msg.value != product.priceWei) revert WrongAmount(product.priceWei, msg.value);
        if (redeemedPurchaseIds[purchaseId]) revert PurchaseAlreadyRedeemed(purchaseId);
        redeemedPurchaseIds[purchaseId] = true;
        emit IntelligencePurchased(msg.sender, topicId, productId, msg.value, purchaseId);
    }

    function withdraw(address payable recipient) external onlyOwner {
        (bool sent,) = recipient.call{value: address(this).balance}("");
        if (!sent) revert TransferFailed();
    }
}
