/** @type {import('tailwindcss').Config} */
export default {
  // 💡 NEW: Enable class-based dark mode
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}