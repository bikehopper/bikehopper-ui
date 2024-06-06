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
            '@nivo': ['@nivo/core', '@nivo/line'],
            '@turf': [
              '@turf/bezier-spline',
              '@turf/boolean-point-in-polygon',
              '@turf/buffer',
              '@turf/convex',
              '@turf/distance',
              '@turf/helpers',
              '@turf/length',
              '@turf/line-slice-along',
              '@turf/meta',
              '@turf/transform-rotate',
            ],
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
      open: true,
      port: 3000,
      proxy: {
        '/api/v1': 'https://api-staging.bikehopper.org',
      },
    },
  };
});
