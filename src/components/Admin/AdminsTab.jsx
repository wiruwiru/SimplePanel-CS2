"use client"

import { useState } from 'react';
import { Plus, Shield, Crown, UserCog, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"

const mockAdmins = [
  { id: 1, name: 'Luca', steamId: '76561199074660131', permissionGroup: 'owner', serverGroup: 'all', permissions: ['@css/root', '@web/root'] },
  { id: 2, name: 'IAN', steamId: '76561198304560396', permissionGroup: 'owner', serverGroup: 'all', permissions: ['#owners'] },
  { id: 3, name: 'Sub1Normal', steamId: '76561198966430349', permissionGroup: 'admin', serverGroup: 'all', permissions: ['@css/ban', '@css/mute', '@web/ban.add'] },
  { id: 4, name: 'Pani', steamId: '76561198197100489', permissionGroup: 'admin', serverGroup: 'retake', permissions: ['@css/ban', '@css/mute'] },
  { id: 5, name: 'ajoFFNAH', steamId: '76561198012989510', permissionGroup: 'moderator', serverGroup: 'all', permissions: ['@css/kick', '@css/slay'] },
];

const permissionGroups = [
  { id: 'owner', name: 'Owner', color: 'bg-red-600' },
  { id: 'admin', name: 'Admin', color: 'bg-orange-600' },
  { id: 'moderator', name: 'Moderador', color: 'bg-blue-600' },
];

const serverGroups = [
  { id: 'all', name: 'Todos los Servidores', color: 'bg-purple-600' },
  { id: 'retake', name: 'Servidores Retake', color: 'bg-green-600' },
  { id: 'automix', name: 'Servidores Automix', color: 'bg-cyan-600' },
];

const Badge = ({ children, className = '' }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>
);

const Select = ({ value, onChange, children, className = '' }) => (
  <select value={value} onChange={onChange} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] w-full ${className}`} >
    {children}
  </select>
);

const Checkbox = ({ checked, onChange, id }) => (
  <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 text-[#FFB800] bg-zinc-800 border-zinc-700 rounded focus:ring-[#FFB800] focus:ring-2" />
);

export function AdminsTab() {
  const { hasFlag } = useAuth()
  const [admins, setAdmins] = useState(mockAdmins);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    steamId: '',
    permissionGroup: 'moderator',
    serverGroup: 'all',
    permissions: []
  });

  const canManage = hasFlag('@web/root');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Nuevo admin:', formData);
    setDialogOpen(false);
    setFormData({ steamId: '', permissionGroup: 'moderator', serverGroup: 'all', permissions: [] });
  };

  const handleDelete = (admin) => {
    if (!canManage) return;
    if (confirm(`¿Estás seguro de eliminar al administrador ${admin.name}?`)) {
      setAdmins(admins.filter(a => a.id !== admin.id));
    }
  };

  if (!canManage) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <Shield className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>No tienes permisos para gestionar administradores.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-zinc-100">Administradores</CardTitle>
              <Button onClick={() => setDialogOpen(true)} className="bg-[#FFB800] hover:bg-[#ce9300]">
                <Plus className="size-4 mr-2" />
                Nuevo Administrador
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {admins.map((admin) => {
                const group = permissionGroups.find(g => g.id === admin.permissionGroup);
                const serverGroup = serverGroups.find(g => g.id === admin.serverGroup);
                
                return (
                  <div key={admin.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 ${group?.color}/10 rounded-lg`}>
                          {admin.permissionGroup === 'owner' && <Crown className="size-5 text-red-500" />}
                          {admin.permissionGroup === 'admin' && <Shield className="size-5 text-orange-500" />}
                          {admin.permissionGroup === 'moderator' && <UserCog className="size-5 text-blue-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-zinc-100">{admin.name}</span>
                            <Badge className={group?.color}>{group?.name}</Badge>
                            <Badge className={serverGroup?.color}>{serverGroup?.name}</Badge>
                          </div>
                          <div className="text-zinc-500 text-sm font-mono">{admin.steamId}</div>
                          <div className="text-zinc-400 text-xs mt-1">
                            Permisos: {admin.permissions.join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                          <Pencil className="size-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(admin)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700">
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Grupos de Permisos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {permissionGroups.map((group) => (
                  <div key={group.id} className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <Badge className={`${group.color} mb-3`}>{group.name}</Badge>
                    <div className="text-sm text-zinc-400">
                      <div className="mb-2">Miembros: {admins.filter(a => a.permissionGroup === group.id).length}</div>
                      <Button variant="outline" size="sm" className="w-full bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Configurar permisos</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Grupos de Servidores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {serverGroups.map((group) => (
                  <div key={group.id} className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <Badge className={`${group.color} mb-3`}>{group.name}</Badge>
                    <div className="text-sm text-zinc-400">
                      <div className="mb-2">Asignados: {admins.filter(a => a.serverGroup === group.id).length}</div>
                      <Button variant="outline" size="sm" className="w-full bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Gestionar servidores</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Agregar administrador</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="steamId" className="text-zinc-300">SteamID</Label>
              <Input id="steamId" placeholder="76561199074660131" value={formData.steamId} onChange={(e) => setFormData({ ...formData, steamId: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permission-group" className="text-zinc-300">Grupo de Permisos</Label>
                <Select id="permission-group" value={formData.permissionGroup} onChange={(e) => setFormData({ ...formData, permissionGroup: e.target.value })} >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderador</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="server-group" className="text-zinc-300">Grupo de Servidores</Label>
                <Select id="server-group" value={formData.serverGroup} onChange={(e) => setFormData({ ...formData, serverGroup: e.target.value })} >
                  <option value="all">Todos los Servidores</option>
                  <option value="retake">Servidores Retake</option>
                  <option value="automix">Servidores Automix</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Permisos Adicionales</Label>
              <div className="space-y-2 bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                {['ban', 'mute', 'kick', 'unban', 'unmute', 'config'].map((perm) => (
                  <div key={perm} className="flex items-center space-x-2">
                    <Checkbox id={perm} checked={formData.permissions.includes(perm)}
                      onChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, permissions: [...formData.permissions, perm] });
                        } else {
                          setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm) });
                        }
                      }} />
                    <label htmlFor={perm} className="text-sm text-zinc-300 cursor-pointer">
                      {perm.charAt(0).toUpperCase() + perm.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="text-zinc-400 hover:text-zinc-800">Cancelar</Button>
              <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">Crear administrador</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}