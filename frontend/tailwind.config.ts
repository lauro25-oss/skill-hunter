import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEF3EE',
          100: '#D4E3D5',
          200: '#A9C8AB',
          300: '#7DAD80',
          400: '#558E58',
          500: '#3B583C',
          600: '#3B583C',
          700: '#2D442E',
          800: '#1E2F1F',
          900: '#111A12',
        },
        surface: '#FFFFFF',
        canvas:  '#F2F5F2',
      },
      fontFamily: {
        sans:   ['Inter', 'system-ui', 'sans-serif'],
        logo:   ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 1px 4px rgba(59,88,60,0.07), 0 0 0 1px rgba(59,88,60,0.05)',
        panel: '2px 0 8px rgba(0,0,0,0.04)',
        float: '0 4px 16px rgba(59,88,60,0.12)',
      },
      borderColor: {
        DEFAULT: '#E6EBE6',
      },
    },
  },
  plugins: [],
} satisfies Config
