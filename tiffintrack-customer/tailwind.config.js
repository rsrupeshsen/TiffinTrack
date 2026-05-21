/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: "#E8670A",
          light: "#FFF3E8",
          dark: "#B84E00",
        },
        leaf: {
          DEFAULT: "#2D6A4F",
          light: "#E8F5EE",
        },
        turmeric: "#F4A811",
        clay: "#6B3F2A",
        cream: "#FDF6ED",
        charcoal: "#1A1410",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        brand: ["Sora", "sans-serif"],
      },
    },
  },
  plugins: [],
};
