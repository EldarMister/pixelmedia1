/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#020B1F",
          900: "#06142E",
          850: "#0B1B3A",
          800: "#102344",
          700: "#18345F"
        },
        accent: "#3B6CFF"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(0, 0, 0, 0.22)"
      }
    }
  },
  plugins: []
};
