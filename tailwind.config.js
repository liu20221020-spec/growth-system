/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 游戏主题色
        bg: {
          primary: '#0a0e1a',
          secondary: '#111827',
          card: '#1a2235',
          hover: '#1f2d45',
        },
        accent: {
          gold: '#f5c518',
          blue: '#4f9eff',
          green: '#00d4aa',
          purple: '#9f5fff',
          red: '#ff4757',
          orange: '#ff6b35',
        },
        // 段位颜色
        rank: {
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          gold: '#ffd700',
          platinum: '#7b68ee',
          diamond: '#4169e1',
          master: '#00c853',
          king: '#ff6600',
        },
      },
      fontFamily: {
        game: ['"Source Han Sans SC"', '"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(79, 158, 255, 0.3)',
        'glow-gold': '0 0 20px rgba(245, 197, 24, 0.4)',
        'glow-green': '0 0 20px rgba(0, 212, 170, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'game-card': 'linear-gradient(135deg, #1a2235 0%, #0f1929 100%)',
      },
    },
  },
  plugins: [],
}
