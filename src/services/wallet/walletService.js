import { ethers } from 'ethers'
import * as bip39 from 'bip39'
import { Keypair } from '@solana/web3.js'
import { derivePath } from 'ed25519-hd-key'
import bs58 from 'bs58'
import { Buffer } from 'buffer'
import { CHAINS } from './chainConfig'
import { saveWallet, getWalletsByUserId, getWalletById, deleteWallet } from '../../database/database'
import { storePrivateKey, deletePrivateKey } from './keychainService'
import { getChainConfig } from './chainConfig'

/**
 * Create a new wallet
 * @param {number} userId - User ID
 * @param {string} chain - Chain identifier (ethereum, polygon, bsc)
 * @param {string} name - Wallet name (optional)
 * @returns {Promise<object>} - Wallet object with mnemonic
 */
export const createWallet = async (userId, chain, name) => {
  try {
    // Validate chain
    const chainConfig = getChainConfig(chain)
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`)
    }

    // Generate mnemonic phrase
    const mnemonic = bip39.generateMnemonic()
    
    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic generated')
    }

    let address
    let privateKey

    // Handle Solana differently from EVM chains
    if (chain === CHAINS.SOLANA) {
      // Solana uses BIP44 path m/44'/501'/0'/0'
      const seed = await bip39.mnemonicToSeed(mnemonic)
      const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key
      const keypair = Keypair.fromSeed(derivedSeed)
      address = keypair.publicKey.toBase58()
      privateKey = Buffer.from(keypair.secretKey).toString('hex')
    } else {
      // EVM chains (Ethereum, Polygon, BSC)
      const wallet = ethers.Wallet.fromPhrase(mnemonic)
      address = wallet.address
      privateKey = wallet.privateKey
    }

    // Save wallet to database
    const walletId = await saveWallet({
      user_id: userId,
      chain: chain,
      address: address,
      name: name || `${chainConfig.name} Wallet`,
    })

    // Store private key securely in keychain
    await storePrivateKey(walletId, privateKey)

    console.log(`Wallet created successfully: ${address} on ${chain}`)

    return {
      id: walletId,
      userId: userId,
      chain: chain,
      address: address,
      name: name || `${chainConfig.name} Wallet`,
      mnemonic: mnemonic, // Return mnemonic only once during creation
      privateKey: null, // Never return private key
    }
  } catch (error) {
    console.error('Error creating wallet:', error)
    throw error
  }
}

/**
 * Import wallet from mnemonic or private key
 * @param {number} userId - User ID
 * @param {string} chain - Chain identifier
 * @param {string} mnemonicOrPrivateKey - Mnemonic phrase or private key
 * @param {string} name - Wallet name (optional)
 * @returns {Promise<object>} - Wallet object
 */
export const importWallet = async (userId, chain, mnemonicOrPrivateKey, name) => {
  try {
    // Validate chain
    const chainConfig = getChainConfig(chain)
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`)
    }

    let wallet
    let address
    let privateKey

    // Check if input is mnemonic or private key
    const isMnemonic = mnemonicOrPrivateKey.split(' ').length >= 12

    if (isMnemonic) {
      // Validate mnemonic
      if (!bip39.validateMnemonic(mnemonicOrPrivateKey.trim())) {
        throw new Error('Invalid mnemonic phrase')
      }

      // Handle Solana differently from EVM chains
      if (chain === CHAINS.SOLANA) {
        const seed = await bip39.mnemonicToSeed(mnemonicOrPrivateKey.trim())
        const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key
        const keypair = Keypair.fromSeed(derivedSeed)
        address = keypair.publicKey.toBase58()
        privateKey = Buffer.from(keypair.secretKey).toString('hex')
      } else {
        // EVM chains
        wallet = ethers.Wallet.fromPhrase(mnemonicOrPrivateKey.trim())
        address = wallet.address
        privateKey = wallet.privateKey
      }
    } else {
      // Assume it's a private key
      if (chain === CHAINS.SOLANA) {
        try {
          const trimmedKey = mnemonicOrPrivateKey.trim()
          let secretKey

          // Try different formats
          // 1. Hex format (128 hex characters = 64 bytes)
          if (trimmedKey.length === 128 && /^[0-9a-fA-F]+$/.test(trimmedKey)) {
            secretKey = Buffer.from(trimmedKey, 'hex')
          }
          // 2. Base58 format (common Solana format)
          else if (trimmedKey.length > 80 && trimmedKey.length < 200) {
            try {
              secretKey = Buffer.from(bs58.decode(trimmedKey))
            } catch (e) {
              // Not base58, try other formats
            }
          }
          // 3. JSON array format [1,2,3,...]
          if (!secretKey) {
            try {
              const parsed = JSON.parse(trimmedKey)
              if (Array.isArray(parsed) && parsed.length === 64) {
                secretKey = Buffer.from(parsed)
              }
            } catch (e) {
              // Not JSON array
            }
          }
          // 4. Comma-separated numbers "1,2,3,..."
          if (!secretKey && trimmedKey.includes(',')) {
            try {
              const numbers = trimmedKey.split(',').map((n) => parseInt(n.trim(), 10))
              if (numbers.length === 64 && numbers.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
                secretKey = Buffer.from(numbers)
              }
            } catch (e) {
              // Not comma-separated
            }
          }

          if (!secretKey) {
            throw new Error('Unable to parse Solana private key. Supported formats: hex (128 chars), base58, JSON array, or comma-separated numbers')
          }

          // Validate secret key length (must be 64 bytes)
          if (secretKey.length !== 64) {
            throw new Error(`Invalid Solana private key length: expected 64 bytes, got ${secretKey.length}`)
          }

          const keypair = Keypair.fromSecretKey(secretKey)
          address = keypair.publicKey.toBase58()
          privateKey = Buffer.from(keypair.secretKey).toString('hex')
        } catch (error) {
          console.error('Solana private key import error:', error)
          throw new Error(error.message || 'Invalid Solana private key format')
        }
      } else {
        // EVM chains
        try {
          wallet = new ethers.Wallet(mnemonicOrPrivateKey.trim())
          address = wallet.address
          privateKey = wallet.privateKey
        } catch (error) {
          throw new Error('Invalid private key format')
        }
      }
    }

    // Check if wallet already exists
    const existingWallets = await getWalletsByUserId(userId)
    const existingWallet = existingWallets.find(
      (w) => 
        (chain === CHAINS.SOLANA 
          ? w.address === address 
          : w.address.toLowerCase() === address.toLowerCase()) 
        && w.chain === chain
    )

    if (existingWallet) {
      throw new Error('Wallet already exists')
    }

    // Save wallet to database
    const walletId = await saveWallet({
      user_id: userId,
      chain: chain,
      address: address,
      name: name || `${chainConfig.name} Wallet`,
    })

    // Store private key securely in keychain
    await storePrivateKey(walletId, privateKey)

    console.log(`Wallet imported successfully: ${address} on ${chain}`)

    return {
      id: walletId,
      userId: userId,
      chain: chain,
      address: address,
      name: name || `${chainConfig.name} Wallet`,
    }
  } catch (error) {
    console.error('Error importing wallet:', error)
    throw error
  }
}

