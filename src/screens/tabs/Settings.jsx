/* eslint-disable react-native/no-inline-styles */
import { 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  StatusBar,
  Animated,
} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import GridPatternBackground from '../../components/GridPatternBackground'
import { getCurrentUser, clearAllData, deleteUser } from '../../database/database'
import { useTheme } from '../../context/ThemeContext'

// Icons
import ProfileIcon from '../../components/icons/ProfileIcon'
import DarkModeIcon from '../../components/icons/DarkModeIcon'
import NodeActivityIcon from '../../components/icons/NodeActivityIcon'
import PrivacySupportIcon from '../../components/icons/PrivacySupportIcon'
import LogoutIcon from '../../components/icons/LogoutIcon'
import DangerIcon from '../../components/icons/DangerIcon'
import DeleteIcon from '../../components/icons/DeleteIcon'
import EditIcon from '../../components/icons/EditIcon'
import ArrowIcon from '../../components/icons/ArrowIcon'
import ATRXIcon from '../../components/icons/ATRXIcon'

// App version - could be replaced with actual build hash from native modules
const APP_VERSION = '0.9.0-beta'

// Terminal loading lines
const loadingLines = [
  { prefix: 'root@trueping:~$ ', text: 'initializing system...', delay: 150 },
  { prefix: '', text: '[OK] Loading core modules', delay: 100 },
  { prefix: '', text: '[OK] Establishing secure connection', delay: 100 },
  { prefix: '', text: '[OK] Network protocols initialized', delay: 100 },
  { prefix: '', text: '[OK] Security layer activated', delay: 100 },
  { prefix: '', text: '[OK] Encryption enabled', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'loading user data...', delay: 150 },
  { prefix: '', text: '[OK] Fetching profile information', delay: 100 },
  { prefix: '', text: '[OK] Verifying authentication', delay: 100 },
  { prefix: '', text: '[OK] Loading user preferences', delay: 100 },
  { prefix: '', text: '[OK] Initializing settings module', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'running diagnostics...', delay: 150 },
  { prefix: '', text: '> CPU: OK | Memory: OK | Network: OK', delay: 100 },
  { prefix: '', text: '> All systems operational', delay: 100 },
  { prefix: 'root@trueping:~$ ', text: 'verifying security...', delay: 150 },
  { prefix: '', text: '> SSL certificate validated', delay: 80 },
  { prefix: '', text: '> Authentication successful', delay: 80 },
  { prefix: '', text: '> Security check passed', delay: 80 },
  { prefix: 'root@trueping:~$ ', text: 'loading settings...', delay: 150 },
  { prefix: '', text: '> Loading application modules', delay: 80 },
  { prefix: '', text: '> Initializing user interface', delay: 80 },
  { prefix: '', text: '> Preparing data layer', delay: 80 },
  { prefix: '', text: '████████████████████████ 100%', delay: 100 },
  { prefix: '', text: 'System ready.', delay: 150 },
]

// Toggle Switch Component
const ToggleSwitch = ({ value, onValueChange }) => {
  return (
    <TouchableOpacity
      onPress={onValueChange}
      activeOpacity={0.8}
      style={{
        height: 24.03,
        width: 39.533,
        borderRadius: 100,
        backgroundColor: value ? '#e65300' : '#5a5a5a',
        padding: 1.55,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 20.929,
          height: 20.929,
          borderRadius: 100,
          backgroundColor: '#FFFFFF',
          alignSelf: value ? 'flex-end' : 'flex-start',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2.325 },
          shadowOpacity: 0.15,
          shadowRadius: 6.201,
          elevation: 3,
        }}
      />
    </TouchableOpacity>
  )
}

// Settings List Item Component
const SettingsItem = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  onPress, 
  rightComponent,
  showDivider = true,
  textColor = '#F6F6F6',
  iconSize = 24
}) => {
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 0,
          gap: 16,
        }}
      >
        <View style={{ width: iconSize, height: iconSize, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <Icon color={textColor} size={iconSize} />
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Satoshi-Medium',
                fontSize: 14,
                lineHeight: 21,
                color: textColor,
                letterSpacing: -0.2,
              }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={{
                  fontFamily: 'Satoshi-Medium',
                  fontSize: 10,
                  lineHeight: 15,
                  color: '#C3C3C3',
                  letterSpacing: -0.2,
                  marginTop: 0,
                }}
              >
                {subtitle}
              </Text>
            )}
          </View>
          {rightComponent}
        </View>
      </TouchableOpacity>
      {showDivider && (
        <View style={{ height: 0, width: '100%', marginVertical: 0 }}>
          <View
            style={{
              height: 1,
              width: '100%',
              backgroundColor: '#333333',
              marginVertical: -0.5,
            }}
          />
        </View>
      )}
    </>
  )
}

