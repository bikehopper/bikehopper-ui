/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bikehoppergreen: '#5aaa0a',
        bikehopperyellow: '#ffd18e',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
