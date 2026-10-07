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

        /* Agricultural brand ramp */
        brand: {
          DEFAULT: 'rgb(var(--cg-brand) / <alpha-value>)',
          soft: 'rgb(var(--cg-brand-soft) / <alpha-value>)',
        },
        leaf: 'rgb(var(--cg-leaf) / <alpha-value>)',

        /* Diagnostic semantics */
        ok: 'rgb(var(--cg-ok) / <alpha-value>)',
        warn: 'rgb(var(--cg-warn) / <alpha-value>)',
        danger: 'rgb(var(--cg-danger) / <alpha-value>)',
        info: 'rgb(var(--cg-info) / <alpha-value>)',
      },
      fontFamily: {
        // Plus Jakarta Sans for display gives a distinct modern silhouette;
        // Inter stays on body and telemetry where small-size legibility wins.
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        // Consistent modern rounding per the brief.
        card: '16px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      // Soft diffused shadows replacing the old hard inset-bezel ladder.
      boxShadow: {
        e1: 'var(--cg-shadow-sm)',
        e2: 'var(--cg-shadow-md)',
        e3: 'var(--cg-shadow-lg)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.5' },
          '70%,100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        // Ambient leaf sway for the brand mark — present but never distracting.
        sway: {
          '0%,100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        // Pulsing glow on the active prediction bar.
        'pulse-glow': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        sheen: 'sheen 1.1s ease-in-out infinite',
        rise: 'rise 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
        sway: 'sway 5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};