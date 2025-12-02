import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { getChainConfig, getNativeCurrencySymbol } from '../../services/wallet/chainConfig'

const WalletCard = ({ wallet, balance, onPress, onDelete }) => {
  const chainConfig = getChainConfig(wallet.chain)
  const nativeSymbol = getNativeCurrencySymbol(wallet.chain)

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-[#212322] border border-white/20 rounded-lg p-4 mb-3"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-white font-satoshi text-lg mb-1">{wallet.name}</Text>
          <Text className="text-[#9CA3AF] font-satoshi text-xs" numberOfLines={1}>
            {wallet.address}
          </Text>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} className="ml-2">
            <Text className="text-red-500 font-satoshi text-xs">Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="mt-2">
        <View className="flex-row items-baseline">
          <Text className="text-white font-satoshi text-2xl">
            {balance ? parseFloat(balance).toFixed(4) : '0.0000'}
          </Text>
          <Text className="text-[#9CA3AF] font-satoshi text-sm ml-2">{nativeSymbol}</Text>
        </View>
        <Text className="text-[#9CA3AF] font-satoshi text-xs mt-1">
          {chainConfig?.name || wallet.chain}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default WalletCard

