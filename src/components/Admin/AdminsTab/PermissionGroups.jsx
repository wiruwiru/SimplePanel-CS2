"use client"

import { useState } from 'react';
import { addToast } from "@heroui/react"
import { Plus, UserCog, Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/UI/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { PermissionGroupDialog } from "@/components/Admin/AdminsTab/UI/PermissionGroupDialog"

export function PermissionGroups({ groups, permissions, onRefresh }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)

  const handleNew = () => {
    setEditingGroup(null)
    setDialogOpen(true)
  }

  const handleEdit = (group) => {
    setEditingGroup(group)
    setDialogOpen(true)
  }

  const handleDelete = async (groupId) => {
    if (!confirm('¿Estás seguro de eliminar este grupo?')) return

    try {
      const response = await fetch(`/api/admin/admins/permission-groups?groupId=${groupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addToast({ title: 'Grupo eliminado', color: 'success', variant: 'solid' })
        onRefresh()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error deleting permission group:', error)
      addToast({ title: 'Error al eliminar grupo', color: 'danger', variant: 'solid' })
    }
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    setEditingGroup(null)
    onRefresh()
  }

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-zinc-100">Grupos de Permisos</CardTitle>
            <Button onClick={handleNew} size="sm" className="bg-[#FFB800] hover:bg-[#ce9300]">
              <Plus className="size-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {groups.map((group) => (
              <div key={group.id} className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCog className="size-5 text-blue-500" />
                      <span className="text-zinc-100 font-medium">{group.name}</span>
                    </div>
                    <div className="text-xs text-zinc-400">Miembros: {group.memberCount} • Inmunidad: {group.immunity}</div>
                    <div className="text-xs text-zinc-500 mt-1">{group.flags.length} permisos</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(group)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700 p-1.5" >
                      <Pencil className="size-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(group.id)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700 p-1.5" >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PermissionGroupDialog open={dialogOpen} onOpenChange={setDialogOpen} editingGroup={editingGroup} permissions={permissions} onSuccess={handleSuccess} />
    </>
  )
}