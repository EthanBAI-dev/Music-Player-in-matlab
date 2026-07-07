/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#050505',
          800: '#0a0a0a',
          700: '#121212',
          600: '#1a1a1a',
          500: '#222222',
          400: '#2a2a2a',
        },
        copper: {
          50: '#faf5ef',
          100: '#f0e4d4',
          200: '#e0c9b0',
          300: '#d0ae8c',
          400: '#c4956a',
          DEFAULT: '#c4956a',
          500: '#b07d52',
          600: '#8c6340',
          700: '#68492e',
          800: '#44301c',
          900: '#20170a',
          deep: '#4a3420',
        },
        warm: {
          white: '#d4cfc8',
          silver: '#b0a9a0',
          gray: '#8a857e',
          dim: '#666360',
          dark: '#444240',
        },
        signal: {
          red: '#ff3355',
          amber: '#ffb300',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"Cascadia Code"', '"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'twinkle': 'twinkle 4s ease-in-out infinite',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
