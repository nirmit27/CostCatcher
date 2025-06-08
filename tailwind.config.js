/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Dark mode toggle
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter"],
        fira: ["Fira Sans"]
      }
    },
  },
  plugins: [
  ],
}