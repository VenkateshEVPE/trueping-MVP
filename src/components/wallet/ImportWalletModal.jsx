import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native'
import { CHAINS, getChainConfig } from '../../services/wallet/chainConfig'

const ImportWalletModal = ({ visible, onClose, onImport }) => {
  const [chain, setChain] = useState(CHAINS.ETHEREUM)
  const [name, setName] = useState('')
  const [mnemonicOrKey, setMnemonicOrKey] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importType, setImportType] = useState('mnemonic') // 'mnemonic' or 'privateKey'

  const handleImport = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a wallet name')
      return
    }

    if (!mnemonicOrKey.trim()) {
      Alert.alert('Error', `Please enter your ${importType === 'mnemonic' ? 'mnemonic phrase' : 'private key'}`)
      return
    }

    setIsImporting(true)
    try {
      await onImport(chain, mnemonicOrKey.trim(), name.trim())
      setName('')
      setMnemonicOrKey('')
      setChain(CHAINS.ETHEREUM)
      setImportType('mnemonic')
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to import wallet')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-[#212322] rounded-t-3xl p-5 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-white font-satoshi text-xl">Import Wallet</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-white font-satoshi text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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
              <Text className="text-white font-satoshi text-sm mb-2">Import Type</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setImportType('mnemonic')}
                  className={`flex-1 border rounded-lg p-3 ${
                    importType === 'mnemonic' ? 'border-[#FF6B35] bg-[#FF6B35]/20' : 'border-white/20'
                  }`}
                >
                  <Text
                    className={`font-satoshi text-center ${
                      importType === 'mnemonic' ? 'text-[#FF6B35]' : 'text-white'
                    }`}
                  >
                    Mnemonic
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setImportType('privateKey')}
                  className={`flex-1 border rounded-lg p-3 ${
                    importType === 'privateKey' ? 'border-[#FF6B35] bg-[#FF6B35]/20' : 'border-white/20'
                  }`}
                >
                  <Text
                    className={`font-satoshi text-center ${
                      importType === 'privateKey' ? 'text-[#FF6B35]' : 'text-white'
                    }`}
                  >
                    Private Key
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-white font-satoshi text-sm mb-2">
                {importType === 'mnemonic' ? 'Recovery Phrase (12 words)' : 'Private Key'}
              </Text>
              <TextInput
                className="bg-[#1a1a1a] border border-white/20 rounded-lg p-3 text-white font-satoshi"
                placeholder={
                  importType === 'mnemonic'
                    ? 'Enter your 12-word recovery phrase'
                    : 'Enter your private key'
                }
                placeholderTextColor="#9CA3AF"
                value={mnemonicOrKey}
                onChangeText={setMnemonicOrKey}
                multiline={importType === 'mnemonic'}
                numberOfLines={importType === 'mnemonic' ? 3 : 1}
                secureTextEntry={importType === 'privateKey'}
              />
            </View>

            <View className="mb-4">
              <Text className="text-white font-satoshi text-sm mb-2">Blockchain Network</Text>
              <View className="flex-row flex-wrap gap-2">
                {Object.values(CHAINS).map((chainOption) => {
                  const config = getChainConfig(chainOption)
                  const isSelected = chain === chainOption
                  return (
                    <TouchableOpacity
                      key={chainOption}
                      onPress={() => setChain(chainOption)}
                      className={`border rounded-lg p-3 ${
                        isSelected ? 'border-[#FF6B35] bg-[#FF6B35]/20' : 'border-white/20'
                      }`}
                      style={{ minWidth: '30%' }}
                    >
                      <Text
                        className={`font-satoshi text-center ${
                          isSelected ? 'text-[#FF6B35]' : 'text-white'
                        }`}
                      >
                        {config?.name || chainOption}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleImport}
              disabled={isImporting}
              className="bg-[#FF6B35] rounded-lg p-4 mt-4"
              style={{ opacity: isImporting ? 0.6 : 1 }}
            >
              {isImporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-satoshi text-center text-lg font-bold">
                  Import Wallet
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export default ImportWalletModal

