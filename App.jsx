import './global.css';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'nativewind';
import { ThemeProvider } from './src/context/ThemeContext';
import SplashScreen from './src/screens/SplashScreen';
import SignInPage from './src/screens/SignIn';
import SignUpPage from './src/screens/SignUp';

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const { colorScheme } = useColorScheme()
  
  return (
    <>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colorScheme === 'dark' ? '#000000' : '#ffffff'} 
      />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="signIn">
          <Stack.Screen name="splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="signIn" component={SignInPage} options={{ headerShown: false }} />
          <Stack.Screen name="signUp" component={SignUpPage} options={{ headerShown: false }} />
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
