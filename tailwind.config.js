/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#2c3040',
          hover: '#363b4e',
          active: '#414760',
          text: '#9ca3b4',
          'text-active': '#f0f1f3',
          border: '#232636',
        },
        surface: {
          DEFAULT: '#edeef1',
          card: '#f8f9fa',
          hover: '#f0f1f3',
          raised: '#ffffff',
          sunken: '#e4e5e9',
          border: '#d8dae0',
          'border-subtle': '#e8eaef',
        },
        content: {
          primary: '#1a1d26',
          secondary: '#5a5f72',
          tertiary: '#8b90a0',
          inverse: '#f0f1f3',
        },
        accent: {
          DEFAULT: '#3954AB',
          light: '#4d65c4',
          dark: '#2d4390',
          subtle: 'rgba(57, 84, 171, 0.07)',
        },
        status: {
          green: '#16a34a',
          'green-bg': 'rgba(22, 163, 74, 0.08)',
          yellow: '#ca8a04',
          'yellow-bg': 'rgba(202, 138, 4, 0.08)',
          red: '#dc2626',
          'red-bg': 'rgba(220, 38, 38, 0.08)',
          blue: '#2563eb',
          'blue-bg': 'rgba(37, 99, 235, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
        panel: '-4px 0 16px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
