/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-space)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#0a0c10',
          card: '#11141c',
          border: '#1c2030',
          hover: '#181c28',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          muted: '#6366f118',
        },
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#f87171',
        muted: '#64748b',
        text: {
          DEFAULT: '#f1f5f9',
          muted: '#94a3b8',
          dim: '#64748b',
        },
      },
      borderRadius: {
        '2xl': '16px',
        'xl': '12px',
        'lg': '10px',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.8125rem', { lineHeight: '1.5' }],
        'base': ['0.875rem', { lineHeight: '1.6' }],
        'lg': ['1rem', { lineHeight: '1.5' }],
        'xl': ['1.125rem', { lineHeight: '1.4' }],
        '2xl': ['1.375rem', { lineHeight: '1.3' }],
        '3xl': ['1.75rem', { lineHeight: '1.25' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.4)',
        'glow': '0 0 20px rgba(99,102,241,0.15)',
      },
    },
  },
  plugins: [],
}
