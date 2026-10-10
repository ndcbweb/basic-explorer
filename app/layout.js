import { Roboto } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { config } from "@/lib/config";
import { assetUrl, getSettings, themeCss } from "@/lib/settings";
import "./globals.css";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto", display: "swap" });

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = getSettings();
  const site = settings.metaTitle || `${config.chainName} Explorer`;
  return {
    title: { default: site, template: `%s | ${site}` },
    description: settings.metaDescription || `Blocks, transactions, addresses and tokens on ${config.chainName}.`,
    keywords: settings.metaKeywords || undefined,
    icons: { icon: assetUrl("favicon") || "/icon.svg" },
  };
}

// Runs before paint so the saved, default or system theme applies without a light flash.
function themeScript(defaultTheme) {
  return `try{var t=localStorage.getItem("theme")||${JSON.stringify(defaultTheme === "system" ? "" : defaultTheme)};if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;
}

function Announcement({ text, link }) {
  return (
    <div className="bg-brand-600 px-4 py-2 text-center text-xs text-white">
      {text}
      {link && (
        <>
          {" "}
          <a href={link} target="_blank" rel="noopener noreferrer" className="font-medium text-white underline hover:text-white">
            Learn more
          </a>
        </>
      )}
    </div>
  );
}

export default function RootLayout({ children }) {
  const settings = getSettings();
  const css = themeCss();
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(settings.defaultTheme) }} />
        {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      </head>
      <body className="flex min-h-screen flex-col">
        {settings.announcementEnabled && settings.announcementText && (
          <Announcement text={settings.announcementText} link={settings.announcementLink} />
        )}
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
