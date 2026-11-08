/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Times New Roman"', 'Times', 'serif'],
        mono: ['Consolas', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        hepco: {
          dark: '#0a0e17',
          surface: '#111827',
          card: '#162032',
          border: '#1f2d42',
          hover: '#24344d',
          green: '#10b981',
          greenDark: '#059669',
          cyan: '#06b6d4',
          cyanDark: '#0891b2',
          orange: '#f59e0b',
          red: '#ef4444',
          muted: '#94a3b8',
        }
      }
    },
  },
  plugins: [],
}
