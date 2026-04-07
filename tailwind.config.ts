import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
        inter: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: 'hsl(var(--primary) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        destructive: 'hsl(var(--destructive) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3rem',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
        shimmer: 'shimmer 1.5s infinite',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        primary: '0 8px 24px -4px hsl(var(--primary) / 0.3)',
        'primary-lg': '0 16px 48px -8px hsl(var(--primary) / 0.4)',
      },
    },
  },
  plugins: [],
}

export default config
