import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import basicSsl from '@vitejs/plugin-basic-ssl';
import babelPluginFormatjs from 'babel-plugin-formatjs';

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
      eslint(),
      basicSsl(),
      fixRoutePathsPlugin(),
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

function fixRoutePathsPlugin() {
  // works around weird bug where paths with dots 404:
  // https://github.com/vitejs/vite/issues/2415
  // needed because our /route/*/to/*/ paths always contain dots since they contain
  // lat-lng pairs!
  return {
    name: 'fix-route-paths-plugin',
    configureServer: (server) => {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/route/')) req.url = '/';
        next();
      });
    },
  };
}
