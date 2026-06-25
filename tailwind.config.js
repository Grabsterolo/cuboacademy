/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F8F6F1',
        carbon: '#16201F',
        'carbon-deep': '#0B3436',
        'text-2': '#71807E',
        jade: '#167D78',
        'jade-hover': '#1A918B',
        'jade-dark': '#0B3436',
        'jade-mid': '#104447',
        'jade-soft': '#DCEDEA',
        'jade-light': '#5ABFBA',
        terra: '#C96E4B',
        'terra-light': '#D9855E',
        'terra-soft': '#F4D8CC',
        border: '#DDE4E1',
      },
      fontFamily: {
        serif: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
    },
  },
  plugins: [],
}
