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

    // Check and create device_data table if needed
    const deviceDataTableExists = await checkDeviceDataTableExists()
    if (!deviceDataTableExists) {
      await createDeviceDataTable()
      console.log('Device data table created successfully')
    }

    // Check and create app_stats table if needed
    const appStatsTableExists = await checkAppStatsTableExists()
    if (!appStatsTableExists) {
      await createAppStatsTable()
      console.log('App stats table created successfully')
      // Initialize app stats on first creation
      await initializeAppStats()
    }

    // Check and create daily_uptime table if needed
    const dailyUptimeTableExists = await checkDailyUptimeTableExists()
    if (!dailyUptimeTableExists) {
      await createDailyUptimeTable()
      console.log('Daily uptime table created successfully')
    }

    // Migrate users table to add skipped_login column if needed
    await migrateUsersTableForSkipLogin()

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
 * Check if device_data table exists
 */
const checkDeviceDataTableExists = async () => {
  try {
    if (!db) {
      return false
    }

    const [results] = await db.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='device_data'",
      []
    )

    return results.rows.length > 0
  } catch (error) {
    return false
  }
}

/**
 * Check if app_stats table exists
 */
const checkAppStatsTableExists = async () => {
  try {
    if (!db) {
      return false
    }

    const [results] = await db.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='app_stats'",
      []
    )

    return results.rows.length > 0
  } catch (error) {
    return false
  }
}

/**
 * Check if daily_uptime table exists
 */
const checkDailyUptimeTableExists = async () => {
  try {
    if (!db) {
      return false
    }

    const [results] = await db.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_uptime'",
      []
    )

    return results.rows.length > 0
  } catch (error) {
    return false
  }
}

/**
 * Migrate users table to add skipped_login column if it doesn't exist
 */
const migrateUsersTableForSkipLogin = async () => {
  try {
    if (!db) {
      return
    }

    // Check if skipped_login column exists
    const [results] = await db.executeSql(
      "PRAGMA table_info(users)"
    )

    let columnExists = false
    for (let i = 0; i < results.rows.length; i++) {
      if (results.rows.item(i).name === 'skipped_login') {
        columnExists = true
        break
      }
    }

    if (!columnExists) {
      // Add skipped_login column
      await db.executeSql(
        'ALTER TABLE users ADD COLUMN skipped_login INTEGER DEFAULT 0'
      )
      console.log('✅ Added skipped_login column to users table')
    }
  } catch (error) {
    console.error('Error migrating users table for skip login:', error)
    // Don't throw - migration failures shouldn't break the app
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
        permissions_granted INTEGER DEFAULT 0,
        skipped_login INTEGER DEFAULT 0,
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
 * Create device_data table
 */
const createDeviceDataTable = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    await db.executeSql(
      `CREATE TABLE IF NOT EXISTS device_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        unique_id TEXT,
        device_name TEXT,
        os TEXT,
        os_version TEXT,
        ip_address TEXT,
        network_type TEXT,
        airplane_mode INTEGER DEFAULT 0,
        internet_reachable INTEGER DEFAULT 0,
        latitude REAL,
        longitude REAL,
        altitude REAL,
        accuracy REAL,
        upload_speed TEXT,
        download_speed TEXT,
        avg_latency REAL,
        best_latency REAL,
        server_tested TEXT,
        timestamp INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    )

    console.log('Device data table created successfully')
  } catch (error) {
    console.error('Error creating device data table:', error)
    throw error
  }
}

/**
 * Create app_stats table
 */
const createAppStatsTable = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    await db.executeSql(
      `CREATE TABLE IF NOT EXISTS app_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_installed_at INTEGER NOT NULL,
        total_samples INTEGER DEFAULT 0,
        last_updated INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    )

    console.log('App stats table created successfully')
  } catch (error) {
    console.error('Error creating app stats table:', error)
    throw error
  }
}

/**
 * Initialize app stats (set installed_at timestamp on first run)
 */
const initializeAppStats = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const now = Date.now()
    await db.executeSql(
      `INSERT INTO app_stats (app_installed_at, total_samples, last_updated) 
       VALUES (?, 0, ?)`,
      [now, now]
    )

    console.log('✅ App stats initialized with installed_at:', new Date(now).toISOString())
  } catch (error) {
    console.error('❌ Error initializing app stats:', error)
    throw error
  }
}

