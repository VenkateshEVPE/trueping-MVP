import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native'
import { CHAINS, getChainConfig } from '../../services/wallet/chainConfig'

const CreateWalletModal = ({ visible, onClose, onCreate }) => {
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a wallet name')
      return
    }

    setIsCreating(true)
    try {
      await onCreate(name.trim())
      setName('')
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create wallet')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-[#212322] rounded-t-3xl p-5 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-white font-satoshi text-xl">Create New Wallet</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-white font-satoshi text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-white font-satoshi text-sm mb-2">Wallet Name</Text>
            <TextInput
              className="bg-[#1a1a1a] border border-white/20 rounded-lg p-3 text-white font-satoshi"
              placeholder="Enter wallet name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="mb-4">
            <Text className="text-white font-satoshi text-sm mb-2">Supported Networks</Text>
            <View className="flex-row flex-wrap gap-2">
              {Object.values(CHAINS).map((chainOption) => {
                const config = getChainConfig(chainOption)
                return (
                  <View
                    key={chainOption}
                    className="border border-white/20 rounded-lg p-3"
                    style={{ minWidth: '30%' }}
                  >
                    <Text className="font-satoshi text-center text-white">
                      {config?.name || chainOption}
                    </Text>
                  </View>
                )
              })}
            </View>
            <Text className="text-[#9CA3AF] font-satoshi text-xs mt-2">
              Wallets will be created on all supported networks
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={isCreating}
            className="bg-[#FF6B35] rounded-lg p-4 mt-4"
            style={{ opacity: isCreating ? 0.6 : 1 }}
          >
            {isCreating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-satoshi text-center text-lg font-bold">
                Create Wallet
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default CreateWalletModal

