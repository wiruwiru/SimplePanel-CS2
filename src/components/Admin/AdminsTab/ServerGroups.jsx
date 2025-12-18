"use client"

import { useState } from 'react'
import { Plus, Server, Pencil, Trash2 } from 'lucide-react'
import { addToast } from "@heroui/react"
import { useI18n } from "@/contexts/I18nContext"
import { Button } from "@/components/UI/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/UI/alert-dialog"
import { ServerGroupDialog } from "@/components/Admin/AdminsTab/UI/ServerGroupDialog"

export function ServerGroups({ groups, allServers, onRefresh }) {
  const { t } = useI18n()
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
        addToast({ title: t('permissions.server_groups.deleted_success'), color: 'success', variant: 'solid' })
        onRefresh()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error deleting server group:', error)
      addToast({ title: t('permissions.server_groups.delete_error'), color: 'danger', variant: 'solid' })
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
            <CardTitle className="text-zinc-100">{t('permissions.server_groups.title')}</CardTitle>
            <Button 
              onClick={handleNew} 
              size="sm" 
              className="text-white" 
              style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} 
              onMouseEnter={(e) => { 
                e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; 
              }} 
              onMouseLeave={(e) => { 
                e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; 
              }}
            >
              <Plus className="size-4 mr-2" />
              {t('permissions.server_groups.new')}
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
                    <div className="text-xs text-zinc-500 mt-1">{group.serverCount} {group.serverCount !== 1 ? t('permissions.server_groups.servers_plural') : t('permissions.server_groups.server')}</div>
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
            <AlertDialogTitle className="text-zinc-100">{t('permissions.server_groups.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t('permissions.server_groups.delete_confirm_description')} <strong className="text-zinc-200">{deleteAlert.group?.name}</strong>? {t('permissions.server_groups.delete_confirm_warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ open: false, group: null })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
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