/**
 * Create daily_uptime table
 */
const createDailyUptimeTable = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    await db.executeSql(
      `CREATE TABLE IF NOT EXISTS daily_uptime (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        uptime_ms INTEGER DEFAULT 0,
        session_start INTEGER,
        last_updated INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    )

    console.log('Daily uptime table created successfully')
  } catch (error) {
    console.error('Error creating daily uptime table:', error)
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
      email_verified = false,
      skipped_login = false,
    } = userData

    // Convert boolean to integer for SQLite storage
    const emailVerifiedInt = email_verified === true || email_verified === 1 ? 1 : 0
    const skippedLoginInt = skipped_login === true || skipped_login === 1 ? 1 : 0

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
            skipped_login = COALESCE(?, skipped_login),
            updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `
      const [updateResults] = await db.executeSql(updateQuery, [
        name,
        user_id || id,
        password || null,
        role || null,
        token || null,
        emailVerifiedInt,
        skippedLoginInt,
        email,
      ])
      console.log('User updated successfully')
      return updateResults.rowsAffected
    } else {
      // Insert new user
      const insertQuery = `
        INSERT INTO users (user_id, name, email, password, role, token, email_verified, skipped_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      const [insertResults] = await db.executeSql(insertQuery, [
        user_id || id,
        name,
        email,
        password || null,
        role || null,
        token || null,
        emailVerifiedInt,
        skippedLoginInt,
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
      const user = results.rows.item(0)
      // Convert integer to boolean for boolean columns
      return {
        ...user,
        email_verified: user.email_verified === 1,
        permissions_granted: user.permissions_granted === 1,
        skipped_login: user.skipped_login === 1,
      }
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
 * Note: Boolean columns are converted from integer to boolean
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
      const user = results.rows.item(0)
      // Convert integer to boolean for boolean columns
      return {
        ...user,
        email_verified: user.email_verified === 1,
        permissions_granted: user.permissions_granted === 1,
        skipped_login: user.skipped_login === 1,
      }
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

/**
 * Get current logged in user (including skipped login users)
 * @returns {Promise<object|null>} - User object with token or skipped_login flag, or null
 * Note: Boolean columns (email_verified, permissions_granted, skipped_login) are converted from integer to boolean
 */
export const getCurrentUser = async () => {
  try {
    if (!db) {
      console.error('Database not initialized.')
      return null
    }

    // First check for users with token
    const [results] = await db.executeSql(
      'SELECT * FROM users WHERE (token IS NOT NULL AND token != "") OR skipped_login = 1 ORDER BY updated_at DESC LIMIT 1',
      []
    )

    if (results.rows.length > 0) {
      const user = results.rows.item(0)
      // Convert integer to boolean for boolean columns
      // Handle case where permissions_granted column might not exist yet
      return {
        ...user,
        email_verified: user.email_verified === 1,
        permissions_granted: user.permissions_granted === 1 || user.permissions_granted === true || false,
        skipped_login: user.skipped_login === 1,
      }
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    // If error is due to missing column, try to add it and retry
    if (error.message && error.message.includes('no such column: permissions_granted')) {
      try {
        await db.executeSql('ALTER TABLE users ADD COLUMN permissions_granted INTEGER DEFAULT 0', [])
        console.log('Added permissions_granted column to users table')
        // Retry getting user
        const [retryResults] = await db.executeSql(
          'SELECT * FROM users WHERE (token IS NOT NULL AND token != "") OR skipped_login = 1 ORDER BY updated_at DESC LIMIT 1',
          []
        )
        if (retryResults.rows.length > 0) {
          const user = retryResults.rows.item(0)
          return {
            ...user,
            email_verified: user.email_verified === 1,
            permissions_granted: false,
            skipped_login: user.skipped_login === 1,
          }
        }
      } catch (retryError) {
        console.error('Error retrying getCurrentUser after adding column:', retryError)
      }
    }
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

// ==================== PERMISSIONS DATABASE FUNCTIONS ====================

/**
 * Check if permissions have been granted
 * @returns {Promise<boolean>} True if permissions granted, false otherwise
 */
export const arePermissionsGranted = async () => {
  try {
    if (!db) {
      return false
    }

    // Check if permissions_granted column exists, if not add it
    try {
      // First try to get current user and check their permissions
      const currentUser = await getCurrentUser()
      if (currentUser && currentUser.permissions_granted !== undefined) {
        // Convert integer to boolean
        return currentUser.permissions_granted === 1 || currentUser.permissions_granted === true
      }

      // Fallback: check users with tokens (for backward compatibility)
      try {
        const [results] = await db.executeSql(
          "SELECT permissions_granted FROM users WHERE token IS NOT NULL AND token != '' ORDER BY updated_at DESC LIMIT 1",
          []
        )

        if (results.rows.length > 0) {
          const user = results.rows.item(0)
          // Convert integer to boolean
          return user.permissions_granted === 1 || user.permissions_granted === true
        }
      } catch (sqlError) {
        // Column might not exist, try to add it
        if (sqlError.message && sqlError.message.includes('no such column: permissions_granted')) {
          try {
            await db.executeSql('ALTER TABLE users ADD COLUMN permissions_granted INTEGER DEFAULT 0', [])
            console.log('Added permissions_granted column to users table')
          } catch (alterError) {
            // Column might already exist, ignore
            console.log('Column might already exist or error:', alterError.message)
          }
        }
      }
    } catch (error) {
      // If getCurrentUser fails, try to add column and check again
      if (error.message && error.message.includes('no such column: permissions_granted')) {
        try {
          await db.executeSql('ALTER TABLE users ADD COLUMN permissions_granted INTEGER DEFAULT 0', [])
          console.log('Added permissions_granted column to users table')
        } catch (alterError) {
          // Column might already exist, ignore
          console.log('Column might already exist or error:', alterError.message)
        }
      }
    }

    return false
  } catch (error) {
    console.error('Error checking permissions status:', error)
    return false
  }
}

/**
 * Mark permissions as granted
 * @returns {Promise<boolean>} Success status
 */
export const markPermissionsAsGranted = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    // Get current user first to ensure we update the correct user
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      console.error('❌ No current user found to update permissions')
      return false
    }

    // Update the current user by email (most reliable identifier)
    // Use 1 for true (SQLite stores booleans as INTEGER)
    const [results] = await db.executeSql(
      'UPDATE users SET permissions_granted = 1, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      [currentUser.email]
    )
    
    if (results.rowsAffected > 0) {
      console.log('✅ Permissions marked as granted for user:', currentUser.email)
      return true
    } else {
      console.warn('⚠️ No rows updated when marking permissions as granted')
      // Fallback: try updating by token if email update didn't work
      const [fallbackResults] = await db.executeSql(
        "UPDATE users SET permissions_granted = 1, updated_at = CURRENT_TIMESTAMP WHERE token IS NOT NULL AND token != ''",
        []
      )
      if (fallbackResults.rowsAffected > 0) {
        console.log('✅ Permissions marked as granted (fallback by token)')
        return true
      }
      console.error('❌ Failed to update permissions - no rows affected')
      return false
    }
  } catch (error) {
    console.error('❌ Error marking permissions as granted:', error)
    return false
  }
}

// ==================== DEVICE DATA DATABASE FUNCTIONS ====================

/**
 * Insert device and network data
 * @param {Object} data - Device and network data object
 * @returns {Promise<boolean>} Success status
 */
export const insertDeviceData = async (data) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const insertQuery = `
      INSERT INTO device_data (
        device_id,
        unique_id,
        device_name,
        os,
        os_version,
        ip_address,
        network_type,
        airplane_mode,
        internet_reachable,
        latitude,
        longitude,
        altitude,
        accuracy,
        upload_speed,
        download_speed,
        avg_latency,
        best_latency,
        server_tested,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const values = [
      data.deviceId || null,
      data.uniqueId || null,
      data.deviceName || null,
      data.os || null,
      data.osVersion || null,
      data.ipAddress || null,
      data.networkType || null,
      data.airplaneMode ? 1 : 0,
      data.internetReachable ? 1 : 0,
      data.latitude || null,
      data.longitude || null,
      data.altitude || null,
      data.accuracy || null,
      data.uploadSpeed || null,
      data.downloadSpeed || null,
      data.avgLatency || null,
      data.bestLatency || null,
      data.serverTested || null,
      data.timestamp || Date.now(),
    ]

    await db.executeSql(insertQuery, values)
    console.log('✅ Device data inserted successfully')
    
    // Update total samples count
    try {
      await updateTotalSamples()
    } catch (updateError) {
      console.warn('⚠️ Failed to update total samples:', updateError.message)
      // Don't fail the insert if stats update fails
    }
    
    return true
  } catch (error) {
    console.error('❌ Error inserting device data:', error)
    return false
  }
}

