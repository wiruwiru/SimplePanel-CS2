"use client"

import { useState } from 'react';
import { Server, Settings, Shield } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"

const mockServers = [
  { id: 1, name: '[ARG - CS2] ⚡ CrisisGamer ⚡ [RETAKE #1] ❤️', address: '45.235.99.18:27060', map: 'de_dust2', players: 18, maxPlayers: 20, status: 'online' },
  { id: 2, name: '[ARG - CS2] ⚡ CrisisGamer ⚡ [RETAKE #2] ❤️', address: '45.235.99.18:27069', map: 'de_mirage', players: 20, maxPlayers: 20, status: 'online' },
  { id: 3, name: '[ARG - CS2] ⚡ CrisisGamer ⚡ [RETAKE #3] ❤️', address: '45.235.98.246:27250', map: 'de_inferno', players: 15, maxPlayers: 20, status: 'online' },
  { id: 4, name: '[ARG - CS2] ⚡ CrisisGamer ⚡ [AUTOMIX #1] ❤️', address: '45.235.99.18:27025', map: 'de_ancient', players: 10, maxPlayers: 10, status: 'online' },
  { id: 5, name: '[ARG - CS2] ⚡ CrisisGamer ⚡ [AUTOMIX #2] ❤️', address: '45.235.98.246:27253', map: 'de_nuke', players: 8, maxPlayers: 10, status: 'online' },
  { id: 6, name: '[ARG - CS2] ⚡ CrisisGamer ⚡ [DESARROLLO] ❤️', address: '45.235.98.41:27070', map: 'de_cache', players: 0, maxPlayers: 10, status: 'offline' },
];

const Switch = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#FFB800]' : 'bg-zinc-700'}`} >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

export function ServersTab() {
  const { hasFlag } = useAuth()
  const [selectedServer, setSelectedServer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    rconPassword: '',
    visible: true
  });

  const canManage = hasFlag('@web/root');

  const handleOpenDialog = (server) => {
    if (!canManage) return;
    setSelectedServer(server);
    setFormData({
      name: server.name,
      ip: server.address,
      rconPassword: '',
      visible: true
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Actualizar servidor:', formData);
    setDialogOpen(false);
  };

  if (!canManage) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <Shield className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>No tienes permisos para gestionar servidores.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockServers.map((server) => (
          <Card key={server.id} className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
            <CardContent>
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-yellow-600/10 rounded-lg shrink-0">
                  <Server className="size-5 text-[#FFB800]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-zinc-100 mb-1 truncate">{server.name}</h3>
                  <p className="text-zinc-500 text-sm font-mono">{server.address}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" onClick={() => handleOpenDialog(server)} >
                <Settings className="size-4 mr-2" />
                Configurar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Configurar servidor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-name" className="text-zinc-300">Nombre del servidor</Label>
              <Input id="server-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-ip" className="text-zinc-300">IP:Puerto</Label>
              <Input id="server-ip" placeholder="192.168.1.1:27015" value={formData.ip} onChange={(e) => setFormData({ ...formData, ip: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcon-password" className="text-zinc-300">Contraseña RCON</Label>
              <Input id="rcon-password" type="password" placeholder="••••••••" value={formData.rconPassword} onChange={(e) => setFormData({ ...formData, rconPassword: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
              <div>
                <Label htmlFor="visibility" className="text-zinc-300">Servidor visible</Label>
                <p className="text-xs text-zinc-500 mt-1">Mostrar en la lista pública</p>
              </div>
              <Switch checked={formData.visible} onChange={(checked) => setFormData({ ...formData, visible: checked })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="text-zinc-400 hover:text-zinc-800">Cancelar</Button>
              <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}