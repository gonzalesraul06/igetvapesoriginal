/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        accent: '#e94560',
        surface: '#f9f9f9',
        'surface-light': '#f1f1f1',
        muted: '#e5e5e5',
        border: '#eaeaea',
        gold: '#fbbc04',
      },
      fontFamily: {
        sans: ['Montserrat', 'Arial', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