/**
 * Get all device data records
 * @param {number} limit - Optional limit for number of records
 * @returns {Promise<Array>} Array of device data records
 */
export const getAllDeviceData = async (limit = null) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    let query = 'SELECT * FROM device_data ORDER BY timestamp DESC'
    if (limit) {
      query += ` LIMIT ${limit}`
    }

    const [results] = await db.executeSql(query)
    const rows = results.rows
    const data = []

    for (let i = 0; i < rows.length; i++) {
      data.push(rows.item(i))
    }

    return data
  } catch (error) {
    console.error('❌ Error fetching device data:', error)
    return []
  }
}

/**
 * Get latest device data record
 * @returns {Promise<object|null>} Latest device data record or null
 */
export const getLatestDeviceData = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const [results] = await db.executeSql(
      'SELECT * FROM device_data ORDER BY timestamp DESC LIMIT 1',
      []
    )

    if (results.rows.length > 0) {
      return results.rows.item(0)
    }

    return null
  } catch (error) {
    console.error('❌ Error fetching latest device data:', error)
    return null
  }
}

/**
 * Delete old device data records (keep only last N records)
 * @param {number} keepCount - Number of records to keep (default: 1000)
 * @returns {Promise<boolean>} Success status
 */
export const deleteOldDeviceData = async (keepCount = 1000) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const query = `
      DELETE FROM device_data 
      WHERE id NOT IN (
        SELECT id FROM device_data 
        ORDER BY timestamp DESC 
        LIMIT ?
      )
    `

    await db.executeSql(query, [keepCount])
    console.log('✅ Old device data records deleted')
    return true
  } catch (error) {
    console.error('❌ Error deleting old device data records:', error)
    return false
  }
}

