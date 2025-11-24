/* eslint-disable react-native/no-inline-styles */
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import GridPatternBackground from '../components/GridPatternBackground'

const OTPVerification = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [otp, setOtp] = useState(['', '', '', ''])
  const [showX, setShowX] = useState([false, false, false, false]) // Track which digits should show "x"
  const [timeLeft, setTimeLeft] = useState(45) // 45 seconds countdown
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])
  const timersRef = useRef([])

  // Auto-focus first OTP input when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  // Handle OTP input change
  const handleOtpChange = (value, index) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1)
    }
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    const newShowX = [...showX]
    
    // Clear existing timer for this index
    if (timersRef.current[index]) {
      clearTimeout(timersRef.current[index])
    }

    if (value) {
      // Set the digit
      newOtp[index] = value
      newShowX[index] = false // Show digit first
      setOtp(newOtp)
      setShowX(newShowX)

      // After 1 second, show "x"
      timersRef.current[index] = setTimeout(() => {
        setShowX(prev => {
          const updated = [...prev]
          updated[index] = true
          return updated
        })
      }, 100)
    } else {
      // Clear the digit
      newOtp[index] = ''
      newShowX[index] = false
      setOtp(newOtp)
      setShowX(newShowX)
    }

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-focus previous input on backspace
    if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(timer => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [])

  // Handle backspace
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle resend OTP
  const handleResendOTP = () => {
    if (canResend) {
      setTimeLeft(45)
      setCanResend(false)
      setOtp(['', '', '', ''])
      inputRefs.current[0]?.focus()
      // Here you would typically call your API to resend OTP
      console.log('Resending OTP...')
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Handle verify OTP
  const handleVerifyOTP = () => {
    const otpString = otp.join('')
    if (otpString.length === 4) {
      // Navigate to reset password screen
      console.log('Verifying OTP:', otpString)
      navigation.navigate('resetPassword')
    }
  }

  const isOtpComplete = otp.every(digit => digit !== '')

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background dark:bg-black"
    >
      {/* Grid pattern background with gradient overlay */}
      <GridPatternBackground />
      
      {/* Gradient overlay at top */}
      <View 
        className="absolute top-0 left-0 right-0"
        style={{
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        }}
      />
      
      {/* Back button */}
      <View
        className="absolute left-5 items-center justify-center z-[9999]"
        style={{ 
          top: insets.top + 10,
          width: 44,
          height: 50,
          overflow: 'visible',
        }}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="w-full h-full items-center justify-center"
          style={{ paddingTop: 2 }}
        >
          <Text className="text-[40px] text-text dark:text-white" style={{ lineHeight: 40 }}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* Main content */}
        <View className="flex-1 px-5 pt-[20%]">
          {/* Title */}
          <View className="mb-4 mt-8">
            <Text className="text-[40px] leading-[50px] font-satoshi text-text dark:text-white">
              Forgot password
            </Text>
          </View>

          {/* Subtitle */}
          <Text className="text-base font-satoshi text-text dark:text-white mb-12">
            An OTP has been sent to your email id
          </Text>

          {/* OTP Input Fields */}
          <View className="items-center mb-8">
            <View className="flex-row items-center justify-center gap-[50px] mb-1">
              {otp.map((digit, index) => (
                <View key={index} className="items-center justify-center w-6 h-6">
                  {/* Hidden TextInput for capturing input */}
                  <TextInput
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    className="absolute inset-0 text-xl text-transparent text-center"
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    style={{ 
                      lineHeight: 20,
                    }}
                  />
                  {/* Display digit or "x" based on showX state */}
                  {digit && (
                    <Text 
                      className={`text-xl text-white text-center ${showX[index] ? 'font-offBitBold' : 'font-satoshiBold'}`}
                      style={{ lineHeight: 20 }}
                    >
                      {showX[index] ? 'x' : digit}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Dividers */}
            <View className="flex-row items-center justify-center gap-[30px]">
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  className="bg-[#d9d9d9] h-[1.4px] w-[40px]"
                />
              ))}
            </View>
          </View>

          {/* Resend OTP and Timer */}
          <View className="flex-row justify-between items-center mb-8 px-5">
            <TouchableOpacity 
              onPress={handleResendOTP}
              disabled={!canResend}
            >
              <Text 
                className={`text-base font-satoshi underline ${canResend ? 'text-[#e65300]' : 'text-[#54565a]'}`}
              >
                Resend OTP
              </Text>
            </TouchableOpacity>
            <Text className="text-base font-satoshi text-white">
              {formatTime(timeLeft)}
            </Text>
          </View>

          {/* Verify OTP button */}
          <TouchableOpacity 
            className={`w-full py-3 items-center justify-center bg-buttonBackground ${!isOtpComplete ? 'opacity-50' : ''}`}
            onPress={handleVerifyOTP}
            disabled={!isOtpComplete}
          >
            <Text className="text-xl font-satoshiMedium text-buttonText">
              Verify OTP
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default OTPVerification

