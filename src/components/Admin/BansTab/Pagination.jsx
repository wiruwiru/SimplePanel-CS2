"use client"

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from "@/contexts/I18nContext"
import { Button } from "@/components/UI/button"

const ITEMS_PER_PAGE = 20

export function Pagination({ currentPage, totalPages, startIndex, total, onPageChange }) {
  const { t } = useI18n()
  
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
      <div className="text-zinc-400 text-sm">{t('pagination.showing')} {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, total)} {t('pagination.of')} {total}</div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline ml-1">{t('pagination.previous')}</span>
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
              <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => onPageChange(pageNum)} style={currentPage === pageNum ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' } : {}} className={currentPage === pageNum ? "hover:opacity-90" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"} onMouseEnter={currentPage === pageNum ? (e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; } : undefined} onMouseLeave={currentPage === pageNum ? (e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; } : undefined}>
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
          <span className="hidden sm:inline mr-1">{t('pagination.next')}</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}