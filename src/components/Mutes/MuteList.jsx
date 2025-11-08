"use client"

import { useState } from "react"
import { VolumeX, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Input } from "@/components/UI/input"
import { Badge } from "@/components/UI/badge"
import { Button } from "@/components/UI/button"
import { mutes } from "@/data/sanctions"

const ITEMS_PER_PAGE = 15

export function MuteList() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredMutes = mutes.filter(
    (mute) =>
      mute.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mute.steamId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mute.reason.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredMutes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentMutes = filteredMutes.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-zinc-100 mb-1">Lista de Muteos</h2>
        <p className="text-zinc-400 text-sm md:text-base">Gestión de jugadores silenciados</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-100">
            <div className="flex items-center gap-2">
              <VolumeX className="size-5 text-orange-500" />
              <span className="text-lg md:text-xl">Muteos ({filteredMutes.length})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value), setCurrentPage(1)}} className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-100 w-full sm:w-64" />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="block lg:hidden space-y-3">
            {currentMutes.map((mute) => (
              <div key={mute.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-100 mb-1 break-all">{mute.player}</div>
                    <div className="text-zinc-500 text-sm break-all">{mute.steamId}</div>
                  </div>
                  <Badge variant={mute.status === "active" ? "default" : "secondary"} className={`${mute.status === "active" ? "bg-yellow-600" : "bg-zinc-700"}`} >
                    {mute.status === "active" ? "Activo" : "Expirado"}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-zinc-400">
                    <span className="text-zinc-500">Razón:</span> {mute.reason}
                  </div>
                  <div className="text-zinc-400">
                    <span className="text-zinc-500">Admin:</span> {mute.admin}
                  </div>
                  <div className="text-zinc-400">
                    <span className="text-zinc-500">Duración:</span> {mute.duration}
                  </div>
                  <div className="text-zinc-500 text-xs">{mute.date}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-zinc-400">Jugador</th>
                  <th className="text-left py-3 px-4 text-zinc-400">SteamID</th>
                  <th className="text-left py-3 px-4 text-zinc-400">Razón</th>
                  <th className="text-left py-3 px-4 text-zinc-400">Admin</th>
                  <th className="text-left py-3 px-4 text-zinc-400">Duración</th>
                  <th className="text-left py-3 px-4 text-zinc-400">Fecha</th>
                  <th className="text-left py-3 px-4 text-zinc-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {currentMutes.map((mute) => (
                  <tr key={mute.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="py-3 px-4 text-zinc-100">{mute.player}</td>
                    <td className="py-3 px-4 text-zinc-400 font-mono text-sm">{mute.steamId}</td>
                    <td className="py-3 px-4 text-zinc-300">{mute.reason}</td>
                    <td className="py-3 px-4 text-zinc-400">{mute.admin}</td>
                    <td className="py-3 px-4 text-zinc-300">{mute.duration}</td>
                    <td className="py-3 px-4 text-zinc-400 text-sm">{mute.date}</td>
                    <td className="py-3 px-4">
                      <Badge variant={mute.status === "active" ? "default" : "secondary"} className={mute.status === "active" ? "bg-yellow-600" : "bg-zinc-700"} >
                        {mute.status === "active" ? "Activo" : "Expirado"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
              <div className="text-zinc-400 text-sm">Mostrando {startIndex + 1} - {Math.min(endIndex, filteredMutes.length)} de {filteredMutes.length}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)} className={currentPage === pageNum ? "bg-orange-600 hover:bg-orange-700" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"} >{pageNum}</Button>
                    )
                  })}
                </div>

                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
                  <span className="hidden sm:inline mr-1">Siguiente</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}