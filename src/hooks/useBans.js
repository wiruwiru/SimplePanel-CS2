import { useState, useEffect, useCallback } from 'react'
import { useProfiles } from './useProfiles'

const ITEMS_PER_PAGE = 20

export function useBans() {
  const [bans, setBans] = useState([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const { fetchProfiles, getAvatarUrl, getDisplayName } = useProfiles()

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
      const response = await fetch(
        `/api/admin/sanctions/bans?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(debouncedSearch)}`,
        { cache: "no-store" }
      )
      if (response.ok) {
        const data = await response.json()
        setBans(data.bans)
        setTotal(data.total)

        const steamIds = data.bans.map(ban => ban.steamId).filter(id => id && id !== "")
        if (steamIds.length > 0) {
          await fetchProfiles(steamIds)
        }
      }
    } catch (error) {
      console.error("Error fetching bans:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, fetchProfiles])

  useEffect(() => {
    fetchBans()
  }, [fetchBans])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  return {
    bans,
    search,
    setSearch,
    currentPage,
    total,
    totalPages,
    startIndex,
    loading,
    getAvatarUrl,
    getDisplayName,
    handlePageChange,
    refetch: fetchBans
  }
}