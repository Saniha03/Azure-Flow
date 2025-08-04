/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "royal-blue": "#1E3A8A",
        azure: "#3B82F6",
        skyM: "#93C5FD",
        "soft-pink": "#F9A8D4",
        "bg-light": "#F8FAFC",
      },
      backgroundImage: {
        "gradient-blue": "linear-gradient(to bottom, #93C5FD, #F8FAFC)",
        "gradient-button":
          "linear-gradient(to right, #1E3A8A, #3B82F6, #F9A8D4)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
