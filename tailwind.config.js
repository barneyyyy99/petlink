/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#20322f',
        muted: '#8c9b96',
        line: '#dfe7e2',
        teal: { DEFAULT: '#2e7f75', 2: '#4ca092', soft: '#dff1eb' },
        mint: '#bfe7dc',
        orange: { DEFAULT: '#c5793f', soft: '#fff0df' },
        blue: { DEFAULT: '#6076c7', soft: '#e9edff' },
        red: { DEFAULT: '#c85f5b', soft: '#fde9e7' },
        paper: '#f8faf7',
      },
      borderRadius: { xl2: '30px' },
      boxShadow: {
        soft: '0 18px 48px rgba(34,66,59,.10)',
        softsm: '0 8px 24px rgba(34,66,59,.08)',
      },
    },
  },
  plugins: [],
}
