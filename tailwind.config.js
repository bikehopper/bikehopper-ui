/** @type {import('tailwindcss').Config} */
import typographyPlugin from '@tailwindcss/typography';

export default {
  corePlugins: {
    preflight: false,
  },
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bikehoppergreen: '#5aaa0a',
        bikehoppergreenlight: '#def0cc',
        bikehopperyellow: '#ffd18e',
        bikeinfragreen: '#438601',
      },
      scale: {
        '-100': '-1', // allow flipping
      },
    },
  },
  plugins: [typographyPlugin],
};
