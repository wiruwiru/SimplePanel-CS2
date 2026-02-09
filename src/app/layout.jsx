import "@/styles/globals.css"
import { Providers } from "@/components/Layout/Providers"
import { Header } from "@/components/Layout/Header"
import { Footer } from "@/components/Layout/Footer"
import { LanguageSetter } from "@/components/Layout/LanguageSetter"

export const metadata = {
  title: {
    default: process.env.PANEL_NAME || "SimplePanel"
  },
  description: "Easily manage and administer sanctions (bans and mutes) for your Counter-Strike 2 servers.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-background">
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Providers>
          <LanguageSetter />
          <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 p-4 md:p-6 bg-background">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}