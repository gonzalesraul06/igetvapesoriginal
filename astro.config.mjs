import { defineConfig } from 'astro/config';
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
  ],
  vite: {
    plugins: [tailwindcss()],
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
