import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg:       '#111110',
          surface:  '#161614',
          border:   'rgba(255,255,255,0.07)',
          text:     '#e8e6e1',
          muted:    'rgba(200,198,190,0.55)',
          faint:    'rgba(200,198,190,0.35)',
          income:   '#6ee7b7',
          expense:  '#fca5a5',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        notion: '6px',
      }
    },
  },
  plugins: [],
}

export default config