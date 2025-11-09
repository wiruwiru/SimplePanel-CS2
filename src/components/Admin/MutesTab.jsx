"use client"

import { useState } from 'react';
import { VolumeX, Plus, Pencil, Trash2, Volume2, Search, MessageSquareOff, Mic } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"

// Mock data
const mockMutes = [
  { id: 1, player: 'Luna', steamId: '76561199092469083', admin: 'yellow flash', reason: 'Flood', duration: '5 minutos', date: '08/11/2025 04:38', status: 'EXPIRED', type: 'GAG' },
  { id: 2, player: 'RN', steamId: '76561199861537310', admin: 'yellow flash', reason: 'Ruidos molestos', duration: '30 minutos', date: '08/11/2025 07:59', status: 'EXPIRED', type: 'SILENCE' },
  { id: 3, player: 'old school', steamId: '76561199049863857', admin: 'tmnz666', reason: 'Molestar usuarios', duration: '15 minutos', date: '09/11/2025 00:12', status: 'EXPIRED', type: 'MUTE' },
  { id: 4, player: 'TestUser', steamId: '76561199000000001', admin: 'Admin', reason: 'Spam en chat', duration: '60 minutos', date: '09/11/2025 10:00', status: 'ACTIVE', type: 'GAG' },
];

const Badge = ({ children, className = '' }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>
);

const Textarea = ({ placeholder, value, onChange, className = '' }) => (
  <textarea placeholder={placeholder} value={value} onChange={onChange} rows={4} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] resize-none w-full ${className}`} />
);

const Select = ({ value, onChange, children, className = '' }) => (
  <select value={value} onChange={onChange} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] w-full ${className}`} >{children}</select>
);

export function MutesTab() {
  const { hasFlag } = useAuth()
  const [mutes, setMutes] = useState(mockMutes);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    steamId: '',
    reason: '',
    duration: '60',
    type: 'MUTE'
  });

  const canAdd = hasFlag('@web/mute.add');
  const canEdit = hasFlag('@web/mute.edit');
  const canUnmute = hasFlag('@web/mute.unmute');
  const canRemove = hasFlag('@web/mute.remove');

  const getMuteIcon = (type) => {
    switch (type) {
      case 'GAG': return <MessageSquareOff className="size-3" />;
      case 'MUTE': return <Mic className="size-3" />;
      case 'SILENCE': return <Volume2 className="size-3" />;
      default: return <VolumeX className="size-3" />;
    }
  };

  const getMuteColor = (type) => {
    switch (type) {
      case 'GAG': return 'bg-orange-600';
      case 'MUTE': return 'bg-purple-600';
      case 'SILENCE': return 'bg-pink-600';
      default: return 'bg-zinc-700';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Crear muteo:', formData);
    setDialogOpen(false);
    setFormData({ steamId: '', reason: '', duration: '60', type: 'MUTE' });
  };

  const handleUnmute = (mute) => {
    if (!canUnmute) return;
    console.log('Desmutear:', mute);
  };

  const handleDelete = (mute) => {
    if (!canRemove) return;
    if (confirm('¿Estás seguro de eliminar este muteo?')) {
      setMutes(mutes.filter(m => m.id !== mute.id));
    }
  };

  const filteredMutes = mutes.filter(mute => 
    mute.player.toLowerCase().includes(search.toLowerCase()) ||
    mute.steamId.includes(search)
  );

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <VolumeX className="size-5 text-[#FFB800]" />
              Gestión de Muteos
            </CardTitle>
            {canAdd && (
              <Button onClick={() => setDialogOpen(true)} className="bg-[#FFB800] hover:bg-[#ce9300]">
                <Plus className="size-4 mr-2" />
                Nuevo Muteo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input placeholder="Buscar por nombre o SteamID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>

          <div className="space-y-2">
            {filteredMutes.map((mute) => (
              <div key={mute.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className={`${getMuteColor(mute.type)} text-white flex items-center gap-1`}>
                        {getMuteIcon(mute.type)}
                        {mute.type}
                      </Badge>
                      <span className="text-zinc-100">{mute.player}</span>
                      <span className="text-zinc-500 text-sm font-mono">{mute.steamId}</span>
                    </div>
                    <div className="text-zinc-400 text-sm">
                      <span className="text-zinc-500">Razón:</span> {mute.reason}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-zinc-500">
                      <span>Admin: {mute.admin}</span>
                      <span>Duración: {mute.duration}</span>
                      <span>{mute.date}</span>
                    </div>
                  </div>
                  <Badge className={mute.status === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-zinc-700 text-white'}>
                    {mute.status === 'ACTIVE' ? 'Activo' : 'Expirado'}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {canEdit && (
                    <Button size="sm" variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                      <Pencil className="size-3 mr-1" />
                      Editar
                    </Button>
                  )}
                  {canUnmute && mute.status === 'ACTIVE' && (
                    <Button size="sm" variant="outline" onClick={() => handleUnmute(mute)} className="bg-zinc-900 border-zinc-700 text-green-400 hover:bg-zinc-700">
                      <Volume2 className="size-3 mr-1" />
                      Desmutear
                    </Button>
                  )}
                  {canRemove && (
                    <Button size="sm" variant="outline" onClick={() => handleDelete(mute)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700">
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
            <DialogTitle className="text-zinc-100">Crear Nuevo Muteo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="steamId" className="text-zinc-300">SteamID</Label>
              <Input id="steamId" placeholder="76561199074660131" value={formData.steamId} onChange={(e) => setFormData({ ...formData, steamId: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
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
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="text-zinc-400 hover:text-zinc-800">Cancelar</Button>
              <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">Crear Muteo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}