/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'offBit': ['OffBitTrial-Regular'],
        'offBitBold': ['OffBitTrial-Bold'],
        'offBit101': ['OffBitTrial-101'],
        'offBit101Bold': ['OffBitTrial-101Bold'],
        'offBitDot': ['OffBitTrial-Dot'],
        'offBitDotBold': ['OffBitTrial-DotBold'],
        'satoshi': ['Satoshi-Regular'],
        'satoshiLight': ['Satoshi-Light'],
        'satoshiMedium': ['Satoshi-Medium'],
        'satoshiBold': ['Satoshi-Bold'],
        'satoshiBlack': ['Satoshi-Black'],
      },
      colors: {
        // Custom theme colors - use with dark: variants in classes
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#1c1c1c',
        textSecondary: '#54565a',
        textTertiary: '#808080',
        inputBackground: '#f0f0f0',
        inputBorder: '#e0e0e0',
        buttonBackground: '#c4beb6',
        buttonText: '#1c1c1c',
        primary: '#c4beb6',
        secondary: '#212322',
        terminalBackground: '#f5f5f5',
        terminalContent: '#ffffff',
        terminalText: '#333333',
        gridPattern: '#e0e0e0',
      },
    },
  },
  plugins: [],
}

