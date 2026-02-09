import { useState, useCallback } from 'react'

export function useProfiles() {
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(false)

  const fetchProfiles = useCallback(async (steamIds) => {
    if (!steamIds || steamIds.length === 0) return

    const idsString = Array.isArray(steamIds) 
      ? steamIds.filter(Boolean).join(',') 
      : steamIds

    if (!idsString) return

    setLoading(true)
    try {
      const response = await fetch(`/api/profiles?ids=${idsString}`)
      if (response.ok) {
        const data = await response.json()
        setProfiles(prev => ({ ...prev, ...data }))
        return data
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const getProfile = useCallback((steamId) => {
    return profiles[steamId] || null
  }, [profiles])

  const getAvatarUrl = useCallback((steamId) => {
    return profiles[steamId]?.avatarUrl || "/placeholder.svg?height=40&width=40"
  }, [profiles])

  const getDisplayName = useCallback((steamId, fallback = '') => {
    return profiles[steamId]?.displayName || fallback
  }, [profiles])

  return {
    profiles,
    loading,
    fetchProfiles,
    getProfile,
    getAvatarUrl,
    getDisplayName
  }
}