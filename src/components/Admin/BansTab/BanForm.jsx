"use client"

import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"
import { Button } from "@/components/UI/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"

const Textarea = ({ placeholder, value, onChange, className = '' }) => (
  <textarea placeholder={placeholder} value={value} onChange={onChange} rows={4} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] resize-none w-full ${className}`} />
)

const Select = ({ value, onChange, children, className = '' }) => (
  <select value={value} onChange={onChange} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] w-full ${className}`} >
    {children}
  </select>
)

export function BanForm({ open, onOpenChange, editingBan, formData, setFormData, onSubmit, onCancel }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{editingBan ? 'Editar Baneo' : 'Crear Nuevo Baneo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="steamId" className="text-zinc-300">SteamID64</Label>
            <Input id="steamId" placeholder="76561199074660131" value={formData.steamId} onChange={(e) => setFormData({ ...formData, steamId: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ip" className="text-zinc-300">Dirección IP (opcional)</Label>
            <Input id="ip" placeholder="192.168.1.1" value={formData.ip} onChange={(e) => setFormData({ ...formData, ip: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-zinc-300">Motivo</Label>
            <Textarea id="reason" placeholder="Describe el motivo del baneo..." value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-zinc-300">Duración</Label>
            <Select id="duration" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} >
              <option value="0">Permanente</option>
              <option value="60">1 hora</option>
              <option value="360">6 horas</option>
              <option value="720">12 horas</option>
              <option value="1440">1 día</option>
              <option value="4320">3 días</option>
              <option value="10080">1 semana</option>
              <option value="43200">1 mes</option>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-zinc-100">
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">
              {editingBan ? 'Guardar Cambios' : 'Crear Baneo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}