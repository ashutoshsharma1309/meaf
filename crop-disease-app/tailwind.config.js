/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Leaf — primary brand
        leaf: {
          50: "#f0faf3",
          100: "#dcf3e2",
          200: "#bbe5c7",
          300: "#8bd09f",
          400: "#56b574",
          500: "#329a55",
          600: "#1f7c42",
          700: "#1a6336",
          800: "#174f2d",
          900: "#144126",
          950: "#082515",
        },
        // Harvest — warm accent for callouts, money, sun
        harvest: {
          50: "#fff8eb",
          100: "#feedc7",
          200: "#fdd989",
          300: "#fbbe4b",
          400: "#faa423",
          500: "#f3870c",
          600: "#d76408",
          700: "#b2470b",
          800: "#90370f",
          900: "#762e10",
        },
        // Earth — soil-tone neutrals for secondary actions / chemical
        earth: {
          50: "#f9f6f2",
          100: "#f0e9df",
          200: "#e0d2c0",
          300: "#cab39a",
          400: "#b39078",
          500: "#9d775f",
          600: "#866251",
          700: "#6c4f43",
          800: "#594139",
          900: "#4a3731",
        },
        // Sky — info / weather widget
        sky: {
          50: "#eff8ff",
          100: "#dceffe",
          200: "#b9defe",
          300: "#7ec5fd",
          400: "#3aa6f9",
          500: "#1188ea",
          600: "#0469c8",
          700: "#0553a1",
          800: "#094786",
          900: "#0d3c6f",
        },
        // semantic
        primary: {
          DEFAULT: "#1f7c42",
          light: "#dcf3e2",
          50: "#f0faf3",
          100: "#dcf3e2",
          200: "#bbe5c7",
          300: "#8bd09f",
          400: "#56b574",
          500: "#329a55",
          600: "#1f7c42",
          700: "#1a6336",
          800: "#174f2d",
          900: "#144126",
        },
        surface: { DEFAULT: "#ffffff", 2: "#fafaf7", 3: "#f5f5f0" },
        ink: { DEFAULT: "#0b1f17", muted: "#5a6b62" },
        border: { DEFAULT: "#e6e8e3", strong: "#cdd2cb" },
        danger: "#b91c1c",
        warning: "#d97706",
        success: "#1f7c42",
      },
      fontFamily: {
        sans: ["Inter", "DM Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(11 31 23 / 0.04), 0 2px 6px 0 rgb(11 31 23 / 0.06)",
        elevated: "0 4px 14px -2px rgb(11 31 23 / 0.10), 0 2px 6px -1px rgb(11 31 23 / 0.06)",
        glow: "0 0 0 4px rgb(31 124 66 / 0.10)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "shimmer": "shimmer 1.4s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      backgroundImage: {
        "grid-leaf":
          "radial-gradient(circle at 1px 1px, rgb(31 124 66 / 0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
