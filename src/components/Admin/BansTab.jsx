"use client"

import { useState } from 'react'
import { addToast } from "@heroui/react"
import { useAuth } from "@/contexts/AuthContext"
import { hasPermission } from "@/utils/permissions"
import { Ban, Plus, Search } from 'lucide-react'
import { createBan, updateBan, deleteBan, unbanBan } from "@/services/sanctions/bans"
import { useBans } from "@/hooks/useBans"
import { Input } from "@/components/UI/input"
import { Button } from "@/components/UI/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/UI/alert-dialog"
import { BanForm } from "./BansTab/BanForm"
import { BanList } from "./BansTab/BanList"

export function BansTab() {
  const { hasFlag, flags, user } = useAuth()
  const { bans, search, setSearch, currentPage, total, totalPages, startIndex, loading, getAvatarUrl, getDisplayName, handlePageChange, refetch } = useBans()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBan, setEditingBan] = useState(null)
  const [formData, setFormData] = useState({
    steamId: '',
    ip: '',
    reason: '',
    duration: '0'
  })

  const [deleteAlert, setDeleteAlert] = useState({ open: false, ban: null })
  const [unbanAlert, setUnbanAlert] = useState({ open: false, ban: null, reason: '' })

  const canView = hasFlag('@web/ban.view')
  const canAdd = hasFlag('@web/ban.add')

  const canEdit = (ban) => {
    if (!ban) return false
    if (ban.status === 'EXPIRED') return false
    return hasPermission(flags, '@web/ban.edit', true, ban.adminSteamId, user?.steamId)
  }

  const canUnban = (ban) => {
    if (!ban) return false
    return hasPermission(flags, '@web/ban.unban', true, ban.adminSteamId, user?.steamId)
  }

  const canRemove = (ban) => {
    if (!ban) return false
    return hasPermission(flags, '@web/ban.remove', true, ban.adminSteamId, user?.steamId)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingBan) {
        await updateBan(editingBan.id, formData)
        addToast({ title: 'Baneo actualizado correctamente', color: 'success', variant: 'solid' })
      } else {
        await createBan(formData)
        addToast({ title: 'Baneo creado correctamente', color: 'success', variant: 'solid' })
      }
      setDialogOpen(false)
      setEditingBan(null)
      setFormData({ steamId: '', ip: '', reason: '', duration: '0' })
      refetch()
    } catch (error) {
      console.error('Error saving ban:', error)
      addToast({ title: error.message || 'Error al guardar baneo', color: 'danger', variant: 'solid' })
    }
  }

  const handleEdit = (ban) => {
    if (!canEdit(ban)) return
    setEditingBan(ban)
    setFormData({
      steamId: ban.steamId,
      ip: ban.ip || '',
      reason: ban.reason,
      duration: ban.duration === 'Permanente' ? '0' : '60'
    })
    setDialogOpen(true)
  }

  const handleUnbanClick = (ban) => {
    if (!canUnban(ban)) return
    setUnbanAlert({ open: true, ban, reason: '' })
  }

  const handleUnbanConfirm = async () => {
    const ban = unbanAlert.ban
    try {
      await unbanBan(ban.id, unbanAlert.reason || undefined)
      addToast({ title: 'Usuario desbaneado correctamente', color: 'success', variant: 'solid' })
      refetch()
    } catch (error) {
      console.error('Error unbanning:', error)
      addToast({ title: error.message || 'Error al desbanear usuario', color: 'danger', variant: 'solid' })
    } finally {
      setUnbanAlert({ open: false, ban: null, reason: '' })
    }
  }

  const handleDeleteClick = (ban) => {
    if (!canRemove(ban)) return
    setDeleteAlert({ open: true, ban })
  }

  const handleDeleteConfirm = async () => {
    const ban = deleteAlert.ban
    try {
      await deleteBan(ban.id)
      addToast({ title: 'Baneo eliminado correctamente', color: 'success', variant: 'solid' })
      refetch()
    } catch (error) {
      console.error('Error deleting ban:', error)
      addToast({ title: error.message || 'Error al eliminar baneo', color: 'danger', variant: 'solid' })
    } finally {
      setDeleteAlert({ open: false, ban: null })
    }
  }

  const handleNew = () => {
    setEditingBan(null)
    setFormData({ steamId: '', ip: '', reason: '', duration: '0' })
    setDialogOpen(true)
  }

  const handleCancel = () => {
    setDialogOpen(false)
    setEditingBan(null)
    setFormData({ steamId: '', ip: '', reason: '', duration: '0' })
  }

  if (!canView) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <Ban className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>No tienes permisos para ver los baneos.</p>
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
              <Ban className="size-5" style={{ color: 'var(--theme-primary)' }} />
              <div>
                <CardTitle className="text-zinc-100">Gestión de Baneos</CardTitle>
                <p className="text-zinc-400 text-sm mt-1">Gestiona los baneos de los jugadores en los servidores</p>
              </div>
            </div>
            {canAdd && (
              <Button onClick={handleNew} style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} className="hover:opacity-90" onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                <Plus className="size-4 mr-2" />
                Nuevo Baneo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input placeholder="Buscar por nombre, SteamID64 o IP..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>

          <BanList bans={bans} loading={loading} getAvatarUrl={getAvatarUrl} getDisplayName={(ban) => getDisplayName(ban.steamId, ban.player)} canEdit={canEdit} canUnban={canUnban} canRemove={canRemove} onEdit={handleEdit} onUnban={handleUnbanClick} onDelete={handleDeleteClick} currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} total={total} onPageChange={handlePageChange} />
        </CardContent>
      </Card>

      <BanForm open={dialogOpen} onOpenChange={setDialogOpen} editingBan={editingBan} formData={formData} setFormData={setFormData} onSubmit={handleSubmit} onCancel={handleCancel} />

      <AlertDialog open={unbanAlert.open} onOpenChange={(open) => setUnbanAlert({ open, ban: null, reason: '' })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">¿Desbanear usuario?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              ¿Estás seguro de que deseas desbanear a <strong className="text-zinc-200">{unbanAlert.ban?.player}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">Motivo del desbaneo (opcional)</label>
            <Input type="text" placeholder="Ej: SS Realizada, no se le encontró nada." value={unbanAlert.reason} onChange={(e) => setUnbanAlert({ ...unbanAlert, reason: e.target.value })} className="w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUnbanAlert({ open: false, ban: null, reason: '' })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUnbanConfirm} className="bg-green-600 hover:bg-green-700 text-white">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAlert.open} onOpenChange={(open) => setDeleteAlert({ open, ban: null })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">¿Eliminar baneo?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              ¿Estás seguro de que deseas eliminar el baneo de <strong className="text-zinc-200">{deleteAlert.ban?.player}</strong>? Esta acción eliminará permanentemente el registro del baneo de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ open: false, ban: null })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}