const Settings = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { colorScheme, toggleColorScheme } = useTheme()
  
  const [user, setUser] = useState(null)
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark')
  const [nodeActivity, setNodeActivity] = useState(true)
  const [atrxBalance] = useState('220') // This would come from a service
  const [isLoading, setIsLoading] = useState(true)
  const [displayedText, setDisplayedText] = useState('')
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const cursorOpacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    setDarkMode(colorScheme === 'dark')
  }, [colorScheme])

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      // Complete loading when data is ready (no artificial delay)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading user:', error)
      setIsLoading(false)
    }
  }

  // Terminal animation effects
  useEffect(() => {
    if (!isLoading) return

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
  }, [isLoading, fadeAnim, cursorOpacity])

  useEffect(() => {
    if (!isLoading || currentLineIndex >= loadingLines.length) {
      return
    }

    // Reset displayed text when starting a new line
    setDisplayedText('')
    
    const currentLine = loadingLines[currentLineIndex]
    const fullText = currentLine.prefix + currentLine.text
    let charIndex = 0

    const typeInterval = setInterval(() => {
      if (charIndex <= fullText.length) {
        setDisplayedText(fullText.substring(0, charIndex))
        charIndex++
      } else {
        clearInterval(typeInterval)
        setTimeout(() => {
          setCurrentLineIndex(prev => prev + 1)
        }, currentLine.delay)
      }
    }, 20)

    return () => clearInterval(typeInterval)
  }, [currentLineIndex, isLoading])

  const handleProfilePress = () => {
    // Navigate to profile screen or show profile modal
    Alert.alert('Profile', 'Profile screen coming soon')
  }

  const handleDarkModeToggle = () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    toggleColorScheme()
  }

  const handleNodeActivityToggle = () => {
    setNodeActivity(!nodeActivity)
    // Handle node activity toggle logic here
  }

  const handlePrivacySupportPress = () => {
    // Navigate to privacy and support screen
    Alert.alert('Privacy and Support', 'Privacy and Support screen coming soon')
  }

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all local data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData()
              navigation.reset({
                index: 0,
                routes: [{ name: 'signIn' }],
              })
            } catch (error) {
              console.error('Error clearing data:', error)
              Alert.alert('Error', 'Failed to clear data. Please try again.')
            }
          },
        },
      ]
    )
  }

  const handleResetNode = () => {
    Alert.alert(
      'Reset Node',
      'Are you sure you want to reset the node? This will clear all local data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData()
              Alert.alert('Success', 'Node reset successfully')
              // Optionally navigate to sign in
              navigation.reset({
                index: 0,
                routes: [{ name: 'signIn' }],
              })
            } catch (error) {
              console.error('Error resetting node:', error)
              Alert.alert('Error', 'Failed to reset node. Please try again.')
            }
          },
        },
      ]
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                await deleteUser(user.id || user.user_id)
                await clearAllData()
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'signIn' }],
                })
              }
            } catch (error) {
              console.error('Error deleting account:', error)
              Alert.alert('Error', 'Failed to delete account. Please try again.')
            }
          },
        },
      ]
    )
  }

  const handleEditAvatar = () => {
    Alert.alert('Edit Avatar', 'Avatar editing coming soon')
  }

  // Format email to show partially hidden
  const formatEmail = (email) => {
    if (!email) return 'user@example.com'
    const [localPart, domain] = email.split('@')
    if (localPart.length > 5) {
      return `${localPart.substring(0, 5)}xxxxx@${domain || 'gmail.com'}`
    }
    return email
  }


  // Render terminal loading screen
  const renderTerminalLines = () => {
    return loadingLines.slice(0, currentLineIndex).map((line, index) => {
      const fullLine = line.prefix + line.text
      return (
        <Text key={index} style={{ fontSize: 14, lineHeight: 20, fontFamily: 'monospace', color: '#E65300' }}>
          {fullLine}
        </Text>
      )
    })
  }

  // Show loading screen
  if (isLoading) {
    return (
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Animated.View 
          className="flex-1 justify-between"
          style={{ opacity: fadeAnim, paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          {/* Terminal content */}
          <View style={{ paddingHorizontal: 15, paddingTop: 15, paddingBottom: 15, flex: 1, backgroundColor: '#0a0a0a' }}>
            {renderTerminalLines()}
            {currentLineIndex < loadingLines.length && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, lineHeight: 20, fontFamily: 'monospace', color: '#E65300' }}>
                  {displayedText}
                </Text>
                <Animated.Text 
                  style={{ 
                    fontSize: 14, 
                    fontFamily: 'monospace', 
                    color: '#E65300',
                    opacity: cursorOpacity 
                  }}
                >
                  ▊
                </Animated.Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Grid Pattern Background */}
      <GridPatternBackground />
      
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 100,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={{ marginTop: 85 - insets.top, alignItems: 'center', marginBottom: 20 }}>
          <View style={{ position: 'relative', width: 62.35, height: 62.35 }}>
            {/* Avatar Image - using placeholder for now */}
            <View
              style={{
                width: 62.35,
                height: 62.35,
                borderRadius: 62.35 / 2,
                backgroundColor: '#212322',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#F6F6F6', fontSize: 24, fontFamily: 'Satoshi-Bold' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            {/* Edit Button */}
            <TouchableOpacity
              onPress={handleEditAvatar}
              activeOpacity={0.8}
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                backgroundColor: '#212322',
                borderRadius: 69.874 / 2,
                width: 28,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8.382,
              }}
            >
              <EditIcon color="#E65300" size={14} />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Info */}
        <View style={{ alignItems: 'center', marginBottom: 15 }}>
          <Text
            style={{
              fontFamily: 'Satoshi-Bold',
              fontSize: 26.821,
              lineHeight: 37.55,
              color: '#F6F6F6',
              marginBottom: 0,
            }}
          >
            {user?.name || 'User Name'}
          </Text>
          <Text
            style={{
              fontFamily: 'Satoshi-Medium',
              fontSize: 15.037,
              lineHeight: 21.05,
              color: '#B3B3B3',
            }}
          >
            {formatEmail(user?.email || 'user@example.com')}
          </Text>
        </View>

        {/* ATRX Balance Badge */}
        <View
          style={{
            backgroundColor: '#212322',
            borderRadius: 99,
            paddingHorizontal: 10,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12.769,
            marginBottom: 30,
          }}
        >
          <ATRXIcon size={22} />
          <Text
            style={{
              fontFamily: 'OffBit-101-Bold',
              fontSize: 16,
              lineHeight: 16,
              color: '#FFFFFF',
            }}
          >
            {atrxBalance} ATRX
          </Text>
        </View>

        {/* Settings Lists */}
        <View style={{ width: '100%', gap: 15, paddingHorizontal: 15 }}>
          {/* First Settings Card */}
          <View
            style={{
              backgroundColor: '#212322',
              borderRadius: 10,
              paddingVertical: 16,
              gap: 16,
            }}
          >
            <SettingsItem
              icon={ProfileIcon}
              title="Profile"
              onPress={handleProfilePress}
              iconSize={22}
              rightComponent={
                <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowIcon color="#F6F6F6" size={20} rotation={270} />
                </View>
              }
            />
            <SettingsItem
              icon={DarkModeIcon}
              title="Dark mode"
              onPress={handleDarkModeToggle}
              iconSize={22}
              rightComponent={<ToggleSwitch value={darkMode} onValueChange={handleDarkModeToggle} />}
            />
            <SettingsItem
              icon={NodeActivityIcon}
              title="Node Activity"
              onPress={handleNodeActivityToggle}
              iconSize={18}
              showDivider={false}
              rightComponent={<ToggleSwitch value={nodeActivity} onValueChange={handleNodeActivityToggle} />}
            />
          </View>

          {/* Second Settings Card */}
          <View
            style={{
              backgroundColor: '#212322',
              borderRadius: 10,
              paddingVertical: 16,
              gap: 16,
            }}
          >
            <SettingsItem
              icon={PrivacySupportIcon}
              title="Privacy and Support"
              onPress={handlePrivacySupportPress}
              iconSize={20}
              rightComponent={
                <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowIcon color="#F6F6F6" size={20} rotation={270} />
                </View>
              }
            />
            <SettingsItem
              icon={LogoutIcon}
              title="Logout"
              onPress={handleLogout}
              iconSize={22}
              showDivider={true}
            />
            <SettingsItem
              icon={DangerIcon}
              title="Danger zone"
              subtitle="Reset Node (clears local data)"
              onPress={handleResetNode}
              iconSize={22}
              showDivider={true}
            />
            <SettingsItem
              icon={DeleteIcon}
              title="Delete Account"
              onPress={handleDeleteAccount}
              iconSize={22}
              textColor="#FF0E00"
              showDivider={false}
            />
          </View>
        </View>

        {/* App Version and Copyright */}
        <View
          style={{
            marginTop: 30,
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              fontFamily: 'Satoshi-Medium',
              fontSize: 14,
              lineHeight: 21,
              color: '#54565A',
              letterSpacing: -0.2,
              textAlign: 'center',
            }}
          >
            App Version, Build Hash (e.g. {APP_VERSION})
          </Text>
          <Text
            style={{
              fontFamily: 'Satoshi-Medium',
              fontSize: 14,
              lineHeight: 21,
              color: '#54565A',
              letterSpacing: -0.2,
              textAlign: 'center',
            }}
          >
            "Authra Technologies FZ-LLC © 2025"
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default Settings
