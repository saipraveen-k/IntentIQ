/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        instamart: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          orange: '#f97316',
          purple: '#6366f1',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          card: '#ffffff',
          border: '#e2e8f0',
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'premium': '0 20px 25px -5px rgba(99, 102, 241, 0.08), 0 8px 10px -6px rgba(99, 102, 241, 0.04)',
      },
    },
  },
  plugins: [],
}
