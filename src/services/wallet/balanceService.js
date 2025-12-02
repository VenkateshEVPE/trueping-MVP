import { ethers } from 'ethers'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getTokenAccountBalance } from '@solana/spl-token'
import { getRpcUrl, getChainConfig, getTokenConfig, getNativeCurrencySymbol, CHAINS } from './chainConfig'
import { getWalletById } from '../../database/database'

// ERC20 ABI for balanceOf function
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
]

/**
 * Get native token balance (ETH, MATIC, BNB, SOL)
 * @param {string} address - Wallet address
 * @param {string} chain - Chain identifier
 * @returns {Promise<string>} - Balance in human-readable format
 */
export const getBalance = async (address, chain) => {
  try {
    const rpcUrl = getRpcUrl(chain)
    if (!rpcUrl) {
      throw new Error(`Unsupported chain: ${chain}`)
    }

    if (chain === CHAINS.SOLANA) {
      // Solana balance
      const connection = new Connection(rpcUrl, 'confirmed')
      const publicKey = new PublicKey(address)
      const balance = await connection.getBalance(publicKey)
      const formattedBalance = (balance / LAMPORTS_PER_SOL).toString()
      return formattedBalance
    } else {
      // EVM chains
      const provider = new ethers.JsonRpcProvider(rpcUrl, {
        name: chain,
        chainId: getChainConfig(chain)?.chainId || 1,
      })
      
      // Add timeout and retry logic
      try {
        const balance = await Promise.race([
          provider.getBalance(address),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          ),
        ])
        const formattedBalance = ethers.formatEther(balance)
        return formattedBalance
      } catch (providerError) {
        // Try fallback RPC if main one fails
        if (chain === CHAINS.POLYGON) {
          console.warn('Primary Polygon RPC failed, trying fallback...')
          const fallbackProvider = new ethers.JsonRpcProvider('https://polygon-rpc.com', {
            name: 'polygon',
            chainId: 137,
          })
          const balance = await Promise.race([
            fallbackProvider.getBalance(address),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Fallback request timeout')), 10000)
            ),
          ])
          const formattedBalance = ethers.formatEther(balance)
          return formattedBalance
        }
        throw providerError
      }
    }
  } catch (error) {
    console.error('Error getting balance:', error)
    throw error
  }
}

/**
 * Get token balance (ERC20 for EVM, SPL for Solana)
 * @param {string} address - Wallet address
 * @param {string} tokenAddress - Token contract/mint address
 * @param {string} chain - Chain identifier
 * @returns {Promise<object>} - Token balance object { balance, symbol, decimals, formatted }
 */
export const getTokenBalance = async (address, tokenAddress, chain) => {
  try {
    const rpcUrl = getRpcUrl(chain)
    if (!rpcUrl) {
      throw new Error(`Unsupported chain: ${chain}`)
    }

    if (chain === CHAINS.SOLANA) {
      // Solana SPL token balance
      const connection = new Connection(rpcUrl, 'confirmed')
      const publicKey = new PublicKey(address)
      const mintPublicKey = new PublicKey(tokenAddress)
      
      // Find associated token account
      const { getAssociatedTokenAddress } = await import('@solana/spl-token')
      const tokenAccount = await getAssociatedTokenAddress(mintPublicKey, publicKey)
      
      try {
        const balance = await getTokenAccountBalance(connection, tokenAccount)
        return {
          balance: balance.value.amount,
          symbol: 'TOKEN', // Would need to fetch from metadata
          decimals: balance.value.decimals,
          formatted: (parseInt(balance.value.amount) / Math.pow(10, balance.value.decimals)).toString(),
        }
      } catch (error) {
        // Token account doesn't exist, balance is 0
        return {
          balance: '0',
          symbol: 'TOKEN',
          decimals: 9,
          formatted: '0',
        }
      }
    } else {
      // EVM ERC20 token balance
      const provider = new ethers.JsonRpcProvider(rpcUrl)
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

      // Get token info
      const [balance, decimals, symbol] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals(),
        tokenContract.symbol(),
      ])

      const formattedBalance = ethers.formatUnits(balance, decimals)

      return {
        balance: balance.toString(),
        symbol: symbol,
        decimals: decimals,
        formatted: formattedBalance,
      }
    }
  } catch (error) {
    console.error('Error getting token balance:', error)
    throw error
  }
}

/**
 * Get all balances for a wallet (native + common tokens)
 * @param {number} walletId - Wallet ID
 * @returns {Promise<object>} - Balances object
 */
export const getAllBalances = async (walletId) => {
  try {
    const wallet = await getWalletById(walletId)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    const { address, chain } = wallet
    const chainConfig = getChainConfig(chain)
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`)
    }

    // Get native balance
    const nativeBalance = await getBalance(address, chain)
    const nativeSymbol = getNativeCurrencySymbol(chain)

    const balances = {
      native: {
        symbol: nativeSymbol,
        balance: nativeBalance,
        formatted: parseFloat(nativeBalance).toFixed(6),
      },
      tokens: [],
    }

    // Get common token balances (USDT, USDC, DAI)
    const tokenSymbols = ['USDT', 'USDC', 'DAI']
    if (chain === 'bsc') {
      tokenSymbols.push('BUSD')
    }

    for (const tokenSymbol of tokenSymbols) {
      try {
        const tokenConfig = getTokenConfig(chain, tokenSymbol)
        if (tokenConfig) {
          const tokenBalance = await getTokenBalance(address, tokenConfig.address, chain)
          if (parseFloat(tokenBalance.formatted) > 0) {
            balances.tokens.push({
              symbol: tokenBalance.symbol,
              address: tokenConfig.address,
              balance: tokenBalance.formatted,
              decimals: tokenBalance.decimals,
            })
          }
        }
      } catch (error) {
        // Skip tokens that fail to fetch
        console.warn(`Failed to fetch ${tokenSymbol} balance:`, error.message)
      }
    }

    return balances
  } catch (error) {
    console.error('Error getting all balances:', error)
    throw error
  }
}

/**
 * Format balance for display
 * @param {string} balance - Balance string
 * @param {number} decimals - Decimal places
 * @returns {string} - Formatted balance
 */
export const formatBalance = (balance, decimals = 6) => {
  try {
    const num = parseFloat(balance)
    if (isNaN(num)) {
      return '0.00'
    }
    return num.toFixed(decimals)
  } catch (error) {
    return '0.00'
  }
}

/**
 * Get balance in different units
 * @param {string} balance - Balance in wei/wei equivalent
 * @param {number} decimals - Token decimals
 * @returns {object} - Balance in different units
 */
export const getBalanceUnits = (balance, decimals = 18) => {
  try {
    const wei = BigInt(balance)
    const formatted = ethers.formatUnits(wei, decimals)
    const num = parseFloat(formatted)

    return {
      wei: balance,
      formatted: formatted,
      short: num >= 1 ? num.toFixed(2) : num.toFixed(6),
      full: formatted,
    }
  } catch (error) {
    return {
      wei: '0',
      formatted: '0',
      short: '0',
      full: '0',
    }
  }
}

