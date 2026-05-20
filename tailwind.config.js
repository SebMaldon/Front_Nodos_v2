/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        imss: {
          green: '#006341',
          'green-dark': '#004d32',
          'green-light': '#007a4f',
          gold: '#c9a227',
          'gold-light': '#f0c040',
        },
        sidebar: {
          bg: '#00472e',
          hover: '#005238',
          active: '#006341',
        }
      }
    },
  },
  plugins: [],
}

