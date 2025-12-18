"use client"

import { Ban, Pencil, Trash2, ShieldOff, MessageSquare } from 'lucide-react'
import { useI18n } from "@/contexts/I18nContext"
import { Button } from "@/components/UI/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { Spinner } from "@/components/UI/spinner"
import { Pagination } from "@/components/Admin/AdminsTab/UI/Pagination"
import { BanComments } from "@/components/Admin/BansTab/BanComments"

const Badge = ({ children, className = '' }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>
)

const getStatusConfig = (status, t) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return { label: t('common.active'), className: 'bg-red-600 text-white' }
    case 'EXPIRED':
      return { label: t('common.expired'), className: 'bg-green-600 text-white' }
    case 'UNBANNED':
      return { label: t('common.unbanned'), className: 'bg-blue-600 text-white' }
    default:
      return { label: t('common.unknown'), className: 'bg-zinc-700 text-white' }
  }
}

export function BanList({ bans, loading, getAvatarUrl, getDisplayName, canEdit, canUnban, canRemove, canAddComment, onEdit, onUnban, onDelete, currentPage, totalPages, startIndex, total, onPageChange }) {
  const { t } = useI18n()
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6" style={{ color: 'var(--theme-primary)' }} />
      </div>
    )
  }

  if (bans.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">{t('admin_lists.no_bans_found')}</div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {bans.map((ban) => {
          const status = getStatusConfig(ban.status, t)
          return (
            <div key={ban.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <a href={`https://steamcommunity.com/profiles/${ban.steamId}`} target="_blank" rel="noopener noreferrer">
                    <Avatar className="size-10 shrink-0 hover:ring-2 transition-all cursor-pointer" style={{ '--tw-ring-color': 'var(--theme-primary)' }}>
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
                        <span className="text-sm text-zinc-500">{t('admin_lists.reason')}:</span>{' '}
                        <span className="text-base text-zinc-300">{ban.reason}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                      <span>
                        <span className="text-zinc-500">{t('admin_lists.duration')}:</span>{' '}
                        <span className="text-zinc-300">{ban.duration}</span>
                      </span>
                      {ban.ip && ban.ip !== '0' && (
                        <span>
                          <span className="text-zinc-500">{t('admin_lists.ip')}:</span>{' '}
                          <span className="text-zinc-300 font-mono text-xs">{ban.ip}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-zinc-500">
                      <span>{t('admin_lists.admin')}: <span className="text-zinc-300">{ban.admin}</span></span>
                      <span>{ban.date}</span>
                    </div>
                    {ban.status === 'UNBANNED' && ban.unbanReason && (
                      <div className="mt-2 pt-2 border-t border-zinc-700">
                        <div className="mb-1">
                          <span className="text-xs text-zinc-500">{t('admin_lists.unban_reason')}: </span>
                          <span className="text-xs text-blue-400">{ban.unbanReason}</span>
                        </div>
                        {ban.unbanAdmin && (
                          <div>
                            <span className="text-xs text-zinc-500">{t('admin_lists.admin')}: </span>
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
                    {t('admin_lists.edit')}
                  </Button>
                )}
                {ban.status === 'ACTIVE' && canUnban(ban) && (
                  <Button size="sm" variant="outline" onClick={() => onUnban(ban)} className="bg-zinc-900 border-zinc-700 text-green-400 hover:bg-zinc-700" >
                    <ShieldOff className="size-3 mr-1" />
                    {t('admin_lists.unban')}
                  </Button>
                )}
                {canRemove(ban) && (
                  <Button size="sm" variant="outline" onClick={() => onDelete(ban)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700" >
                    <Trash2 className="size-3 mr-1" />
                    {t('admin_lists.delete')}
                  </Button>
                )}
                {canAddComment && canAddComment() && (
                  <Button size="sm" variant="outline" onClick={() => { const event = new CustomEvent('showAddCommentForm', { detail: { banId: ban.id } }); window.dispatchEvent(event) }} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                    <MessageSquare className="size-3 mr-1" />
                    {t('admin_lists.add_comment') || 'Add comment'}
                  </Button>
                )}
              </div>
              <BanComments banId={ban.id} />
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