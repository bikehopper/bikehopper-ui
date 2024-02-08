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
      scale: {
        '-100': '-1', // allow flipping
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
