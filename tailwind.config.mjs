/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        accent: '#e94560',
        'accent-dark': '#c7324d',
        'accent-light': '#fff1f3',
        secondary: '#6366f1',
        'secondary-light': '#eef2ff',
        surface: '#f8fafc',
        'surface-dark': '#f1f5f9',
        muted: '#cbd5e1',
        border: '#e2e8f0',
        gold: '#f59e0b',
        green: '#10b981',
        dark: '#080d1a',
        'dark-surface': '#111827',
        text: '#0f172a',
        'text-muted': '#64748b',
        'text-light': '#94a3b8',
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
};
