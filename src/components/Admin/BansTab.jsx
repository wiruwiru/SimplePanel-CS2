"use client"

import { addToast } from "@heroui/react"
import { useAuth } from "@/contexts/AuthContext"
import { hasPermission, getPermissionLevel } from "@/lib/permission-utils"
import { useState, useEffect, useCallback } from 'react';
import { Ban, Plus, Pencil, Trash2, ShieldOff, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"
import { Button } from "@/components/UI/button"
import { Spinner } from "@/components/UI/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/UI/alert-dialog"

const ITEMS_PER_PAGE = 20

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

const getStatusConfig = (status) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return { label: 'Activo', className: 'bg-red-600 text-white' };
    case 'EXPIRED':
      return { label: 'Expirado', className: 'bg-green-600 text-white' };
    case 'UNBANNED':
      return { label: 'Desbaneado', className: 'bg-blue-600 text-white' };
    default:
      return { label: 'Desconocido', className: 'bg-zinc-700 text-white' };
  }
};

export function BansTab() {
  const { hasFlag, flags, user } = useAuth()
  const [bans, setBans] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBan, setEditingBan] = useState(null);
  const [formData, setFormData] = useState({
    steamId: '',
    ip: '',
    reason: '',
    duration: '0'
  });

  const [deleteAlert, setDeleteAlert] = useState({ open: false, ban: null });
  const [unbanAlert, setUnbanAlert] = useState({ open: false, ban: null });

  const canView = hasFlag('@web/ban.view');
  const canAdd = hasFlag('@web/ban.add');

  const canEdit = (ban) => {
    if (!ban) return false;
    return hasPermission(flags, '@web/ban.edit', true, ban.adminSteamId, user?.steamId);
  };

  const canUnban = (ban) => {
    if (!ban) return false;
    return hasPermission(flags, '@web/ban.unban', true, ban.adminSteamId, user?.steamId);
  };

  const canRemove = (ban) => {
    if (!ban) return false;
    return hasPermission(flags, '@web/ban.remove', true, ban.adminSteamId, user?.steamId);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  const fetchBans = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/sanctions/bans?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(debouncedSearch)}`, { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setBans(data.bans)
        setTotal(data.total)

        const steamIds = data.bans.map(ban => ban.steamId).filter(id => id && id !== "").join(",")
        if (steamIds) {
          try {
            const profilesResponse = await fetch(`/api/profiles?ids=${steamIds}`)
            if (profilesResponse.ok) {
              const profilesData = await profilesResponse.json()
              setProfiles(profilesData)
            }
          } catch (error) {
            console.error("Error fetching profiles:", error)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching bans:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch])

  useEffect(() => {
    fetchBans()
  }, [fetchBans])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getAvatarUrl = (steamId) => {
    return profiles[steamId]?.avatarUrl || "/placeholder.svg?height=40&width=40"
  }

  const getDisplayName = (ban) => {
    return profiles[ban.steamId]?.displayName || ban.player
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Crear/Editar ban:', formData);
    setDialogOpen(false);
    setEditingBan(null);
    setFormData({ steamId: '', ip: '', reason: '', duration: '0' });
    fetchBans();
  };

  const handleEdit = (ban) => {
    if (!canEdit(ban)) return;
    setEditingBan(ban);
    setFormData({
      steamId: ban.steamId,
      ip: ban.ip || '',
      reason: ban.reason,
      duration: ban.duration === 'Permanente' ? '0' : '60'
    });
    setDialogOpen(true);
  };

  const handleUnbanClick = (ban) => {
    if (!canUnban(ban)) return;
    setUnbanAlert({ open: true, ban });
  };

  const handleUnbanConfirm = async () => {
    const ban = unbanAlert.ban;
    try {
      addToast({ title: 'Usuario desbaneado correctamente', color: 'success', variant: 'solid' });
      fetchBans();
    } catch (error) {
      console.error('Error unbanning:', error);
      addToast({ title: 'Error al desbanear usuario', color: 'danger', variant: 'solid' });
    } finally {
      setUnbanAlert({ open: false, ban: null });
    }
  };

  const handleDeleteClick = (ban) => {
    if (!canRemove(ban)) return;
    setDeleteAlert({ open: true, ban });
  };

  const handleDeleteConfirm = async () => {
    const ban = deleteAlert.ban;
    try {
      addToast({ title: 'Baneo eliminado correctamente', color: 'success', variant: 'solid' });
      fetchBans();
    } catch (error) {
      console.error('Error deleting ban:', error);
      addToast({ title: 'Error al eliminar baneo', color: 'danger', variant: 'solid' });
    } finally {
      setDeleteAlert({ open: false, ban: null });
    }
  };

  if (!canView) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <Ban className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>No tienes permisos para ver los baneos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = getStatusConfig;

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Ban className="size-5 text-[#FFB800]" />
              <div>
                <CardTitle className="text-zinc-100">Gestión de Baneos</CardTitle>
                <p className="text-zinc-400 text-sm mt-1">Gestiona los baneos de los jugadores en los servidores</p>
              </div>
            </div>
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
              <Input placeholder="Buscar por nombre, SteamID64 o IP..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6 text-[#FFB800]" />
            </div>
          ) : bans.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">No se encontraron baneos</div>
          ) : (
            <>
              <div className="space-y-2">
                {bans.map((ban) => (
                  <div key={ban.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <a href={`https://steamcommunity.com/profiles/${ban.steamId}`} target="_blank" rel="noopener noreferrer" >
                          <Avatar className="size-10 shrink-0">
                            <AvatarImage src={getAvatarUrl(ban.steamId)} alt={ban.player} />
                            <AvatarFallback>{ban.player.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </a>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-zinc-100 font-medium">{getDisplayName(ban)}</span>
                            <span className="text-zinc-500 text-xs font-mono">({ban.steamId})</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 mb-1">
                            <span><span className="text-sm text-zinc-500">Razón:</span> <span className="text-base text-zinc-300">{ban.reason}</span></span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                            <span><span className="text-zinc-500">Duración:</span> <span className="text-zinc-300">{ban.duration}</span></span>
                            {ban.ip && ban.ip !== '0' && (
                              <span><span className="text-zinc-500">IP:</span> <span className="font-mono text-xs">{ban.ip}</span></span>
                            )}
                          </div>
                          <div className="flex gap-4 mt-1 text-xs text-zinc-500">
                            <span>Admin: {ban.admin}</span>
                            <span>{ban.date}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={statusConfig(ban.status).className}>{statusConfig(ban.status).label}</Badge>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {canEdit(ban) && (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(ban)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                          <Pencil className="size-3 mr-1" />
                          Editar
                        </Button>
                      )}
                      {ban.status === 'ACTIVE' && canUnban(ban) && (
                        <Button size="sm" variant="outline" onClick={() => handleUnbanClick(ban)} className="bg-zinc-900 border-zinc-700 text-green-400 hover:bg-zinc-700">
                          <ShieldOff className="size-3 mr-1" />
                          Desbanear
                        </Button>
                      )}
                      {canRemove(ban) && (
                        <Button size="sm" variant="outline" onClick={() => handleDeleteClick(ban)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700">
                          <Trash2 className="size-3 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
                  <div className="text-zinc-400 text-sm">Mostrando {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, total)} de {total}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
                      <ChevronLeft className="size-4" />
                      <span className="hidden sm:inline ml-1">Anterior</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)} className={currentPage === pageNum ? "bg-[#FFB800] hover:bg-[#ce9300]" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"}>{pageNum}</Button>
                        )
                      })}
                    </div>

                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
                      <span className="hidden sm:inline mr-1">Siguiente</span>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">{editingBan ? 'Editar Baneo' : 'Crear Nuevo Baneo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="text-zinc-400 hover:text-zinc-100">Cancelar</Button>
              <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">{editingBan ? 'Guardar Cambios' : 'Crear Baneo'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={unbanAlert.open} onOpenChange={(open) => setUnbanAlert({ open, ban: null })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">¿Desbanear usuario?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              ¿Estás seguro de que deseas desbanear a <strong className="text-zinc-200">{unbanAlert.ban?.player}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUnbanAlert({ open: false, ban: null })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUnbanConfirm} className="bg-green-600 hover:bg-green-700 text-white">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAlert.open} onOpenChange={(open) => setDeleteAlert({ open, ban: null })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">¿Eliminar baneo?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              ¿Estás seguro de que deseas eliminar el baneo de <strong className="text-zinc-200">{deleteAlert.ban?.player}</strong>? Esta acción eliminará permanentemente el registro del baneo de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ open: false, ban: null })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}