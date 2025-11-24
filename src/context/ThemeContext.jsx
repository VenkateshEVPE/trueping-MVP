import React, { createContext, useContext } from 'react'
import { useColorScheme } from 'nativewind'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme()

  return (
    <ThemeContext.Provider value={{ 
      colorScheme, 
      setColorScheme, 
      toggleColorScheme,
      themeMode: colorScheme,
      toggleTheme: toggleColorScheme,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

