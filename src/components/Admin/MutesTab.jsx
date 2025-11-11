"use client"

import { useState } from 'react'
import { addToast } from "@heroui/react"
import { useAuth } from "@/contexts/AuthContext"
import { hasPermission } from "@/lib/permission-utils"
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
  const { mutes, search, setSearch, currentPage, total, totalPages, startIndex, loading, getAvatarUrl, getDisplayName, handlePageChange, refetch } = useMutes()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    steamId: '',
    reason: '',
    duration: '60',
    type: 'MUTE'
  })

  const [deleteAlert, setDeleteAlert] = useState({ open: false, mute: null })
  const [unmuteAlert, setUnmuteAlert] = useState({ open: false, mute: null })

  const canView = hasFlag('@web/mute.view')
  const canAdd = hasFlag('@web/mute.add')

  const canEdit = (mute) => {
    if (!mute) return false
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createMute(formData)
      addToast({ title: 'Muteo creado correctamente', color: 'success', variant: 'solid' })
      setDialogOpen(false)
      setFormData({ steamId: '', reason: '', duration: '60', type: 'MUTE' })
      refetch()
    } catch (error) {
      console.error('Error creating mute:', error)
      addToast({ title: error.message || 'Error al crear muteo', color: 'danger', variant: 'solid' })
    }
  }

  const handleUnmuteClick = (mute) => {
    if (!canUnmute(mute)) return
    setUnmuteAlert({ open: true, mute })
  }

  const handleUnmuteConfirm = async () => {
    const mute = unmuteAlert.mute
    try {
      await unmuteMute(mute.id)
      addToast({ title: 'Usuario desmuteado correctamente', color: 'success', variant: 'solid' })
      refetch()
    } catch (error) {
      console.error('Error unmuting:', error)
      addToast({ title: error.message || 'Error al desmutear usuario', color: 'danger', variant: 'solid' })
    } finally {
      setUnmuteAlert({ open: false, mute: null })
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
      addToast({ title: 'Muteo eliminado correctamente', color: 'success', variant: 'solid' })
      refetch()
    } catch (error) {
      console.error('Error deleting mute:', error)
      addToast({ title: error.message || 'Error al eliminar muteo', color: 'danger', variant: 'solid' })
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
            <p>No tienes permisos para ver los muteos.</p>
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
              <VolumeX className="size-5 text-[#FFB800]" />
              <div>
                <CardTitle className="text-zinc-100">Gestión de Muteos</CardTitle>
                <p className="text-zinc-400 text-sm mt-1">Gestiona los muteos (gag, mute, silence) de los jugadores</p>
              </div>
            </div>
            {canAdd && (
              <Button onClick={() => setDialogOpen(true)} className="bg-[#FFB800] hover:bg-[#ce9300]">
                <Plus className="size-4 mr-2" />
                Nuevo Muteo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input placeholder="Buscar por nombre o SteamID64..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>

          <MuteList mutes={mutes} loading={loading} getAvatarUrl={getAvatarUrl} getDisplayName={(mute) => getDisplayName(mute.steamId, mute.player)} canEdit={canEdit} canUnmute={canUnmute} canRemove={canRemove} onEdit={() => {}} onUnmute={handleUnmuteClick} onDelete={handleDeleteClick} currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} total={total} onPageChange={handlePageChange} />
        </CardContent>
      </Card>

      <MuteForm open={dialogOpen} onOpenChange={setDialogOpen} formData={formData} setFormData={setFormData} onSubmit={handleSubmit} onCancel={handleCancel} />

      <AlertDialog open={unmuteAlert.open} onOpenChange={(open) => setUnmuteAlert({ open, mute: null })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">¿Desmutear usuario?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              ¿Estás seguro de que deseas desmutear a <strong className="text-zinc-200">{unmuteAlert.mute?.player}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUnmuteAlert({ open: false, mute: null })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUnmuteConfirm} className="bg-green-600 hover:bg-green-700 text-white">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAlert.open} onOpenChange={(open) => setDeleteAlert({ open, mute: null })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">¿Eliminar muteo?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              ¿Estás seguro de que deseas eliminar el muteo de <strong className="text-zinc-200">{deleteAlert.mute?.player}</strong>? Esta acción eliminará permanentemente el registro del muteo de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ open: false, mute: null })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
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