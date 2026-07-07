/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        night: {
          900: '#050505',
          800: '#0a0a0a',
          700: '#121212',
          600: '#1a1a1a',
          500: '#222222',
          400: '#2a2a2a',
        },
        neon: {
          light: '#7fff00',
          DEFAULT: '#00ff41',
          dark: '#00cc33',
          deep: '#003d00',
        },
        matrix: {
          100: '#e0ffe0',
          200: '#a0ffa0',
          300: '#50ff50',
          400: '#00ff41',
          500: '#00cc33',
          600: '#009926',
          700: '#006619',
          800: '#003d00',
          900: '#001a00',
        },
        alien: {
          amber: '#ffb300',
          red: '#ff3355',
          silver: '#e0e0e0',
          gray: '#a0a0a0',
          dim: '#666666',
        },
      },
      fontFamily: {
        mono: ['"Cascadia Code"', '"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['"Segoe UI"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-neon': 'pulse-neon 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'twinkle': 'twinkle 4s ease-in-out infinite',
        'beam': 'beam 3s ease-in-out infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(0, 255, 65, 0.3))' },
          '50%': { filter: 'drop-shadow(0 0 12px rgba(0, 255, 65, 0.8))' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
        'beam': {
          '0%, 100%': { opacity: '0.3', transform: 'scaleY(0.95)' },
          '50%': { opacity: '0.7', transform: 'scaleY(1.05)' },
        },
        'scan': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 255, 65, 0.15)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 255, 65, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
