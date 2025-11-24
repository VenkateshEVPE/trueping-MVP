import { useTheme } from '../context/ThemeContext'

/**
 * Hook that returns theme color values for use in NativeWind arbitrary values
 * Usage: className={`bg-[${themeClasses.bg}]`}
 */
export const useThemeClasses = () => {
  const { theme } = useTheme()

  return {
    bg: theme.background,
    bgSurface: theme.surface,
    bgInput: theme.inputBackground,
    bgButton: theme.buttonBackground,
    bgTerminal: theme.terminalBackground,
    bgTerminalContent: theme.terminalContent,
    
    text: theme.text,
    textSecondary: theme.textSecondary,
    textTertiary: theme.textTertiary,
    textButton: theme.buttonText,
    textTerminal: theme.terminalText,
    
    borderInput: theme.inputBorder,
    border: theme.inputBorder,
  }
}

