import "@/styles/globals.css"
import { Providers } from "@/components/Layout/Providers"
import { Header } from "@/components/Layout/Header"
import { Footer } from "@/components/Layout/Footer"

export const metadata = {
  title: "SimplePanel",
  description: "Panel administrativo para servidores de Counter Strike",
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full flex flex-col bg-zinc-950 text-zinc-100">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 p-4 md:p-6">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}