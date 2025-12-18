"use client"

import { useState } from 'react'
import { addToast } from "@heroui/react"
import { useAuth } from "@/contexts/AuthContext"
import { useI18n } from "@/contexts/I18nContext"
import { hasPermission } from "@/utils/permissions"
import { VolumeX, Plus, Search } from 'lucide-react'
import { createMute, deleteMute, unmuteMute } from "@/services/sanctions/mutes"
import { useMutes } from "@/hooks/useMutes"
import { Input } from "@/components/UI/input"
import { Button } from "@/components/UI/button"
import { MuteForm } from "@/components/Admin/MutesTab/MuteForm"
import { MuteList } from "@/components/Admin/MutesTab/MuteList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/UI/alert-dialog"

export function MutesTab() {
  const { hasFlag, flags, user } = useAuth()
  const { t } = useI18n()
  const { mutes, search, setSearch, currentPage, total, totalPages, startIndex, loading, getAvatarUrl, getDisplayName, handlePageChange, refetch } = useMutes()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    steamId: '',
    reason: '',
    duration: '60',
    type: 'MUTE'
  })

  const [deleteAlert, setDeleteAlert] = useState({ open: false, mute: null })
  const [unmuteAlert, setUnmuteAlert] = useState({ open: false, mute: null, reason: '' })

  const canView = hasFlag('@web/mute.view')
  const canAdd = hasFlag('@web/mute.add')

  const canEdit = (mute) => {
    if (!mute) return false
    if (mute.status === 'EXPIRED') return false
    return hasPermission(flags, '@web/mute.edit', true, mute.adminSteamId, user?.steamId)
  }

  const canUnmute = (mute) => {
    if (!mute) return false
    return hasPermission(flags, '@web/mute.unmute', true, mute.adminSteamId, user?.steamId)
  }

  const canRemove = (mute) => {
    if (!mute) return false
    return hasPermission(flags, '@web/mute.remove', true, mute.adminSteamId, user?.steamId)
  }

  const canAddComment = () => {
    return hasFlag('@web/mute.comment.add')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createMute(formData)
      addToast({ title: t('mutes.created_success'), color: 'success', variant: 'solid' })
      setDialogOpen(false)
      setFormData({ steamId: '', reason: '', duration: '60', type: 'MUTE' })
      refetch()
    } catch (error) {
      console.error('Error creating mute:', error)
      addToast({ title: error.message || t('mutes.save_error'), color: 'danger', variant: 'solid' })
    }
  }

  const handleUnmuteClick = (mute) => {
    if (!canUnmute(mute)) return
    setUnmuteAlert({ open: true, mute, reason: '' })
  }

  const handleUnmuteConfirm = async () => {
    const mute = unmuteAlert.mute
    try {
      await unmuteMute(mute.id, unmuteAlert.reason || undefined)
      addToast({ title: t('mutes.unmuted_success'), color: 'success', variant: 'solid' })
      refetch()
    } catch (error) {
      console.error('Error unmuting:', error)
      addToast({ title: error.message || t('mutes.unmute_error'), color: 'danger', variant: 'solid' })
    } finally {
      setUnmuteAlert({ open: false, mute: null, reason: '' })
    }
  }

  const handleDeleteClick = (mute) => {
    if (!canRemove(mute)) return
    setDeleteAlert({ open: true, mute })
  }

  const handleDeleteConfirm = async () => {
    const mute = deleteAlert.mute
    try {
      await deleteMute(mute.id)
      addToast({ title: t('mutes.deleted_success'), color: 'success', variant: 'solid' })
      refetch()
    } catch (error) {
      console.error('Error deleting mute:', error)
      addToast({ title: error.message || t('mutes.delete_error'), color: 'danger', variant: 'solid' })
    } finally {
      setDeleteAlert({ open: false, mute: null })
    }
  }

  const handleCancel = () => {
    setDialogOpen(false)
    setFormData({ steamId: '', reason: '', duration: '60', type: 'MUTE' })
  }

  if (!canView) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <VolumeX className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>{t('admin.mutes.no_permissions_view')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <VolumeX className="size-5" style={{ color: 'var(--theme-primary)' }} />
              <div>
                <CardTitle className="text-zinc-100">{t('admin.mutes.title')}</CardTitle>
                <p className="text-zinc-400 text-sm mt-1">{t('admin.mutes.description')}</p>
              </div>
            </div>
            {canAdd && (
              <Button onClick={() => setDialogOpen(true)} style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} className="hover:opacity-90" onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                <Plus className="size-4 mr-2" />
                {t('admin.mutes.new_mute')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input placeholder={t('admin.mutes.search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>

          <MuteList mutes={mutes} loading={loading} getAvatarUrl={getAvatarUrl} getDisplayName={(mute) => getDisplayName(mute.steamId, mute.player)} canEdit={canEdit} canUnmute={canUnmute} canRemove={canRemove} canAddComment={canAddComment} onEdit={() => {}} onUnmute={handleUnmuteClick} onDelete={handleDeleteClick} currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} total={total} onPageChange={handlePageChange} />
        </CardContent>
      </Card>

      <MuteForm open={dialogOpen} onOpenChange={setDialogOpen} formData={formData} setFormData={setFormData} onSubmit={handleSubmit} onCancel={handleCancel} />

      <AlertDialog open={unmuteAlert.open} onOpenChange={(open) => setUnmuteAlert({ open, mute: null, reason: '' })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">{t('admin.mutes.unmute_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t('admin.mutes.unmute_confirm_description')} <strong className="text-zinc-200">{unmuteAlert.mute?.player}</strong>? {t('admin.mutes.unmute_confirm_warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">{t('common.reason')} ({t('common.optional')})</label>
            <Input type="text" placeholder={t('admin.mutes.unmute_reason_placeholder')} value={unmuteAlert.reason} onChange={(e) => setUnmuteAlert({ ...unmuteAlert, reason: e.target.value })} className="w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUnmuteAlert({ open: false, mute: null, reason: '' })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUnmuteConfirm} className="bg-green-600 hover:bg-green-700 text-white">
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAlert.open} onOpenChange={(open) => setDeleteAlert({ open, mute: null })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">{t('admin.mutes.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t('admin.mutes.delete_confirm_description')} <strong className="text-zinc-200">{deleteAlert.mute?.player}</strong>? {t('admin.mutes.delete_confirm_warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ open: false, mute: null })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}