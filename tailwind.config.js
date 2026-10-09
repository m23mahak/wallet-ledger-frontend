/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1F3A',
          800: '#0F2746',
          700: '#153258',
        },
        brand: {
          blue: '#2563EB',
          hover: '#1D4ED8',
          sky: '#38BDF8',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          dark: '#0F172A',
          muted: '#64748B',
          success: '#16A34A',
          error: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
