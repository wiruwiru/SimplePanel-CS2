"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Search, Filter, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useI18n } from "@/contexts/I18nContext"
import { useChatLogs } from "@/hooks/useChatLogs"
import { Input } from "@/components/UI/input"
import { Button } from "@/components/UI/button"
import { ChatLogsList } from "@/components/Admin/ChatLogsTab/ChatLogsList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"

export function ChatLogsTab() {
  const { hasFlag } = useAuth()
  const { t } = useI18n()
  const [showFilters, setShowFilters] = useState(false)
  const [enableChatLogs, setEnableChatLogs] = useState(true)
  
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/config", { cache: "no-store" })
        if (response.ok) {
          const config = await response.json()
          setEnableChatLogs(config.enableChatLogs !== false)
        }
      } catch (error) {
        console.error("Error loading config:", error)
      }
    }
    loadConfig()
  }, [])
  
  const canView = hasFlag("@web/chatlogs.view")
  const { chatlogs, search, setSearch, playerSearch, setPlayerSearch, team, setTeam, messageType, setMessageType, serverId, setServerId, servers, currentPage, total, totalPages, startIndex, loading, getAvatarUrl, getDisplayName, handlePageChange, clearFilters, hasActiveFilters, refetch } = useChatLogs(canView && enableChatLogs)

  if (!enableChatLogs) {
    return null
  }

  if (!canView) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>{t('admin.chat_logs.no_permissions')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5" style={{ color: 'var(--theme-primary)' }} />
            <div>
              <CardTitle className="text-zinc-100">{t('admin.chat_logs.title')}</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">{t('admin.chat_logs.description')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
              <Filter className="size-4 mr-2" />
              {t('admin.chat_logs.filters')}
              {hasActiveFilters && <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }}>!</span>}
            </Button>
            <Button variant="outline" size="sm" onClick={refetch} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" title="Refrescar">
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input placeholder={t('admin.chat_logs.search_messages_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input placeholder={t('admin.chat_logs.search_player_placeholder')} value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)} className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>

          {showFilters && (
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-300 font-medium">{t('admin.chat_logs.advanced_filters')}</span>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-zinc-200 hover:bg-zinc-800">
                    {t('admin.chat_logs.clear_filters')}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-muted-foreground text-sm mb-1 block">{t('admin.chat_logs.team')}</label>
                  <select value={team} onChange={(e) => setTeam(e.target.value)} className="bg-card border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full" >
                    <option value="">{t('admin.chat_logs.all_teams')}</option>
                    <option value="0">NONE</option>
                    <option value="1">SPECT</option>
                    <option value="2">TT</option>
                    <option value="3">CT</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm mb-1 block">{t('admin.chat_logs.message_type')}</label>
                  <select value={messageType} onChange={(e) => setMessageType(e.target.value)} className="bg-card border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full" >
                    <option value="">{t('admin.chat_logs.all_types')}</option>
                    <option value="global">{t('admin.chat_logs.global')}</option>
                    <option value="team">{t('admin.chat_logs.team_msg')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm mb-1 block">{t('admin.chat_logs.server')}</label>
                  <select value={serverId} onChange={(e) => setServerId(e.target.value)} className="bg-card border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full" >
                    <option value="">{t('admin.chat_logs.all_servers')}</option>
                    {servers.map((server) => (
                      <option key={server.id} value={server.id}>
                        {server.name || `${t('admin.chat_logs.server_name')} ${server.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <ChatLogsList chatlogs={chatlogs} loading={loading} getAvatarUrl={getAvatarUrl} getDisplayName={getDisplayName} currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} total={total} onPageChange={handlePageChange} />
      </CardContent>
    </Card>
  )
}