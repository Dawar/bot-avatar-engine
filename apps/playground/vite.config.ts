import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
const librarySource = fileURLToPath(new URL('../../packages/bot-avatar/src/', import.meta.url));
export default defineConfig({
  server: {
    allowedHosts: ['littlebot.mykiosk.app', 'littlebot-preview.mykiosk.app'],
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'refresh-avatar-engine',
      apply: 'serve',
      hotUpdate({ file, modules }) {
        if (!file.startsWith(librarySource)) return;
        // Controllers live outside React; Fast Refresh can preserve the old sampler.
        for (const module of modules) this.environment.moduleGraph.invalidateModule(module);
        this.environment.hot.send({ type: 'full-reload' });
        return [];
      },
    },
  ],
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
