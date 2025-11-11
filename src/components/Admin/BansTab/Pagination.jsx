"use client"

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/UI/button"

const ITEMS_PER_PAGE = 20

export function Pagination({ currentPage, totalPages, startIndex, total, onPageChange }) {
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
      <div className="text-zinc-400 text-sm">Mostrando {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, total)} de {total}</div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
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
              <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => onPageChange(pageNum)} className={currentPage === pageNum ? "bg-[#FFB800] hover:bg-[#ce9300]" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"} >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
          <span className="hidden sm:inline mr-1">Siguiente</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}