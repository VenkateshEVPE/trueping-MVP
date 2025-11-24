import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import GridPatternBackground from '../components/GridPatternBackground'

const SignIn = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Email validation function
  const isValidEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue)
  }

  const isEmailValid = isValidEmail(email)

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background dark:bg-black"
    >
      {/* Grid pattern background with gradient overlay */}
      <GridPatternBackground />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* Main content */}
        <View className="flex-1 px-5 pt-[20%]">
          {/* Title */}
          <View className="mt-8 mb-8">
            <Text className="text-[40px] leading-[50px] font-satoshi text-text dark:text-white">
              Login into your
            </Text>
            <Text className="text-[40px] leading-[50px] font-satoshi text-text dark:text-white">
              Account
            </Text>
          </View>

          {/* Email container */}
          <View className="mb-4">
            <Text className="text-xl mb-2 font-satoshi text-text dark:text-white">
              Email ID
            </Text>
            <View className="relative">
              <TextInput
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

          {/* Password container */}
          <View className="mb-6">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-xl font-satoshi text-text dark:text-white">
                Password
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('forgotPassword')}>
                <Text className="text-xs mt-2 underline font-satoshi text-buttonBackground">
                  Forgot password ?
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              className="h-[49px] px-3 text-base border font-satoshi bg-inputBackground dark:bg-[#212322] border-inputBorder dark:border-black text-text dark:text-white"
              placeholder="Enter your password here"
              placeholderTextColor="#54565a"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Buttons container */}
          <View className="items-center mt-6">
            {/* Login button */}
            <TouchableOpacity 
              className="w-full py-3 items-center justify-center mb-7 bg-buttonBackground"
            >
              <Text className="text-xl font-satoshiMedium text-buttonText">
                Login in
              </Text>
            </TouchableOpacity>

            {/* Or divider */}
            <Text className="text-xl text-center mb-7 font-satoshi text-text dark:text-white">
              Or
            </Text>

            {/* Sign up button */}
            <TouchableOpacity 
              className="w-full py-3 items-center justify-center mb-7 bg-buttonBackground"
              onPress={() => navigation.navigate('signUp')}
            >
              <Text className="text-xl font-satoshiMedium text-buttonText">
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default SignIn