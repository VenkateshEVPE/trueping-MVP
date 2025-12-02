import SQLite from 'react-native-sqlite-storage'

// Enable SQLite debugging if needed
SQLite.DEBUG(true)
SQLite.enablePromise(true)

const database_name = 'TruePing.db'
const database_version = '1.0'
const database_displayname = 'SQLite TruePing Database'
const database_size = 200000

let db = null

/**
 * Initialize database and create tables
 */
export const initDatabase = async () => {
  try {
    // Check if database already exists by trying to open it
    db = await SQLite.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size
    )
    console.log('Database opened successfully')

    // Check if tables already exist before creating
    const tablesExist = await checkTablesExist()
    
    if (!tablesExist) {
      await createTables() // Create necessary tables only if they don't exist
      console.log('Tables created successfully')
    } else {
      console.log('Database and tables already exist')
    }

    // Check and migrate wallet tables if needed
    const walletTablesExist = await checkWalletTablesExist()
    if (!walletTablesExist) {
      await createWalletTables()
      console.log('Wallet tables created successfully')
    }

    return db
  } catch (error) {
    console.error('Error opening database:', error)
    throw error // Re-throw error for handling at call site
  }
}

/**
 * Check if tables already exist
 */
const checkTablesExist = async () => {
  try {
    if (!db) {
      return false
    }

    // Try to query the users table to see if it exists
    const [results] = await db.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
      []
    )

    return results.rows.length > 0
  } catch (error) {
    // If query fails, tables don't exist
    console.log('Tables do not exist, will create them')
    return false
  }
}

/**
 * Check if wallet tables exist (for migration)
 */
const checkWalletTablesExist = async () => {
  try {
    if (!db) {
      return false
    }

    const [results] = await db.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='wallets'",
      []
    )

    return results.rows.length > 0
  } catch (error) {
    return false
  }
}

/**
 * Create users table
 */
const createTables = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    await db.executeSql(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        role TEXT,
        token TEXT,
        email_verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    )

    console.log('Users table created successfully')
  } catch (error) {
    console.error('Error creating tables:', error)
    throw error
  }
}

/**
 * Create wallet tables (wallets and transactions)
 */
const createWalletTables = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    // Create wallets table
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
    )

    // Create transactions table
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
    )

    console.log('Wallet tables created successfully')
  } catch (error) {
    console.error('Error creating wallet tables:', error)
    throw error
  }
}

/**
 * Get database instance
 */
export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

/**
 * Save or update user information
 * @param {object} userData - User data { id, name, email, password, role, token, email_verified }
 * @returns {Promise<number>} - User ID
 */
