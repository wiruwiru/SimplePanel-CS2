"use client"

import { useState, useEffect } from 'react';
import { Plus, Shield, Crown, UserCog, Pencil, Trash2, Server, Tag, Users } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"
import { Spinner } from "@/components/UI/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { addToast } from "@heroui/react"

const Badge = ({ children, className = '' }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>
);

const Select = ({ value, onChange, children, className = '' }) => (
  <select value={value} onChange={onChange} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] w-full ${className}`} >
    {children}
  </select>
);

const Checkbox = ({ checked, onChange, id, label }) => (
  <div className="flex items-center space-x-2">
    <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 text-[#FFB800] bg-zinc-800 border-zinc-700 rounded focus:ring-[#FFB800] focus:ring-2 cursor-pointer" />
    {label && <label htmlFor={id} className="text-sm text-zinc-300 cursor-pointer">{label}</label>}
  </div>
);

export function AdminsTab() {
  const { hasFlag } = useAuth()
  const [loading, setLoading] = useState(true)
  const [admins, setAdmins] = useState([])
  const [permissionGroups, setPermissionGroups] = useState([])
  const [serverGroups, setServerGroups] = useState([])
  const [permissions, setPermissions] = useState([])
  const [profiles, setProfiles] = useState({})
  const [allServers, setAllServers] = useState([])
  
  // Diálogos
  const [adminDialog, setAdminDialog] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [permGroupDialog, setPermGroupDialog] = useState(false)
  const [editingPermGroup, setEditingPermGroup] = useState(null)
  const [serverGroupDialog, setServerGroupDialog] = useState(false)
  const [editingServerGroup, setEditingServerGroup] = useState(null)
  const [customFlagDialog, setCustomFlagDialog] = useState(false)
  
  // Form data
  const [adminForm, setAdminForm] = useState({
    steamId: '',
    name: '',
    permissionGroup: null,
    serverGroup: 'all',
    customFlags: [],
    immunity: 0
  })

  const [permGroupForm, setPermGroupForm] = useState({
    name: '',
    immunity: 0,
    flags: []
  })

  const [serverGroupForm, setServerGroupForm] = useState({
    name: '',
    description: '',
    color: '#6B7280',
    serverIds: []
  })

  const [customFlagForm, setCustomFlagForm] = useState({
    flag: '@custom/',
    description: ''
  })

  const canManage = hasFlag('@web/root')

  useEffect(() => {
    if (canManage) {
      fetchAllData()
    }
  }, [canManage])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [adminsRes, permGroupsRes, serverGroupsRes, permsRes, serversRes] = await Promise.all([
        fetch('/api/admin/admins', { cache: 'no-store' }),
        fetch('/api/admin/admins/permission-groups', { cache: 'no-store' }),
        fetch('/api/admin/admins/server-groups', { cache: 'no-store' }),
        fetch('/api/admin/admins/permissions', { cache: 'no-store' }),
        fetch('/api/admin/servers', { cache: 'no-store' })
      ])

      if (adminsRes.ok) {
        const data = await adminsRes.json()
        setAdmins(data.admins)
        
        // Fetch Steam profiles
        const steamIds = data.admins.map(a => a.steamId).filter(Boolean).join(',')
        if (steamIds) {
          const profilesRes = await fetch(`/api/profiles?ids=${steamIds}`)
          if (profilesRes.ok) {
            const profilesData = await profilesRes.json()
            setProfiles(profilesData)
          }
        }
      }

      if (permGroupsRes.ok) {
        const data = await permGroupsRes.json()
        setPermissionGroups(data.groups)
      }

      if (serverGroupsRes.ok) {
        const data = await serverGroupsRes.json()
        setServerGroups(data.groups)
      }

      if (permsRes.ok) {
        const data = await permsRes.json()
        setPermissions(data.permissions)
      }

      if (serversRes.ok) {
        const data = await serversRes.json()
        // Adaptar la respuesta de tu API existente
        const servers = Array.isArray(data) ? data : data.servers || []
        setAllServers(servers.map(s => ({
          id: s.id,
          name: s.name || s.hostname,
          address: s.address
        })))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      addToast({ title: 'Error al cargar datos', color: 'danger', variant: 'solid' })
    } finally {
      setLoading(false)
    }
  }

  // Admin CRUD
  const handleSaveAdmin = async (e) => {
    e.preventDefault()
    
    try {
      const method = editingAdmin ? 'PATCH' : 'POST'
      const response = await fetch('/api/admin/admins', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steamId: adminForm.steamId,
          name: adminForm.name,
          groupId: adminForm.permissionGroup,
          serverGroupId: adminForm.serverGroup,
          flags: adminForm.customFlags,
          immunity: adminForm.immunity
        })
      })

      if (response.ok) {
        addToast({ 
          title: editingAdmin ? 'Administrador actualizado' : 'Administrador creado', 
          color: 'success', 
          variant: 'solid' 
        })
        setAdminDialog(false)
        setEditingAdmin(null)
        resetAdminForm()
        fetchAllData()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error saving admin:', error)
      addToast({ title: 'Error al guardar administrador', color: 'danger', variant: 'solid' })
    }
  }

  const handleDeleteAdmin = async (steamId) => {
    if (!confirm('¿Estás seguro de eliminar este administrador?')) return

    try {
      const response = await fetch(`/api/admin/admins?steamId=${steamId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addToast({ title: 'Administrador eliminado', color: 'success', variant: 'solid' })
        fetchAllData()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      addToast({ title: 'Error al eliminar administrador', color: 'danger', variant: 'solid' })
    }
  }

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin)
    setAdminForm({
      steamId: admin.steamId,
      name: admin.name,
      permissionGroup: admin.groupId,
      serverGroup: admin.servers.length > 0 ? 'custom' : 'all',
      customFlags: admin.flags,
      immunity: admin.immunity
    })
    setAdminDialog(true)
  }

  const resetAdminForm = () => {
    setAdminForm({
      steamId: '',
      name: '',
      permissionGroup: null,
      serverGroup: 'all',
      customFlags: [],
      immunity: 0
    })
  }

  // Permission Group CRUD
  const handleSavePermGroup = async (e) => {
    e.preventDefault()
    
    try {
      const method = editingPermGroup ? 'PATCH' : 'POST'
      const body = editingPermGroup 
        ? { groupId: editingPermGroup.id, ...permGroupForm }
        : permGroupForm

      const response = await fetch('/api/admin/admins/permission-groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        addToast({ 
          title: editingPermGroup ? 'Grupo actualizado' : 'Grupo creado', 
          color: 'success', 
          variant: 'solid' 
        })
        setPermGroupDialog(false)
        setEditingPermGroup(null)
        resetPermGroupForm()
        fetchAllData()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error saving permission group:', error)
      addToast({ title: 'Error al guardar grupo', color: 'danger', variant: 'solid' })
    }
  }

  const handleDeletePermGroup = async (groupId) => {
    if (!confirm('¿Estás seguro de eliminar este grupo?')) return

    try {
      const response = await fetch(`/api/admin/admins/permission-groups?groupId=${groupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addToast({ title: 'Grupo eliminado', color: 'success', variant: 'solid' })
        fetchAllData()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error deleting permission group:', error)
      addToast({ title: 'Error al eliminar grupo', color: 'danger', variant: 'solid' })
    }
  }

  const handleEditPermGroup = (group) => {
    setEditingPermGroup(group)
    setPermGroupForm({
      name: group.name,
      immunity: group.immunity,
      flags: group.flags
    })
    setPermGroupDialog(true)
  }

  const resetPermGroupForm = () => {
    setPermGroupForm({
      name: '',
      immunity: 0,
      flags: []
    })
  }

  // Server Group CRUD
  const handleSaveServerGroup = async (e) => {
    e.preventDefault()
    
    try {
      const method = editingServerGroup ? 'PATCH' : 'POST'
      const body = editingServerGroup ? { groupId: editingServerGroup.id, ...serverGroupForm } : serverGroupForm
      const response = await fetch('/api/admin/admins/server-groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        addToast({ 
          title: editingServerGroup ? 'Grupo actualizado' : 'Grupo creado', 
          color: 'success', 
          variant: 'solid' 
        })
        setServerGroupDialog(false)
        setEditingServerGroup(null)
        resetServerGroupForm()
        fetchAllData()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error saving server group:', error)
      addToast({ title: 'Error al guardar grupo de servidores', color: 'danger', variant: 'solid' })
    }
  }

  const handleDeleteServerGroup = async (groupId) => {
    if (!confirm('¿Estás seguro de eliminar este grupo de servidores?')) return

    try {
      const response = await fetch(`/api/admin/admins/server-groups?groupId=${groupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addToast({ title: 'Grupo de servidores eliminado', color: 'success', variant: 'solid' })
        fetchAllData()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error deleting server group:', error)
      addToast({ title: 'Error al eliminar grupo de servidores', color: 'danger', variant: 'solid' })
    }
  }

  const handleEditServerGroup = (group) => {
    setEditingServerGroup(group)
    setServerGroupForm({
      name: group.name,
      description: group.description || '',
      color: group.color,
      serverIds: group.servers.map(s => s.id)
    })
    setServerGroupDialog(true)
  }

  const resetServerGroupForm = () => {
    setServerGroupForm({
      name: '',
      description: '',
      color: '#6B7280',
      serverIds: []
    })
  }

  // Custom Flag
  const handleSaveCustomFlag = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/admins/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customFlagForm)
      })

      if (response.ok) {
        addToast({ title: 'Flag personalizado creado', color: 'success', variant: 'solid' })
        setCustomFlagDialog(false)
        setCustomFlagForm({ flag: '@custom/', description: '' })
        fetchAllData()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error saving custom flag:', error)
      addToast({ title: 'Error al crear flag', color: 'danger', variant: 'solid' })
    }
  }

  const handleDeleteCustomFlag = async (flag) => {
    if (!confirm('¿Estás seguro de eliminar este flag personalizado?')) return

    try {
      const response = await fetch(`/api/admin/admins/permissions?flag=${encodeURIComponent(flag)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addToast({ title: 'Flag eliminado', color: 'success', variant: 'solid' })
        fetchAllData()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error deleting custom flag:', error)
      addToast({ title: 'Error al eliminar flag', color: 'danger', variant: 'solid' })
    }
  }

  const getAvatarUrl = (steamId) => {
    return profiles[steamId]?.avatarUrl || "/placeholder.svg?height=40&width=40"
  }

  const getDisplayName = (admin) => {
    return profiles[admin.steamId]?.displayName || admin.name
  }

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
    )
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-8 text-[#FFB800]" />
            <span className="ml-3 text-zinc-400">Cargando...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Lista de Administradores */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-zinc-100">Administradores</CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => { setEditingAdmin(null); resetAdminForm(); setAdminDialog(true) }} className="bg-[#FFB800] hover:bg-[#ce9300]">
                  <Plus className="size-4 mr-2" />
                  Nuevo Admin
                </Button>
                <Button onClick={() => setCustomFlagDialog(true)} variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                  <Tag className="size-4 mr-2" />
                  Custom Flag
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {admins.map((admin) => (
                <div key={admin.steamId} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar className="size-10 shrink-0">
                        <AvatarImage src={getAvatarUrl(admin.steamId)} alt={admin.name} />
                        <AvatarFallback>{admin.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-zinc-100 font-medium">{getDisplayName(admin)}</span>
                          <Badge className="bg-purple-600 text-white">{admin.group}</Badge>
                          <Badge className="bg-blue-600 text-white">{admin.immunity}</Badge>
                        </div>
                        <div className="text-zinc-500 text-sm font-mono">{admin.steamId}</div>
                        {admin.flags.length > 0 && (
                          <div className="text-zinc-400 text-xs mt-1">
                            Permisos: {admin.flags.slice(0, 3).join(', ')}
                            {admin.flags.length > 3 && ` +${admin.flags.length - 3} más`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleEditAdmin(admin)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                        <Pencil className="size-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteAdmin(admin.steamId)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700">
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {admins.length === 0 && (
                <div className="text-center py-8 text-zinc-400">No hay administradores registrados</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grupos de Permisos y Grupos de Servidores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grupos de Permisos */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-zinc-100">Grupos de Permisos</CardTitle>
                <Button onClick={() => { setEditingPermGroup(null); resetPermGroupForm(); setPermGroupDialog(true) }} size="sm" className="bg-[#FFB800] hover:bg-[#ce9300]">
                  <Plus className="size-4 mr-2" />
                  Nuevo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {permissionGroups.map((group) => (
                  <div key={group.id} className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <UserCog className="size-5 text-blue-500" />
                          <span className="text-zinc-100 font-medium">{group.name}</span>
                        </div>
                        <div className="text-xs text-zinc-400">Miembros: {group.memberCount} • Inmunidad: {group.immunity}</div>
                        <div className="text-xs text-zinc-500 mt-1">{group.flags.length} permisos</div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleEditPermGroup(group)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700 p-1.5">
                          <Pencil className="size-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeletePermGroup(group.id)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700 p-1.5">
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grupos de Servidores */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-zinc-100">Grupos de Servidores</CardTitle>
                <Button onClick={() => { setEditingServerGroup(null); resetServerGroupForm(); setServerGroupDialog(true) }} size="sm" className="bg-[#FFB800] hover:bg-[#ce9300]">
                  <Plus className="size-4 mr-2" />
                  Nuevo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {serverGroups.map((group) => (
                  <div key={group.id} className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Server className="size-4" style={{ color: group.color }} />
                          <span className="text-zinc-100 font-medium">{group.name}</span>
                        </div>
                        <div className="text-xs text-zinc-400">{group.description}</div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {group.serverCount} servidor{group.serverCount !== 1 ? 'es' : ''}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleEditServerGroup(group)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700 p-1.5">
                          <Pencil className="size-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteServerGroup(group.id)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700 p-1.5">
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Admin */}
      <Dialog open={adminDialog} onOpenChange={setAdminDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editingAdmin ? 'Editar Administrador' : 'Nuevo Administrador'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAdmin} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="steamId" className="text-zinc-300">SteamID64</Label>
                <Input id="steamId" placeholder="76561199074660131" value={adminForm.steamId} onChange={(e) => setAdminForm({...adminForm, steamId: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required disabled={!!editingAdmin} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Nombre</Label>
                <Input id="name" placeholder="Nombre del admin" value={adminForm.name} onChange={(e) => setAdminForm({...adminForm, name: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permGroup" className="text-zinc-300">Grupo de Permisos</Label>
                <Select id="permGroup" value={adminForm.permissionGroup || ''} onChange={(e) => setAdminForm({...adminForm, permissionGroup: e.target.value ? parseInt(e.target.value) : null})}>
                  <option value="">Ninguno</option>
                  {permissionGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serverGroup" className="text-zinc-300">Grupo de Servidores</Label>
                <Select id="serverGroup" value={adminForm.serverGroup} onChange={(e) => setAdminForm({...adminForm, serverGroup: e.target.value})}>
                  <option value="all">Todos los Servidores</option>
                  {serverGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="immunity" className="text-zinc-300">Inmunidad</Label>
              <Input id="immunity" type="number" min="0" max="100" value={adminForm.immunity} onChange={(e) => setAdminForm({...adminForm, immunity: parseInt(e.target.value) || 0})} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Flags Adicionales</Label>
              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 max-h-48 overflow-y-auto space-y-2">
                {permissions.map(perm => (
                  <Checkbox
                    key={perm.flag}
                    id={perm.flag}
                    label={`${perm.flag} - ${perm.description}`}
                    checked={adminForm.customFlags.includes(perm.flag)}
                    onChange={(checked) => {
                      if (checked) {
                        setAdminForm({...adminForm, customFlags: [...adminForm.customFlags, perm.flag]})
                      } else {
                        setAdminForm({...adminForm, customFlags: adminForm.customFlags.filter(f => f !== perm.flag)})
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAdminDialog(false)} className="text-zinc-400 hover:text-zinc-100">Cancelar</Button>
              <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">
                {editingAdmin ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Grupo de Permisos */}
      <Dialog open={permGroupDialog} onOpenChange={setPermGroupDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editingPermGroup ? 'Editar Grupo de Permisos' : 'Nuevo Grupo de Permisos'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePermGroup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="groupName" className="text-zinc-300">Nombre del Grupo</Label>
                <Input id="groupName" placeholder="Ej: #administrador" value={permGroupForm.name} onChange={(e) => setPermGroupForm({...permGroupForm, name: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupImmunity" className="text-zinc-300">Inmunidad</Label>
                <Input id="groupImmunity" type="number" min="0" max="100" value={permGroupForm.immunity} onChange={(e) => setPermGroupForm({...permGroupForm, immunity: parseInt(e.target.value) || 0})} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Permisos del Grupo</Label>
              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 max-h-64 overflow-y-auto space-y-2">
                {permissions.map(perm => (
                  <Checkbox
                    key={perm.flag}
                    id={`group-${perm.flag}`}
                    label={`${perm.flag} - ${perm.description}`}
                    checked={permGroupForm.flags.includes(perm.flag)}
                    onChange={(checked) => {
                      if (checked) {
                        setPermGroupForm({...permGroupForm, flags: [...permGroupForm.flags, perm.flag]})
                      } else {
                        setPermGroupForm({...permGroupForm, flags: permGroupForm.flags.filter(f => f !== perm.flag)})
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setPermGroupDialog(false)} className="text-zinc-400 hover:text-zinc-100">Cancelar</Button>
              <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">
                {editingPermGroup ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Grupo de Servidores */}
      <Dialog open={serverGroupDialog} onOpenChange={setServerGroupDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editingServerGroup ? 'Editar Grupo de Servidores' : 'Nuevo Grupo de Servidores'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveServerGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serverGroupName" className="text-zinc-300">Nombre del Grupo</Label>
              <Input id="serverGroupName" placeholder="Ej: Retakes" value={serverGroupForm.name} onChange={(e) => setServerGroupForm({...serverGroupForm, name: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serverGroupDesc" className="text-zinc-300">Descripción</Label>
              <Input id="serverGroupDesc" placeholder="Descripción del grupo" value={serverGroupForm.description} onChange={(e) => setServerGroupForm({...serverGroupForm, description: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serverGroupColor" className="text-zinc-300">Color</Label>
              <div className="flex gap-2">
                <Input id="serverGroupColor" type="color" value={serverGroupForm.color} onChange={(e) => setServerGroupForm({...serverGroupForm, color: e.target.value})} className="bg-zinc-800 border-zinc-700 w-20 h-10 cursor-pointer" />
                <Input type="text" value={serverGroupForm.color} onChange={(e) => setServerGroupForm({...serverGroupForm, color: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100 flex-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Servidores</Label>
              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 max-h-48 overflow-y-auto space-y-2">
                {allServers.length > 0 ? (
                  allServers.map(server => (
                    <Checkbox
                      key={server.id}
                      id={`server-${server.id}`}
                      label={`${server.name} (${server.address})`}
                      checked={serverGroupForm.serverIds.includes(server.id)}
                      onChange={(checked) => {
                        if (checked) {
                          setServerGroupForm({...serverGroupForm, serverIds: [...serverGroupForm.serverIds, server.id]})
                        } else {
                          setServerGroupForm({...serverGroupForm, serverIds: serverGroupForm.serverIds.filter(id => id !== server.id)})
                        }
                      }}
                    />
                  ))
                ) : (
                  <p className="text-zinc-500 text-sm">No hay servidores disponibles</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setServerGroupDialog(false)} className="text-zinc-400 hover:text-zinc-100">Cancelar</Button>
              <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">
                {editingServerGroup ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Custom Flag */}
      <Dialog open={customFlagDialog} onOpenChange={setCustomFlagDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Crear Flag Personalizado</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCustomFlag} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customFlag" className="text-zinc-300">Flag</Label>
              <Input id="customFlag" placeholder="@custom/mi-flag" value={customFlagForm.flag} onChange={(e) => setCustomFlagForm({...customFlagForm, flag: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
              <p className="text-xs text-zinc-500">El flag debe comenzar con @</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customFlagDesc" className="text-zinc-300">Descripción</Label>
              <Input id="customFlagDesc" placeholder="Descripción del permiso" value={customFlagForm.description} onChange={(e) => setCustomFlagForm({...customFlagForm, description: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
            </div>

            {permissions.filter(p => p.isCustom).length > 0 && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Flags Personalizados Existentes</Label>
                <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 max-h-32 overflow-y-auto space-y-1">
                  {permissions.filter(p => p.isCustom).map(perm => (
                    <div key={perm.flag} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{perm.flag}</span>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleDeleteCustomFlag(perm.flag)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700 p-1">
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCustomFlagDialog(false)} className="text-zinc-400 hover:text-zinc-100">Cancelar</Button>
              <Button type="submit" className="bg-[#FFB800] hover:bg-[#ce9300]">Crear Flag</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}