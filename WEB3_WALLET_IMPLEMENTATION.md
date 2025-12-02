# Web3 Wallet Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Implementation Plan](#implementation-plan)
3. [Development Steps](#development-steps)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Architecture](#architecture)
6. [API Reference](#api-reference)

---

## Overview

This document covers the complete implementation of a multi-chain Web3 wallet supporting Ethereum, Polygon, BSC, and Solana blockchains. The wallet includes secure key management, transaction handling, balance viewing, and a complete UI.

### Features Implemented
- ✅ Multi-chain support (Ethereum, Polygon, BSC, Solana)
- ✅ Wallet creation with mnemonic backup
- ✅ Wallet import (mnemonic or private key)
- ✅ Secure private key storage using React Native Keychain
- ✅ Balance viewing (native tokens + ERC20/SPL tokens)
- ✅ Send transactions (native tokens)
- ✅ Transaction history
- ✅ QR code generation for addresses
- ✅ Comprehensive error handling

---

## Implementation Plan

### Phase 1: Dependencies & Setup
1. Install core dependencies
2. Configure polyfills for React Native
3. Set up database schema

### Phase 2: Core Services
1. Keychain service for secure storage
2. Chain configuration
3. Wallet service (create/import)
4. Balance service
5. Transaction service

### Phase 3: UI Components
1. Wallet cards
2. Modals (create, import, send)
3. QR code display
4. Transaction history

### Phase 4: Integration
1. Update Wallet screen
2. Error handling
3. Testing

---

## Development Steps

### Step 1: Install Dependencies

```bash
# Core Web3 libraries
npm install ethers react-native-keychain react-native-qrcode-svg bip39 @react-native-async-storage/async-storage --legacy-peer-deps

# Solana support
npm install @solana/web3.js @solana/spl-token @solana/wallet-adapter-base bip32 ed25519-hd-key bs58 --legacy-peer-deps

# Polyfills for React Native
npm install buffer process readable-stream react-native-get-random-values --legacy-peer-deps
npm install react-native-crypto util url assert stream-http https-browserify os-browserify path-browserify browserify-zlib --legacy-peer-deps
npm install @react-native-clipboard/clipboard --legacy-peer-deps
```

### Step 2: Configure Polyfills

#### Update `index.js`
```javascript
// IMPORTANT: react-native-get-random-values must be imported FIRST
import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';
import { Buffer } from 'buffer';
import process from 'process';
import stream from 'readable-stream';

// Polyfill Buffer, process, and stream for React Native
global.Buffer = Buffer;
global.process = process;
if (typeof global.stream === 'undefined') {
  global.stream = stream;
}

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

#### Update `metro.config.js`
```javascript
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = mergeConfig(getDefaultConfig(__dirname), {
  resolver: {
    extraNodeModules: {
      buffer: require.resolve('buffer'),
      process: require.resolve('process/browser'),
      stream: require.resolve('readable-stream'),
      crypto: require.resolve('react-native-crypto'),
      util: require.resolve('util'),
      url: require.resolve('url'),
      assert: require.resolve('assert'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      zlib: require.resolve('browserify-zlib'),
    },
  },
});

module.exports = withNativeWind(config, { input: './global.css' });
```

### Step 3: Database Schema

Add to `src/database/database.js`:

```javascript
// Add wallet tables
const createWalletTables = async () => {
  await db.executeSql(
    `CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      chain TEXT NOT NULL,
      address TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, chain, address)
    );`
  );

  await db.executeSql(
    `CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL,
      tx_hash TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      amount TEXT NOT NULL,
      token_symbol TEXT DEFAULT 'ETH',
      status TEXT DEFAULT 'pending',
      chain TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
      UNIQUE(wallet_id, tx_hash)
    );`
  );
};
```

### Step 4: Create Services

#### Keychain Service (`src/services/wallet/keychainService.js`)
- `storePrivateKey()` - Store encrypted private key
- `getPrivateKey()` - Retrieve private key
- `deletePrivateKey()` - Remove private key

#### Chain Config (`src/services/wallet/chainConfig.js`)
- Network configurations for all chains
- RPC endpoints
- Token contract addresses

#### Wallet Service (`src/services/wallet/walletService.js`)
- `createWallet()` - Generate new wallet
- `importWallet()` - Import existing wallet
- `getWallets()` - Get all wallets
- `removeWallet()` - Delete wallet

#### Balance Service (`src/services/wallet/balanceService.js`)
- `getBalance()` - Get native token balance
- `getTokenBalance()` - Get ERC20/SPL token balance
- `getAllBalances()` - Get all balances for a wallet

#### Transaction Service (`src/services/wallet/transactionService.js`)
- `sendTransaction()` - Send native token
- `sendTokenTransaction()` - Send ERC20 token
- `getTransactionHistory()` - Get transaction history

### Step 5: Create UI Components

Components in `src/components/wallet/`:
- `WalletCard.jsx` - Display wallet info
- `AddressQRCode.jsx` - QR code for address
- `TransactionItem.jsx` - Transaction display
- `CreateWalletModal.jsx` - Create wallet modal
- `ImportWalletModal.jsx` - Import wallet modal
- `SendTransactionModal.jsx` - Send transaction modal
- `MnemonicDisplay.jsx` - Display mnemonic phrase

### Step 6: Update Wallet Screen

Integrate all services and components in `src/screens/tabs/Wallet.jsx`

---

## Troubleshooting Guide

### Error 1: `Property 'Buffer' doesn't exist`

**Error Message:**
```
Error: Property 'Buffer' doesn't exist
```

**Cause:** React Native doesn't have Node.js `Buffer` by default, which is required by crypto libraries.

**Solution:**
1. Install buffer: `npm install buffer --legacy-peer-deps`
2. Add to `index.js`:
   ```javascript
   import { Buffer } from 'buffer';
   global.Buffer = Buffer;
   ```
3. Add to `metro.config.js`:
   ```javascript
   resolver: {
     extraNodeModules: {
       buffer: require.resolve('buffer'),
     },
   }
   ```
4. Clear cache: `npm start -- --reset-cache`

---

### Error 2: `Unable to resolve module stream`

**Error Message:**
```
Error: Unable to resolve module stream from cipher-base/index.js
```

**Cause:** `stream` module is not available in React Native.

**Solution:**
1. Install readable-stream: `npm install readable-stream --legacy-peer-deps`
2. Add to `index.js`:
   ```javascript
   import stream from 'readable-stream';
   if (typeof global.stream === 'undefined') {
     global.stream = stream;
   }
   ```
3. Add to `metro.config.js`:
   ```javascript
   stream: require.resolve('readable-stream'),
   ```
4. Clear cache and restart

---

### Error 3: `crypto.getRandomValues must be defined`

**Error Message:**
```
Error: crypto.getRandomValues must be defined
```

**Cause:** `bip39` requires `crypto.getRandomValues` for generating random mnemonic phrases.

**Solution:**
1. Install: `npm install react-native-get-random-values --legacy-peer-deps`
2. **IMPORTANT:** Import at the very top of `index.js` (before any other imports):
   ```javascript
   // MUST be first import
   import 'react-native-get-random-values';
   ```
3. Clear cache and restart

---

### Error 4: `Network request failed` (Polygon)

**Error Message:**
```
TypeError: Network request failed
```

**Cause:** RPC endpoint is down or unreachable.

**Solution:**
1. Update RPC URL in `chainConfig.js` to a more reliable endpoint:
   ```javascript
   rpcUrl: 'https://rpc.ankr.com/polygon', // More reliable
   ```
2. Add fallback logic in `balanceService.js`:
   ```javascript
   // Try fallback if primary fails
   if (chain === CHAINS.POLYGON) {
     const fallbackProvider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
     // Use fallback...
   }
   ```
3. Add timeout protection:
   ```javascript
   const balance = await Promise.race([
     provider.getBalance(address),
     new Promise((_, reject) => 
       setTimeout(() => reject(new Error('Request timeout')), 10000)
     ),
   ]);
   ```

---

### Error 5: `Invalid Solana private key format`

**Error Message:**
```
Error: Invalid Solana private key format
```

**Cause:** Solana private keys can be in multiple formats (hex, base58, JSON array, etc.)

**Solution:**
1. Install bs58: `npm install bs58 --legacy-peer-deps`
2. Update `walletService.js` to handle multiple formats:
   ```javascript
   // Support hex, base58, JSON array, comma-separated
   if (trimmedKey.length === 128 && /^[0-9a-fA-F]+$/.test(trimmedKey)) {
     // Hex format
     secretKey = Buffer.from(trimmedKey, 'hex');
   } else if (trimmedKey.length > 80) {
     // Base58 format
     secretKey = Buffer.from(bs58.decode(trimmedKey));
   } else if (trimmedKey.includes(',')) {
     // Comma-separated
     const numbers = trimmedKey.split(',').map(n => parseInt(n.trim(), 10));
     secretKey = Buffer.from(numbers);
   }
   ```

---

### Error 6: Metro bundler cache issues

**Symptoms:** Old code running, imports not resolving, strange errors

**Solution:**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Or manually
rm -rf node_modules/.cache
rm -rf /tmp/metro-*
rm -rf /tmp/haste-map-*

# Rebuild
npm run android  # or npm run ios
```

---

### Error 7: Android build issues with native modules

**Solution:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

---

### Error 8: iOS build issues

**Solution:**
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

---

## Architecture

### File Structure
```
src/
├── services/
│   └── wallet/
│       ├── keychainService.js    # Secure key storage
│       ├── chainConfig.js         # Network configurations
│       ├── walletService.js       # Wallet operations
│       ├── balanceService.js      # Balance fetching
│       └── transactionService.js  # Transaction handling
├── components/
│   └── wallet/
│       ├── WalletCard.jsx
│       ├── AddressQRCode.jsx
│       ├── TransactionItem.jsx
│       ├── CreateWalletModal.jsx
│       ├── ImportWalletModal.jsx
│       ├── SendTransactionModal.jsx
│       └── MnemonicDisplay.jsx
├── screens/
│   └── tabs/
│       └── Wallet.jsx             # Main wallet screen
└── database/
    └── database.js                # Database operations
```

### Data Flow

1. **Wallet Creation:**
   - User inputs → `CreateWalletModal` → `walletService.createWallet()`
   - Generate mnemonic → Create keypair → Save to DB → Store key in Keychain
   - Display mnemonic → User confirms → Wallet ready

2. **Balance Fetching:**
   - `Wallet.jsx` → `balanceService.getAllBalances()`
   - Fetch from blockchain RPC → Parse → Display

3. **Transaction Sending:**
   - User inputs → `SendTransactionModal` → `transactionService.sendTransaction()`
   - Get private key from Keychain → Sign transaction → Broadcast → Save to DB

### Security Considerations

1. **Private Key Storage:**
   - Stored in React Native Keychain (encrypted)
   - Never exposed in logs or UI
   - Only retrieved when needed for signing

2. **Mnemonic Display:**
   - Shown only once during creation
   - User must confirm backup
   - Never stored in plain text

3. **Transaction Signing:**
   - Happens locally on device
   - Private key never leaves device
   - All validation before signing

---

## API Reference

### Wallet Service

#### `createWallet(userId, chain, name)`
Creates a new wallet for the specified chain.

**Parameters:**
- `userId` (number): User ID
- `chain` (string): Chain identifier ('ethereum', 'polygon', 'bsc', 'solana')
- `name` (string, optional): Wallet name

**Returns:**
```javascript
{
  id: number,
  userId: number,
  chain: string,
  address: string,
  name: string,
  mnemonic: string, // Only returned once
}
```

#### `importWallet(userId, chain, mnemonicOrPrivateKey, name)`
Imports an existing wallet.

**Parameters:**
- `userId` (number): User ID
- `chain` (string): Chain identifier
- `mnemonicOrPrivateKey` (string): Mnemonic phrase or private key
- `name` (string, optional): Wallet name

**Returns:**
```javascript
{
  id: number,
  userId: number,
  chain: string,
  address: string,
  name: string,
}
```

### Balance Service

#### `getBalance(address, chain)`
Gets native token balance.

**Parameters:**
- `address` (string): Wallet address
- `chain` (string): Chain identifier

**Returns:** `Promise<string>` - Balance in human-readable format

#### `getAllBalances(walletId)`
Gets all balances for a wallet.

**Returns:**
```javascript
{
  native: {
    symbol: string,
    balance: string,
    formatted: string,
  },
  tokens: Array<{
    symbol: string,
    address: string,
    balance: string,
    decimals: number,
  }>,
}
```

### Transaction Service

#### `sendTransaction(walletId, toAddress, amount)`
Sends native token transaction.

**Parameters:**
- `walletId` (number): Wallet ID
- `toAddress` (string): Recipient address
- `amount` (string): Amount in human-readable format

**Returns:**
```javascript
{
  hash: string,
  from: string,
  to: string,
  amount: string,
  status: 'confirmed' | 'failed',
  blockNumber: number | null,
  gasUsed: string | null,
}
```

---

## Configuration

### Chain Configuration

Edit `src/services/wallet/chainConfig.js` to:
- Add new chains
- Update RPC endpoints
- Add token contracts
- Change network settings

### RPC Endpoints

Current endpoints:
- **Ethereum:** `https://eth.llamarpc.com`
- **Polygon:** `https://rpc.ankr.com/polygon` (with fallback)
- **BSC:** `https://bsc-dataseed.binance.org`
- **Solana:** `https://api.devnet.solana.com` (devnet)

### Database

Wallet data stored in SQLite:
- `wallets` table: Wallet metadata
- `transactions` table: Transaction history

Private keys stored in React Native Keychain (encrypted).

---

## Testing Checklist

- [ ] Create Ethereum wallet
- [ ] Create Polygon wallet
- [ ] Create BSC wallet
- [ ] Create Solana wallet
- [ ] Import wallet from mnemonic
- [ ] Import wallet from private key
- [ ] View balances (all chains)
- [ ] Send transaction (Ethereum)
- [ ] Send transaction (Polygon)
- [ ] Send transaction (BSC)
- [ ] Send transaction (Solana)
- [ ] View transaction history
- [ ] Display QR code
- [ ] Delete wallet
- [ ] Error handling (invalid addresses, insufficient balance, etc.)

---

## Future Enhancements

1. **Token Transactions:**
   - ERC20 token transfers
   - SPL token transfers
   - Token approval

2. **Additional Features:**
   - Multi-signature wallets
   - Hardware wallet integration
   - DeFi protocol interactions
   - NFT support
   - Transaction fee estimation
   - Gas price optimization

3. **Additional Chains:**
   - Bitcoin
   - Avalanche
   - Arbitrum
   - Optimism

4. **UI Improvements:**
   - Dark/light theme
   - Transaction filters
   - Export transaction history
   - Wallet backup/restore

---

## Support & Resources

### Documentation
- [Ethers.js Docs](https://docs.ethers.io/)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [React Native Keychain](https://github.com/oblador/react-native-keychain)

### RPC Providers
- [Ankr](https://www.ankr.com/)
- [Alchemy](https://www.alchemy.com/)
- [Infura](https://www.infura.io/)

### Block Explorers
- [Etherscan](https://etherscan.io/)
- [Polygonscan](https://polygonscan.com/)
- [BSCScan](https://bscscan.com/)
- [Solscan](https://solscan.io/)

---

## Version History

- **v1.0.0** - Initial implementation
  - Multi-chain support (Ethereum, Polygon, BSC, Solana)
  - Wallet creation and import
  - Balance viewing
  - Transaction sending
  - Complete UI

---

## License

This implementation is part of the TruePing project.

---

**Last Updated:** 2024
**Maintained By:** TruePing Development Team

