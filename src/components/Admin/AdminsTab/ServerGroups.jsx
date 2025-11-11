"use client"

import { useState } from 'react';
import { addToast } from "@heroui/react"
import { Plus, Server, Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/UI/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { ServerGroupDialog } from "@/components/Admin/AdminsTab/UI/ServerGroupDialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/UI/alert-dialog"

export function ServerGroups({ groups, allServers, onRefresh }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [deleteAlert, setDeleteAlert] = useState({ open: false, group: null })

  const handleNew = () => {
    setEditingGroup(null)
    setDialogOpen(true)
  }

  const handleEdit = (group) => {
    setEditingGroup(group)
    setDialogOpen(true)
  }

  const handleDeleteClick = (group) => {
    setDeleteAlert({ open: true, group })
  }

  const handleDeleteConfirm = async () => {
    const group = deleteAlert.group
    try {
      const response = await fetch(`/api/admin/admins/server-groups?groupId=${group.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addToast({ title: 'Grupo de servidores eliminado', color: 'success', variant: 'solid' })
        onRefresh()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error deleting server group:', error)
      addToast({ title: 'Error al eliminar grupo de servidores', color: 'danger', variant: 'solid' })
    } finally {
      setDeleteAlert({ open: false, group: null })
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
            <CardTitle className="text-zinc-100">Grupos de Servidores</CardTitle>
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
                      <Server className="size-4" style={{ color: group.color }} />
                      <span className="text-zinc-100 font-medium">{group.name}</span>
                    </div>
                    <div className="text-xs text-zinc-400">{group.description}</div>
                    <div className="text-xs text-zinc-500 mt-1">{group.serverCount} servidor{group.serverCount !== 1 ? 'es' : ''}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(group)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700 p-1.5" >
                      <Pencil className="size-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteClick(group)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700 p-1.5" >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ServerGroupDialog open={dialogOpen} onOpenChange={setDialogOpen} editingGroup={editingGroup} allServers={allServers} onSuccess={handleSuccess} />

      <AlertDialog open={deleteAlert.open} onOpenChange={(open) => setDeleteAlert({ open, group: null })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">¿Eliminar grupo de servidores?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              ¿Estás seguro de que deseas eliminar el grupo <strong className="text-zinc-200">{deleteAlert.group?.name}</strong>? Todos los administradores asignados a este grupo perderán el acceso a estos servidores. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ open: false, group: null })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
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