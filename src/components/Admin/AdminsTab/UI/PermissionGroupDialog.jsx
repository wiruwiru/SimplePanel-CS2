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
      immunity: editingGroup.immunity,
      flags: editingGroup.flags
    }
  }
  return {
    name: '#',
    immunity: 0,
    flags: []
  }
}

export function PermissionGroupDialog({ open, onOpenChange, editingGroup, permissions, onSuccess }) {
  const { t } = useI18n()
  const initialFormData = useMemo(() => getInitialFormData(editingGroup), [editingGroup])
  const [formData, setFormData] = useState(initialFormData)

  const handleNameChange = (value) => {
    if (!value.startsWith('#')) {
      value = '#' + value.replace(/^#+/, '')
    }
    setFormData({...formData, name: value})
  }

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
      const newData = getInitialFormData(editingGroup)
      setFormData(newData)
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editingGroup ? 'PATCH' : 'POST'
      const body = editingGroup ? { groupId: editingGroup.id, ...formData } : formData

      const response = await fetch('/api/admin/admins/permission-groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        addToast({ 
          title: editingGroup ? t('permissions.groups.updated_success') : t('permissions.groups.created_success'), 
          color: 'success', 
          variant: 'solid' 
        })
        onSuccess()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error saving permission group:', error)
      addToast({ title: t('permissions.groups.save_error'), color: 'danger', variant: 'solid' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{editingGroup ? t('permissions.groups.edit_title') : t('permissions.groups.new_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-zinc-300">{t('permissions.groups.name')}</Label>
              <Input id="groupName" placeholder={t('permissions.groups.name_placeholder')} value={formData.name} onChange={(e) => handleNameChange(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
              <p className="text-xs text-zinc-500">{t('permissions.groups.name_hint')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupImmunity" className="text-zinc-300">{t('permissions.groups.immunity')}</Label>
              <Input id="groupImmunity" type="number" min="0" max="100" value={formData.immunity} onChange={(e) => setFormData({...formData, immunity: parseInt(e.target.value) || 0})} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">{t('permissions.groups.permissions')}</Label>
            <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 max-h-64 overflow-y-auto space-y-2">
              {permissions.map(perm => (
                <Checkbox key={perm.flag} id={`group-${perm.flag}`} label={`${perm.flag} - ${perm.description}`} checked={formData.flags.includes(perm.flag)}
                  onChange={(checked) => {
                    if (checked) {
                      setFormData({...formData, flags: [...formData.flags, perm.flag]})
                    } else {
                      setFormData({...formData, flags: formData.flags.filter(f => f !== perm.flag)})
                    }
                  }} />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">{t('common.cancel')}</Button>
            <Button type="submit" className="text-white" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; }}>{editingGroup ? t('common.update') : t('common.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}