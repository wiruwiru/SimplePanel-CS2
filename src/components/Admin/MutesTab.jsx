"use client"

import { useState, useEffect, useCallback } from 'react';
import { VolumeX, Plus, Pencil, Trash2, Volume2, Search, MessageSquareOff, Mic, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"
import { Spinner } from "@/components/UI/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"

const ITEMS_PER_PAGE = 20

const Textarea = ({ placeholder, value, onChange, className = '' }) => (
  <textarea placeholder={placeholder} value={value} onChange={onChange} rows={4} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] resize-none w-full ${className}`} />
);

const Select = ({ value, onChange, children, className = '' }) => (
  <select value={value} onChange={onChange} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] w-full ${className}`} >{children}</select>
);

const getStatusConfig = (status) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return { label: 'Activo', className: 'bg-red-600 text-white' };
    case 'EXPIRED':
      return { label: 'Expirado', className: 'bg-green-600 text-white' };
    case 'UNMUTED':
      return { label: 'Desmuteado', className: 'bg-blue-600 text-white' };
    default:
      return { label: 'Desconocido', className: 'bg-zinc-700 text-white' };
  }
};

const getMuteTypeConfig = (type) => {
  switch (type?.toUpperCase()) {
    case 'GAG':
      return {
        label: 'Gag',
        icon: MessageSquareOff,
        className: 'bg-orange-600 text-white'
      };
    case 'MUTE':
      return {
        label: 'Mute',
        icon: Mic,
        className: 'bg-purple-600 text-white'
      };
    case 'SILENCE':
      return {
        label: 'Silence',
        icon: Volume2,
        className: 'bg-pink-600 text-white'
      };
    default:
      return {
        label: 'Desconocido',
        icon: VolumeX,
        className: 'bg-zinc-700 text-white'
      };
  }
};

const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const MuteTypeBadge = ({ type }) => {
  const config = getMuteTypeConfig(type);
  const Icon = config.icon;
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${config.className}`}>
      <Icon className="size-3" />
      {config.label}
    </span>
  );
};

export function MutesTab() {
  const { hasFlag } = useAuth()
  const [mutes, setMutes] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    steamId: '',
    reason: '',
    duration: '60',
    type: 'MUTE'
  });

  const canView = hasFlag('@web/mute.view');
  const canAdd = hasFlag('@web/mute.add');
  const canEdit = hasFlag('@web/mute.edit');
  const canUnmute = hasFlag('@web/mute.unmute');
  const canRemove = hasFlag('@web/mute.remove');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  const fetchMutes = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/mutes?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(debouncedSearch)}`, { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setMutes(data.mutes)
        setTotal(data.total)

        const steamIds = data.mutes.map(mute => mute.steamId).filter(id => id && id !== "").join(",")
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
      console.error("Error fetching mutes:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch])

  useEffect(() => {
    fetchMutes()
  }, [fetchMutes])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getAvatarUrl = (steamId) => {
    return profiles[steamId]?.avatarUrl || "/placeholder.svg?height=40&width=40"
  }

  const getDisplayName = (mute) => {
    return profiles[mute.steamId]?.displayName || mute.player
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Crear muteo:', formData);
    setDialogOpen(false);
    setFormData({ steamId: '', reason: '', duration: '60', type: 'MUTE' });
    fetchMutes();
  };

  const handleUnmute = (mute) => {
    if (!canUnmute) return;
    console.log('Desmutear:', mute);
  };

  const handleDelete = (mute) => {
    if (!canRemove) return;
    if (confirm('¿Estás seguro de eliminar este muteo?')) {
      console.log('Eliminar:', mute);
      fetchMutes();
    }
  };

  if (!canView) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <VolumeX className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>No tienes permisos para ver los muteos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              <Input placeholder="Buscar por nombre o SteamID64..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6 text-[#FFB800]" />
            </div>
          ) : mutes.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">No se encontraron muteos</div>
          ) : (
            <>
              <div className="space-y-2">
                {mutes.map((mute) => (
                  <div key={mute.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <a href={`https://steamcommunity.com/profiles/${mute.steamId}`} target="_blank" rel="noopener noreferrer" >
                          <Avatar className="size-10 shrink-0">
                            <AvatarImage src={getAvatarUrl(mute.steamId)} alt={mute.player} />
                            <AvatarFallback>{mute.player.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </a>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-zinc-100 font-medium">{getDisplayName(mute)}</span>
                            <span className="text-zinc-500 text-xs font-mono">({mute.steamId})</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-400 mt-2 mb-1">
                            <span><span className="text-sm text-zinc-500">Razón:</span> <span className="text-base text-zinc-300">{mute.reason}</span></span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                            <span><span className="text-zinc-500">Duración:</span> <span className="text-zinc-300">{mute.duration}</span></span>
                          </div>
                          <div className="flex gap-4 mt-1 text-xs text-zinc-500">
                            <span>Admin: {mute.admin}</span>
                            <span>{mute.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <MuteTypeBadge type={mute.type} />
                        <StatusBadge status={mute.status} />
                      </div>
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
                  <div className="text-zinc-400 text-sm">Mostrando {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, total)} de {total}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
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