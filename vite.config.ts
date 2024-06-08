import { defineConfig } from 'vite';
import eslint2 from 'vite-plugin-eslint2';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import basicSsl from '@vitejs/plugin-basic-ssl';
import babelPluginFormatjs from 'babel-plugin-formatjs';

export default defineConfig(() => {
  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'maplibre-gl': ['maplibre-gl'],
            'react-map-gl': ['react-map-gl/maplibre'],
            react: ['react', 'react-dom/client', 'react-redux', 'react-intl'],
            '@nivo': ['@nivo/line'],
          },
        },
      },
      outDir: 'build',
    },
    plugins: [
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
      host: true,
      port: 3000,
      proxy: {
        '/api/v1': 'https://api-staging.bikehopper.org',
      },
    },
  };
});
