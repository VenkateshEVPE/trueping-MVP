import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  Animated,
  StatusBar,
  Image,
} from 'react-native'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import Clipboard from '@react-native-clipboard/clipboard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GridPatternBackground from '../../components/GridPatternBackground'
import { getCurrentUser } from '../../database/database'
import { createWalletsOnAllChains, importWallet, getWallets, removeWallet } from '../../services/wallet/walletService'
import { getAllBalances } from '../../services/wallet/balanceService'
import { sendTransaction, getTransactionHistory } from '../../services/wallet/transactionService'
import WalletCard from '../../components/wallet/WalletCard'
import AddressQRCode from '../../components/wallet/AddressQRCode'
import TransactionItem from '../../components/wallet/TransactionItem'
import CreateWalletModal from '../../components/wallet/CreateWalletModal'
import ImportWalletModal from '../../components/wallet/ImportWalletModal'
import SendTransactionModal from '../../components/wallet/SendTransactionModal'
import MnemonicDisplay from '../../components/wallet/MnemonicDisplay'
import ShareIcon from '../../components/icons/ShareIcon'
import ArrowUpIcon from '../../components/icons/ArrowUpIcon'

// Terminal loading lines for Wallet
const walletLoadingLines = [
  { prefix: 'root@trueping:~$ ', text: 'initializing system...', delay: 150 },
  { prefix: '', text: '[OK] Loading core modules', delay: 100 },
  { prefix: '', text: '[OK] Establishing secure connection', delay: 100 },
  { prefix: '', text: '[OK] Network protocols initialized', delay: 100 },
  { prefix: '', text: '[OK] Security layer activated', delay: 100 },
  { prefix: '', text: '[OK] Encryption enabled', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'loading wallets...', delay: 150 },
  { prefix: '', text: '[OK] Fetching wallet data', delay: 100 },
  { prefix: '', text: '[OK] Loading wallet configurations', delay: 100 },
  { prefix: '', text: '[OK] Initializing wallet service', delay: 100 },
  { prefix: '', text: '[OK] Wallet module ready', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'scanning blockchain...', delay: 150 },
  { prefix: '', text: '> Connecting to network nodes', delay: 80 },
  { prefix: '', text: '> Synchronizing blockchain data', delay: 80 },
  { prefix: '', text: '> Verifying transactions', delay: 80 },
  { prefix: '', text: '> Blockchain sync complete', delay: 80 },
  { prefix: 'root@trueping:~$ ', text: 'loading balances...', delay: 150 },
  { prefix: '', text: '[OK] Fetching account balances', delay: 100 },
  { prefix: '', text: '[OK] Calculating total assets', delay: 100 },
  { prefix: '', text: '[OK] Balance data loaded', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'retrieving transactions...', delay: 150 },
  { prefix: '', text: '[OK] Loading transaction history', delay: 100 },
  { prefix: '', text: '[OK] Parsing transaction data', delay: 100 },
  { prefix: '', text: '[OK] Transaction cache updated', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'running diagnostics...', delay: 150 },
  { prefix: '', text: '> CPU: OK | Memory: OK | Network: OK', delay: 100 },
  { prefix: '', text: '> All systems operational', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'verifying security...', delay: 150 },
  { prefix: '', text: '> SSL certificate validated', delay: 80 },
  { prefix: '', text: '> Authentication successful', delay: 80 },
  { prefix: '', text: '> Security check passed', delay: 80 },
  { prefix: 'root@trueping:~$ ', text: 'launching wallet...', delay: 150 },
  { prefix: '', text: '> Loading application modules', delay: 80 },
  { prefix: '', text: '> Initializing user interface', delay: 80 },
  { prefix: '', text: '> Preparing data layer', delay: 80 },
  { prefix: '', text: '████████████████████████ 100%', delay: 100 },
  { prefix: '', text: 'System ready.', delay: 150 },
]

