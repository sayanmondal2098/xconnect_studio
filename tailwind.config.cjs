/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        panel2: "rgb(var(--panel2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        mint: "rgb(var(--mint) / <alpha-value>)",
        lavender: "rgb(var(--lavender) / <alpha-value>)",
        peach: "rgb(var(--peach) / <alpha-value>)",
        sky: "rgb(var(--sky) / <alpha-value>)",
        lemon: "rgb(var(--lemon) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
      },
      boxShadow: { soft: "0 10px 30px rgb(0 0 0 / 0.18)" },
      borderRadius: { xl2: "18px" },
    },
  },
  plugins: [],
};
