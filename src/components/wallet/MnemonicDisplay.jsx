import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'

const MnemonicDisplay = ({ mnemonic, onConfirm }) => {
  const [copied, setCopied] = useState(false)
  const words = mnemonic.split(' ')

  const handleCopy = () => {
    Clipboard.setString(mnemonic)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirm = () => {
    Alert.alert(
      'Confirm Backup',
      'Have you securely saved your recovery phrase? You will not be able to see it again.',
      [
        {
          text: 'Not Yet',
          style: 'cancel',
        },
        {
          text: 'Yes, I Saved It',
          onPress: onConfirm,
          style: 'default',
        },
      ]
    )
  }

  return (
    <View className="flex-1 bg-[#212322] p-5">
      <View className="mb-4">
        <Text className="text-white font-satoshi text-xl mb-2">Your Recovery Phrase</Text>
        <Text className="text-[#9CA3AF] font-satoshi text-sm">
          Write down these 12 words in the exact order shown. Keep them safe and never share them
          with anyone.
        </Text>
      </View>

      <View className="bg-black/50 border border-yellow-500/50 rounded-lg p-4 mb-4">
        <Text className="text-yellow-500 font-satoshi text-xs mb-2 text-center">
          ⚠️ SECURITY WARNING
        </Text>
        <Text className="text-yellow-500/80 font-satoshi text-xs text-center">
          Anyone with access to this phrase can control your wallet. Never share it or store it
          online.
        </Text>
      </View>

      <ScrollView className="flex-1 mb-4">
        <View className="flex-row flex-wrap justify-between">
          {words.map((word, index) => (
            <View
              key={index}
              className="bg-[#1a1a1a] border border-white/10 rounded p-3 mb-2"
              style={{ width: '48%' }}
            >
              <Text className="text-[#9CA3AF] font-satoshi text-xs mb-1">{index + 1}</Text>
              <Text className="text-white font-satoshi text-base">{word}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={handleCopy}
        className="bg-[#1a1a1a] border border-white/20 rounded-lg p-3 mb-3"
      >
        <Text className="text-white font-satoshi text-center">
          {copied ? '✓ Copied to Clipboard' : 'Copy to Clipboard'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleConfirm}
        className="bg-[#FF6B35] rounded-lg p-4"
      >
        <Text className="text-white font-satoshi text-center text-lg font-bold">
          I've Saved My Recovery Phrase
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default MnemonicDisplay

