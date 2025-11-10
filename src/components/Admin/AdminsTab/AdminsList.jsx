"use client"

import { useState } from 'react';
import { addToast } from "@heroui/react"
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/UI/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { AdminDialog } from "@/components/Admin/AdminsTab/UI/AdminDialog"

const Badge = ({ children, className = '' }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>
);

export function AdminsList({ admins, profiles, permissions, permissionGroups, serverGroups, onRefresh }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)

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

  const handleDelete = async (steamId) => {
    if (!confirm('¿Estás seguro de eliminar este administrador?')) return

    try {
      const response = await fetch(`/api/admin/admins?steamId=${steamId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addToast({ title: 'Administrador eliminado', color: 'success', variant: 'solid' })
        onRefresh()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      addToast({ title: 'Error al eliminar administrador', color: 'danger', variant: 'solid' })
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
            <CardTitle className="text-zinc-100">Administradores</CardTitle>
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
                          {admin.flags.length > 3 && ` +${admin.flags.length - 3} más`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(admin)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                      <Pencil className="size-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(admin.steamId)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700">
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

      <AdminDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingAdmin={editingAdmin}
        permissions={permissions}
        permissionGroups={permissionGroups}
        serverGroups={serverGroups}
        onSuccess={handleSuccess}
      />
    </>
  )
}