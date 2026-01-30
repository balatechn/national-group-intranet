import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Primary Brand Colors - Rich Gold
        primary: {
          DEFAULT: '#B8860B',
          50: '#FDF8E8',
          100: '#FAF0D1',
          200: '#F5E1A3',
          300: '#F0D275',
          400: '#D4A017',
          500: '#B8860B',
          600: '#956D09',
          700: '#725407',
          800: '#4F3B05',
          900: '#2C2103',
          foreground: '#FFFFFF',
        },
        // Secondary Colors - Warm Gold Accent
        secondary: {
          DEFAULT: '#DAA520',
          50: '#FEF9E7',
          100: '#FDF3CF',
          200: '#FBE79F',
          300: '#F9DB6F',
          400: '#E6BE1A',
          500: '#DAA520',
          600: '#AE841A',
          700: '#836313',
          800: '#57420D',
          900: '#2C2106',
          foreground: '#1F1F1F',
        },
        // Status Colors
        success: {
          DEFAULT: '#22C55E',
          light: '#DCFCE7',
          dark: '#166534',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#DC2626',
        },
        // Background & Surface Colors - Half White / Off White
        background: '#FAFAFA',
        surface: {
          DEFAULT: '#F5F5F5',
          100: '#EFEFEF',
          200: '#E8E8E8',
        },
        // Border Colors
        border: {
          DEFAULT: '#E5E5E5',
          light: '#F0F0F0',
          dark: '#D4D4D4',
        },
        // Text Colors
        text: {
          primary: '#1F1F1F',
          secondary: '#525252',
          muted: '#737373',
        },
        // Gold accents for special elements
        gold: {
          DEFAULT: '#B8860B',
          light: '#FFD700',
          dark: '#8B6508',
          shine: '#FFE55C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display': ['2.25rem', { lineHeight: '1.3', fontWeight: '700' }],
        'heading-lg': ['1.875rem', { lineHeight: '1.4', fontWeight: '600' }],
        'heading': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
