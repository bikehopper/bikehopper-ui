/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bikehoppergreen: '#5aaa0a',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
