/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6B21A8',
          800: '#6B21A8',
          900: '#5B218A'
        },
        pressure: {
          high: '#ef4444',
          medium: '#f59e0b',
          low: '#10b981',
          verylow: '#3b82f6'
        },
        critical: '#dc2626',
        warning: '#ea580c',
        info: '#2563eb'
      }
    }
  },
  plugins: [],
}
