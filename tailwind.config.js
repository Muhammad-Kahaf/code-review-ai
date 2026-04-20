/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#050505",
          800: "#0f0f0f",
          700: "#1a1a1a",
          600: "#2f2f2f",
          500: "#3a3a3a",
          400: "#555555",
          300: "#888888",
          200: "#b4b4b4",
          100: "#ececec",
        },
        surface: {
          dark: "#212121",
          darker: "#171717",
        },
        accent: {
          primary: "#10a37f",
          hover: "#0d8f6f",
          dim: "rgba(16, 163, 127, 0.15)",
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        spin: "spin 1s linear infinite",
      },
      backdropBlur: {
        "ultra": "40px",
      },
      boxShadow: {
        "glow-violet": "0 0 24px rgba(139, 92, 246, 0.4)",
        "glow-emerald": "0 0 24px rgba(16, 163, 127, 0.4)",
      },
    },
  },
  plugins: [],
}
