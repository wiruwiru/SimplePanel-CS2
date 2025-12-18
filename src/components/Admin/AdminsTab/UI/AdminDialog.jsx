"use client"

import { useState, useEffect, useMemo } from 'react';
import { addToast } from "@heroui/react"
import { useI18n } from "@/contexts/I18nContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"

const Select = ({ value, onChange, children, className = '' }) => (
  <select value={value} onChange={onChange} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full ${className}`}>{children}</select>
);

const Checkbox = ({ checked, onChange, id, label }) => (
  <div className="flex items-center space-x-2">
    <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded focus:ring-ring focus:ring-2 cursor-pointer" style={{ color: 'var(--theme-primary)' }} />
    {label && <label htmlFor={id} className="text-sm text-zinc-300 cursor-pointer">{label}</label>}
  </div>
);

const getInitialFormData = (editingAdmin, serverGroups) => {
  if (editingAdmin) {
    let serverGroup = 'all';
    
    if (editingAdmin.servers && editingAdmin.servers.length > 0) {
      const adminServerIds = editingAdmin.servers.map(s => s.id).sort();

      const allServersCount = serverGroups.reduce((total, group) => {
        return total + (group.servers ? group.servers.length : 0);
      }, 0);

      const allServerIds = new Set();
      serverGroups.forEach(group => {
        if (group.servers) {
          group.servers.forEach(server => allServerIds.add(server.id));
        }
      });
      
      const hasAllServers = adminServerIds.length === allServerIds.size &&  adminServerIds.every(id => allServerIds.has(id));
      if (!hasAllServers) {
        const matchingGroup = serverGroups.find(group => {
          if (!group.servers || group.servers.length === 0) return false;
          const groupServerIds = group.servers.map(s => s.id).sort();
          return groupServerIds.length === adminServerIds.length &&
                 groupServerIds.every((id, idx) => id === adminServerIds[idx]);
        });
        
        if (matchingGroup) {
          serverGroup = String(matchingGroup.id);
        } else {
          serverGroup = 'custom';
        }
      }
    }
    
    return {
      steamId: editingAdmin.steamId || '',
      name: editingAdmin.name || '',
      permissionGroup: editingAdmin.groupId || null,
      serverGroup: serverGroup,
      customFlags: Array.isArray(editingAdmin.flags) ? editingAdmin.flags : [],
      immunity: editingAdmin.immunity || 0
    }
  }
  return {
    steamId: '',
    name: '',
    permissionGroup: null,
    serverGroup: 'all',
    customFlags: [],
    immunity: 0
  }
}

export function AdminDialog({ open, onOpenChange, editingAdmin, permissions, permissionGroups, serverGroups, onSuccess }) {
  const { t } = useI18n()
  const initialFormData = useMemo(() => getInitialFormData(editingAdmin, serverGroups), [editingAdmin, serverGroups])
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
      setFormData(getInitialFormData(editingAdmin, serverGroups))
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const method = editingAdmin ? 'PATCH' : 'POST'
      const response = await fetch('/api/admin/admins', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steamId: formData.steamId,
          name: formData.name,
          groupId: formData.permissionGroup,
          serverGroupId: formData.serverGroup,
          flags: formData.customFlags,
          immunity: formData.immunity
        })
      })

      if (response.ok) {
        addToast({ 
          title: editingAdmin ? 'Administrador actualizado' : 'Administrador creado', 
          color: 'success', 
          variant: 'solid' 
        })
        onSuccess()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error saving admin:', error)
      addToast({ title: t('admin.admins.save_error'), color: 'danger', variant: 'solid' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{editingAdmin ? t('admin.admins.edit_admin') : t('admin.admins.new_admin_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="steamId" className="text-zinc-300">{t('admin.admins.steamid64')}</Label>
              <Input id="steamId" placeholder="76561199074660131" value={formData.steamId} onChange={(e) => setFormData({...formData, steamId: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required disabled={!!editingAdmin} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">{t('admin.admins.name')}</Label>
              <Input id="name" placeholder={t('admin.admins.name_placeholder')} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="permGroup" className="text-zinc-300">{t('admin.admins.group')}</Label>
              <Select id="permGroup" value={formData.permissionGroup || ''} onChange={(e) => setFormData({...formData, permissionGroup: e.target.value ? parseInt(e.target.value) : null})} >
                <option value="">Ninguno</option>
                {permissionGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serverGroup" className="text-zinc-300">{t('admin.admins.server_group')}</Label>
              <Select id="serverGroup" value={formData.serverGroup} onChange={(e) => setFormData({...formData, serverGroup: e.target.value})} >
                <option value="all">{t('admin.admins.all_servers')}</option>
                {serverGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="immunity" className="text-zinc-300">{t('permissions.groups.immunity')}</Label>
            <Input id="immunity" type="number" min="0" max="100" value={formData.immunity} onChange={(e) => setFormData({...formData, immunity: parseInt(e.target.value) || 0})} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">{t('admin.admins.additional_flags')}</Label>
            <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 max-h-48 overflow-y-auto space-y-2">
              {permissions.map(perm => (
                <Checkbox key={perm.flag} id={perm.flag} label={`${perm.flag} - ${perm.description}`} checked={formData.customFlags.includes(perm.flag)}
                  onChange={(checked) => {
                    if (checked) {
                      setFormData({...formData, customFlags: [...formData.customFlags, perm.flag]})
                    } else {
                      setFormData({...formData, customFlags: formData.customFlags.filter(f => f !== perm.flag)})
                    }
                  }} />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">{t('common.cancel')}</Button>
            <Button type="submit" className="hover:opacity-90" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>{editingAdmin ? t('common.update') : t('common.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}