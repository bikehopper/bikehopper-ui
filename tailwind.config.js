/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false,
  },
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bikehoppergreen: '#5aaa0a',
        bikehoppergreenlight: '#def0cc',
        bikehopperyellow: '#ffd18e',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
