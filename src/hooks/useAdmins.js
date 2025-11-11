import { useState, useEffect, useCallback } from 'react'
import { addToast } from "@heroui/react"
import { useProfiles } from './useProfiles'

export function useAdmins() {
  const [admins, setAdmins] = useState([])
  const [permissionGroups, setPermissionGroups] = useState([])
  const [serverGroups, setServerGroups] = useState([])
  const [permissions, setPermissions] = useState([])
  const [allServers, setAllServers] = useState([])
  const [loading, setLoading] = useState(true)
  const { fetchProfiles, profiles, getAvatarUrl, getDisplayName } = useProfiles()

  const fetchAllData = useCallback(async () => {
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
        
        const steamIds = data.admins.map(a => a.steamId).filter(Boolean)
        if (steamIds.length > 0) {
          await fetchProfiles(steamIds)
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
  }, [fetchProfiles])

  return {
    admins,
    permissionGroups,
    serverGroups,
    permissions,
    allServers,
    profiles,
    loading,
    getAvatarUrl,
    getDisplayName,
    fetchAllData
  }
}