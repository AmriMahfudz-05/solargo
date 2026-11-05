// Tailwind Play CDN configuration
// Must be safe whether loaded before or after the Tailwind CDN script.
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        warmbg: '#F8F7F4',
        cardbg: '#FFFFFF',
        mutedborder: '#E8E6DF',
        sage: {
          50: '#F2F6F3',
          100: '#E2EBE5',
          200: '#C7D9CD',
          500: '#4E7D63',
          600: '#3D654F',
          700: '#2E4E3C',
          800: '#21392B'
        },
        charcoal: {
          400: '#8A949E',
          600: '#4A5561',
          800: '#242C35',
          900: '#181E24'
        },
        clay: '#D97757',
        sunwarm: '#E8B35A'
      }
    }
  }
};