const Wallet = () => {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState('market') // 'market' or 'wallet'
  const [user, setUser] = useState(null)
  const [wallets, setWallets] = useState([])
  const [balances, setBalances] = useState({})
  const [transactions, setTransactions] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [selectedWalletGroup, setSelectedWalletGroup] = useState(null) // Selected wallet name/group
  const [filteredWallets, setFilteredWallets] = useState([]) // Wallets filtered by selected group

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showMnemonicModal, setShowMnemonicModal] = useState(false)
  const [pendingMnemonic, setPendingMnemonic] = useState(null)
  const [showWalletPicker, setShowWalletPicker] = useState(false)

  // Terminal loading state
  const [displayedText, setDisplayedText] = useState('')
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const cursorOpacity = useRef(new Animated.Value(1)).current

  // Load user and wallets
  const loadData = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        setLoading(false)
        return
      }

      setUser(currentUser)

      const userWallets = await getWallets(currentUser.user_id || currentUser.id)
      setWallets(userWallets)
      
      // Group wallets by name and set initial selection
      const walletGroups = [...new Set(userWallets.map(w => w.name))]
      setSelectedWalletGroup((prevGroup) => {
        if (walletGroups.length > 0 && !prevGroup) {
          const firstGroup = walletGroups[0]
          setFilteredWallets(userWallets.filter(w => w.name === firstGroup))
          return firstGroup
        } else if (prevGroup && walletGroups.includes(prevGroup)) {
          setFilteredWallets(userWallets.filter(w => w.name === prevGroup))
          return prevGroup
        } else {
          setFilteredWallets(userWallets)
          return prevGroup
        }
      })

      // Load balances for each wallet
      const balancesMap = {}
      for (const wallet of userWallets) {
        try {
          const balanceData = await getAllBalances(wallet.id)
          balancesMap[wallet.id] = balanceData.native.balance
        } catch (error) {
          console.error(`Error loading balance for wallet ${wallet.id}:`, error)
          balancesMap[wallet.id] = '0'
        }
      }
      setBalances(balancesMap)

      // Load transactions for each wallet
      const transactionsMap = {}
      for (const wallet of userWallets) {
        try {
          const txHistory = await getTransactionHistory(wallet.id)
          transactionsMap[wallet.id] = txHistory.map((tx) => ({
            ...tx,
            walletAddress: wallet.address,
          }))
        } catch (error) {
          console.error(`Error loading transactions for wallet ${wallet.id}:`, error)
          transactionsMap[wallet.id] = []
        }
      }
      setTransactions(transactionsMap)
    } catch (error) {
      console.error('Error loading wallet data:', error)
      Alert.alert('Error', 'Failed to load wallet data')
    } finally {
      // Complete loading when data is ready (no artificial delay)
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Terminal animation effects
  useEffect(() => {
    if (!loading) return

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()

    // Cursor blink animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [loading, fadeAnim, cursorOpacity])

  useEffect(() => {
    if (!loading || currentLineIndex >= walletLoadingLines.length) {
      return
    }

    // Reset displayed text when starting a new line
    setDisplayedText('')
    
    const currentLine = walletLoadingLines[currentLineIndex]
    const fullText = currentLine.prefix + currentLine.text
    let charIndex = 0

    const typeInterval = setInterval(() => {
      if (charIndex <= fullText.length) {
        setDisplayedText(fullText.substring(0, charIndex))
        charIndex++
      } else {
        clearInterval(typeInterval)
        setTimeout(() => {
          setCurrentLineIndex(prev => prev + 1)
        }, currentLine.delay)
      }
    }, 20)

    return () => clearInterval(typeInterval)
  }, [currentLineIndex, loading])

  // Render terminal loading screen
  const renderTerminalLines = () => {
    return walletLoadingLines.slice(0, currentLineIndex).map((line, index) => {
      const fullLine = line.prefix + line.text
      return (
        <Text key={index} style={{ fontSize: 14, lineHeight: 20, fontFamily: 'monospace', color: '#E65300' }}>
          {fullLine}
        </Text>
      )
    })
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadData()
  }, [loadData])

  const handleCreateWallet = async (name) => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not found')
        return
      }

      const result = await createWalletsOnAllChains(user.user_id || user.id, name)
      
      // Show mnemonic modal
      setPendingMnemonic(result.mnemonic)
      setShowCreateModal(false)
      setShowMnemonicModal(true)
      
      // Set the newly created wallet group as selected
      setSelectedWalletGroup(name)
    } catch (error) {
      console.error('Error creating wallets:', error)
      throw error
    }
  }

  const handleMnemonicConfirmed = () => {
    setShowMnemonicModal(false)
    setPendingMnemonic(null)
    loadData() // Reload wallets
  }

  // Get unique wallet groups (by name)
  const walletGroups = [...new Set(wallets.map(w => w.name))]

  // Handle wallet group selection
  const handleWalletGroupChange = (groupName) => {
    setSelectedWalletGroup(groupName)
    setFilteredWallets(wallets.filter(w => w.name === groupName))
    setSelectedWallet(null) // Clear selected wallet when changing groups
    setShowWalletPicker(false)
  }

  const handleImportWallet = async (chain, mnemonicOrKey, name) => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not found')
        return
      }

      await importWallet(user.user_id || user.id, chain, mnemonicOrKey, name)
      setShowImportModal(false)
      loadData() // Reload wallets
      Alert.alert('Success', 'Wallet imported successfully')
    } catch (error) {
      console.error('Error importing wallet:', error)
      throw error
    }
  }

  const handleSendTransaction = async (toAddress, amount, tokenSymbol) => {
    try {
      if (!selectedWallet) {
        Alert.alert('Error', 'No wallet selected')
        return
      }

      let result
      if (tokenSymbol && tokenSymbol !== 'ETH' && tokenSymbol !== 'MATIC' && tokenSymbol !== 'BNB') {
        // Token transaction (not implemented in this version, would need token address)
        Alert.alert('Info', 'Token transactions coming soon')
        return
      } else {
        // Native token transaction
        result = await sendTransaction(selectedWallet.id, toAddress, amount)
      }

      setShowSendModal(false)
      setSelectedWallet(null)
      loadData() // Reload data
      Alert.alert('Success', `Transaction sent! Hash: ${result.hash}`)
    } catch (error) {
      console.error('Error sending transaction:', error)
      throw error
    }
  }

  const handleDeleteWallet = (wallet) => {
    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete ${wallet.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeWallet(wallet.id)
              loadData()
              Alert.alert('Success', 'Wallet deleted successfully')
            } catch (error) {
              console.error('Error deleting wallet:', error)
              Alert.alert('Error', 'Failed to delete wallet')
            }
          },
        },
      ]
    )
  }

  const handleWalletPress = (wallet) => {
    setSelectedWallet(wallet)
    setShowQRModal(true)
  }

  if (loading) {
    return (
      <View className="flex-1 bg-black">
        <Animated.View 
          className="flex-1 justify-between"
          style={{ opacity: fadeAnim, paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          {/* Terminal content */}
          <View style={{ paddingHorizontal: 15, paddingTop: 15, paddingBottom: 15, flex: 1, backgroundColor: '#0a0a0a' }}>
            {renderTerminalLines()}
            {currentLineIndex < walletLoadingLines.length && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, lineHeight: 20, fontFamily: 'monospace', color: '#E65300' }}>
                  {displayedText}
                </Text>
                <Animated.Text 
                  style={{ 
                    fontSize: 14, 
                    fontFamily: 'monospace', 
                    color: '#E65300',
                    opacity: cursorOpacity 
                  }}
                >
                  ▊
                </Animated.Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    )
  }

  // Market data - would come from API in real app
  const marketData = {
    token: 'ATRX',
    amount: '260.3',
    price: '$520',
    change: '-17%',
    tokenPrice: '$2,156.54',
    marketcap: '$0.52',
    fullyDilutedValuation: '$0.85',
    liquidity: '$269,258,379,159.23',
    volume24h: '$256,659,560.23',
  }

  const handleShare = () => {
    console.log('Share pressed')
  }

  const handleTokenPress = () => {
    console.log('Token pressed')
  }

  // Render Market content
  const renderMarketContent = () => {
  return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 10,
          paddingBottom: insets.bottom + 80,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Title and Share Icon */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%',
          paddingHorizontal: 16,
          marginTop: 10,
          marginBottom: 10,
        }}>
          <Text
            style={{
              fontFamily: 'OffBit-101-Bold',
              fontSize: 32,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            ATRX
          </Text>
          <TouchableOpacity
            onPress={handleShare}
            style={{
              position: 'absolute',
              right: 16,
              width: 36.5,
              height: 36.5,
              borderRadius: 18.25,
              backgroundColor: '#2A2A2A',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#E65300',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <ShareIcon color="#E65300" size={16} />
          </TouchableOpacity>
        </View>

        {/* Coin Image */}
        <View style={{ 
          width: 160, 
          height: 160, 
          marginTop: 10,
          marginBottom: 5,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Image
            source={require('../../../assets/icons/ATRX_L.png')}
            style={{
              width: 160,
              height: 160,
              resizeMode: 'contain',
            }}
          />
        </View>

        {/* Token Amount */}
        <Text
          style={{
            fontFamily: 'OffBit-101',
            fontSize: 20,
            color: '#FFFFFF',
            marginTop: 5,
            marginBottom: 5,
          }}
        >
          {marketData.amount}
        </Text>

        {/* Price Capsule */}
        <View
          style={{
            backgroundColor: '#212322',
            borderRadius: 99,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 8,
            marginTop: 5,
            marginBottom: 15,
          }}
        >
          <View
            style={{
              borderRightWidth: 1,
              borderRightColor: '#54565A',
              paddingRight: 6,
              marginRight: 6,
            }}
          >
            <Text
              style={{
                fontFamily: 'OffBit-101',
                fontSize: 16,
                color: '#FFFFFF',
              }}
            >
              {marketData.price}
            </Text>
          </View>
          <View style={{ paddingLeft: 6 }}>
            <Text
              style={{
                fontFamily: 'OffBit-101',
                fontSize: 16,
                color: '#FF0E00',
              }}
            >
              {marketData.change}
            </Text>
          </View>
        </View>

        {/* Market & Additional info Section */}
        <View style={{ width: '100%', paddingHorizontal: 21, marginTop: 10 }}>
          <Text
            style={{
              fontFamily: 'Satoshi-Medium',
              fontSize: 16,
              color: '#FFFFFF',
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            Market & Additional info
          </Text>

          {/* Market Info Card */}
          <View
            style={{
              backgroundColor: '#212322',
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 0,
            }}
          >
            {/* Token Item */}
            <TouchableOpacity
              onPress={handleTokenPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 0,
                marginBottom: 6,
              }}
            >
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    fontFamily: 'Satoshi-Regular',
                    fontSize: 14,
                    color: '#F6F6F6',
                    letterSpacing: -0.2,
                  }}
                >
                  Token
                </Text>
                <Text
                  style={{
                    fontFamily: 'Satoshi-Bold',
                    fontSize: 14,
                    color: '#F6F6F6',
                    letterSpacing: -0.2,
                    textDecorationLine: 'underline',
                  }}
                >
                  {marketData.token}
                </Text>
              </View>
              <View style={{ width: 20, height: 20, marginLeft: 5, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpIcon color="#E65300" size={20} />
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={{ height: 1, width: '100%', backgroundColor: '#333333', marginVertical: 6 }} />

            {/* Price Item */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 0,
                marginBottom: 6,
              }}
            >
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    fontFamily: 'Satoshi-Regular',
                    fontSize: 14,
                    color: '#F6F6F6',
                    letterSpacing: -0.2,
                  }}
                >
                  Price
                </Text>
                <Text
                  style={{
                    fontFamily: 'OffBit-101-Bold',
                    fontSize: 14,
                    color: '#F6F6F6',
                    letterSpacing: -0.2,
                  }}
                >
                  {marketData.tokenPrice}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, width: '100%', backgroundColor: '#333333', marginVertical: 6 }} />

            {/* Marketcap Item */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 0,
                marginBottom: 6,
              }}
            >
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    fontFamily: 'Satoshi-Regular',
                    fontSize: 14,
                    color: '#F6F6F6',
                    letterSpacing: -0.2,
                  }}
                >
                  Marketcap
                </Text>
                <Text
                  style={{
                    fontFamily: 'OffBit-101-Bold',
                    fontSize: 14,
                    color: '#F6F6F6',
                    letterSpacing: -0.2,
                  }}
                >
                  {marketData.marketcap}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, width: '100%', backgroundColor: '#333333', marginVertical: 6 }} />

            {/* Fully Diluted Valuation Item */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 0,
                marginBottom: 6,
              }}
            >
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    fontFamily: 'Satoshi-Regular',
                    fontSize: 14,
                    color: '#FFFFFF',
                    letterSpacing: -0.2,
                  }}
                >
                  Fully Diluted Valuation
                </Text>
                <Text
                  style={{
                    fontFamily: 'OffBit-101-Bold',
                    fontSize: 14,
                    color: '#FFFFFF',
                    letterSpacing: -0.2,
                    textAlign: 'right',
                  }}
                >
                  {marketData.fullyDilutedValuation}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, width: '100%', backgroundColor: '#333333', marginVertical: 6 }} />

            {/* Liquidity Item */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 0,
                marginBottom: 6,
              }}
            >
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    fontFamily: 'Satoshi-Regular',
                    fontSize: 14,
                    color: '#FFFFFF',
                    letterSpacing: -0.2,
                  }}
                >
                  Liquidity
                </Text>
                <Text
                  style={{
                    fontFamily: 'OffBit-101-Bold',
                    fontSize: 14,
                    color: '#FFFFFF',
                    letterSpacing: -0.2,
                    textAlign: 'right',
                  }}
                >
                  {marketData.liquidity}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, width: '100%', backgroundColor: '#333333', marginVertical: 6 }} />

            {/* Volume (24h) Item */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 0,
              }}
            >
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    fontFamily: 'Satoshi-Regular',
                    fontSize: 14,
                    color: '#FFFFFF',
                    letterSpacing: -0.2,
                  }}
                >
                  Volume (24h)
                </Text>
                <Text
                  style={{
                    fontFamily: 'OffBit-101-Bold',
                    fontSize: 14,
                    color: '#FFFFFF',
                    letterSpacing: -0.2,
                  }}
                >
                  {marketData.volume24h}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    )
  }

  // Render Wallet content
  const renderWalletContent = () => {
    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 0, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View className="flex-1 px-5 pt-5">
          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-5">
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="flex-1 bg-[#FF6B35] rounded-lg p-4"
            >
              <Text className="text-white font-satoshi text-center font-bold">Create Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowImportModal(true)}
              className="flex-1 bg-[#212322] border border-white/20 rounded-lg p-4"
            >
              <Text className="text-white font-satoshi text-center font-bold">Import Wallet</Text>
            </TouchableOpacity>
          </View>

          {/* Wallet Group Selector */}
          {walletGroups.length > 0 && (
            <View className="mb-5">
              <Text className="text-white font-satoshi text-sm mb-2">Select Wallet Group</Text>
              <TouchableOpacity
                onPress={() => setShowWalletPicker(!showWalletPicker)}
                className="bg-[#1a1a1a] border border-white/20 rounded-lg p-3 flex-row justify-between items-center"
              >
                <Text className="text-white font-satoshi">
                  {selectedWalletGroup || 'Select wallet group'}
                </Text>
                <Text className="text-white font-satoshi">▼</Text>
              </TouchableOpacity>
              
              {showWalletPicker && (
                <View className="bg-[#1a1a1a] border border-white/20 rounded-lg mt-2">
                  {walletGroups.map((groupName) => (
                    <TouchableOpacity
                      key={groupName}
                      onPress={() => handleWalletGroupChange(groupName)}
                      className={`p-3 border-b border-white/10 ${
                        selectedWalletGroup === groupName ? 'bg-[#FF6B35]/20' : ''
                      }`}
                    >
                      <Text className={`font-satoshi ${
                        selectedWalletGroup === groupName ? 'text-[#FF6B35]' : 'text-white'
                      }`}>
                        {groupName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Wallets List */}
          {filteredWallets.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Text className="text-[#9CA3AF] font-satoshi text-center mb-4">
                {wallets.length === 0 
                  ? 'No wallets yet. Create or import a wallet to get started.'
                  : 'No wallets in this group.'}
              </Text>
            </View>
          ) : (
            <>
              {filteredWallets.map((wallet) => (
                <View key={wallet.id}>
                  <WalletCard
                    wallet={wallet}
                    balance={balances[wallet.id] || '0'}
                    onPress={() => handleWalletPress(wallet)}
                    onDelete={() => handleDeleteWallet(wallet)}
                  />
                </View>
              ))}

              {/* Transactions Section */}
              {selectedWallet && transactions[selectedWallet.id] && (
                <View className="mt-5">
                  <Text className="text-white font-satoshi text-lg mb-3">Recent Transactions</Text>
                  {transactions[selectedWallet.id].length === 0 ? (
                    <Text className="text-[#9CA3AF] font-satoshi text-sm">
                      No transactions yet
                    </Text>
                  ) : (
                    transactions[selectedWallet.id].slice(0, 5).map((tx) => (
                      <TransactionItem key={tx.id} transaction={tx} />
                    ))
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    )
  }

  return (
    <View className="flex-1 bg-background dark:bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <GridPatternBackground />

      {/* Top Bar Switcher */}
      <View style={{
        paddingTop: insets.top,
        paddingBottom: 10,
        paddingHorizontal: 16,
        backgroundColor: '#000000',
      }}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#212322',
          borderRadius: 10,
          padding: 4,
          gap: 4,
        }}>
          <TouchableOpacity
            onPress={() => setActiveTab('market')}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: activeTab === 'market' ? '#E65300' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'Satoshi-Medium',
                fontSize: 14,
                color: activeTab === 'market' ? '#FFFFFF' : '#9CA3AF',
              }}
            >
              Market
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('wallet')}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: activeTab === 'wallet' ? '#E65300' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'Satoshi-Medium',
                fontSize: 14,
                color: activeTab === 'wallet' ? '#FFFFFF' : '#9CA3AF',
              }}
            >
              Wallet
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conditional Content Rendering */}
      {activeTab === 'market' ? renderMarketContent() : renderWalletContent()}

      {/* Create Wallet Modal */}
      <CreateWalletModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateWallet}
      />

      {/* Import Wallet Modal */}
      <ImportWalletModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportWallet}
      />

      {/* Send Transaction Modal */}
      <SendTransactionModal
        visible={showSendModal}
        onClose={() => {
          setShowSendModal(false)
          setSelectedWallet(null)
        }}
        wallet={selectedWallet}
        onSend={handleSendTransaction}
        tokenSymbol={selectedWallet ? balances[selectedWallet.id]?.native?.symbol : null}
      />

      {/* QR Code Modal */}
      <Modal visible={showQRModal} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-center items-center">
          <View className="bg-[#212322] rounded-3xl p-5 max-w-[90%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-white font-satoshi text-xl">Wallet Address</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Text className="text-white font-satoshi text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            {selectedWallet && <AddressQRCode address={selectedWallet.address} chain={selectedWallet.chain} />}

            <View className="flex-row gap-3 mt-5">
              <TouchableOpacity
                onPress={() => {
                  setShowQRModal(false)
                  setShowSendModal(true)
                }}
                className="flex-1 bg-[#FF6B35] rounded-lg p-3"
              >
                <Text className="text-white font-satoshi text-center font-bold">Send</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (selectedWallet?.address) {
                    Clipboard.setString(selectedWallet.address)
                    Alert.alert('Success', 'Address copied to clipboard')
                  }
                }}
                className="flex-1 bg-[#1a1a1a] border border-white/20 rounded-lg p-3"
              >
                <Text className="text-white font-satoshi text-center">Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mnemonic Display Modal */}
      <Modal visible={showMnemonicModal} transparent animationType="slide">
        <View className="flex-1 bg-black">
          <MnemonicDisplay mnemonic={pendingMnemonic || ''} onConfirm={handleMnemonicConfirmed} />
        </View>
      </Modal>
    </View>
  )
}

export default Wallet
