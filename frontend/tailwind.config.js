/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dickens: {
          green: '#1A3A32',
          gold: '#8B864E',
          cream: '#F5F5F5',
          brown: '#5D4037',
          red: '#632626',
        }
      },
      fontFamily: {
        gothic: ['UnifrakturMaguntia', 'cursive'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
