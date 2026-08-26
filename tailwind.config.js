/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './hooks/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070b14',
          900: '#0b1220',
          800: '#121a2b',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(250, 204, 21, 0.25)',
      },
    },
  },
  plugins: [],
};
