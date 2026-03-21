/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        accent: '#e94560',
        'accent-dark': '#c7324d',
        surface: '#f8f9fa',
        'surface-light': '#f0f1f3',
        muted: '#dee2e6',
        border: '#e5e7eb',
        gold: '#f59e0b',
        text: '#1a1a2e',
        'text-muted': '#6b7280',
      },
      fontFamily: {
        sans: ['Montserrat', 'Arial', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
