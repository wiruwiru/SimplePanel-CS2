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

export function MuteForm({ open, onOpenChange, formData, setFormData, onSubmit, onCancel }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Crear Nuevo Muteo</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="steamId" className="text-zinc-300">SteamID64</Label>
            <Input id="steamId" placeholder="76561199074660131" value={formData.steamId} onChange={(e) => setFormData({ ...formData, steamId: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" required  />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className="text-zinc-300">Tipo de Muteo</Label>
            <Select id="type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} >
              <option value="MUTE">Mute (Voz)</option>
              <option value="GAG">Gag (Chat de texto)</option>
              <option value="SILENCE">Silence (Voz + Chat)</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-zinc-300">Motivo</Label>
            <Textarea id="reason" placeholder="Describe el motivo del muteo..." value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-zinc-300">Duración</Label>
            <Select id="duration" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} >
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
              <option value="180">3 horas</option>
              <option value="360">6 horas</option>
              <option value="720">12 horas</option>
              <option value="1440">1 día</option>
              <option value="10080">1 semana</option>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-zinc-100">
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">
              Crear Muteo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}