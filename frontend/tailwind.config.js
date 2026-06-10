/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#12233f",
        teal: "#007e87",
        canvas: "#f4f7fb"
      },
      boxShadow: {
        panel: "0 16px 45px rgba(18, 35, 63, 0.1)"
      }
    }
  },
  plugins: []
};
