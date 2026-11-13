import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

function kronosRoutesBannerPlugin() {
  return {
    name: 'kronos-routes-banner',
    configureServer(server) {
      const origPrintUrls = server.printUrls;
      server.printUrls = () => {
        origPrintUrls();
        const base = (server.resolvedUrls?.local?.[0] || 'http://localhost:3000/').replace(/\/+$/, '');
        const netBase = (server.resolvedUrls?.network?.[0] || '').replace(/\/+$/, '');

        const green = '\x1b[32m';
        const bold = '\x1b[1m';
        const cyan = '\x1b[36m';
        const yellow = '\x1b[33m';
        const reset = '\x1b[0m';

        console.log('');
        console.log(`  ${green}➜${reset}  ${bold}Storefront:${reset}    ${cyan}${base}/${reset}`);
        console.log(`  ${yellow}➜${reset}  ${bold}Admin Studio:${reset}  ${cyan}${base}/admin${reset}`);
        console.log(`  ${yellow}➜${reset}  ${bold}Admin Portal:${reset}  ${cyan}${base}/admin-kronos-2026${reset}`);
        console.log(`  ${green}➜${reset}  ${bold}Product PDP:${reset}   ${cyan}${base}/product/trf-mid-waist-baggy-folded-fit-jeans-zara-w1${reset}`);
        if (netBase) {
          console.log(`  ${yellow}➜${reset}  ${bold}Network Admin:${reset} ${cyan}${netBase}/admin${reset}`);
        }
      };
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), kronosRoutesBannerPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  },
  server: {
    port: 3000,
    open: false,
    host: true
  }
});
