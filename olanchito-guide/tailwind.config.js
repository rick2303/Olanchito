/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jungle': {
          50: '#f2fbf8',
          100: '#d4f3e9',
          200: '#a8e7d3',
          300: '#75d3b7',
          400: '#42aa8f',
          500: '#2f9d82',
          600: '#237e6a',
          700: '#206557',
          800: '#1e5147',
          900: '#1d443d',
          950: '#0b2823',
        },
      },
    },
  },
  plugins: [],
}