/**
 * Delete device data records by IDs
 * @param {Array<number>} ids - Array of record IDs to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteDeviceDataByIds = async (ids) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    if (!ids || ids.length === 0) {
      return true
    }

    // Create placeholders for the IN clause
    const placeholders = ids.map(() => '?').join(',')
    const query = `DELETE FROM device_data WHERE id IN (${placeholders})`

    await db.executeSql(query, ids)
    console.log(`✅ Deleted ${ids.length} device data records`)
    
    // Update total samples count after deletion
    try {
      await updateTotalSamples()
    } catch (updateError) {
      console.warn('⚠️ Failed to update total samples after deletion:', updateError.message)
      // Don't fail the delete if stats update fails
    }
    
    return true
  } catch (error) {
    console.error('❌ Error deleting device data records:', error)
    return false
  }
}

/**
 * Get device data records that haven't been uploaded yet
 * @param {number} limit - Maximum number of records to fetch
 * @returns {Promise<Array>} Array of device data records
 */
export const getUnuploadedDeviceData = async (limit = 100) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const [results] = await db.executeSql(
      'SELECT * FROM device_data ORDER BY timestamp ASC LIMIT ?',
      [limit]
    )

    const data = []
    for (let i = 0; i < results.rows.length; i++) {
      data.push(results.rows.item(i))
    }

    return data
  } catch (error) {
    console.error('❌ Error fetching unuploaded device data:', error)
    return []
  }
}

/**
 * Get device data database statistics
 * @returns {Promise<object>} Statistics object
 */
export const getDeviceDataStats = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const [countResults] = await db.executeSql(
      'SELECT COUNT(*) as count FROM device_data',
      []
    )
    const count = countResults.rows.item(0).count

    const [latestResults] = await db.executeSql(
      'SELECT MAX(timestamp) as latest FROM device_data',
      []
    )
    const latest = latestResults.rows.item(0).latest

    return {
      totalRecords: count,
      latestTimestamp: latest,
    }
  } catch (error) {
    console.error('❌ Error getting device data stats:', error)
    return {
      totalRecords: 0,
      latestTimestamp: null,
    }
  }
}

