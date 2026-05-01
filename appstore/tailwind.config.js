/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx,html}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        brand: '#5b5ef4',
        'brand-dark': '#4748d4',
        surface: '#0f0f1a',
        'surface-2': '#1a1a2e',
        'surface-3': '#22223b',
        accent: '#5b5ef4',
        green: '#22c55e',
        muted: '#6b7090',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      }
    }
  },
  plugins: []
}
