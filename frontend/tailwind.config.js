/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070C12",      // page background
        panel: "#0D1620",    // cards
        raised: "#131F2B",   // inputs, ticket stubs
        line: "#1E2D3B",     // borders
        muted: "#8396A7",    // secondary text
        soft: "#C3CFDA",     // body text
        accent: "#2EE6D6",   // brand
        ok: "#4ADE80",
        warn: "#FBBF24",
        danger: "#F87171",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Instrument Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};