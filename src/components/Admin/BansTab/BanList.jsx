"use client"

import { Ban, Pencil, Trash2, ShieldOff } from 'lucide-react';
import { Button } from "@/components/UI/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { Spinner } from "@/components/UI/spinner"
import { Pagination } from "./Pagination"

const Badge = ({ children, className = '' }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>
)

const getStatusConfig = (status) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return { label: 'Activo', className: 'bg-red-600 text-white' }
    case 'EXPIRED':
      return { label: 'Expirado', className: 'bg-green-600 text-white' }
    case 'UNBANNED':
      return { label: 'Desbaneado', className: 'bg-blue-600 text-white' }
    default:
      return { label: 'Desconocido', className: 'bg-zinc-700 text-white' }
  }
}

export function BanList({ bans, loading, getAvatarUrl, getDisplayName, canEdit, canUnban, canRemove, onEdit, onUnban, onDelete, currentPage, totalPages, startIndex, total, onPageChange }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6 text-[#FFB800]" />
      </div>
    )
  }

  if (bans.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">No se encontraron baneos</div>
    )
  }

  const statusConfig = getStatusConfig

  return (
    <>
      <div className="space-y-2">
        {bans.map((ban) => {
          const status = statusConfig(ban.status)
          return (
            <div key={ban.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <a href={`https://steamcommunity.com/profiles/${ban.steamId}`} target="_blank" rel="noopener noreferrer">
                    <Avatar className="size-10 shrink-0 hover:ring-2 hover:ring-[#FFB800] transition-all cursor-pointer">
                      <AvatarImage src={getAvatarUrl(ban.steamId)} alt={ban.player} />
                      <AvatarFallback>{ban.player.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-zinc-100 font-medium">{getDisplayName(ban)}</span>
                      <span className="text-zinc-500 text-xs font-mono">({ban.steamId})</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 mb-1">
                      <span>
                        <span className="text-sm text-zinc-500">Razón:</span>{' '}
                        <span className="text-base text-zinc-300">{ban.reason}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                      <span>
                        <span className="text-zinc-500">Duración:</span>{' '}
                        <span className="text-zinc-300">{ban.duration}</span>
                      </span>
                      {ban.ip && ban.ip !== '0' && (
                        <span>
                          <span className="text-zinc-500">IP:</span>{' '}
                          <span className="text-zinc-300 font-mono text-xs">{ban.ip}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-zinc-500">
                      <span>Admin: {ban.admin}</span>
                      <span>{ban.date}</span>
                    </div>
                    {ban.status === 'UNBANNED' && ban.unbanReason && (
                      <div className="mt-2 pt-2 border-t border-zinc-700">
                        <div className="mb-1">
                          <span className="text-xs text-zinc-500">Motivo del desbaneo: </span>
                          <span className="text-xs text-blue-400">{ban.unbanReason}</span>
                        </div>
                        {ban.unbanAdmin && (
                          <div>
                            <span className="text-xs text-zinc-500">Admin: </span>
                            <span className="text-xs text-zinc-300">{ban.unbanAdmin}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {canEdit(ban) && (
                  <Button size="sm" variant="outline" onClick={() => onEdit(ban)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
                    <Pencil className="size-3 mr-1" />
                    Editar
                  </Button>
                )}
                {ban.status === 'ACTIVE' && canUnban(ban) && (
                  <Button size="sm" variant="outline" onClick={() => onUnban(ban)} className="bg-zinc-900 border-zinc-700 text-green-400 hover:bg-zinc-700" >
                    <ShieldOff className="size-3 mr-1" />
                    Desbanear
                  </Button>
                )}
                {canRemove(ban) && (
                  <Button size="sm" variant="outline" onClick={() => onDelete(ban)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700" >
                    <Trash2 className="size-3 mr-1" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} total={total} onPageChange={onPageChange} />
      )}
    </>
  )
}