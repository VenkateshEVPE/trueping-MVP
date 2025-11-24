/* eslint-disable react-native/no-inline-styles */
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal, Animated, Keyboard } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { BlurView } from '@react-native-community/blur'
import GridPatternBackground from '../components/GridPatternBackground'

const ResetPassword = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  const modalOpacity = useRef(new Animated.Value(0)).current
  const modalTranslateY = useRef(new Animated.Value(50)).current
  const newPasswordInputRef = useRef(null)

  // Auto-focus new password input when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      newPasswordInputRef.current?.focus()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Password validation
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0
  const isSubmitEnabled = passwordsMatch && newPassword.length >= 6

  // Hide keyboard when submit button becomes enabled
  useEffect(() => {
    if (isSubmitEnabled) {
      Keyboard.dismiss()
    }
  }, [isSubmitEnabled])

  // Reset modal animations when modal becomes visible
  useEffect(() => {
    if (showSuccessModal) {
      modalOpacity.setValue(0)
      modalTranslateY.setValue(50)
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(modalTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccessModal])

  const handleSubmit = () => {
    if (isSubmitEnabled) {
      // Dismiss keyboard before showing modal
      Keyboard.dismiss()
      // Show success modal
      setShowSuccessModal(true)
    }
  }

  // Handle continue button
  const handleContinue = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false)
      navigation.navigate('signIn')
    })
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background dark:bg-black"
    >
      {/* Grid pattern background with gradient overlay */}
      <GridPatternBackground />
      
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
          <View className="mb-8 mt-8">
            <Text className="text-[40px] leading-[50px] font-satoshi text-text dark:text-white">
              Re-set password
            </Text>
          </View>

          {/* Password Form */}
          <View className="mb-6">
            {/* New Password container */}
            <View className="mb-6">
              <Text className="text-xl mb-2 font-satoshi text-text dark:text-white">
                New password
              </Text>
              <TextInput
                ref={newPasswordInputRef}
                className="h-[49px] px-3 text-base border font-satoshi bg-inputBackground dark:bg-[#212322] border-inputBorder dark:border-black text-text dark:text-white"
                placeholder="Enter your new password here"
                placeholderTextColor="#54565a"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Confirm Password container */}
            <View className="mb-6">
              <Text className="text-xl mb-2 font-satoshi text-text dark:text-white">
                Confirm your new password
              </Text>
              <TextInput
                className="h-[49px] px-3 text-base border font-satoshi bg-inputBackground dark:bg-[#212322] border-inputBorder dark:border-black text-text dark:text-white"
                placeholder="Re-enter your new password here"
                placeholderTextColor="#54565a"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity 
            className="w-full py-3 items-center justify-center bg-buttonBackground mt-auto"
            onPress={handleSubmit}
            disabled={!isSubmitEnabled}
            style={{ opacity: isSubmitEnabled ? 1 : 0.5 }}
          >
            <Text className="text-xl font-satoshiMedium text-buttonText">
              Submit
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View className="flex-1">
          {/* Backdrop with Blur */}
          <Animated.View 
            className="absolute inset-0"
            style={{ opacity: modalOpacity }}
          >
            <BlurView
              style={{ flex: 1 }}
              blurType="dark"
              blurAmount={10}
              reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.72)"
            />
          </Animated.View>
          
          {/* Modal Container at Bottom */}
          <View className="flex-1 justify-end pb-8 px-5">
            <Animated.View
              className="bg-[#212322] rounded-[10px] w-full p-6"
              style={{
                transform: [{ translateY: modalTranslateY }],
                opacity: modalOpacity,
              }}
            >
              {/* Message Container */}
              <View className="mb-6">
                <Text className="text-[32px] leading-[50px] font-satoshi text-white mb-4">
                  Password reset successful.
                </Text>
                <Text className="text-xl font-satoshi text-white">
                  Your password has been successfully updated.
                </Text>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                className="bg-buttonBackground rounded-[5px] py-3 items-center justify-center"
                onPress={handleContinue}
              >
                <Text className="text-xl font-satoshiMedium text-black">
                  Continue
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

export default ResetPassword

