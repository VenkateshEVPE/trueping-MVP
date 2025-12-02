import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native'
import { isValidAddress } from '../../services/wallet/walletService'

const SendTransactionModal = ({ visible, onClose, wallet, onSend, tokenSymbol = null }) => {
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!toAddress.trim()) {
      Alert.alert('Error', 'Please enter recipient address')
      return
    }

    if (!isValidAddress(toAddress.trim(), wallet?.chain)) {
      Alert.alert('Error', 'Invalid recipient address')
      return
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }

    setIsSending(true)
    try {
      await onSend(toAddress.trim(), amount.trim(), tokenSymbol)
      setToAddress('')
      setAmount('')
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send transaction')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-[#212322] rounded-t-3xl p-5 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-white font-satoshi text-xl">
              Send {tokenSymbol || 'Token'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-white font-satoshi text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-white font-satoshi text-sm mb-2">From</Text>
              <TextInput
                className="bg-[#1a1a1a] border border-white/20 rounded-lg p-3 text-white font-satoshi"
                value={wallet?.address || ''}
                editable={false}
              />
            </View>

            <View className="mb-4">
              <Text className="text-white font-satoshi text-sm mb-2">To Address</Text>
              <TextInput
                className="bg-[#1a1a1a] border border-white/20 rounded-lg p-3 text-white font-satoshi"
                placeholder="Enter recipient address"
                placeholderTextColor="#9CA3AF"
                value={toAddress}
                onChangeText={setToAddress}
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-white font-satoshi text-sm mb-2">Amount ({tokenSymbol || 'ETH'})</Text>
              <TextInput
                className="bg-[#1a1a1a] border border-white/20 rounded-lg p-3 text-white font-satoshi"
                placeholder="0.0"
                placeholderTextColor="#9CA3AF"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={isSending}
              className="bg-[#FF6B35] rounded-lg p-4 mt-4"
              style={{ opacity: isSending ? 0.6 : 1 }}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-satoshi text-center text-lg font-bold">
                  Send Transaction
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export default SendTransactionModal

