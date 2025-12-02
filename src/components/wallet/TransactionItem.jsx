import React from 'react'
import { View, Text } from 'react-native'
import { getChainConfig } from '../../services/wallet/chainConfig'

const TransactionItem = ({ transaction }) => {
  const chainConfig = getChainConfig(transaction.chain)
  const isSent = transaction.from.toLowerCase() === transaction.walletAddress?.toLowerCase()
  const statusColor =
    transaction.status === 'confirmed'
      ? '#10B981'
      : transaction.status === 'pending'
        ? '#F59E0B'
        : '#EF4444'

  return (
    <View className="bg-[#212322] border border-white/20 rounded-lg p-3 mb-2">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-white font-satoshi text-sm mb-1">
            {isSent ? 'Sent' : 'Received'} {transaction.tokenSymbol}
          </Text>
          <Text className="text-[#9CA3AF] font-satoshi text-xs" numberOfLines={1}>
            {isSent ? 'To' : 'From'}: {isSent ? transaction.to : transaction.from}
          </Text>
        </View>
        <View
          className="px-2 py-1 rounded"
          style={{ backgroundColor: `${statusColor}20` }}
        >
          <Text className="text-xs font-satoshi" style={{ color: statusColor }}>
            {transaction.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-2">
        <Text className="text-white font-satoshi text-base">
          {isSent ? '-' : '+'}
          {parseFloat(transaction.amount || '0').toFixed(6)} {transaction.tokenSymbol}
        </Text>
        <Text className="text-[#9CA3AF] font-satoshi text-xs">
          {chainConfig?.name || transaction.chain}
        </Text>
      </View>

      {transaction.hash && (
        <Text className="text-[#9CA3AF] font-satoshi text-xs mt-2" numberOfLines={1}>
          {transaction.hash}
        </Text>
      )}
    </View>
  )
}

export default TransactionItem

