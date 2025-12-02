# Web3 Wallet Implementation Plan

## Overview

Create a full-featured Web3 wallet supporting multiple blockchains, starting with Ethereum and EVM-compatible chains (Polygon, BSC, etc.), and Solana. The implementation will include secure key management, transaction handling, and a complete UI.

## Dependencies to Install

- `ethers` - Ethereum/EVM blockchain interaction
- `react-native-keychain` - Secure storage for private keys
- `react-native-qrcode-svg` - Generate QR codes for wallet addresses
- `@react-native-async-storage/async-storage` - General async storage (if not already installed)
- `bip39` - Mnemonic phrase generation and validation
- `react-native-svg` - Already installed, needed for QR codes
- `@solana/web3.js` - Solana blockchain interaction
- `@solana/spl-token` - Solana SPL token support
- `bs58` - Base58 encoding/decoding for Solana
- `ed25519-hd-key` - Solana key derivation
- `bip32` - BIP32 key derivation
- Polyfills: `buffer`, `process`, `readable-stream`, `react-native-get-random-values`, `@react-native-clipboard/clipboard`

## Database Schema Updates

### Add to `src/database/database.js`:

1. **wallets table**: Store wallet metadata
   - `id` (PRIMARY KEY)
   - `user_id` (INTEGER, links to users table)
   - `chain` (TEXT) - e.g., 'ethereum', 'polygon', 'bsc', 'solana'
   - `address` (TEXT) - Wallet address
   - `name` (TEXT) - User-friendly wallet name
   - `created_at` (DATETIME)
   - `updated_at` (DATETIME)

2. **transactions table**: Store transaction history
   - `id` (PRIMARY KEY)
   - `wallet_id` (INTEGER, FOREIGN KEY to wallets)
   - `tx_hash` (TEXT) - Transaction hash
   - `from_address` (TEXT)
   - `to_address` (TEXT)
   - `amount` (TEXT) - Amount in wei/wei equivalent
   - `token_symbol` (TEXT) - 'ETH', 'USDT', etc.
   - `status` (TEXT) - 'pending', 'confirmed', 'failed'
   - `chain` (TEXT)
   - `created_at` (DATETIME)

## File Structure

### Services (`src/services/wallet/`)

1. **`walletService.js`** - Core wallet operations
   - `createWallet(chain, name)` - Generate new wallet with mnemonic
   - `importWallet(chain, privateKeyOrMnemonic, name)` - Import existing wallet
   - `getWallets(userId)` - Get all wallets for user
   - `getWalletById(walletId)` - Get specific wallet
   - `deleteWallet(walletId)` - Remove wallet

2. **`keychainService.js`** - Secure key storage
   - `storePrivateKey(walletId, privateKey)` - Encrypt and store private key
   - `getPrivateKey(walletId)` - Retrieve and decrypt private key
   - `deletePrivateKey(walletId)` - Remove stored key

3. **`balanceService.js`** - Fetch balances
   - `getBalance(address, chain)` - Get native token balance
   - `getTokenBalance(address, tokenAddress, chain)` - Get ERC20/SPL token balance
   - `getAllBalances(walletId)` - Get all balances for a wallet

4. **`transactionService.js`** - Transaction operations
   - `sendTransaction(walletId, toAddress, amount, chain)` - Send native token
   - `sendTokenTransaction(walletId, tokenAddress, toAddress, amount, chain)` - Send ERC20/SPL token
   - `getTransactionHistory(walletId)` - Fetch transaction history
   - `getTransactionStatus(txHash, chain)` - Check transaction status

5. **`chainConfig.js`** - Blockchain network configurations
   - RPC endpoints for different chains
   - Chain IDs and network names
   - Token contracts (USDT, USDC, etc.)

### Components (`src/components/wallet/`)

1. **`WalletCard.jsx`** - Display wallet info (address, balance, chain)
2. **`AddressQRCode.jsx`** - Display QR code for wallet address
3. **`TransactionItem.jsx`** - Display individual transaction
4. **`CreateWalletModal.jsx`** - Modal for creating new wallet
5. **`ImportWalletModal.jsx`** - Modal for importing wallet
6. **`SendTransactionModal.jsx`** - Modal for sending transactions
7. **`MnemonicDisplay.jsx`** - Display and copy mnemonic phrase (with security warning)

### Screens (`src/screens/tabs/Wallet.jsx`)

Update the Wallet screen to include:
- List of user's wallets
- "Create Wallet" button
- "Import Wallet" button
- Wallet cards showing balance and address
- Transaction history section
- Send/Receive buttons
- QR code display modal

## Implementation Steps

