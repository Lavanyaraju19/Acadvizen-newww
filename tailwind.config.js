/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7fc',
          100: '#b3e6f6',
          200: '#80d5f0',
          300: '#4dc4ea',
          400: '#26b7e5',
          500: '#00a1d6',
          600: '#008fc2',
          700: '#007aad',
          800: '#006699',
          900: '#004466',
        },
        accent: {
          cyan: '#00BFFF',
          teal: '#008B8B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
