// src/app/layout.tsx
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { PushNotificationProvider } from '@/contexts/PushNotificationProvider';

export const metadata: Metadata = {
  title: 'Jornada Financeira',
  description: 'Sua jornada para o sucesso financeiro começa aqui.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/logo-192.png"></link>
        <meta name="theme-color" content="#1E40AF" />
      </head>
      <body>
         <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  function setTheme(theme) {
                    document.documentElement.classList.remove('light', 'dark');
                    if (theme === 'system') {
                      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                    document.documentElement.classList.add(theme);
                  }
                  var theme = localStorage.getItem('vite-ui-theme') || 'dark';
                  setTheme(theme);
                })();
              `,
            }}
          />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          storageKey="vite-ui-theme"
        >
          <PushNotificationProvider>
            {children}
            <Toaster />
          </PushNotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
