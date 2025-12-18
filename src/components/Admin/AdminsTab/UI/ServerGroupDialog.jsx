"use client"

import { useState, useEffect, useMemo } from 'react'
import { addToast } from "@heroui/react"
import { useI18n } from "@/contexts/I18nContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"

const Checkbox = ({ checked, onChange, id, label }) => (
  <div className="flex items-center space-x-2">
    <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded focus:ring-ring focus:ring-2 cursor-pointer" style={{ color: 'var(--theme-primary)' }} />
    {label && <label htmlFor={id} className="text-sm text-zinc-300 cursor-pointer">{label}</label>}
  </div>
);

const getInitialFormData = (editingGroup) => {
  if (editingGroup) {
    return {
      name: editingGroup.name,
      description: editingGroup.description || '',
      color: editingGroup.color,
      serverIds: editingGroup.servers.map(s => s.id)
    }
  }
  return {
    name: '',
    description: '',
    color: '#6B7280',
    serverIds: []
  }
}

export function ServerGroupDialog({ open, onOpenChange, editingGroup, allServers, onSuccess }) {
  const { t } = useI18n()
  const initialFormData = useMemo(() => getInitialFormData(editingGroup), [editingGroup])
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        setFormData(initialFormData)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [open, initialFormData])
  
  const handleOpenChange = (isOpen) => {
    if (isOpen) {
      setFormData(getInitialFormData(editingGroup))
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const method = editingGroup ? 'PATCH' : 'POST'
      const body = editingGroup ? { groupId: editingGroup.id, ...formData } : formData
      
      const response = await fetch('/api/admin/admins/server-groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        addToast({ 
          title: editingGroup ? t('permissions.server_groups.updated_success') : t('permissions.server_groups.created_success'), 
          color: 'success', 
          variant: 'solid' 
        })
        onSuccess()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error saving server group:', error)
      addToast({ title: t('permissions.server_groups.save_error'), color: 'danger', variant: 'solid' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{editingGroup ? t('permissions.server_groups.edit_title') : t('permissions.server_groups.new_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serverGroupName" className="text-zinc-300">{t('permissions.server_groups.name')}</Label>
            <Input id="serverGroupName" placeholder={t('permissions.server_groups.name_placeholder')} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serverGroupDesc" className="text-zinc-300">{t('permissions.server_groups.description')}</Label>
            <Input id="serverGroupDesc" placeholder={t('permissions.server_groups.description_placeholder')} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serverGroupColor" className="text-zinc-300">{t('permissions.server_groups.color')}</Label>
            <div className="flex gap-2">
              <Input id="serverGroupColor" type="color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="bg-zinc-800 border-zinc-700 w-20 h-10 cursor-pointer" />
              <Input type="text" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100 flex-1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">{t('permissions.server_groups.servers')}</Label>
            <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 max-h-48 overflow-y-auto space-y-2">
              {allServers.length > 0 ? (
                allServers.map(server => (
                  <Checkbox key={server.id} id={`server-${server.id}`} label={`${server.name} (${server.address})`} checked={formData.serverIds.includes(server.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setFormData({...formData, serverIds: [...formData.serverIds, server.id]})
                      } else {
                        setFormData({...formData, serverIds: formData.serverIds.filter(id => id !== server.id)})
                      }
                    }} />
                ))
              ) : (
                <p className="text-zinc-500 text-sm">{t('permissions.server_groups.no_servers_available')}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">{t('common.cancel')}</Button>
            <Button type="submit" className="hover:opacity-90" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>{editingGroup ? t('common.update') : t('common.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}