import { defineConfig } from '@vite-pwa/assets-generator/config';

// Generates the home screen icons for iOS and Android from
// public/bikehopper-icon.svg. Run `npm run generate-icons` after editing the
// SVG.
//
// iOS gives web apps no way to supply separate dark/tinted/clear icons; it
// derives them from the single apple-touch-icon based on brightness. Keeping
// the bike white (the brightest element) is what makes those modes look right.
const green = '#5aaa0a';

export default defineConfig({
  preset: {
    // The default palette quantization leaves only a handful of colors and
    // makes the bike's edges jagged.
    png: { compressionLevel: 9, palette: false },
    // Plain manifest icons. The SVG is already a full-bleed green square.
    transparent: {
      sizes: [192, 512],
      padding: 0,
    },
    // Android adaptive icon: shrink the bike into the 80% safe-zone circle.
    maskable: {
      sizes: [512],
      padding: 0.2,
      resizeOptions: { background: green },
    },
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { background: green },
    },
  },
  images: ['public/bikehopper-icon.svg'],
});
