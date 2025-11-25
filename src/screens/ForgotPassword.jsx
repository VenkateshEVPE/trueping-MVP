/* eslint-disable react-native/no-inline-styles */
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import GridPatternBackground from '../components/GridPatternBackground'
import { sendOTP } from '../services/auth/auth'

const ForgotPassword = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const emailInputRef = useRef(null)

  // Auto-focus email input when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      emailInputRef.current?.focus()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Email validation function
  const isValidEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue)
  }

  const isEmailValid = isValidEmail(email)

  const handleRequestOTP = async () => {
    // Validate email
    if (!isEmailValid) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError(null)
    Keyboard.dismiss()

    try {
      const response = await sendOTP(email.trim())
      
      // Success - navigate to OTP verification screen
      setIsLoading(false)
      console.log('OTP sent successfully:', response)
      navigation.navigate('otpVerification', { 
        email: email.trim()
      })
    } catch (err) {
      setIsLoading(false)
      // Handle error
      const errorMessage = err.data?.message || err.message || 'Failed to send OTP. Please try again.'
      setError(errorMessage)
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background dark:bg-black"
    >
      {/* Grid pattern background with gradient overlay */}
      <GridPatternBackground />

      
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
      {/* Gradient overlay at top */}
      <View 
        className="absolute top-0 left-0 right-0"
        style={{
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        }}
      />
      
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
          <Text className="text-base font-satoshi text-text dark:text-white mb-8">
            Enter your email id to reset your password.
          </Text>

          {/* Email container */}
          <View className="mb-8">
            <Text className="text-xl mb-2 font-satoshi text-text dark:text-white">
              Email ID
            </Text>
            <View className="relative">
              <TextInput
                ref={emailInputRef}
                className="h-[49px] px-3 text-base border font-satoshi bg-inputBackground dark:bg-[#212322] border-inputBorder dark:border-black text-text dark:text-white"
                placeholder="Enter your email id here"
                placeholderTextColor="#54565a"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isEmailValid && (
                <View className="absolute right-3 top-[17px] w-[15px] h-[15px] items-center justify-center">
                  <Text className="text-emerald-500 text-xs">✓</Text>
                </View>
              )}
            </View>
          </View>

          {/* Error message */}
          {error && (
            <View className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded">
              <Text className="text-red-400 text-sm font-satoshi">{error}</Text>
            </View>
          )}

          {/* Request OTP button */}
          <TouchableOpacity 
            className="w-full py-3 items-center justify-center bg-buttonBackground mt-auto"
            onPress={handleRequestOTP}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#1c1c1c" />
            ) : (
            <Text className="text-xl font-satoshiMedium text-buttonText">
              Request OTP
            </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ForgotPassword

