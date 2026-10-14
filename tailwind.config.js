/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#111814",
        secondary: "#1F6B45",
        tertiary: "#E5E9E2",
        neutral: "#D7DDD6",
        surface: "#FFFFFF",
        "on-surface": "#111814",
        muted: "#5E665F",
        accent: "#20EFA0",
        border: "#E5E7EB",
        error: "#B8422E",
      },
      fontFamily: {
        sans: ['Plein', 'Syne', 'Space Grotesk', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Plein', 'Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      spacing: {
        xs: '2px',
        sm: '10px',
        md: '20px',
        lg: '32px',
        xl: '64px',
        gutter: '24px',
        section: '96px',
      },
      letterSpacing: {
        'headline-display': '-0.045em',
        'headline-lg': '-0.05em',
        'headline-md': '-0.036em',
        'nav': '0.08em',
        'label-sm': '0.04em',
      }
    },
  },
  plugins: [],
}
