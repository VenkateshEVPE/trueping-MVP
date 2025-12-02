import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GridPatternBackground from '../../components/GridPatternBackground'
import { getCurrentUser } from '../../database/database'
import { createWallet, importWallet, getWallets, removeWallet } from '../../services/wallet/walletService'
import { getAllBalances } from '../../services/wallet/balanceService'
import { sendTransaction, getTransactionHistory } from '../../services/wallet/transactionService'
import WalletCard from '../../components/wallet/WalletCard'
import AddressQRCode from '../../components/wallet/AddressQRCode'
import TransactionItem from '../../components/wallet/TransactionItem'
import CreateWalletModal from '../../components/wallet/CreateWalletModal'
import ImportWalletModal from '../../components/wallet/ImportWalletModal'
import SendTransactionModal from '../../components/wallet/SendTransactionModal'
import MnemonicDisplay from '../../components/wallet/MnemonicDisplay'

const Wallet = () => {
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState(null)
  const [wallets, setWallets] = useState([])
  const [balances, setBalances] = useState({})
  const [transactions, setTransactions] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showMnemonicModal, setShowMnemonicModal] = useState(false)
  const [pendingMnemonic, setPendingMnemonic] = useState(null)

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
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadData()
  }, [loadData])

  const handleCreateWallet = async (chain, name) => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not found')
        return
      }

      const newWallet = await createWallet(user.user_id || user.id, chain, name)
      
      // Show mnemonic modal
      setPendingMnemonic(newWallet.mnemonic)
      setShowCreateModal(false)
      setShowMnemonicModal(true)
    } catch (error) {
      console.error('Error creating wallet:', error)
      throw error
    }
  }

  const handleMnemonicConfirmed = () => {
    setShowMnemonicModal(false)
    setPendingMnemonic(null)
    loadData() // Reload wallets
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
      <View className="flex-1 bg-background dark:bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text className="text-white font-satoshi mt-4">Loading wallets...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background dark:bg-black">
      <GridPatternBackground />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View className="flex-1 px-5 pt-5">
          <Text className="text-[40px] leading-[50px] font-satoshi text-text dark:text-white mb-5">
            Wallet
          </Text>

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

          {/* Wallets List */}
          {wallets.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Text className="text-[#9CA3AF] font-satoshi text-center mb-4">
                No wallets yet. Create or import a wallet to get started.
              </Text>
            </View>
          ) : (
            <>
              {wallets.map((wallet) => (
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

            {selectedWallet && <AddressQRCode address={selectedWallet.address} />}

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
                  setShowQRModal(false)
                  setSelectedWallet(null)
                }}
                className="flex-1 bg-[#1a1a1a] border border-white/20 rounded-lg p-3"
              >
                <Text className="text-white font-satoshi text-center">Close</Text>
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
