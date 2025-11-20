// tailwind.config.js

const semanticColors = {
  surface: {
    DEFAULT: 'var(--surface)',
    muted: 'var(--surface-muted)',
    hover: 'var(--surface-hover)',
  },
  text: {
    DEFAULT: 'var(--text)',
    muted: 'var(--text-muted)',
  },
  accent: {
    DEFAULT: 'var(--accent)',
    foreground: 'var(--accent-foreground)',
  },
  border: 'var(--border)',
  muted: {
    DEFAULT: 'var(--muted)',
    foreground: 'var(--muted-foreground)',
  },
};


module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: semanticColors,
      backgroundColor: semanticColors,
      borderColor: {
        DEFAULT: 'var(--border)',
        ...semanticColors,
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
