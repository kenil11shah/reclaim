import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-soft': 'rgb(var(--brand-soft) / <alpha-value>)',
        'on-brand': 'rgb(var(--on-brand) / <alpha-value>)',
        amber: 'rgb(var(--amber) / <alpha-value>)',
        'amber-soft': 'rgb(var(--amber-soft) / <alpha-value>)',
        ok: 'rgb(var(--ok) / <alpha-value>)',
        'ok-soft': 'rgb(var(--ok-soft) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { xl: '14px', '2xl': '20px' },
      maxWidth: { content: '1120px', prose: '68ch' },
    },
  },
  plugins: [],
} satisfies Config;
