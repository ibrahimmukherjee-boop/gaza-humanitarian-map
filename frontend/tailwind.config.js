/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        humanitarian: {
          blue: "#2563eb",
          green: "#16a34a",
          cyan: "#0891b2",
          orange: "#ea580c",
          teal: "#0d9488",
          red: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};
