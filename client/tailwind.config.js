/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066cc',
        'primary-focus': '#0071e3',
        'primary-on-dark': '#2997ff',
        canvas: '#ffffff',
        'canvas-parchment': '#f5f5f7',
        'surface-pearl': '#fafafc',
        'surface-tile-1': '#272729',
        'surface-tile-2': '#2a2a2c',
        'surface-tile-3': '#252527',
        surface_black: '#000000',
        'surface-chip-translucent': '#d2d2d7',
        ink: '#1d1d1f',
        body: '#1d1d1f',
        'body-on-dark': '#ffffff',
        'body-muted': '#cccccc',
        'ink-muted-80': '#333333',
        'ink-muted-48': '#7a7a7a',
        'divider-soft': '#f0f0f0',
        hairline: '#e0e0e0',
      },
      fontFamily: {
        display: ['SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
        text: ['SF Pro Text', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        xs: '5px',
        sm: '8px',
        md: '11px',
        lg: '18px',
        pill: '9999px',
        full: '9999px / 50%',
      },
      spacing: {
        xsxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '17px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '80px',
      },
    },
  },
};