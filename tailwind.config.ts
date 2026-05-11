import type { Config } from "tailwindcss";

/**
 * Tailwind v4 builds from CSS (`globals.css`). Class-based dark mode is enabled there via
 * `@custom-variant dark (&:where(.dark, .dark *));` so it stays in sync with `next-themes`.
 *
 * `darkMode` here keeps tooling / parity with Tailwind v3-style setups and matches docs intent.
 */
const config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
} satisfies Config;

export default config;
