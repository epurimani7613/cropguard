/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--cg-canvas) / <alpha-value>)',
        surface: 'rgb(var(--cg-surface) / <alpha-value>)',
        elevated: 'rgb(var(--cg-elevated) / <alpha-value>)',
        line: 'rgb(var(--cg-line) / <alpha-value>)',
        ink: 'rgb(var(--cg-ink) / <alpha-value>)',
        muted: 'rgb(var(--cg-muted) / <alpha-value>)',
        ok: 'rgb(var(--cg-ok) / <alpha-value>)',
        warn: 'rgb(var(--cg-warn) / <alpha-value>)',
        danger: 'rgb(var(--cg-danger) / <alpha-value>)',
        info: 'rgb(var(--cg-info) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        card: '14px',
      },
      // A real elevation ladder. Blur is only used on top of these, never instead.
      boxShadow: {
        e1: '0 1px 0 0 rgb(var(--cg-line) / 0.9) inset, 0 1px 2px rgb(0 0 0 / 0.28)',
        e2: '0 1px 0 0 rgb(var(--cg-line) / 0.9) inset, 0 8px 24px -12px rgb(0 0 0 / 0.55)',
        e3: '0 1px 0 0 rgb(var(--cg-line) / 0.9) inset, 0 24px 60px -24px rgb(0 0 0 / 0.65)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.55' },
          '70%,100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        sheen: 'sheen 1.1s ease-in-out infinite',
        rise: 'rise 220ms ease-out both',
      },
    },
  },
  plugins: [],
};