// ==================== APP STATISTICS FUNCTIONS ====================

/**
 * Format uptime in milliseconds to human-readable string
 * @param {number} milliseconds - Uptime in milliseconds
 * @returns {string} Formatted uptime string
 */
const formatUptime = (milliseconds) => {
  if (!milliseconds || milliseconds < 0) {
    return '0s'
  }

  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) {
    return `${years}y ${days % 365}d`
  } else if (months > 0) {
    return `${months}mo ${days % 30}d`
  } else if (weeks > 0) {
    return `${weeks}w ${days % 7}d`
  } else if (days > 0) {
    return `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Get today's date string (YYYY-MM-DD)
 * @returns {string} Date string
 */
const getTodayDateString = () => {
  const today = new Date()
  return today.toISOString().split('T')[0] // Returns YYYY-MM-DD
}

/**
 * Start or update daily uptime tracking
 * @returns {Promise<boolean>} Success status
 */
export const startDailyUptimeTracking = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const today = getTodayDateString()
    const now = Date.now()

    // Check if today's record exists
    const [existingResults] = await db.executeSql(
      'SELECT * FROM daily_uptime WHERE date = ?',
      [today]
    )

    if (existingResults.rows.length === 0) {
      // Create new record for today
      await db.executeSql(
        `INSERT INTO daily_uptime (date, uptime_ms, session_start, last_updated) 
         VALUES (?, 0, ?, ?)`,
        [today, now, now]
      )
      console.log('✅ Daily uptime tracking started for', today)
    } else {
      // Update session_start if not set or if it's a new session (more than 5 minutes gap)
      const existing = existingResults.rows.item(0)
      if (!existing.session_start || (now - existing.last_updated > 5 * 60 * 1000)) {
        // New session - update session_start
        await db.executeSql(
          `UPDATE daily_uptime 
           SET session_start = ?, last_updated = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE date = ?`,
          [now, now, today]
        )
        console.log('✅ New daily uptime session started for', today)
      }
    }

    return true
  } catch (error) {
    console.error('❌ Error starting daily uptime tracking:', error)
    return false
  }
}

/**
 * Update daily uptime (call this periodically while app is running)
 * @returns {Promise<boolean>} Success status
 */
export const updateDailyUptime = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const today = getTodayDateString()
    const now = Date.now()

    // Get today's record
    const [results] = await db.executeSql(
      'SELECT * FROM daily_uptime WHERE date = ?',
      [today]
    )

    if (results.rows.length === 0) {
      // Create if doesn't exist
      await startDailyUptimeTracking()
      return true
    }

    const record = results.rows.item(0)
    if (!record.session_start) {
      // Session not started, start it
      await db.executeSql(
        `UPDATE daily_uptime 
         SET session_start = ?, last_updated = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE date = ?`,
        [now, now, today]
      )
      return true
    }

    // Calculate elapsed time since last update (or session start if first update)
    const lastUpdate = record.last_updated || record.session_start
    const elapsed = now - lastUpdate

    // Only update if at least 1 second has passed (avoid too frequent updates)
    if (elapsed >= 1000) {
      const newUptime = record.uptime_ms + elapsed

      await db.executeSql(
        `UPDATE daily_uptime 
         SET uptime_ms = ?, last_updated = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE date = ?`,
        [newUptime, now, today]
      )

      console.log(`✅ Daily uptime updated for ${today}: ${formatUptime(newUptime)}`)
    }

    return true
  } catch (error) {
    console.error('❌ Error updating daily uptime:', error)
    return false
  }
}

/**
 * Get today's uptime
 * @returns {Promise<object>} Today's uptime stats
 */
export const getTodayUptime = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    const today = getTodayDateString()
    const now = Date.now()

    // Get today's record
    const [results] = await db.executeSql(
      'SELECT * FROM daily_uptime WHERE date = ?',
      [today]
    )

    if (results.rows.length === 0) {
      return {
        date: today,
        uptimeMs: 0,
        uptimeFormatted: '0s',
        sessionStart: null,
        isActive: false,
      }
    }

    const record = results.rows.item(0)
    let currentUptime = record.uptime_ms || 0

    // If session is active (last_updated within last 5 minutes), add elapsed time
    if (record.session_start && record.last_updated) {
      const timeSinceLastUpdate = now - record.last_updated
      if (timeSinceLastUpdate < 5 * 60 * 1000) {
        // Session is still active, add elapsed time
        currentUptime += timeSinceLastUpdate
      }
    }

    return {
      date: today,
      uptimeMs: currentUptime,
      uptimeFormatted: formatUptime(currentUptime),
      sessionStart: record.session_start,
      isActive: record.session_start && (now - record.last_updated < 5 * 60 * 1000),
    }
  } catch (error) {
    console.error('❌ Error getting today uptime:', error)
    return {
      date: getTodayDateString(),
      uptimeMs: 0,
      uptimeFormatted: '0s',
      sessionStart: null,
      isActive: false,
    }
  }
}

/**
 * Update total samples count
 * @param {number} count - Total number of samples (optional, will count if not provided)
 * @returns {Promise<boolean>} Success status
 */
export const updateTotalSamples = async (count = null) => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    let totalCount = count
    if (totalCount === null) {
      const [countResults] = await db.executeSql(
        'SELECT COUNT(*) as count FROM device_data',
        []
      )
      totalCount = countResults.rows.item(0).count
    }

    const now = Date.now()
    await db.executeSql(
      `UPDATE app_stats 
       SET total_samples = ?, last_updated = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = (SELECT id FROM app_stats ORDER BY id DESC LIMIT 1)`,
      [totalCount, now]
    )

    console.log('✅ Total samples updated:', totalCount)
    return true
  } catch (error) {
    console.error('❌ Error updating total samples:', error)
    return false
  }
}

/**
 * Get app statistics (total samples and uptime)
 * @returns {Promise<object>} App stats object
 */
export const getAppStats = async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized')
    }

    // Get app stats
    const [statsResults] = await db.executeSql(
      'SELECT * FROM app_stats ORDER BY id DESC LIMIT 1',
      []
    )

    if (statsResults.rows.length === 0) {
      // Initialize if not exists
      await initializeAppStats()
      const [newStatsResults] = await db.executeSql(
        'SELECT * FROM app_stats ORDER BY id DESC LIMIT 1',
        []
      )
      if (newStatsResults.rows.length > 0) {
        const stats = newStatsResults.rows.item(0)
        const now = Date.now()
        const uptime = now - stats.app_installed_at

        // Get today's uptime
        const todayUptime = await getTodayUptime()

        return {
          appInstalledAt: stats.app_installed_at,
          totalSamples: stats.total_samples || 0,
          totalUptime: uptime, // in milliseconds
          totalUptimeFormatted: formatUptime(uptime),
          todayUptime: todayUptime.uptimeMs,
          todayUptimeFormatted: todayUptime.uptimeFormatted,
          todayIsActive: todayUptime.isActive,
          lastUpdated: stats.last_updated || stats.app_installed_at,
        }
      }
    }

    const stats = statsResults.rows.item(0)
    const now = Date.now()
    const uptime = now - stats.app_installed_at

    // Get actual count from device_data table
    const [countResults] = await db.executeSql(
      'SELECT COUNT(*) as count FROM device_data',
      []
    )
    const actualCount = countResults.rows.item(0).count

    // Update total_samples if different
    if (actualCount !== stats.total_samples) {
      await updateTotalSamples(actualCount)
    }

    // Get today's uptime
    const todayUptime = await getTodayUptime()

    return {
      appInstalledAt: stats.app_installed_at,
      totalSamples: actualCount,
      totalUptime: uptime, // in milliseconds
      totalUptimeFormatted: formatUptime(uptime),
      todayUptime: todayUptime.uptimeMs,
      todayUptimeFormatted: todayUptime.uptimeFormatted,
      todayIsActive: todayUptime.isActive,
      lastUpdated: stats.last_updated || stats.app_installed_at,
    }
  } catch (error) {
    console.error('❌ Error getting app stats:', error)
    return {
      appInstalledAt: null,
      totalSamples: 0,
      totalUptime: 0,
      totalUptimeFormatted: '0s',
      todayUptime: 0,
      todayUptimeFormatted: '0s',
      todayIsActive: false,
      lastUpdated: null,
    }
  }
}