export const saveUser = async (userData) => {
  try {
    if (!db) {
      console.error('Database not initialized.')
      throw new Error('Database not initialized')
    }

    const {
      id,
      user_id,
      name,
      email,
      password,
      role,
      token,
      email_verified = 0,
    } = userData

    // Check if user exists
    const [results] = await db.executeSql(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if (results.rows.length > 0) {
      // Update existing user
      const updateQuery = `
        UPDATE users 
        SET name = ?,
            user_id = ?,
            password = COALESCE(?, password),
            role = COALESCE(?, role),
            token = COALESCE(?, token),
            email_verified = COALESCE(?, email_verified),
            updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `
      const [updateResults] = await db.executeSql(updateQuery, [
        name,
        user_id || id,
        password || null,
        role || null,
        token || null,
        email_verified,
        email,
      ])
      console.log('User updated successfully')
      return updateResults.rowsAffected
    } else {
      // Insert new user
      const insertQuery = `
        INSERT INTO users (user_id, name, email, password, role, token, email_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      const [insertResults] = await db.executeSql(insertQuery, [
        user_id || id,
        name,
        email,
        password || null,
        role || null,
        token || null,
        email_verified,
      ])
      console.log('User saved successfully')
      return insertResults.insertId
    }
  } catch (error) {
    console.error('Error saving user:', error)
    throw error
  }
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} - User object or null
 */
export const getUserByEmail = async (email) => {
  try {
    if (!db) {
      console.error('Database not initialized.')
      return null
    }

    const [results] = await db.executeSql(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if (results.rows.length > 0) {
      return results.rows.item(0)
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {Promise<object|null>} - User object or null
 */
export const getUserById = async (id) => {
  try {
    if (!db) {
      console.error('Database not initialized.')
      return null
    }

    const [results] = await db.executeSql(
      'SELECT * FROM users WHERE id = ? OR user_id = ?',
      [id, id]
    )

    if (results.rows.length > 0) {
      return results.rows.item(0)
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

/**
 * Get current logged in user
 * @returns {Promise<object|null>} - User object with token or null
 */
export const getCurrentUser = async () => {
  try {
    if (!db) {
      console.error('Database not initialized.')
      return null
    }

    const [results] = await db.executeSql(
      'SELECT * FROM users WHERE token IS NOT NULL AND token != "" ORDER BY updated_at DESC LIMIT 1',
      []
    )

    if (results.rows.length > 0) {
      return results.rows.item(0)
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Update user token
 * @param {string} email - User email
 * @param {string} token - Auth token
 * @returns {Promise<void>}
 */
export const updateUserToken = async (email, token) => {
  try {
    if (!db) {
      console.error('Database not initialized.')
      return
    }

    await db.executeSql(
      'UPDATE users SET token = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      [token, email]
    )
    console.log('User token updated successfully')
  } catch (error) {
    console.error('Error updating user token:', error)
    throw error
  }
}

/**
 * Update user email verification status
 * @param {string} email - User email
 * @param {boolean} verified - Verification status
 * @returns {Promise<void>}
 */
export const updateEmailVerification = async (email, verified) => {
  try {
    if (!db) {
      console.error('Database not initialized.')
      return
    }

    await db.executeSql(
      'UPDATE users SET email_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      [verified ? 1 : 0, email]
    )
    console.log('Email verification status updated')
  } catch (error) {
    console.error('Error updating email verification:', error)
    throw error
  }
}

/**
 * Logout user (clear token)
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const logoutUser = async (email) => {
  try {
    if (!db) {
      console.error('Database not initialized.')
      return
    }

    await db.executeSql(
      'UPDATE users SET token = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      [email]
    )
    console.log('User logged out successfully')
  } catch (error) {
    console.error('Error logging out user:', error)
    throw error
  }
}

/**
 * Delete user
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const deleteUser = async (email) => {
  try {
    if (!db) {
      console.error('Database not initialized.')
      return
    }

    await db.executeSql('DELETE FROM users WHERE email = ?', [email])
    console.log('User deleted successfully')
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

/**
 * Get all users
 * @returns {Promise<Array>} - Array of user objects
 */
export const getAllUsers = async () => {
  try {
    if (!db) {
      console.error('Database not initialized.')
      return []
    }

    const [results] = await db.executeSql('SELECT * FROM users ORDER BY created_at DESC', [])

    const users = []
    for (let i = 0; i < results.rows.length; i++) {
      users.push(results.rows.item(i))
    }
    return users
  } catch (error) {
    console.error('Error getting all users:', error)
    return []
  }
}

/**
 * Clear all SQLite data (delete all records from all tables)
 * @returns {Promise<void>}
 */
export const clearAllData = async () => {
  try {
    if (!db) {
      console.error('Database not initialized.')
      throw new Error('Database not initialized')
    }

    // Delete all data from users table
    await db.executeSql('DELETE FROM users', [])
    console.log('All SQLite data cleared successfully')
  } catch (error) {
    console.error('Error clearing all data:', error)
    throw error
  }
}

// ==================== WALLET DATABASE FUNCTIONS ====================

/**
 * Save wallet to database
 * @param {object} walletData - Wallet data { user_id, chain, address, name }
 * @returns {Promise<number>} - Wallet ID
 */
export const saveWallet = async (walletData) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const { user_id, chain, address, name } = walletData

    const insertQuery = `
      INSERT INTO wallets (user_id, chain, address, name)
      VALUES (?, ?, ?, ?)
    `
    const [insertResults] = await db.executeSql(insertQuery, [
      user_id,
      chain,
      address,
      name || `${chain} Wallet`,
    ])
    console.log('Wallet saved successfully')
    return insertResults.insertId
  } catch (error) {
    console.error('Error saving wallet:', error)
    throw error
  }
}

/**
 * Get all wallets for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of wallet objects
 */
export const getWalletsByUserId = async (userId) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const [results] = await db.executeSql(
      'SELECT * FROM wallets WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    )

    const wallets = []
    for (let i = 0; i < results.rows.length; i++) {
      wallets.push(results.rows.item(i))
    }
    return wallets
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
export const getWalletById = async (walletId) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const [results] = await db.executeSql('SELECT * FROM wallets WHERE id = ?', [walletId])

    if (results.rows.length > 0) {
      return results.rows.item(0)
    }
    return null
  } catch (error) {
    console.error('Error getting wallet by ID:', error)
    return null
  }
}

/**
 * Delete wallet
 * @param {number} walletId - Wallet ID
 * @returns {Promise<void>}
 */
export const deleteWallet = async (walletId) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    await db.executeSql('DELETE FROM wallets WHERE id = ?', [walletId])
    console.log('Wallet deleted successfully')
  } catch (error) {
    console.error('Error deleting wallet:', error)
    throw error
  }
}

/**
 * Save transaction to database
 * @param {object} transactionData - Transaction data { wallet_id, tx_hash, from_address, to_address, amount, token_symbol, status, chain }
 * @returns {Promise<number>} - Transaction ID
 */
export const saveTransaction = async (transactionData) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const {
      wallet_id,
      tx_hash,
      from_address,
      to_address,
      amount,
      token_symbol = 'ETH',
      status = 'pending',
      chain,
    } = transactionData

    const insertQuery = `
      INSERT OR IGNORE INTO transactions (wallet_id, tx_hash, from_address, to_address, amount, token_symbol, status, chain)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    const [insertResults] = await db.executeSql(insertQuery, [
      wallet_id,
      tx_hash,
      from_address,
      to_address,
      amount,
      token_symbol,
      status,
      chain,
    ])
    console.log('Transaction saved successfully')
    return insertResults.insertId
  } catch (error) {
    console.error('Error saving transaction:', error)
    throw error
  }
}

/**
 * Get transaction history for a wallet
 * @param {number} walletId - Wallet ID
 * @returns {Promise<Array>} - Array of transaction objects
 */
export const getTransactionsByWalletId = async (walletId) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const [results] = await db.executeSql(
      'SELECT * FROM transactions WHERE wallet_id = ? ORDER BY created_at DESC',
      [walletId]
    )

    const transactions = []
    for (let i = 0; i < results.rows.length; i++) {
      transactions.push(results.rows.item(i))
    }
    return transactions
  } catch (error) {
    console.error('Error getting transactions:', error)
    return []
  }
}

/**
 * Update transaction status
 * @param {string} txHash - Transaction hash
 * @param {string} status - New status ('pending', 'confirmed', 'failed')
 * @returns {Promise<void>}
 */
export const updateTransactionStatus = async (txHash, status) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    await db.executeSql('UPDATE transactions SET status = ? WHERE tx_hash = ?', [status, txHash])
    console.log('Transaction status updated')
  } catch (error) {
    console.error('Error updating transaction status:', error)
    throw error
  }
}
