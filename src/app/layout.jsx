import "@/styles/globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { Header } from "@/components/Layout/Header"
import { Footer } from "@/components/Layout/Footer"

export const metadata = {
  title: "SimplePanel",
  description: "Panel administrativo para servidores de Counter Strike",
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <AuthProvider>
          <Header />
          <main className="p-4 md:p-6">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}