/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        honeywell: {
          red: '#EE3124',
          dark: '#1A1A1A',
          gray: '#F2F2F2',
        }
      },
    },
  },
  plugins: [],
}