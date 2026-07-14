/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Sri Vidya Peetham brand palette (saffron / maroon / gold)
        primary: {
          DEFAULT: '#E8751A',
          dark: '#C25010',
          light: '#FBE7D3',
          foreground: '#FFFFFF',
        },
        maroon: '#7A1F1F',
        gold: '#E6A419',
      },
    },
  },
  plugins: [],
};
