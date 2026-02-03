/** @type {import('tailwindcss').Config} */
export default {
  content: ['./public/**/*.{html,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0D1117',
          secondary: '#161B22',
          card: '#21262D',
          border: '#30363D',
        },
        light: {
          primary: '#FFFFFF',
          secondary: '#F6F8FA',
          card: '#FFFFFF',
          border: '#E5E7EB',
        },
        accent: {
          DEFAULT: '#4ADE80',
          hover: '#22C55E',
          dark: '#16A34A',
          'dark-hover': '#15803D',
        },
        text: {
          primary: '#E6EDF3',
          secondary: '#8B949E',
          'light-primary': '#1F2937',
          'light-secondary': '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        glass: '8px',
      },
    },
  },
  plugins: [],
};
