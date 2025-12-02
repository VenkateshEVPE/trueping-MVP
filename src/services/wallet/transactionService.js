import { ethers } from 'ethers'
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import { Buffer } from 'buffer'
import { getRpcUrl, getChainConfig, CHAINS } from './chainConfig'
import { getWalletById } from '../../database/database'
import { getPrivateKey } from './keychainService'
import {
  saveTransaction,
  getTransactionsByWalletId,
  updateTransactionStatus,
} from '../../database/database'

// ERC20 ABI for transfer function
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
]

/**
 * Send native token transaction (ETH, MATIC, BNB, SOL)
 * @param {number} walletId - Wallet ID
 * @param {string} toAddress - Recipient address
 * @param {string} amount - Amount in human-readable format (e.g., "0.1")
 * @returns {Promise<object>} - Transaction result
 */
export const sendTransaction = async (walletId, toAddress, amount) => {
  try {
    // Get wallet info
    const wallet = await getWalletById(walletId)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    const { address, chain } = wallet
    const rpcUrl = getRpcUrl(chain)
    if (!rpcUrl) {
      throw new Error(`Unsupported chain: ${chain}`)
    }

    // Get private key from keychain
    const privateKey = await getPrivateKey(walletId)
    if (!privateKey) {
      throw new Error('Private key not found')
    }

    if (chain === CHAINS.SOLANA) {
      // Solana transaction
      const connection = new Connection(rpcUrl, 'confirmed')
      const fromPublicKey = new PublicKey(address)

      // Validate recipient address
      let toPublicKey
      try {
        toPublicKey = new PublicKey(toAddress)
      } catch (error) {
        throw new Error('Invalid Solana recipient address')
      }

      // Convert amount to lamports
      const amountLamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL)

      // Create keypair from private key
      const secretKey = Buffer.from(privateKey, 'hex')
      const keypair = Keypair.fromSecretKey(secretKey)

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports: amountLamports,
        })
      )

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(connection, transaction, [keypair])
      console.log('Solana transaction sent:', signature)

      // Save transaction to database
      await saveTransaction({
        wallet_id: walletId,
        tx_hash: signature,
        from_address: address,
        to_address: toAddress,
        amount: amountLamports.toString(),
        token_symbol: 'SOL',
        status: 'confirmed',
        chain: chain,
      })

      return {
        hash: signature,
        from: address,
        to: toAddress,
        amount: amount,
        status: 'confirmed',
        blockNumber: null, // Solana doesn't use block numbers
        gasUsed: null,
      }
    } else {
      // EVM transaction
      // Create provider and wallet
      const provider = new ethers.JsonRpcProvider(rpcUrl)
      const walletInstance = new ethers.Wallet(privateKey, provider)

      // Validate recipient address
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Invalid recipient address')
      }

      // Convert amount to wei
      const amountWei = ethers.parseEther(amount.toString())

      // Get gas price
      const feeData = await provider.getFeeData()
      const gasPrice = feeData.gasPrice

      // Estimate gas
      const gasEstimate = await provider.estimateGas({
        from: address,
        to: toAddress,
        value: amountWei,
      })

      // Create transaction
      const tx = {
        to: toAddress,
        value: amountWei,
        gasPrice: gasPrice,
        gasLimit: gasEstimate,
      }

      // Send transaction
      const txResponse = await walletInstance.sendTransaction(tx)
      console.log('Transaction sent:', txResponse.hash)

      // Save transaction to database
      await saveTransaction({
        wallet_id: walletId,
        tx_hash: txResponse.hash,
        from_address: address,
        to_address: toAddress,
        amount: amountWei.toString(),
        token_symbol: getChainConfig(chain).nativeCurrency.symbol,
        status: 'pending',
        chain: chain,
      })

      // Wait for transaction confirmation
      const receipt = await txResponse.wait()
      console.log('Transaction confirmed:', receipt.hash)

      // Update transaction status
      await updateTransactionStatus(txResponse.hash, receipt.status === 1 ? 'confirmed' : 'failed')

      return {
        hash: txResponse.hash,
        from: address,
        to: toAddress,
        amount: amount,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      }
    }
  } catch (error) {
    console.error('Error sending transaction:', error)
    throw error
  }
}

/**
 * Send ERC20 token transaction
 * @param {number} walletId - Wallet ID
 * @param {string} tokenAddress - Token contract address
 * @param {string} toAddress - Recipient address
 * @param {string} amount - Amount in human-readable format
 * @returns {Promise<object>} - Transaction result
 */
