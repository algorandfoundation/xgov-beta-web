/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  prefix: "",
  theme: {
    darkMode: "selector",
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        xs: "24rem", // 24rem
      },
      fontSize: {
        'xxs': ['0.7rem', { lineHeight: '1rem' }],
      },
      colors: {
        "algo-teal-10": "#E7FAF9",
        "algo-teal-20": "#D1F4F4",
        "algo-teal-30": "#B9EFEE",
        "algo-teal-40": "#A2EAE8",
        "algo-teal-50": "#8BE4E2",
        "algo-teal-60": "#74DFDD",
        "algo-teal-70": "#5CDAD7",
        "algo-teal-80": "#45D5D1",
        "algo-teal-90": "#2ECFCC",
        "algo-teal": "#17CAC6",
        "algo-blue-10": "#E9E9FD",
        "algo-blue-20": "#D4D4FA",
        "algo-blue-30": "#BFBFF9",
        "algo-blue-40": "#A9A9F6",
        "algo-blue-50": "#9595F5",
        "algo-blue-60": "#8080F3",
        "algo-blue-70": "#6C6CF1",
        "algo-blue-80": "#5858F0",
        "algo-blue-90": "#4444ED",
        "algo-blue": "#2D2DF1",
        "algo-black-10": "#E5E7E9",
        "algo-black-20": "#CCD0D3",
        "algo-black-30": "#B2B8BD",
        "algo-black-40": "#99A1A7",
        "algo-black-50": "#7F8991",
        "algo-black-60": "#66717C",
        "algo-black-70": "#4C5965",
        "algo-black-80": "#334250",
        "algo-black-90": "#192A39",
        "algo-black": "#001324",
        "algo-orange": "#FF7F48",
        "algo-yellow": "#FFE248",
        "algo-green": "#01DC94",
        "algo-red": "#FF2C2C",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "mass-scale": {
          from: { transform: "scale(0)" },
          to: { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-slow": "spin 6s linear infinite",
        "mass-scale": "mass-scale 6s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
