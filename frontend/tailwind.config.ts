import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#111210',
          900: '#1d1f1b',
          800: '#2a2d27',
          700: '#3a3e36',
        },
        paper: {
          50: '#f8f6ef',
          100: '#efeadc',
          200: '#ddd3bd',
        },
        moss: {
          500: '#687b45',
          600: '#526237',
        },
        signal: {
          500: '#d96c48',
        },
      },
      fontFamily: {
        sans: ['Aptos', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'Cambria', 'serif'],
      },
      borderRadius: {
        panel: '8px',
      },
      boxShadow: {
        soft: '0 24px 60px rgb(17 18 16 / 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
