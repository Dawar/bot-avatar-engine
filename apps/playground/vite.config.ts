import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  server: {
    allowedHosts: ['littlebot.mykiosk.app', 'littlebot-preview.mykiosk.app'],
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: '@dawartodo/bot-avatar/react',
        replacement: fileURLToPath(
          new URL('../../packages/bot-avatar/src/react.tsx', import.meta.url),
        ),
      },
      {
        find: '@dawartodo/bot-avatar',
        replacement: fileURLToPath(
          new URL('../../packages/bot-avatar/src/index.ts', import.meta.url),
        ),
      },
    ],
  },
});
