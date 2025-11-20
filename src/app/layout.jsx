import "@/styles/globals.css"
import { Providers } from "@/components/Layout/Providers"
import { Header } from "@/components/Layout/Header"
import { Footer } from "@/components/Layout/Footer"
import { LanguageSetter } from "@/components/Layout/LanguageSetter"

export const metadata = {
  title: {
    default: "SimplePanel"
  },
  description: "Gestiona facilmente sanciones en tus servidores de Counter Strike 2",
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full bg-background">
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