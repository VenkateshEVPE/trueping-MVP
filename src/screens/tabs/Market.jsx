/* eslint-disable react-native/no-inline-styles */
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Image,
} from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GridPatternBackground from '../../components/GridPatternBackground'
import ShareIcon from '../../components/icons/ShareIcon'
import ArrowUpIcon from '../../components/icons/ArrowUpIcon'

const Market = () => {
  const insets = useSafeAreaInsets()

  const handleShare = () => {
    // Handle share functionality
    console.log('Share pressed')
  }

  const handleTokenPress = () => {
    // Handle token press (navigate to token details)
    console.log('Token pressed')
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

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Grid Pattern Background */}
      <GridPatternBackground />
      
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 10,
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
          {/* <TouchableOpacity
            onPress={handleShare}
            style={{
              position: 'absolute',
              right: 16,
              width: 36.5,
              height: 36.5,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShareIcon color="#F6F6F6" size={36.5} />
          </TouchableOpacity> */}
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
    </View>
  )
}

export default Market

