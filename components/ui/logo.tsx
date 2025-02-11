import { useTheme } from 'next-themes';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 40 }: LogoProps) {
  const { theme } = useTheme();
  const fill = theme === 'dark' ? '#ffffff' : '#000000';

  return (
    <svg
      width={size}
      height={size * 0.76} // Maintain aspect ratio
      viewBox="0.4 0.6 906.7 688"
      className={className}
    >
      <path
        fill={fill}
        d="m0.4 0.6h573.5c184 0 333.2 164.2 333.2 348.2v2.3c0 178.1-144.4 337.5-322.5 337.5h-268.1v-550.3h107v450.9h123.8c48.6 0 96.4-13 137.8-38.4 52.3-32.1 110.2-89.9 112.5-193.1 4-210.4-179.2-254.3-227.2-255.3h-570z"
      />
    </svg>
  );
}