/**
 * Blockchain network configurations
 * Contains RPC endpoints, chain IDs, and token contract addresses
 */

export const CHAINS = {
  ETHEREUM: 'ethereum',
  BSC: 'bsc',
  SOLANA: 'solana',
}

export const CHAIN_CONFIGS = {
  [CHAINS.ETHEREUM]: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com', // Public RPC endpoint
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'https://etherscan.io',
    tokens: {
      USDT: {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        symbol: 'USDT',
        decimals: 6,
        name: 'Tether USD',
      },
      USDC: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
      },
      DAI: {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        symbol: 'DAI',
        decimals: 18,
        name: 'Dai Stablecoin',
      },
    },
  },
  [CHAINS.BSC]: {
    name: 'Binance Smart Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org', // Public RPC endpoint
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    blockExplorer: 'https://bscscan.com',
    tokens: {
      USDT: {
        address: '0x55d398326f99059fF775485246999027B3197955',
        symbol: 'USDT',
        decimals: 18,
        name: 'Tether USD',
      },
      USDC: {
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        symbol: 'USDC',
        decimals: 18,
        name: 'USD Coin',
      },
      BUSD: {
        address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        symbol: 'BUSD',
        decimals: 18,
        name: 'Binance USD',
      },
    },
  },
  [CHAINS.SOLANA]: {
    name: 'Solana',
    chainId: null, // Solana doesn't use chain IDs
    rpcUrl: 'https://api.mainnet-beta.solana.com', // Mainnet RPC endpoint
    nativeCurrency: {
      name: 'SOL',
      symbol: 'SOL',
      decimals: 9,
    },
    blockExplorer: 'https://solscan.io',
    tokens: {
      USDC: {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Solana Mainnet USDC mint address
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
      },
      USDT: {
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Solana Mainnet USDT mint address
        symbol: 'USDT',
        decimals: 6,
        name: 'Tether USD',
      },
    },
  },
}

/**
 * Get chain configuration
 * @param {string} chain - Chain identifier
 * @returns {object|null} - Chain configuration or null
 */
export const getChainConfig = (chain) => {
  return CHAIN_CONFIGS[chain] || null
}

/**
 * Get RPC URL for a chain
 * @param {string} chain - Chain identifier
 * @returns {string|null} - RPC URL or null
 */
export const getRpcUrl = (chain) => {
  const config = getChainConfig(chain)
  return config ? config.rpcUrl : null
}

/**
 * Get chain ID
 * @param {string} chain - Chain identifier
 * @returns {number|null} - Chain ID or null
 */
export const getChainId = (chain) => {
  const config = getChainConfig(chain)
  return config ? config.chainId : null
}

/**
 * Get token configuration
 * @param {string} chain - Chain identifier
 * @param {string} tokenSymbol - Token symbol (e.g., 'USDT')
 * @returns {object|null} - Token config or null
 */
export const getTokenConfig = (chain, tokenSymbol) => {
  const config = getChainConfig(chain)
  if (!config || !config.tokens) {
    return null
  }
  return config.tokens[tokenSymbol.toUpperCase()] || null
}

/**
 * Get all supported chains
 * @returns {Array<string>} - Array of chain identifiers
 */
export const getSupportedChains = () => {
  return Object.values(CHAINS)
}

/**
 * Get native currency symbol for a chain
 * @param {string} chain - Chain identifier
 * @returns {string} - Native currency symbol
 */
export const getNativeCurrencySymbol = (chain) => {
  const config = getChainConfig(chain)
  return config ? config.nativeCurrency.symbol : 'ETH'
}

