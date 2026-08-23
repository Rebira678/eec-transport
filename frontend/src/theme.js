import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#090d16',
        color: '#f3f4f6',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      },
    },
  },
  colors: {
    brand: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    dark: {
      bg: '#090d16',
      card: '#111827',
      sidebar: '#0b1120',
      border: 'rgba(255, 255, 255, 0.08)',
    }
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'blue.400',
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'blue.400',
      },
    },
  },
});

export default theme;
