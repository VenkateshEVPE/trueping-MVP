/* eslint-disable react-native/no-inline-styles */
import { View, Animated } from 'react-native'
import React, { useRef, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLinkBuilder } from '@react-navigation/native'
import { PlatformPressable } from '@react-navigation/elements'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Home from './tabs/Home'
import Wallet from './tabs/Wallet'
import LeaderBoard from './tabs/LeaderBoard'
import Settings from './tabs/Settings'
import HomeIcon from '../components/icons/HomeIcon'
import WalletIcon from '../components/icons/WalletIcon'
import ChartIcon from '../components/icons/ChartIcon'
import SettingsIcon from '../components/icons/SettingsIcon'
import { startPeriodicDataCollection, startPeriodicUploadService } from '../services/deviceDataCollector'

// Custom Tab Bar Component
function MyTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets()
  const { buildHref } = useLinkBuilder()
  
  // Calculate indicator position - exact from Figma
  const calculatePosition = (tabIndex) => {
    const iconWidth = 28.936
    const gap = 35
    const indicatorWidth = 58.851
    const padding = 25
    // Calculate center position for each icon, then offset indicator to center it
    return padding + (iconWidth + gap) * tabIndex + iconWidth / 2 - indicatorWidth / 2
  }
  
  // Initialize indicator position for Settings (index 3) - 201.93px from Figma
  const initialPosition = calculatePosition(3)
  const indicatorPosition = useRef(new Animated.Value(initialPosition)).current

  // Animate indicator when tab changes
  useEffect(() => {
    const position = calculatePosition(state.index)
    Animated.spring(indicatorPosition, {
      toValue: position,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index])

  // Render icon based on route name - using SVG icons
  const renderIcon = (routeName, isFocused) => {
    const iconSize = 28.936
    const iconColor = isFocused ? '#FF6B35' : '#9CA3AF'
    
    switch (routeName) {
      case 'Home':
        return <HomeIcon color={iconColor} size={iconSize} />
      case 'Wallet':
        return <WalletIcon color={iconColor} size={iconSize} />
      case 'LeaderBoard':
        return <ChartIcon color={iconColor} size={iconSize} />
      case 'Settings':
        return <SettingsIcon color={iconColor} size={iconSize} />
      default:
        return null
    }
  }

  return (
    <View 
      style={{ 
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: insets.bottom + 10,
      }}
    >
      <View 
        style={{
          backgroundColor: '#212322',
          borderRadius: 119.363,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 25,
          paddingVertical: 20,
          gap: 35,
          position: 'relative',
        }}
      >
        {/* Animated indicator */}
        <Animated.View
          style={{
            position: 'absolute',
            backgroundColor: '#000000',
            height: 48,
            width: 58,
            borderRadius: 25,
            left: 0,
            top: 20 + (28.936 - 48.46) / 2, // Center with icon: padding + (iconHeight - indicatorHeight) / 2
            transform: [
              { translateX: indicatorPosition },
            ],
          }}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            })
          }

          return (
            <PlatformPressable
              key={route.key}
              href={buildHref(route.name, route.params)}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                width: 28.8,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              {renderIcon(route.name, isFocused)}
            </PlatformPressable>
          )
        })}
      </View>
    </View>
  )
}

// Create Tab Navigator
const Tab = createBottomTabNavigator()

// Tab bar component reference
const CustomTabBar = (props) => <MyTabBar {...props} />

function MyTabs() {
  // Start data collection and upload services when tabs mount (user is authenticated)
  useEffect(() => {
    let dataCollectionCleanup = null
    let uploadServiceCleanup = null

    const startServices = async () => {
      try {
        console.log('🚀 Starting data collection and upload services in tabs...')
        
        // Add a delay to ensure permissions are fully processed and screen is ready
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Start periodic data collection (every 2 minutes)
        try {
          dataCollectionCleanup = startPeriodicDataCollection(120000)
          console.log('✅ Periodic device data collection started (every 2 minutes)')
        } catch (collectionError) {
          console.error('❌ Error starting periodic data collection:', collectionError)
          // Don't crash - continue with upload service
        }
        
        // Start periodic upload service (every 2 minutes)
        try {
          uploadServiceCleanup = startPeriodicUploadService(120000)
          console.log('✅ Periodic upload service started (every 2 minutes)')
        } catch (uploadError) {
          console.error('❌ Error starting periodic upload service:', uploadError)
          // Don't crash - app can still function
        }
      } catch (error) {
        console.error('❌ Error starting services in tabs:', error)
        // Don't crash the app - log and continue
      }
    }

    startServices()

    // Cleanup: Stop services when navigating away from tabs
    return () => {
      console.log('🛑 Stopping data collection and upload services (navigating away from tabs)')
      try {
        if (dataCollectionCleanup) {
          dataCollectionCleanup()
        }
        if (uploadServiceCleanup) {
          uploadServiceCleanup()
        }
      } catch (cleanupError) {
        console.error('❌ Error during cleanup:', cleanupError)
      }
    }
  }, [])

  return (
    <Tab.Navigator
      tabBar={CustomTabBar}
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Wallet" component={Wallet} />
      <Tab.Screen name="LeaderBoard" component={LeaderBoard} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  )
}

export default MyTabs
