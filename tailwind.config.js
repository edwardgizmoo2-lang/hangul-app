/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#121214',
          surface: '#1a1a1e',
          surfaceHover: '#222226',
          border: '#2a2a2e',
        },
        accent: {
          purple: '#a855f7',
          purpleHover: '#9333ea',
          green: '#10b981',
          greenHover: '#059669',
          blue: '#3b82f6',
          blueHover: '#2563eb',
          red: '#ef4444',
          redHover: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        hangul: ['Noto Sans KR', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}