/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campestre: {
          green: {
            light: '#d2f1d2',
            DEFAULT: '#1c663c', // Verde golf clásico / campestre
            dark: '#0f3a21',
          },
          gold: {
            light: '#f5dfa3',
            DEFAULT: '#c5a059', // Dorado elegante
            dark: '#8b6c31',
          },
          dark: {
            DEFAULT: '#0f172a',
            light: '#1e293b',
          }
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 8px 30px rgb(0,0,0,0.12)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      }
    },
  },
  plugins: [],
}
