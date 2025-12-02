import React from 'react'
import { View, Text } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

const AddressQRCode = ({ address, size = 200 }) => {
  if (!address) {
    return null
  }

  return (
    <View className="items-center justify-center p-4 bg-white rounded-lg">
      <QRCode value={address} size={size} />
      <Text className="text-[#212322] font-satoshi text-xs mt-4 text-center" numberOfLines={2}>
        {address}
      </Text>
    </View>
  )
}

export default AddressQRCode

