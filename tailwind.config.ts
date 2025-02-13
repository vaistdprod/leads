import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addBase, addUtilities }: { addBase: any; addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.bg-state-background': { backgroundColor: 'oklch(var(--background))' },
        '.text-state-foreground': { color: 'oklch(var(--foreground))' },
        '.border-state-border': { borderColor: 'oklch(var(--border))' },
        '.bg-state-card': { backgroundColor: 'oklch(var(--card))' },
        '.text-state-card-foreground': { color: 'oklch(var(--card-foreground))' },
        '.bg-state-popover': { backgroundColor: 'oklch(var(--popover))' },
        '.text-state-popover-foreground': { color: 'oklch(var(--popover-foreground))' },
        '.bg-state-primary': { backgroundColor: 'oklch(var(--primary))' },
        '.text-state-primary-foreground': { color: 'oklch(var(--primary-foreground))' },
        '.bg-state-secondary': { backgroundColor: 'oklch(var(--secondary))' },
        '.text-state-secondary-foreground': { color: 'oklch(var(--secondary-foreground))' },
        '.bg-state-muted': { backgroundColor: 'oklch(var(--muted))' },
        '.text-state-muted-foreground': { color: 'oklch(var(--muted-foreground))' },
        '.bg-state-accent': { backgroundColor: 'oklch(var(--accent))' },
        '.text-state-accent-foreground': { color: 'oklch(var(--accent-foreground))' },
        '.bg-state-destructive': { backgroundColor: 'oklch(var(--destructive))' },
        '.text-state-destructive-foreground': { color: 'oklch(var(--destructive-foreground))' },
        '.ring-state-ring': { '--tw-ring-color': 'oklch(var(--ring))' },
        '.border-state-input': { borderColor: 'oklch(var(--input))' },
        '.bg-state-chart-1': { backgroundColor: 'oklch(var(--chart-1))' },
        '.bg-state-chart-2': { backgroundColor: 'oklch(var(--chart-2))' },
        '.bg-state-chart-3': { backgroundColor: 'oklch(var(--chart-3))' },
        '.bg-state-chart-4': { backgroundColor: 'oklch(var(--chart-4))' },
        '.bg-state-chart-5': { backgroundColor: 'oklch(var(--chart-5))' },
      });
    },
  ],
};

export default config;
