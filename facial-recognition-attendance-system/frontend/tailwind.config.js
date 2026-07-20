/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-green-500',
    'bg-green-600'
  ],
  theme: {
    extend: {
      colors: {
        'fras-navy': '#111f4d',
        'fras-blue': '#1a2e6c',
        'fras-dark': '#0A0F1E',
        'fras-gold': '#f5a623',
        'fras-gold-dark': '#e09112',
      },
      backgroundImage: {
        'fras-gradient': 'linear-gradient(90deg, #0A0F1E 0%, #10213E 50%, #183153 100%)',
        'fras-navy-gradient': 'linear-gradient(90deg, #111f4d 0%, #1a2e6c 50%, #111f4d 100%)',
        'fras-gold-gradient': 'linear-gradient(135deg, #f5a623 0%, #e09112 100%)',
      }
    },
  },
  plugins: [],
}