export const sendTokenTransaction = async (walletId, tokenAddress, toAddress, amount) => {
  try {
    // Get wallet info
    const wallet = await getWalletById(walletId)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    const { address, chain } = wallet
    const rpcUrl = getRpcUrl(chain)
    if (!rpcUrl) {
      throw new Error(`Unsupported chain: ${chain}`)
    }

    // Get private key from keychain
    const privateKey = await getPrivateKey(walletId)
    if (!privateKey) {
      throw new Error('Private key not found')
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const walletInstance = new ethers.Wallet(privateKey, provider)

    // Validate addresses
    if (!ethers.isAddress(toAddress)) {
      throw new Error('Invalid recipient address')
    }
    if (!ethers.isAddress(tokenAddress)) {
      throw new Error('Invalid token address')
    }

    // Get token contract
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, walletInstance)

    // Get token decimals
    const decimals = await tokenContract.decimals()
    const symbol = await tokenContract.symbol()

    // Convert amount to token units
    const amountUnits = ethers.parseUnits(amount.toString(), decimals)

    // Get gas price
    const feeData = await provider.getFeeData()
    const gasPrice = feeData.gasPrice

    // Estimate gas for token transfer
    const gasEstimate = await tokenContract.transfer.estimateGas(toAddress, amountUnits)

    // Send transaction
    const txResponse = await tokenContract.transfer(toAddress, amountUnits, {
      gasPrice: gasPrice,
      gasLimit: gasEstimate,
    })

    console.log('Token transaction sent:', txResponse.hash)

    // Save transaction to database
    await saveTransaction({
      wallet_id: walletId,
      tx_hash: txResponse.hash,
      from_address: address,
      to_address: toAddress,
      amount: amountUnits.toString(),
      token_symbol: symbol,
      status: 'pending',
      chain: chain,
    })

    // Wait for transaction confirmation
    const receipt = await txResponse.wait()
    console.log('Token transaction confirmed:', receipt.hash)

    // Update transaction status
    await updateTransactionStatus(txResponse.hash, receipt.status === 1 ? 'confirmed' : 'failed')

    return {
      hash: txResponse.hash,
      from: address,
      to: toAddress,
      amount: amount,
      tokenSymbol: symbol,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    }
  } catch (error) {
    console.error('Error sending token transaction:', error)
    throw error
  }
}

/**
 * Get transaction history for a wallet
 * @param {number} walletId - Wallet ID
 * @returns {Promise<Array>} - Array of transaction objects
 */
export const getTransactionHistory = async (walletId) => {
  try {
    const transactions = await getTransactionsByWalletId(walletId)
    return transactions.map((tx) => ({
      id: tx.id,
      walletId: tx.wallet_id,
      hash: tx.tx_hash,
      from: tx.from_address,
      to: tx.to_address,
      amount: tx.amount,
      tokenSymbol: tx.token_symbol,
      status: tx.status,
      chain: tx.chain,
      createdAt: tx.created_at,
    }))
  } catch (error) {
    console.error('Error getting transaction history:', error)
    return []
  }
}

/**
 * Get transaction status from blockchain
 * @param {string} txHash - Transaction hash
 * @param {string} chain - Chain identifier
 * @returns {Promise<object>} - Transaction status
 */
export const getTransactionStatus = async (txHash, chain) => {
  try {
    const rpcUrl = getRpcUrl(chain)
    if (!rpcUrl) {
      throw new Error(`Unsupported chain: ${chain}`)
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const receipt = await provider.getTransactionReceipt(txHash)

    if (!receipt) {
      return {
        status: 'pending',
        blockNumber: null,
        confirmations: 0,
      }
    }

    return {
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      blockNumber: receipt.blockNumber,
      confirmations: receipt.confirmations,
      gasUsed: receipt.gasUsed.toString(),
    }
  } catch (error) {
    console.error('Error getting transaction status:', error)
    return {
      status: 'unknown',
      blockNumber: null,
      confirmations: 0,
    }
  }
}

/**
 * Estimate gas for a transaction
 * @param {number} walletId - Wallet ID
 * @param {string} toAddress - Recipient address
 * @param {string} amount - Amount in human-readable format
 * @returns {Promise<object>} - Gas estimate
 */
export const estimateGas = async (walletId, toAddress, amount) => {
  try {
    const wallet = await getWalletById(walletId)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    const { address, chain } = wallet
    const rpcUrl = getRpcUrl(chain)
    if (!rpcUrl) {
      throw new Error(`Unsupported chain: ${chain}`)
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const amountWei = ethers.parseEther(amount.toString())

    const gasEstimate = await provider.estimateGas({
      from: address,
      to: toAddress,
      value: amountWei,
    })

    const feeData = await provider.getFeeData()

    return {
      gasLimit: gasEstimate.toString(),
      gasPrice: feeData.gasPrice?.toString() || '0',
      estimatedCost: (gasEstimate * (feeData.gasPrice || 0n)).toString(),
    }
  } catch (error) {
    console.error('Error estimating gas:', error)
    throw error
  }
}