/**
 * Get all wallets for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of wallet objects
 */
export const getWallets = async (userId) => {
  try {
    const wallets = await getWalletsByUserId(userId)
    return wallets.map((wallet) => ({
      id: wallet.id,
      userId: wallet.user_id,
      chain: wallet.chain,
      address: wallet.address,
      name: wallet.name,
      createdAt: wallet.created_at,
      updatedAt: wallet.updated_at,
    }))
  } catch (error) {
    console.error('Error getting wallets:', error)
    return []
  }
}

/**
 * Get wallet by ID
 * @param {number} walletId - Wallet ID
 * @returns {Promise<object|null>} - Wallet object or null
 */
export const getWallet = async (walletId) => {
  try {
    const wallet = await getWalletById(walletId)
    if (!wallet) {
      return null
    }

    return {
      id: wallet.id,
      userId: wallet.user_id,
      chain: wallet.chain,
      address: wallet.address,
      name: wallet.name,
      createdAt: wallet.created_at,
      updatedAt: wallet.updated_at,
    }
  } catch (error) {
    console.error('Error getting wallet:', error)
    return null
  }
}

/**
 * Delete wallet
 * @param {number} walletId - Wallet ID
 * @returns {Promise<boolean>} - Success status
 */
export const removeWallet = async (walletId) => {
  try {
    // Delete private key from keychain
    await deletePrivateKey(walletId)

    // Delete wallet from database (transactions will be cascade deleted)
    await deleteWallet(walletId)

    console.log(`Wallet ${walletId} deleted successfully`)
    return true
  } catch (error) {
    console.error('Error deleting wallet:', error)
    throw error
  }
}

/**
 * Get wallet address from wallet ID
 * @param {number} walletId - Wallet ID
 * @returns {Promise<string|null>} - Wallet address or null
 */
export const getWalletAddress = async (walletId) => {
  try {
    const wallet = await getWallet(walletId)
    return wallet ? wallet.address : null
  } catch (error) {
    console.error('Error getting wallet address:', error)
    return null
  }
}

/**
 * Validate address (EVM or Solana)
 * @param {string} address - Address to validate
 * @param {string} chain - Chain identifier (optional, for Solana validation)
 * @returns {boolean} - True if valid
 */
export const isValidAddress = (address, chain = null) => {
  try {
    if (chain === CHAINS.SOLANA) {
      // Solana addresses are base58 encoded, typically 32-44 characters
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
      return base58Regex.test(address)
    } else {
      // EVM chains
      return ethers.isAddress(address)
    }
  } catch (error) {
    return false
  }
}

/**
 * Validate mnemonic phrase
 * @param {string} mnemonic - Mnemonic phrase to validate
 * @returns {boolean} - True if valid
 */
export const isValidMnemonic = (mnemonic) => {
  try {
    return bip39.validateMnemonic(mnemonic.trim())
  } catch (error) {
    return false
  }
}

