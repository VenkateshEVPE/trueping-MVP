import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native'
import React, { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import GridPatternBackground from '../components/GridPatternBackground'
import { signIn } from '../services/auth/auth'
import { saveUser, updateUserToken } from '../database/database'
import { arePermissionsGranted } from '../services/permissionsStorage'

const SignIn = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Email validation function
  const isValidEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue)
  }

  const isEmailValid = isValidEmail(email)

  // Handle login
  const handleLogin = async () => {
    // Validate form
    if (!isEmailValid) {
      setError('Please enter a valid email address')
      return
    }
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    setError(null)
    Keyboard.dismiss()

    try {
      const response = await signIn({
        email: email.trim(),
        password: password,
      })
      
      // Save/update user in database
      try {
        const token = response.token || response.access_token || null
        await saveUser({
          id: response.id,
          user_id: response.id,
          name: response.name || '',
          email: email.trim(),
          role: response.role || '',
          token: token,
          email_verified: response.email_verified ? true : false,
          skipped_login: false, // Clear skipped_login flag on normal login
        })
        
        // Update token if separate call needed
        if (token) {
          await updateUserToken(email.trim(), token)
        }
        
        console.log('User data saved to database successfully')
      } catch (dbError) {
        console.error('Error saving user to database:', dbError)
        // Continue even if database save fails
      }
      
      // Success - handle successful login
      setIsLoading(false)
      console.log('Login successful:', response)
      
      // Check if permissions have been granted
      const permissionsGranted = await arePermissionsGranted()
      if (permissionsGranted) {
        // Navigate to tabs screen
        navigation.replace('tabs')
      } else {
        // Navigate to permissions screen
        navigation.replace('permissions')
      }
    } catch (err) {
      setIsLoading(false)
      // Handle error
      const errorMessage = err.data?.message || err.message || 'Invalid email or password. Please try again.'
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
      
      {/* Skip button */}
      <View className="absolute top-0 right-0 z-10" style={{ paddingTop: insets.top + 10, paddingRight: 20 }}>
        <TouchableOpacity onPress={async () => {
          try {
            // Save user with skipped_login flag
            await saveUser({
              id: null,
              user_id: null,
              name: 'Guest User',
              email: `guest_${Date.now()}@skip.local`,
              password: null,
              role: 'guest',
              token: null,
              email_verified: false,
              skipped_login: true,
            })
            console.log('✅ Skip login: User saved with skipped_login flag')
            
            const permissionsGranted = await arePermissionsGranted()
            if (permissionsGranted) {
              navigation.replace('tabs')
            } else {
              navigation.replace('permissions')
            }
          } catch (error) {
            console.error('Error saving skip login user:', error)
            // Still navigate even if save fails
          const permissionsGranted = await arePermissionsGranted()
          if (permissionsGranted) {
            navigation.replace('tabs')
          } else {
            navigation.replace('permissions')
            }
          }
        }}>
          <Text className="text-base font-satoshi text-buttonBackground underline">
            Skip
          </Text>
        </TouchableOpacity>
      </View>
      
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

          {/* Error message */}
          {error && (
            <View className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded">
              <Text className="text-red-400 text-sm font-satoshi">{error}</Text>
            </View>
          )}

          {/* Buttons container */}
          <View className="items-center mt-6">
            {/* Login button */}
            <TouchableOpacity 
              className="w-full py-3 items-center justify-center mb-7 bg-buttonBackground"
              onPress={handleLogin}
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#1c1c1c" />
              ) : (
              <Text className="text-xl font-satoshiMedium text-buttonText">
                Login in
              </Text>
              )}
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