import { defineConfig } from 'vite';
import eslint2 from 'vite-plugin-eslint2';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import basicSsl from '@vitejs/plugin-basic-ssl';
import babelPluginFormatjs from 'babel-plugin-formatjs';
import checker from 'vite-plugin-checker';

export default defineConfig(() => {
  return {
    build: {
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
      checker({
        typescript: true,
      }),
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
