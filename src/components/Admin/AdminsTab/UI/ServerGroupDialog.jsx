"use client"

import { useState, useEffect, useMemo } from 'react';
import { addToast } from "@heroui/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"

const Checkbox = ({ checked, onChange, id, label }) => (
  <div className="flex items-center space-x-2">
    <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 text-[#FFB800] bg-zinc-800 border-zinc-700 rounded focus:ring-[#FFB800] focus:ring-2 cursor-pointer" />
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
          title: editingGroup ? 'Grupo actualizado' : 'Grupo creado', 
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
      addToast({ title: 'Error al guardar grupo de servidores', color: 'danger', variant: 'solid' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{editingGroup ? 'Editar Grupo de Servidores' : 'Nuevo Grupo de Servidores'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serverGroupName" className="text-zinc-300">Nombre del Grupo</Label>
            <Input id="serverGroupName" placeholder="Ej: Retakes" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serverGroupDesc" className="text-zinc-300">Descripción</Label>
            <Input id="serverGroupDesc" placeholder="Descripción del grupo" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serverGroupColor" className="text-zinc-300">Color</Label>
            <div className="flex gap-2">
              <Input id="serverGroupColor" type="color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="bg-zinc-800 border-zinc-700 w-20 h-10 cursor-pointer" />
              <Input type="text" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100 flex-1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Servidores</Label>
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
                <p className="text-zinc-500 text-sm">No hay servidores disponibles</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">Cancelar</Button>
            <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">{editingGroup ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}