import { View, Text, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'

const terminalLines = [
  { prefix: 'root@trueping:~$ ', text: 'initializing system...', delay: 500 },
  { prefix: '', text: '[OK] Loading core modules', delay: 300 },
  { prefix: '', text: '[OK] Establishing secure connection', delay: 300 },
  { prefix: '', text: '[OK] Network protocols initialized', delay: 300 },
  { prefix: '', text: '[OK] Security layer activated', delay: 300 },
  { prefix: '', text: '[OK] Encryption enabled', delay: 300 },
  { prefix: 'root@trueping:~$ ', text: 'scanning network...', delay: 500 },
  { prefix: '', text: '> Analyzing network topology', delay: 250 },
  { prefix: '', text: '> Target acquired', delay: 200 },
  { prefix: '', text: '> Firewall bypassed', delay: 200 },
  { prefix: '', text: '> Access granted', delay: 200 },
  { prefix: '', text: '> Connection established', delay: 200 },
  { prefix: 'root@trueping:~$ ', text: 'running diagnostics...', delay: 500 },
  { prefix: '', text: '> CPU: 100% | Memory: 85% | Network: OK', delay: 300 },
  { prefix: '', text: '> All systems operational', delay: 300 },
  { prefix: 'root@trueping:~$ ', text: 'verifying security...', delay: 500 },
  { prefix: '', text: '> SSL certificate validated', delay: 250 },
  { prefix: '', text: '> Authentication successful', delay: 250 },
  { prefix: '', text: '> Security check passed', delay: 250 },
  { prefix: 'root@trueping:~$ ', text: 'launching trueping...', delay: 500 },
  { prefix: '', text: '> Loading application modules', delay: 200 },
  { prefix: '', text: '> Initializing user interface', delay: 200 },
  { prefix: '', text: '> Preparing data layer', delay: 200 },
  { prefix: '', text: '████████████████████████ 100%', delay: 300 },
  { prefix: '', text: 'System ready.', delay: 500 },
]

const SplashScreen = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [displayedText, setDisplayedText] = useState('')
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const cursorOpacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()

    // Cursor blink animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (currentLineIndex >= terminalLines.length) {
      // All lines displayed, navigate after a short delay
      setTimeout(() => {
        navigation.replace('signIn')
      }, 1000)
      return
    }

    const currentLine = terminalLines[currentLineIndex]
    const fullText = currentLine.prefix + currentLine.text
    let charIndex = 0

    const typeInterval = setInterval(() => {
      if (charIndex <= fullText.length) {
        setDisplayedText(fullText.substring(0, charIndex))
        charIndex++
      } else {
        clearInterval(typeInterval)
        // Move to next line after delay
        setTimeout(() => {
          setCurrentLineIndex(prev => prev + 1)
        }, currentLine.delay)
      }
    }, 30) // Typing speed

    return () => clearInterval(typeInterval)
  }, [currentLineIndex, navigation])

  const renderDisplayedLines = () => {
    return terminalLines.slice(0, currentLineIndex).map((line, index) => {
      const fullLine = line.prefix + line.text
      return (
        <Text key={index} className="text-sm leading-5 font-mono text-terminalText dark:text-[#a0a0a0]">
          {fullLine}
        </Text>
      )
    })
  }

  return (
    <View className="flex-1 bg-background dark:bg-black">
      <Animated.View 
        className="flex-1 justify-between"
        style={{ opacity: fadeAnim, paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* Terminal content */}
        <View className="px-[15px] pt-[15px] pb-[15px] flex-1 bg-terminalContent dark:bg-[#0a0a0a]">
          {renderDisplayedLines()}
          {currentLineIndex < terminalLines.length && (
            <View className="flex-row items-center">
              <Text className="text-sm leading-5 font-mono text-terminalText dark:text-[#a0a0a0]">{displayedText}</Text>
              <Animated.Text 
                className="text-sm font-mono text-terminalText dark:text-[#a0a0a0]"
                style={{ opacity: cursorOpacity }}
              >
                ▊
              </Animated.Text>
            </View>
          )}
        </View>

        {/* Logo */}
        <View className="items-center justify-center py-[30px] px-[15px] w-full bg-terminalContent dark:bg-[#0a0a0a]">
          <View className="items-center">
            {/* eslint-disable-next-line react-native/no-inline-styles */}
            <Text className="text-xs leading-4 font-mono text-left text-terminalText dark:text-[#a0a0a0]" style={{ includeFontPadding: false }}>
              ╔════════════════════════════╗
            </Text>
            {/* eslint-disable-next-line react-native/no-inline-styles */}
            <Text className="text-xs leading-4 font-mono text-left text-terminalText dark:text-[#a0a0a0]" style={{ includeFontPadding: false }}>
               ║        TRUEPING          ║ 
            </Text>
            {/* eslint-disable-next-line react-native/no-inline-styles */}
            <Text className="text-xs leading-4 font-mono text-left text-terminalText dark:text-[#a0a0a0]" style={{ includeFontPadding: false }}>
              ╚════════════════════════════╝
            </Text>
          </View>
          <View className="mt-[15px] items-center">
            <Text className="text-[10px] font-mono text-center tracking-[2px] text-terminalText dark:text-[#a0a0a0]">
              [ SECURE NETWORK ACCESS ]
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

export default SplashScreen

