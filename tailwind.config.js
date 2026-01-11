export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Lombok Barat Palette
        // Lombok Barat Palette
        'lobar-blue': '#009FE3', // Base Blue from Shield
        'lobar-blue-dark': '#007BB0',
        'lobar-blue-light': '#4DC3FF',
        'lobar-red': '#ED1C24', // Red from Top Bar
        'lobar-yellow': '#FFF200', // Yellow from Border/Stars

        // Semantic Aliases
        primary: '#009FE3',
        secondary: '#0f172a', // Keep Slate 900 for Contrast
        accent: '#FFF200',
        surface: 'rgba(255, 255, 255, 0.95)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
