/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Poppins', 'sans-serif'],
      },
      colors: {
        carnival: {
          50: '#fef7ff',
          100: '#fdecfe',
          200: '#fbd9fc',
          300: '#f8b8f8',
          400: '#f489f1',
          500: '#ec5ce6',
          600: '#d236ca',
          700: '#b025a6',
          800: '#912187',
          900: '#771e6e',
          950: '#4d0c45',
        },
        gold: {
          50: '#fffbeb',
          100: '#fff3c6',
          200: '#ffe688',
          300: '#ffd149',
          400: '#ffbd20',
          500: '#f99b07',
          600: '#dd7302',
          700: '#b74e06',
          800: '#943c0c',
          900: '#7a320d',
          950: '#461902',
        },
        electric: {
          50: '#edfffe',
          100: '#d2fffc',
          200: '#abfff9',
          300: '#70fff4',
          400: '#29f5e9',
          500: '#00d9d1',
          600: '#00ada8',
          700: '#058a85',
          800: '#0a6e6b',
          900: '#0e5b58',
          950: '#013737',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(236, 92, 230, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(236, 92, 230, 0.8)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'carnival-gradient': 'linear-gradient(135deg, #ec5ce6 0%, #f99b07 50%, #00d9d1 100%)',
        'party-gradient': 'linear-gradient(45deg, #d236ca 0%, #ec5ce6 25%, #f99b07 50%, #ffbd20 75%, #00d9d1 100%)',
      }
    },
  },
  plugins: [],
}
