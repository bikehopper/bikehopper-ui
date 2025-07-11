import { defineConfig, loadEnv } from 'vite';
import eslint2 from 'vite-plugin-eslint2';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import basicSsl from '@vitejs/plugin-basic-ssl';
import babelPluginFormatjs from 'babel-plugin-formatjs';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const open = env.OPEN_BROWSER === 'false' ? false : true;
  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: [
              'react',
              'react/jsx-runtime',
              'react-dom/client',
              'react-redux',
              'react-intl',
            ],
            'maplibre-gl': ['maplibre-gl'],
            'react-map-gl': ['react-map-gl/maplibre'],
            '@nivo': ['@nivo/line', '@nivo/axes', '@nivo/scales'],
          },
        },
      },
      outDir: 'build',
    },
    plugins: [
      tailwindcss(),
      svgr(),
      react({
        babel: {
          plugins: [
            [
              babelPluginFormatjs,
              {
                idInterpolationPattern: '[sha512:contenthash:base64:6]',
                ast: true,
              },
            ],
          ],
        },
      }),
      eslint2(),
      basicSsl(),
    ],
    server: {
      port: 3000,
      open,
      proxy: {
        '/api/v1': 'https://api-staging.bikehopper.org',
      },
    },
    css: {
      transformer: 'lightningcss',
    },
  };
});
