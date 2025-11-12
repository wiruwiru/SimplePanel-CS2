"use client"

import { useState } from 'react';
import { addToast } from "@heroui/react"
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { Button } from "@/components/UI/button"
import { AdminDialog } from "@/components/Admin/AdminsTab/UI/AdminDialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/UI/alert-dialog"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/UI/hover-card"
import { deleteAdmin } from "@/services/admins/admins"

const Badge = ({ children, className = '' }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>
);

export function AdminsList({ admins, profiles, permissions, permissionGroups, serverGroups, onRefresh }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [deleteAlert, setDeleteAlert] = useState({ open: false, admin: null })

  const getAvatarUrl = (steamId) => {
    return profiles[steamId]?.avatarUrl || "/placeholder.svg?height=40&width=40"
  }

  const getDisplayName = (admin) => {
    return profiles[admin.steamId]?.displayName || admin.name
  }

  const handleEdit = (admin) => {
    setEditingAdmin(admin)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setEditingAdmin(null)
    setDialogOpen(true)
  }

  const handleDeleteClick = (admin) => {
    setDeleteAlert({ open: true, admin })
  }

  const handleDeleteConfirm = async () => {
    const admin = deleteAlert.admin
    try {
      await deleteAdmin(admin.steamId)
      addToast({ title: 'Administrador eliminado', color: 'success', variant: 'solid' })
      onRefresh()
    } catch (error) {
      console.error('Error deleting admin:', error)
      addToast({ title: error.message || 'Error al eliminar administrador', color: 'danger', variant: 'solid' })
    } finally {
      setDeleteAlert({ open: false, admin: null })
    }
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    setEditingAdmin(null)
    onRefresh()
  }

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-[#FFB800]" />
              <div>
                <CardTitle className="text-zinc-100">Administradores</CardTitle>
                <p className="text-zinc-400 text-sm mt-1">Gestiona administradores, grupos de permisos y flags personalizados</p>
              </div>
            </div>
            <Button onClick={handleNew} className="bg-[#FFB800] hover:bg-[#ce9300]">
              <Plus className="size-4 mr-2" />
              Nuevo Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.steamId} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage src={getAvatarUrl(admin.steamId)} alt={admin.name} />
                      <AvatarFallback>{admin.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-zinc-100 font-medium">{getDisplayName(admin)}</span>
                        <Badge className="bg-purple-600 text-white">{admin.group}</Badge>
                        <Badge className="bg-blue-600 text-white">{admin.immunity}</Badge>
                      </div>
                      <div className="text-zinc-500 text-sm font-mono">{admin.steamId}</div>
                      {admin.flags.length > 0 && (
                        <div className="text-zinc-400 text-xs mt-1">
                          Permisos: {admin.flags.slice(0, 3).join(', ')}
                          {admin.flags.length > 3 && (
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <span className="cursor-pointer hover:text-[#FFB800] transition-colors"> +{admin.flags.length - 3} más</span>
                              </HoverCardTrigger>
                              <HoverCardContent className="bg-zinc-800 border-zinc-700 text-zinc-100 w-80">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-zinc-100 mb-2">Todos los permisos ({admin.flags.length})</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {admin.flags.map((flag, index) => (
                                      <span key={index} className="px-2 py-1 bg-zinc-700 text-zinc-200 rounded text-xs font-mono">
                                        {flag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(admin)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                      <Pencil className="size-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteClick(admin)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700">
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {admins.length === 0 && (
              <div className="text-center py-8 text-zinc-400">No hay administradores registrados</div>
            )}
          </div>
        </CardContent>
      </Card>

      <AdminDialog open={dialogOpen} onOpenChange={setDialogOpen} editingAdmin={editingAdmin} permissions={permissions} permissionGroups={permissionGroups} serverGroups={serverGroups} onSuccess={handleSuccess} />

      <AlertDialog open={deleteAlert.open} onOpenChange={(open) => setDeleteAlert({ open, admin: null })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">¿Eliminar administrador?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              ¿Estás seguro de que deseas eliminar a <strong className="text-zinc-200">{deleteAlert.admin?.name}</strong> como administrador? Esta acción eliminará todos sus permisos y accesos en todos los servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ open: false, admin: null })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
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