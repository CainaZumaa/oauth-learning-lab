import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ArchitectureOverlay } from "@/components/ArchitectureOverlay";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OAuth 2.0 / OIDC Learning Lab",
  description:
    "Local educational lab for Authorization Code Flow, PKCE, tokens, and security tests",
};

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('oauth-lab-theme');
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
    var l = localStorage.getItem('oauth-lab-locale');
    document.documentElement.lang = l === 'en' ? 'en' : 'pt-BR';
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.lang = 'pt-BR';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <I18nProvider>
          {children}
          <ArchitectureOverlay />
        </I18nProvider>
      </body>
    </html>
  );
}
