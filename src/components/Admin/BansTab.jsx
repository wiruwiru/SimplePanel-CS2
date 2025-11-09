"use client"

import { useState } from 'react';
import { Ban, Plus, Pencil, Trash2, ShieldOff, Search } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"

// Mock data
const mockBans = [
  { id: 1, player: 'Cangu', steamId: '76561199002692488', admin: 'Luca', reason: 'Actitud no bienvenida en la comunidad.', duration: 'Permanente', date: '07/11/2025 12:56', status: 'ACTIVE' },
  { id: 2, player: 'cass1n', steamId: '76561199232936001', admin: 'Luca', reason: 'Actitud no bienvenida en la comunidad.', duration: 'Permanente', date: '07/11/2025 12:56', status: 'ACTIVE' },
  { id: 3, player: 'ElPelado', steamId: '76561198176734201', admin: 'Luca', reason: 'Abuso de los permisos de administración', duration: 'Permanente', date: '07/11/2025 12:56', status: 'ACTIVE' },
  { id: 4, player: 'naipe', steamId: '76561199088452228', admin: 'Luca', reason: 'Actitud no bienvenida en la comunidad.', duration: 'Permanente', date: '07/11/2025 12:57', status: 'UNBANNED' },
  { id: 5, player: 'JASON DE JUUZOU', steamId: '76561198330114148', admin: 'Luca', reason: 'Toxicidad, mal uso de !call', duration: '120 minutos', date: '07/11/2025 20:56', status: 'EXPIRED' },
];

const Badge = ({ children, className = '' }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>
);

const Textarea = ({ placeholder, value, onChange, className = '' }) => (
  <textarea placeholder={placeholder} value={value} onChange={onChange} rows={4} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] resize-none w-full ${className}`} />
);

const Select = ({ value, onChange, children, className = '' }) => (
  <select value={value} onChange={onChange} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] w-full ${className}`} >
    {children}
  </select>
);

export function BansTab() {
  const { hasFlag } = useAuth()
  const [bans, setBans] = useState(mockBans);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBan, setEditingBan] = useState(null);
  const [formData, setFormData] = useState({
    steamId: '',
    ip: '',
    reason: '',
    duration: '0'
  });

  const canAdd = hasFlag('@web/ban.add');
  const canEdit = hasFlag('@web/ban.edit');
  const canUnban = hasFlag('@web/ban.unban');
  const canRemove = hasFlag('@web/ban.remove');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Crear/Editar ban:', formData);
    setDialogOpen(false);
    setEditingBan(null);
    setFormData({ steamId: '', ip: '', reason: '', duration: '0' });
  };

  const handleEdit = (ban) => {
    if (!canEdit) return;
    setEditingBan(ban);
    setFormData({
      steamId: ban.steamId,
      ip: '',
      reason: ban.reason,
      duration: ban.duration === 'Permanente' ? '0' : '60'
    });
    setDialogOpen(true);
  };

  const handleUnban = (ban) => {
    if (!canUnban) return;
    console.log('Desbanear:', ban);
  };

  const handleDelete = (ban) => {
    if (!canRemove) return;
    if (confirm('¿Estás seguro de eliminar este baneo?')) {
      setBans(bans.filter(b => b.id !== ban.id));
    }
  };

  const filteredBans = bans.filter(ban => 
    ban.player.toLowerCase().includes(search.toLowerCase()) ||
    ban.steamId.includes(search)
  );

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Ban className="size-5 text-[#FFB800]" />Gestión de Baneos</CardTitle>
            {canAdd && (
              <Button onClick={() => setDialogOpen(true)} className="bg-[#FFB800] hover:bg-[#ce9300]">
                <Plus className="size-4 mr-2" />
                Nuevo Baneo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input
                placeholder="Buscar por nombre o SteamID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredBans.map((ban) => (
              <div key={ban.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className="bg-red-600 text-white">Baneo</Badge>
                      <span className="text-zinc-100">{ban.player}</span>
                      <span className="text-zinc-500 text-sm font-mono">{ban.steamId}</span>
                    </div>
                    <div className="text-zinc-400 text-sm">
                      <span className="text-zinc-500">Razón:</span> {ban.reason}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-zinc-500">
                      <span>Admin: {ban.admin}</span>
                      <span>Duración: {ban.duration}</span>
                      <span>{ban.date}</span>
                    </div>
                  </div>
                  <Badge className={ban.status === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-zinc-700 text-white'}>
                    {ban.status === 'ACTIVE' ? 'Activo' : 'Expirado'}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {canEdit && (
                    <Button size="sm" variant="outline" onClick={() => handleEdit(ban)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                      <Pencil className="size-3 mr-1" />
                      Editar
                    </Button>
                  )}
                  {canUnban && ban.status === 'ACTIVE' && (
                    <Button size="sm" variant="outline" onClick={() => handleUnban(ban)} className="bg-zinc-900 border-zinc-700 text-green-400 hover:bg-zinc-700">
                      <ShieldOff className="size-3 mr-1" />
                      Desbanear
                    </Button>
                  )}
                  {canRemove && (
                    <Button size="sm" variant="outline" onClick={() => handleDelete(ban)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700">
                      <Trash2 className="size-3 mr-1" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">{editingBan ? 'Editar Baneo' : 'Crear Nuevo Baneo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="steamId" className="text-zinc-300">SteamID</Label>
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
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="text-zinc-400 hover:text-zinc-800">Cancelar</Button>
              <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">{editingBan ? 'Guardar Cambios' : 'Crear Baneo'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}