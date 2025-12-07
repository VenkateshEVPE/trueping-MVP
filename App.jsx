import './global.css';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './src/context/ThemeContext';
import { initDatabase, getCurrentUser, arePermissionsGranted, startDailyUptimeTracking, updateDailyUptime } from './src/database/database';
import { startBackgroundService, isBackgroundServiceRunning } from './src/services/BackgroundLocationService';
import SplashScreen from './src/screens/SplashScreen';
import SignInPage from './src/screens/SignIn';
import SignUpPage from './src/screens/SignUp';
import ForgotPasswordPage from './src/screens/ForgotPassword';
import OTPVerificationPage from './src/screens/OTPVerification';
import ResetPasswordPage from './src/screens/ResetPassword';
import PermissionsScreen from './src/screens/PermissionsScreen';
import MyTabs from './src/screens/Tabs';

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const { colorScheme } = useColorScheme()
  const [isLoading, setIsLoading] = useState(true)
  const [initialRoute, setInitialRoute] = useState('signIn')
  
  // Initialize database and check for existing user on app start
  useEffect(() => {
    let dailyUptimeInterval = null

    const checkAuthStatus = async () => {
      try {
        // Initialize database (includes device_data table)
        await initDatabase()
        console.log('Database initialized successfully')
        
        // Start daily uptime tracking
        await startDailyUptimeTracking()
        
        // Update daily uptime every minute while app is running
        dailyUptimeInterval = setInterval(async () => {
          await updateDailyUptime()
        }, 60000) // Update every 1 minute
        
        // Check if user exists in database
        const currentUser = await getCurrentUser()
        
        if (currentUser) {
          // Check if user skipped login (now boolean)
          if (currentUser.skipped_login === true || currentUser.skipped_login === 1) {
            console.log('User skipped login, checking permissions...')
            const permissionsGranted = await arePermissionsGranted()
            if (permissionsGranted) {
              console.log('Skipped login user found, permissions granted, navigating to tabs')
              
              // Start background service (data collection will start in tabs screen)
              try {
                const isRunning = await isBackgroundServiceRunning()
                if (!isRunning) {
                  console.log('📍 Starting BackgroundLocationService from App.jsx...')
                  await startBackgroundService(false) // Don't show alerts
                  // Give service a moment to initialize
                  await new Promise(resolve => setTimeout(resolve, 1000))
                } else {
                  console.log('✅ BackgroundLocationService already running')
                }
              } catch (serviceError) {
                console.warn('⚠️ Failed to start BackgroundLocationService in App.jsx:', serviceError.message)
                // Continue anyway - service will start when Home screen loads
              }
              
              setInitialRoute('tabs')
            } else {
              console.log('Skipped login user found, permissions not granted, navigating to permissions')
              setInitialRoute('permissions')
            }
          } else if (currentUser.token) {
            // User exists with token, check permissions
            const permissionsGranted = await arePermissionsGranted()
            if (permissionsGranted) {
              console.log('User found in database, permissions granted, navigating to tabs')
              
              // Start background service (data collection will start in tabs screen)
              try {
                const isRunning = await isBackgroundServiceRunning()
                if (!isRunning) {
                  console.log('📍 Starting BackgroundLocationService from App.jsx...')
                  await startBackgroundService(false) // Don't show alerts
                  // Give service a moment to initialize
                  await new Promise(resolve => setTimeout(resolve, 1000))
                } else {
                  console.log('✅ BackgroundLocationService already running')
                }
              } catch (serviceError) {
                console.warn('⚠️ Failed to start BackgroundLocationService in App.jsx:', serviceError.message)
                // Continue anyway - service will start when Home screen loads
              }
              
              setInitialRoute('tabs')
            } else {
              console.log('User found in database, permissions not granted, navigating to permissions')
              setInitialRoute('permissions')
            }
          } else {
            // User exists but no token, go to sign in
            console.log('User found but no token, navigating to sign in')
            setInitialRoute('signIn')
          }
        } else {
          // No user found, go to sign in
          console.log('No user found in database, navigating to sign in')
          setInitialRoute('signIn')
        }
      } catch (error) {
        console.error('Failed to initialize database or check auth:', error)
        // On error, default to sign in screen
        setInitialRoute('signIn')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuthStatus()

    // Cleanup function
    return () => {
      if (dailyUptimeInterval) {
        clearInterval(dailyUptimeInterval)
      }
    }
  }, [])
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
      </View>
    )
  }
  
  return (
    <>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colorScheme === 'dark' ? '#000000' : '#ffffff'} 
      />
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen name="splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="signIn" component={SignInPage} options={{ headerShown: false }} />
          <Stack.Screen name="signUp" component={SignUpPage} options={{ headerShown: false }} />
          <Stack.Screen name="forgotPassword" component={ForgotPasswordPage} options={{ headerShown: false }} />
          <Stack.Screen name="otpVerification" component={OTPVerificationPage} options={{ headerShown: false }} />
          <Stack.Screen name="resetPassword" component={ResetPasswordPage} options={{ headerShown: false }} />
          <Stack.Screen name="permissions" component={PermissionsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="tabs" component={MyTabs} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  )
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
