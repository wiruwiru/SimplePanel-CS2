import { useState, useEffect, useCallback } from 'react'
import { useProfiles } from './useProfiles'

const ITEMS_PER_PAGE = 20

export function useChatLogs(canView = true) {
  const [chatlogs, setChatlogs] = useState([])
  const [search, setSearch] = useState("")
  const [playerSearch, setPlayerSearch] = useState("")
  const [team, setTeam] = useState("")
  const [messageType, setMessageType] = useState("")
  const [serverId, setServerId] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [debouncedPlayerSearch, setDebouncedPlayerSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [servers, setServers] = useState([])
  const { fetchProfiles, getAvatarUrl, getDisplayName } = useProfiles()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPlayerSearch(playerSearch)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [playerSearch])

  useEffect(() => {
    setCurrentPage(1)
  }, [team, messageType, serverId])

  const fetchServers = useCallback(async () => {
    try {
      let response = await fetch("/api/servers", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setServers(data.map(server => ({ id: server.id, name: server.name })))
        return
      }
      response = await fetch("/api/admin/servers", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setServers(data)
      }
    } catch (error) {
      console.error("Error fetching servers:", error)
    }
  }, [])

  const fetchChatlogs = useCallback(async () => {
    if (!canView) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      })

      if (debouncedSearch) params.append("search", debouncedSearch)
      if (debouncedPlayerSearch) params.append("playerSearch", debouncedPlayerSearch)
      if (team !== "") params.append("team", team)
      if (messageType !== "") params.append("messageType", messageType)
      if (serverId) params.append("serverId", serverId)

      const response = await fetch(`/api/admin/chatlogs?${params.toString()}`, { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setChatlogs(data.chatlogs)
        setTotal(data.total)

        const steamIds = data.chatlogs
          .map((log) => log.playerSteam64)
          .filter((id) => id && id !== "")
        if (steamIds.length > 0) {
          await fetchProfiles(steamIds)
        }
      }
    } catch (error) {
      console.error("Error fetching chatlogs:", error)
    } finally {
      setLoading(false)
    }
  }, [canView, currentPage, debouncedSearch, debouncedPlayerSearch, team, messageType, serverId, fetchProfiles])

  useEffect(() => {
    if (canView) {
      fetchServers()
    }
  }, [canView, fetchServers])

  useEffect(() => {
    if (canView) {
      fetchChatlogs()
    }
  }, [canView, fetchChatlogs])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const clearFilters = useCallback(() => {
    setTeam("")
    setMessageType("")
    setServerId("")
    setSearch("")
    setPlayerSearch("")
    setCurrentPage(1)
  }, [])

  const hasActiveFilters = team !== "" || messageType !== "" || serverId !== "" || search !== "" || playerSearch !== ""

  return {
    chatlogs,
    search,
    setSearch,
    playerSearch,
    setPlayerSearch,
    team,
    setTeam,
    messageType,
    setMessageType,
    serverId,
    setServerId,
    servers,
    currentPage,
    total,
    totalPages,
    startIndex,
    loading,
    getAvatarUrl,
    getDisplayName,
    handlePageChange,
    clearFilters,
    hasActiveFilters,
    refetch: fetchChatlogs
  }
}