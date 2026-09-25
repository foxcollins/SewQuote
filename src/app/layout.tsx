import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Newsreader, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import {
  LOCALE_COOKIE,
  localeFromAcceptLanguage,
  localeFromValue,
  t,
} from "@/lib/i18n";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

async function resolveRootLocale() {
  const [store, headerList] = await Promise.all([cookies(), headers()]);
  const fromCookie = localeFromValue(store.get(LOCALE_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  return localeFromAcceptLanguage(headerList.get("accept-language"));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveRootLocale();
  return {
    title: t(locale, "app.name"),
    description: t(locale, "app.description"),
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t(locale, "app.name"),
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#c85a32",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await resolveRootLocale();

  return (
    <html lang={locale}>
      <body
        className={`${newsreader.variable} ${jakarta.variable} ${jetbrains.variable} antialiased`}
      >
        <I18nProvider initialLocale={locale} syncDocumentLang={false}>
          {children}
        </I18nProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ("serviceWorker" in navigator) { window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); }); }`,
          }}
        />
      </body>
    </html>
  );
}
