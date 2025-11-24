/* eslint-disable react-native/no-inline-styles */
import { View, Text, TextInput, TouchableOpacity, ScrollView, Keyboard, Animated, Modal, ActivityIndicator } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { BlurView } from '@react-native-community/blur'
import GridPatternBackground from '../components/GridPatternBackground'
import { signUp } from '../services/auth/auth'

const SignUp = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [showBackArrow, setShowBackArrow] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const scrollViewRef = useRef(null)
  const emailInputRef = useRef(null)
  const emailContainerRef = useRef(null)
  const passwordInputRef = useRef(null)
  const passwordContainerRef = useRef(null)
  const confirmPasswordInputRef = useRef(null)
  const confirmPasswordContainerRef = useRef(null)
  const originalScrollY = useRef(0)
  const currentScrollY = useRef(0)
  const focusedFieldRef = useRef(null) // Track which field is focused
  const lastScrollY = useRef(0)
  const backArrowOpacity = useRef(new Animated.Value(1)).current
  const modalOpacity = useRef(new Animated.Value(0)).current
  const modalTranslateY = useRef(new Animated.Value(50)).current

  // Email validation function
  const isValidEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue)
  }

  const isEmailValid = isValidEmail(email)

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

  // Handle keyboard show/hide events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true)
      // Scroll to focused field when keyboard appears
      if (focusedFieldRef.current && scrollViewRef.current) {
        setTimeout(() => {
          if (scrollViewRef.current && focusedFieldRef.current) {
            // Try to measure and scroll to the focused field
            focusedFieldRef.current.measureLayout(
              scrollViewRef.current,
              (x, y, width, height) => {
                // Scroll to show the field with some padding from top
                const scrollY = Math.max(0, y - 130) // 130px padding from top
                scrollViewRef.current?.scrollTo({
                  y: scrollY,
                  animated: true,
                })
                // Update current scroll position
                currentScrollY.current = scrollY
                lastScrollY.current = scrollY
              },
              () => {
                // Fallback: scroll to end if measure fails (for lower fields)
                scrollViewRef.current?.scrollToEnd({ animated: true })
                // Update scroll position after scrolling
                setTimeout(() => {
                  if (scrollViewRef.current) {
                    scrollViewRef.current.measure((x, y, width, height, pageX, pageY) => {
                      // This is a workaround - we'll update on next scroll event
                    })
                  }
                }, 100)
              }
            )
          }
        }, 150) // Increased timeout to ensure layout is ready
      }
    })
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false)
      // Scroll to top when keyboard hides
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: 0,
            animated: true,
          })
          // Update scroll position tracking
          currentScrollY.current = 0
          lastScrollY.current = 0
          originalScrollY.current = 0
        }
      }, 100)
    })

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  // Generic field focus handler
  const handleFieldFocus = (containerRef) => {
    // Store current scroll position before keyboard appears
    originalScrollY.current = currentScrollY.current
    // Mark which field is focused
    focusedFieldRef.current = containerRef.current
  }

  // Generic field blur handler
  const handleFieldBlur = () => {
    focusedFieldRef.current = null
    // Show back arrow when field loses focus (if keyboard is not visible)
    if (!isKeyboardVisible && !showBackArrow) {
      setShowBackArrow(true)
      Animated.timing(backArrowOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }

  // Handle email field focus
  const handleEmailFocus = () => {
    handleFieldFocus(emailContainerRef)
    // Hide back arrow when email field is focused
    if (showBackArrow) {
      setShowBackArrow(false)
      Animated.timing(backArrowOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
    // Force scroll for email field
    setTimeout(() => {
      if (emailContainerRef.current && scrollViewRef.current) {
        emailContainerRef.current.measureLayout(
          scrollViewRef.current,
          (x, y, width, height) => {
            const scrollY = Math.max(0, y - 130)
            scrollViewRef.current?.scrollTo({
              y: scrollY,
              animated: true,
            })
            currentScrollY.current = scrollY
            lastScrollY.current = scrollY
          },
          () => {
            // Fallback scroll
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        )
      }
    }, 200)
  }

  // Handle password field focus
  const handlePasswordFocus = () => {
    handleFieldFocus(passwordContainerRef)
  }

  // Handle confirm password field focus
  const handleConfirmPasswordFocus = () => {
    handleFieldFocus(confirmPasswordContainerRef)
    // Force scroll for confirm password field
    setTimeout(() => {
      if (confirmPasswordContainerRef.current && scrollViewRef.current) {
        confirmPasswordContainerRef.current.measureLayout(
          scrollViewRef.current,
          (x, y, width, height) => {
            const scrollY = Math.max(0, y - 130)
            scrollViewRef.current?.scrollTo({
              y: scrollY,
              animated: true,
            })
            currentScrollY.current = scrollY
            lastScrollY.current = scrollY
          },
          () => {
            // Fallback scroll to end
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        )
      }
    }, 200)
  }

  // Handle create account
  const handleCreateAccount = async () => {
    // Validate form
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    
    if (!isEmailValid) {
      setError('Please enter a valid email address')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }

    setIsLoading(true)
    setError(null)
    Keyboard.dismiss()

    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password: password,
        role: 'contributor',
      })
      
      // Success - show success modal
      setIsLoading(false)
      setShowSuccessModal(true)
    } catch (err) {
      setIsLoading(false)
      // Handle error
      const errorMessage = err.data?.message || err.message || 'Something went wrong. Please try again.'
      setError(errorMessage)
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
    <View className="flex-1 bg-background dark:bg-black">
      {/* Grid pattern background with gradient overlay */}
      <GridPatternBackground />
      
      {/* Back button */}
      <Animated.View
        className="absolute left-5 items-center justify-center z-[9999]"
        style={{ 
          top: insets.top + 10,
          opacity: backArrowOpacity,
          width: 44,
          height: 50,
          overflow: 'visible',
        }}
        pointerEvents={showBackArrow ? 'auto' : 'none'}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="w-full h-full items-center justify-center"
          style={{ paddingTop: 2 }}
        >
          <Text className="text-[40px] text-text dark:text-white" style={{ lineHeight: 40 }}>←</Text>
        </TouchableOpacity>
      </Animated.View>
      
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ 
          paddingTop: insets.top, 
          paddingBottom: insets.bottom + 400,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
        scrollEnabled={isKeyboardVisible}
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y
          // Always track current scroll position
          currentScrollY.current = scrollY
          // Store scroll position when keyboard is not visible
          if (!isKeyboardVisible) {
            originalScrollY.current = scrollY
          }
          
          // Detect scroll direction and show/hide back arrow
          const scrollDifference = scrollY - lastScrollY.current
          const threshold = 10 // Minimum scroll distance to trigger hide/show
          
          if (Math.abs(scrollDifference) > threshold) {
            if (scrollDifference > 0 && scrollY > 50) {
              // Scrolling down - hide arrow
              if (showBackArrow) {
                setShowBackArrow(false)
                Animated.timing(backArrowOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start()
              }
            } else if (scrollDifference < 0) {
              // Scrolling up - show arrow
              if (!showBackArrow) {
                setShowBackArrow(true)
                Animated.timing(backArrowOpacity, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }).start()
              }
            }
          }
          
          lastScrollY.current = scrollY
        }}
        scrollEventThrottle={16}
      >
        {/* Main content */}
        <View className="flex-1 px-5 pt-[20%]">
          {/* Title */}
          <View className="mt-8 mb-8">
            <Text className="text-[40px] leading-[50px] font-satoshi text-text dark:text-white">
              Create your
            </Text>
            <Text className="text-[40px] leading-[50px] font-satoshi text-text dark:text-white">
              Account
            </Text>
          </View>

          {/* Form container */}
          <View className="mb-6">
            {/* Name container */}
            <View className="mb-6">
              <Text className="text-xl mb-2 font-satoshi text-text dark:text-white">
                Name
              </Text>
              <TextInput
                className="h-[49px] px-3 text-base border font-satoshi bg-inputBackground dark:bg-[#212322] border-inputBorder dark:border-black text-text dark:text-white"
                placeholder="Enter your name here"
                placeholderTextColor="#54565a"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Email container */}
            <View ref={emailContainerRef} className="mb-6">
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
                  onFocus={handleEmailFocus}
                  onBlur={handleFieldBlur}
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
            <View ref={passwordContainerRef} className="mb-6">
              <Text className="text-xl mb-2 font-satoshi text-text dark:text-white">
                Password
              </Text>
              <TextInput
                ref={passwordInputRef}
                className="h-[49px] px-3 text-base border font-satoshi bg-inputBackground dark:bg-[#212322] border-inputBorder dark:border-black text-text dark:text-white"
                placeholder="Enter your password here"
                placeholderTextColor="#54565a"
                value={password}
                onChangeText={setPassword}
                onFocus={handlePasswordFocus}
                onBlur={handleFieldBlur}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Confirm password container */}
            <View ref={confirmPasswordContainerRef} className="mb-6">
              <Text className="text-xl mb-2 font-satoshi text-text dark:text-white">
                Re-enter your password
              </Text>
              <TextInput
                ref={confirmPasswordInputRef}
                className="h-[49px] px-3 text-base border font-satoshi bg-inputBackground dark:bg-[#212322] border-inputBorder dark:border-black text-text dark:text-white"
                placeholder="Enter your password here"
                placeholderTextColor="#54565a"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={handleConfirmPasswordFocus}
                onBlur={handleFieldBlur}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Error message */}
          {error && (
            <View className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded">
              <Text className="text-red-400 text-sm font-satoshi">{error}</Text>
            </View>
          )}

          {/* Terms and conditions checkbox */}
          <View className="flex-row items-start mb-8">
            <TouchableOpacity
              onPress={() => {
                setAgreeToTerms(!agreeToTerms)
                setError(null)
              }}
              className="w-[21px] h-[21px] mr-4 mt-1 border items-center justify-center bg-inputBackground dark:bg-[#212322] border-text dark:border-white"
            >
              {agreeToTerms && (
                <Text className="text-xs text-text dark:text-white">✓</Text>
              )}
            </TouchableOpacity>
            <Text className="flex-1 text-xs leading-4 font-satoshi text-text dark:text-white">
              By signing up you agree to the terms and conditions of the service and privacy policy
            </Text>
          </View>

          {/* Create account button */}
          <TouchableOpacity 
            className="w-full py-3 items-center justify-center bg-buttonBackground"
            onPress={handleCreateAccount}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#1c1c1c" />
            ) : (
              <Text className="text-xl font-satoshiMedium text-buttonText">
                Create account
              </Text>
            )}
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
                  Congratulations.
                </Text>
                <Text className="text-xl font-satoshi text-white">
                  Your account has been successfully set up.
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
    </View>
  )
}

export default SignUp

