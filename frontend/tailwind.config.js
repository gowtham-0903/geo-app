/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:          '#001E61',
        'navy-dark':   '#001244',
        'navy-mid':    '#002880',
        'navy-light':  '#A2BFFF',
        'navy-faint':  '#EEF2FF',
        'app-bg':      '#F0F2F8',
        'card':        '#FFFFFF',
        'success':     '#16A34A',
        'success-bg':  '#DCFCE7',
        'warning':     '#D97706',
        'warning-bg':  '#FEF3C7',
        'danger':      '#DC2626',
        'danger-bg':   '#FEE2E2',
        'info':        '#2563EB',
        'info-bg':     '#DBEAFE',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card':   '0 1px 3px 0 rgba(0, 30, 97, 0.06), 0 1px 2px -1px rgba(0, 30, 97, 0.04)',
        'modal':  '0 25px 50px -12px rgba(0, 30, 97, 0.25)',
        'nav':    '0 -1px 0 0 rgba(0, 30, 97, 0.06)',
        'fab':    '0 8px 24px rgba(0, 30, 97, 0.30)',
        'header': '0 1px 0 0 rgba(0, 30, 97, 0.06)',
      },
      maxWidth: {
        mobile: '430px',
      },
      animation: {
        'skeleton': 'skeleton-pulse 1.5s ease-in-out infinite',
        'fade-in':  'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'skeleton-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.4' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(1rem)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
