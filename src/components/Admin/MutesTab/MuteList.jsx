"use client"

import { Pencil, Trash2, Volume2, MessageSquare } from 'lucide-react'
import { useI18n } from "@/contexts/I18nContext"
import { Button } from "@/components/UI/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { Spinner } from "@/components/UI/spinner"
import { Pagination } from "@/components/Admin/AdminsTab/UI/Pagination"
import { MuteComments } from "@/components/Admin/MutesTab/MuteComments"

const getStatusConfig = (status, t) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return { label: t('common.active'), className: 'bg-red-600 text-white' }
    case 'EXPIRED':
      return { label: t('common.expired'), className: 'bg-green-600 text-white' }
    case 'UNMUTED':
      return { label: t('common.unmuted'), className: 'bg-blue-600 text-white' }
    default:
      return { label: t('common.unknown'), className: 'bg-zinc-700 text-white' }
  }
}

const getMuteTypeConfig = (type, t) => {
  switch (type?.toUpperCase()) {
    case 'GAG':
      return {
        label: t('mutes.gag'),
        icon: '💬',
        className: 'bg-orange-600 text-white'
      }
    case 'MUTE':
      return {
        label: t('mutes.mute'),
        icon: '🎤',
        className: 'bg-purple-600 text-white'
      }
    case 'SILENCE':
      return {
        label: t('mutes.silence'),
        icon: '🔇',
        className: 'bg-pink-600 text-white'
      }
    default:
      return {
        label: t('common.unknown'),
        icon: '❓',
        className: 'bg-zinc-700 text-white'
      }
  }
}

const StatusBadge = ({ status, t }) => {
  const config = getStatusConfig(status, t)
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

const MuteTypeBadge = ({ type, t }) => {
  const config = getMuteTypeConfig(type, t)
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${config.className}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}

export function MuteList({ mutes, loading, getAvatarUrl, getDisplayName, canEdit, canUnmute, canRemove, canAddComment, onEdit, onUnmute, onDelete, currentPage, totalPages, startIndex, total, onPageChange }) {
  const { t } = useI18n()
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6" style={{ color: 'var(--theme-primary)' }} />
      </div>
    )
  }

  if (mutes.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">{t('admin_lists.no_mutes_found')}</div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {mutes.map((mute) => (
          <div key={mute.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1">
                <a href={`https://steamcommunity.com/profiles/${mute.steamId}`} target="_blank" rel="noopener noreferrer">
                  <Avatar className="size-10 shrink-0 hover:ring-2 transition-all cursor-pointer" style={{ '--tw-ring-color': 'var(--theme-primary)' }}>
                    <AvatarImage src={getAvatarUrl(mute.steamId)} alt={mute.player} />
                    <AvatarFallback>{mute.player.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </a>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-zinc-100 font-medium">{getDisplayName(mute)}</span>
                    <span className="text-zinc-500 text-xs font-mono">({mute.steamId})</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-400 mt-2 mb-1">
                    <span>
                      <span className="text-sm text-zinc-500">{t('admin_lists.reason')}:</span>{' '}
                      <span className="text-base text-zinc-300">{mute.reason}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                    <span>
                      <span className="text-zinc-500">{t('admin_lists.duration')}:</span>{' '}
                      <span className="text-zinc-300">{mute.duration}</span>
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-zinc-500">
                    <span>{t('admin_lists.admin')}: <span className="text-zinc-300">{mute.admin}</span></span>
                    <span>{mute.date}</span>
                  </div>
                  {mute.status === 'UNMUTED' && mute.unmuteReason && (
                    <div className="mt-2 pt-2 border-t border-zinc-700">
                      <div className="mb-1">
                        <span className="text-xs text-zinc-500">{t('admin_lists.unmute_reason')}: </span>
                        <span className="text-xs text-blue-400">{mute.unmuteReason}</span>
                      </div>
                      {mute.unmuteAdmin && (
                        <div>
                          <span className="text-xs text-zinc-500">{t('admin_lists.admin')}: </span>
                          <span className="text-xs text-zinc-300">{mute.unmuteAdmin}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <MuteTypeBadge type={mute.type} t={t} />
                <StatusBadge status={mute.status} t={t} />
              </div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {canEdit(mute) && (
                <Button size="sm" variant="outline" onClick={() => onEdit(mute)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
                  <Pencil className="size-3 mr-1" />
                  {t('admin_lists.edit')}
                </Button>
              )}
              {mute.status === 'ACTIVE' && canUnmute(mute) && (
                <Button size="sm" variant="outline" onClick={() => onUnmute(mute)} className="bg-zinc-900 border-zinc-700 text-green-400 hover:bg-zinc-700" >
                  <Volume2 className="size-3 mr-1" />
                  {t('admin_lists.unmute')}
                </Button>
              )}
              {canRemove(mute) && (
                <Button size="sm" variant="outline" onClick={() => onDelete(mute)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700" >
                  <Trash2 className="size-3 mr-1" />
                  {t('admin_lists.delete')}
                </Button>
              )}
              {canAddComment && canAddComment() && (
                <Button size="sm" variant="outline" onClick={() => { const event = new CustomEvent('showAddCommentForm', { detail: { muteId: mute.id } }); window.dispatchEvent(event) }} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                  <MessageSquare className="size-3 mr-1" />
                  {t('admin_lists.add_comment') || 'Add comment'}
                </Button>
              )}
            </div>
            <MuteComments muteId={mute.id} />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} total={total} onPageChange={onPageChange} />
      )}
    </>
  )
}