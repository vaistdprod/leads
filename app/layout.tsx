import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
});

export const metadata: Metadata = {
  title: 'Lead Management',
  description: 'Automated Lead Management System',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" suppressHydrationWarning className={plusJakartaSans.variable}>
      <head>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={plusJakartaSans.className}>
        <ThemeProvider data-attribute="class">
          <NextThemesProvider defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </NextThemesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
