/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        spf: {
          black: '#0d0d0d',
          ink: '#111111',
          charcoal: '#161616',
          graphite: '#1c1c1c',
          slate: '#222222',
          edge: '#2a2a2a',
          mist: '#3a3a3a',
          yellow: '#F5C518',
          'yellow-bright': '#FFD029',
          'yellow-deep': '#E0B00C',
          green: '#22C55E',
          'green-soft': '#16A34A',
          amber: '#F59E0B',
          red: '#EF4444',
          'red-coral': '#F87171',
          blue: '#3B82F6',
          'blue-bright': '#60A5FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'spf-soft': '0 6px 24px rgba(0,0,0,0.45)',
        'spf-float': '0 10px 40px rgba(0,0,0,0.55)',
        'spf-glow': '0 0 24px rgba(245,197,24,0.35)',
      },
      keyframes: {
        'marker-pulse': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.18)', opacity: '0.85' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'gps-pulse': {
          '0%': { transform: 'scale(0.7)', opacity: '0.7' },
          '70%': { transform: 'scale(2.2)', opacity: '0' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'num-bump': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.28)' },
          '100%': { transform: 'scale(1)' },
        },
        'toast-in': {
          '0%': { transform: 'translateY(14px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'marker-pulse': 'marker-pulse 1.6s ease-in-out infinite',
        'gps-pulse': 'gps-pulse 2.4s ease-out infinite',
        'num-bump': 'num-bump 0.5s ease-out',
        'toast-in': 'toast-in 0.28s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
};
