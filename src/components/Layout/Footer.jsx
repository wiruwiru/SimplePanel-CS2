import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 mt-12">
      <div className="px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto text-center text-zinc-400 text-sm">
          <p>
            &copy; {currentYear} <Link href="/" className="text-gray-400 hover:text-[#FFB800] transition-colors">SimplePanel</Link> | Developed by <Link href="https://github.com/wiruwiru" target="_blank" rel="nofollow" className="text-gray-400 hover:text-[#FFB800] transition-colors">Luca.</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}