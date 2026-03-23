import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://igetvapeshub.com',
  output: 'static',
  adapter: cloudflare(),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/account/') && !page.includes('/checkout'),
    }),
    {
      name: 'cloudflare-worker-generator',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const outDir = fileURLToPath(dir);
          const clientDir = path.join(outDir, 'client');
          const serverDir = path.join(outDir, 'server');
          
          if (!fs.existsSync(clientDir)) return;

          // Tell Cloudflare to route /api/* to the server worker, and treat everything else as static
          const routesJson = '{"version":1,"include":["/api/*"],"exclude":["/*"]}';

          // Ensure it works regardless of whether the user sets their Cloudflare output dir to 'dist' or 'dist/client'
          fs.writeFileSync(path.join(outDir, '_routes.json'), routesJson);
          fs.writeFileSync(path.join(clientDir, '_routes.json'), routesJson);

          // For 'dist' output
          fs.writeFileSync(path.join(outDir, '_worker.js'), 'export { default } from "./server/entry.mjs";');
          // For 'dist/client' output (worker needs to reach back up to the server bundle... wait! Cloudflare won't deploy 'server' if 'client' is the output dir!)
          
          // Actually, if Cloudflare builds via 'astro build', they must set output to 'dist' in Cloudflare, 
          // because Astro creates dist/client and dist/server. Wait! If output is 'dist', then static files are in dist/client, 
          // so Cloudflare will serve them ONLY if we move them! Let's automate the moving!!
          
          // Move all files from dist/client/* to dist/
          const copyRecursiveSync = (src, dest) => {
            const exists = fs.existsSync(src);
            const stats = exists && fs.statSync(src);
            const isDirectory = exists && stats.isDirectory();
            if (isDirectory) {
              if (!fs.existsSync(dest)) fs.mkdirSync(dest);
              fs.readdirSync(src).forEach((childItemName) => {
                copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
              });
            } else {
              fs.copyFileSync(src, dest);
            }
          };
          copyRecursiveSync(clientDir, outDir);
        }
      }
    }
  ],
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'cloudflare-ssr-input',
        config(_, env) {
          if (env.isSsrBuild) {
            return {
              build: {
                rollupOptions: {
                  input: '@astrojs/cloudflare/entrypoints/server',
                },
              },
            };
          }
        },
      },
    ],
    resolve: {
      alias: {
        cookie: fileURLToPath(new URL('./src/shims/cookie.ts', import.meta.url)),
      },
    },
  },
  redirects: {
    '/iget': '/',
    '/iget/jnr-cruiser': '/products/jnr-cruiser',
    '/iget/iget-one': '/products/iget-one',
    '/iget/iget-bar-pro': '/products/iget-bar-pro',
    '/iget/iget-bar-plus-s3': '/products/iget-bar-plus-s3',
    '/iget/iget-bar-plus-s3-pod': '/products/iget-bar-plus-s3-pod',
    '/iget/alibarbar-ingot': '/products/alibarbar-ingot',
    '/iget/alibarbar-ice-adjust': '/products/alibarbar-ice-adjust',
    '/iget/shipping-policy': '/shipping-policy',
    '/iget/payment': '/payment-methods',
    '/iget/privacy-policy': '/privacy-policy',
    '/iget/terms-conditions': '/terms-and-conditions',
    '/iget/places/australia': '/delivery',
    '/iget/mix-n-match': '/mix-and-match',
    '/iget/contact': '/contact',
    '/iget/checkout': '/checkout',
    '/iget/account': '/account',
    '/iget/signup': '/account/signup',
    '/iget/lost-password': '/account/lost-password',
    '/iget/orders': '/account/orders',
  },
  image: {
    domains: ['igetvapeshub.com'],
  },
});
