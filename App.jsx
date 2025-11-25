import './global.css';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './src/context/ThemeContext';
import { initDatabase, getCurrentUser } from './src/database/database';
import SplashScreen from './src/screens/SplashScreen';
import SignInPage from './src/screens/SignIn';
import SignUpPage from './src/screens/SignUp';
import ForgotPasswordPage from './src/screens/ForgotPassword';
import OTPVerificationPage from './src/screens/OTPVerification';
import ResetPasswordPage from './src/screens/ResetPassword';
import MyTabs from './src/screens/Tabs';

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const { colorScheme } = useColorScheme()
  const [isLoading, setIsLoading] = useState(true)
  const [initialRoute, setInitialRoute] = useState('signIn')
  
  // Initialize database and check for existing user on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Initialize database first
        await initDatabase()
        console.log('Database initialized successfully')
        
        // Check if user exists in database
        const currentUser = await getCurrentUser()
        
        if (currentUser && currentUser.token) {
          // User exists with token, navigate to tabs
          console.log('User found in database, navigating to tabs')
          setInitialRoute('tabs')
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
  }, [])
  
  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#e65300" />
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
