import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rx: {
          primary: "#0d9488",
          "primary-dark": "#0f766e",
          teal: "#14b8a6",
          blue: "#0891b2",
          muted: "#99a3b3",
          border: "#e2e8f0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
