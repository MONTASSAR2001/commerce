/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rawline: {
          black: '#111111',
          dark: '#0E0E10',
          red: '#EA301F',
          bone: '#FFFFE3',
          muted: '#787878',
          slate: '#8E8E93',
        }
      },
      fontFamily: {
        azeret: ['Azeret Mono', 'monospace', 'sans-serif'],
        'serif-italic': ['Source Serif 4', 'Georgia', 'serif'],
        'source-serif': ['Source Serif 4', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Azeret Mono', 'ui-monospace', 'monospace']
      },
      keyframes: {
        tickerVertical: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' }
        },
        marqueeHorizontal: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      },
      animation: {
        'ticker-vertical': 'tickerVertical 20s linear infinite',
        'marquee-horizontal': 'marqueeHorizontal 25s linear infinite'
      }
    },
  },
  plugins: [],
}