1. **Install dependencies** - Add required npm packages
2. **Configure polyfills** - Set up Buffer, process, stream, crypto polyfills in `index.js` and `metro.config.js`
3. **Update database schema** - Add wallets and transactions tables with migration logic
4. **Create keychain service** - Secure private key storage using React Native Keychain
5. **Create chain config** - Network configurations for Ethereum, Polygon, BSC, Solana
6. **Create wallet service** - Core wallet operations (create/import) with multi-chain support
7. **Create balance service** - Fetch balances from blockchain with fallback RPC endpoints
8. **Create transaction service** - Send transactions and fetch transaction history
9. **Create UI components** - Wallet cards, modals, QR codes, transaction items
10. **Update Wallet screen** - Integrate all services and components with full wallet functionality
11. **Add error handling** - Comprehensive error handling, validation, and user feedback throughout wallet features

## Security Considerations

- Private keys stored in React Native Keychain (encrypted)
- Mnemonic phrases shown only once during creation with security warning
- All sensitive operations require user confirmation
- Input validation for addresses and amounts
- Transaction signing happens locally, never expose private keys
- Keys never logged or exposed in UI

## Supported Blockchains

### EVM Chains
- **Ethereum** - Mainnet
- **Polygon** - Mainnet (with fallback RPC)
- **BSC (Binance Smart Chain)** - Mainnet

### Non-EVM Chains
- **Solana** - Devnet (configurable to mainnet)

## Network Configuration

### RPC Endpoints
- **Ethereum:** `https://eth.llamarpc.com`
- **Polygon:** `https://rpc.ankr.com/polygon` (with `https://polygon-rpc.com` fallback)
- **BSC:** `https://bsc-dataseed.binance.org`
- **Solana:** `https://api.devnet.solana.com` (devnet for testing)

### Block Explorers
- **Ethereum:** https://etherscan.io
- **Polygon:** https://polygonscan.com
- **BSC:** https://bscscan.com
- **Solana:** https://solscan.io/?cluster=devnet

## Key Features

### Wallet Management
- ✅ Create new wallets with mnemonic backup
- ✅ Import wallets from mnemonic phrase
- ✅ Import wallets from private key (multiple formats)
- ✅ View all wallets for a user
- ✅ Delete wallets (with confirmation)
- ✅ Secure key storage in device keychain

### Balance & Tokens
- ✅ View native token balances (ETH, MATIC, BNB, SOL)
- ✅ View ERC20 token balances (USDT, USDC, DAI)
- ✅ View SPL token balances (Solana)
- ✅ Real-time balance updates
- ✅ Support for multiple tokens per wallet

### Transactions
- ✅ Send native token transactions
- ✅ Transaction history tracking
- ✅ Transaction status monitoring
- ✅ QR code generation for receiving
- ✅ Address validation (EVM and Solana formats)

### User Experience
- ✅ Clean, modern UI
- ✅ Pull-to-refresh for balances
- ✅ Loading states and error handling
- ✅ Confirmation dialogs for sensitive operations
- ✅ Security warnings for mnemonic display

## Troubleshooting Checklist

### Common Issues & Solutions

1. **Buffer Error**
   - Install `buffer` package
   - Add to `index.js`: `global.Buffer = Buffer`
   - Add to `metro.config.js` resolver

2. **Stream Module Error**
   - Install `readable-stream`
   - Add to global scope and metro config

3. **crypto.getRandomValues Error**
   - Install `react-native-get-random-values`
   - Import FIRST in `index.js` (before other imports)

4. **Network Request Failed**
   - Update RPC endpoints
   - Add fallback RPC logic
   - Add timeout protection

5. **Solana Private Key Format**
   - Support multiple formats (hex, base58, JSON array, comma-separated)
   - Install `bs58` for base58 decoding

6. **Metro Cache Issues**
   - Run `npm start -- --reset-cache`
   - Clear node_modules cache

## Testing Requirements

- [ ] Create wallet for each supported chain
- [ ] Import wallet from mnemonic
- [ ] Import wallet from private key (all formats)
- [ ] View balances (native + tokens)
- [ ] Send transactions on all chains
- [ ] View transaction history
- [ ] Display QR codes
- [ ] Delete wallets
- [ ] Error handling (invalid addresses, network failures, etc.)
- [ ] Security (mnemonic backup, key storage)

## Future Extensibility

- Add Solana mainnet support
- Add Bitcoin support (separate service layer)
- Multi-signature wallets
- Hardware wallet integration
- DeFi protocol interactions
- NFT support
- Token swap functionality
- Transaction fee optimization
- Additional EVM chains (Arbitrum, Optimism, Avalanche)

## Success Criteria

✅ Multi-chain wallet creation and import  
✅ Secure key management  
✅ Balance viewing across all chains  
✅ Transaction sending functionality  
✅ Complete UI with all features  
✅ Comprehensive error handling  
✅ Production-ready security practices  

---

**Plan Created:** 2024  
**Status:** ✅ Completed  
**Implementation Time:** Full development cycle with troubleshooting

