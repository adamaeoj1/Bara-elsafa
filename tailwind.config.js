/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'Cairo', 'sans-serif'],
      },
      colors: {
        cream: '#F7F4EB',
        brand: {
          purple: '#6D4AFF',
          pink: '#FF80AB',
          cyan: '#6FD8F2',
          yellow: '#FAD85D',
          green: '#7CE38B',
          orange: '#FFAB73',
          brown: '#D7B38C',
          lightPink: '#F8BBD0',
          lightGreen: '#A5D6A7',
        },
        pawn: {
          purple: '#B388FF',
          cyan: '#6FD8F2',
          yellow: '#FAD85D',
          green: '#7CE38B',
          pink: '#FF80AB',
          orange: '#FFAB73',
          brown: '#D7B38C',
        }
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal': '3px 3px 0px 0px #000000',
        'brutal-lg': '4px 4px 0px 0px #000000',
        'brutal-xl': '6px 6px 0px 0px #000000',
      }
    },
  },
  plugins: [],
}
