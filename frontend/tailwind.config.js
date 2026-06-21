/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#003d9b",
          light: "#e0f2fe",
          dark: "#0369a1",
          hover: "#002b6d"
        },
        success: "#22c55e",
        warning: "#f97316",
        critical: "#ef4444",
        background: "#ffffff",
        secBackground: "#F8FAFC"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
