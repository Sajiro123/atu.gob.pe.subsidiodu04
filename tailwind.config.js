/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,ts,scss}',
  ],
  theme: {
    extend: {
      colors: {
        atu: {
          primary:        '#004C97',
          'primary-strong':'#003A75',
          'primary-mid':  '#00A3E0',
          'primary-soft': '#E3EEF6',
          surface:        '#FFFFFF',
          'surface-2':    '#F5F8FB',
          'surface-3':    '#EAF0F5',
          bg:             '#EEF2F6',
          border:         '#DCE4EC',
          'border-strong':'#C6D2DD',
          text:           '#15242F',
          'text-2':       '#46586A',
          'text-3':       '#6E8090',
          ok:             '#15803D',
          'ok-bg':        '#E4F4EA',
          warn:           '#B45309',
          'warn-bg':      '#FBEFDD',
          bad:            '#C0392B',
          'bad-bg':       '#FAE6E3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      width: {
        sidebar: '260px',
      },
      transitionTimingFunction: {
        'atu': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
