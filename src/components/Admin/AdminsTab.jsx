"use client"

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { addToast } from "@heroui/react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/UI/card"
import { Spinner } from "@/components/UI/spinner"
import { AdminsList } from "@/components/Admin/AdminsTab/AdminsList"
import { PermissionGroups } from "@/components/Admin/AdminsTab/PermissionGroups"
import { ServerGroups } from "@/components/Admin/AdminsTab/ServerGroups"
import { CustomFlags } from "@/components/Admin/AdminsTab/CustomFlags"

export function AdminsTab() {
  const { hasFlag } = useAuth()
  const [loading, setLoading] = useState(true)
  const [admins, setAdmins] = useState([])
  const [permissionGroups, setPermissionGroups] = useState([])
  const [serverGroups, setServerGroups] = useState([])
  const [permissions, setPermissions] = useState([])
  const [profiles, setProfiles] = useState({})
  const [allServers, setAllServers] = useState([])

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
    <div className="space-y-6">
      <AdminsList admins={admins} profiles={profiles} permissions={permissions} permissionGroups={permissionGroups} serverGroups={serverGroups} onRefresh={fetchAllData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PermissionGroups  groups={permissionGroups} permissions={permissions} onRefresh={fetchAllData} />
        <ServerGroups  groups={serverGroups} allServers={allServers} onRefresh={fetchAllData} />
      </div>

      <CustomFlags permissions={permissions} onRefresh={fetchAllData} />
    </div>
  )
}