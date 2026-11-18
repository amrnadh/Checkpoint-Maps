import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'CheckPoint Maps',
        short_name: 'CheckPoint',
        description: 'Every place you eat unlocks a piece of your city.',
        theme_color: '#F3F4EF',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: { maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 },
    }),
  ],
  server: { host: true },
});
