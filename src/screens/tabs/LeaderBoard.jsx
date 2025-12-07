import { Text, View, ScrollView } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GridPatternBackground from '../../components/GridPatternBackground'

const LeaderBoard = () => {
  const insets = useSafeAreaInsets()

  // Dummy leaderboard data
  const leaderboardData = [
    { rank: 1, deviceName: 'QuantumPulse-X1', samples: 12580, avgLatency: 12, uptime: 98.5 },
    { rank: 2, deviceName: 'NeuralNet-7', samples: 11234, avgLatency: 15, uptime: 97.2 },
    { rank: 3, deviceName: 'CyberLink-Pro', samples: 10890, avgLatency: 18, uptime: 96.8 },
    { rank: 4, deviceName: 'DataStream-99', samples: 9876, avgLatency: 22, uptime: 95.5 },
    { rank: 5, deviceName: 'NetCore-42', samples: 9234, avgLatency: 25, uptime: 94.3 },
    { rank: 6, deviceName: 'PulseNode-8', samples: 8765, avgLatency: 28, uptime: 93.1 },
    { rank: 7, deviceName: 'SpeedTest-Max', samples: 8234, avgLatency: 32, uptime: 92.4 },
    { rank: 8, deviceName: 'FastTrack-15', samples: 7890, avgLatency: 35, uptime: 91.8 },
    { rank: 9, deviceName: 'UltraNet-3', samples: 7456, avgLatency: 38, uptime: 90.5 },
    { rank: 10, deviceName: 'MegaLink-21', samples: 7123, avgLatency: 42, uptime: 89.2 },
  ]

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700' // Gold
    if (rank === 2) return '#C0C0C0' // Silver
    if (rank === 3) return '#CD7F32' // Bronze
    return '#e65300' // Orange
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <View className="flex-1 bg-background dark:bg-black">
      {/* Grid pattern background with gradient overlay */}
      <GridPatternBackground />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          paddingTop: insets.top + 20, 
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 15,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-[32px] leading-[40px] font-satoshiBold text-white mb-2" style={{ letterSpacing: 0.15 }}>
            LeaderBoard
          </Text>
          <Text className="text-[14px] font-satoshi text-white/70" style={{ letterSpacing: 0.15 }}>
            Top performers by samples collected
          </Text>
        </View>

        {/* Leaderboard List */}
        <View className="gap-3">
          {leaderboardData.map((entry) => (
            <View
              key={entry.rank}
              className="bg-[#212322] border border-white/20 rounded-[8px] p-4"
              style={{
                borderColor: entry.rank <= 3 ? `${getRankColor(entry.rank)}80` : 'rgba(255, 255, 255, 0.2)',
                borderWidth: entry.rank <= 3 ? 2 : 1,
              }}
            >
              <View className="flex-row items-center justify-between">
                {/* Rank and Device Name */}
                <View className="flex-row items-center flex-1">
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor: entry.rank <= 3 ? `${getRankColor(entry.rank)}20` : 'rgba(230, 83, 0, 0.2)',
                    }}
                  >
                    <Text 
                      className="text-[16px] font-offBit101Bold"
                      style={{ color: getRankColor(entry.rank) }}
                    >
                      {getRankIcon(entry.rank)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-satoshiBold text-[16px] mb-1" style={{ letterSpacing: 0.15 }}>
                      {entry.deviceName}
                    </Text>
                    <Text className="text-white/60 font-satoshi text-[12px]" style={{ letterSpacing: 0.15 }}>
                      Rank #{entry.rank}
                    </Text>
                  </View>
                </View>

                {/* Stats */}
                <View className="items-end">
                  <View className="flex-row items-baseline mb-1">
                    <Text className="text-[#e65300] font-offBit101Bold text-[20px]">
                      {entry.samples.toLocaleString()}
                    </Text>
                    <Text className="text-white/60 font-satoshi text-[10px] ml-1">samples</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-white/70 font-satoshi text-[11px]">
                      {entry.avgLatency}ms
                    </Text>
                    <Text className="text-white/70 font-satoshi text-[11px]">
                      {entry.uptime}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Footer Info */}
        <View className="mt-6 pt-4 border-t border-white/10">
          <Text className="text-white/50 font-satoshi text-[12px] text-center" style={{ letterSpacing: 0.15 }}>
            Rankings update in real-time
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default LeaderBoard