/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Marca Rutario (de los logos): navy, teal, aqua y coral
        ink: '#0B1630',
        forest: '#073F3A',
        brand: '#0F8F82',
        aqua: '#2EE6C5',
        coral: '#FF6B3D',
        // Roles semánticos (los nombres se conservan para no tocar cada componente)
        primary: '#0B7468',            // botones: 5.7:1 con texto blanco
        'primary-container': '#CDEDE7',
        'on-primary-container': '#0A5C54',
        secondary: '#0A5C54',          // títulos, enlaces y hover: 7.9:1 con blanco
        'secondary-container': '#CDEDE7',
        tertiary: '#B83A14',           // texto coral sobre blanco: 5.8:1
        'tertiary-container': '#FFD9CC',
        surface: '#F4F8F8',
        'surface-low': '#EAF2F1',
        'surface-container': '#DDEAE8',
        'on-surface': '#0B1630',
        'on-surface-variant': '#3B4760',
        neutral: '#4A5672',
        line: '#DCE6E4',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,22,48,0.05)',
        pop: '0 12px 28px rgba(11,22,48,0.14)',
      },
      borderRadius: { lg: '0.5rem', xl: '0.5rem', '2xl': '0.625rem' },
    },
  },
  plugins: [],
}
