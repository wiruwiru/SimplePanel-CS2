"use client"

import { useState, Children, cloneElement, isValidElement } from 'react';
import { Shield } from "lucide-react"
import withAuth from "@/hooks/withAuth"
import { useAuth } from "@/contexts/AuthContext"
import { useI18n } from "@/contexts/I18nContext"
import { BansTab } from "@/components/Admin/BansTab"
import { MutesTab } from "@/components/Admin/MutesTab"
import { AdminsTab } from "@/components/Admin/AdminsTab"
import { ServersTab } from "@/components/Admin/ServersTab"
import { PlayerSearchTab } from "@/components/Admin/PlayerSearchTab"
import { ChatLogsTab } from "@/components/Admin/ChatLogsTab"

const Tabs = ({ defaultValue, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className="w-full">
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return null;
        
        if (child.type === TabsList) {
          return cloneElement(child, { activeTab, setActiveTab });
        }
        
        if (child.type === TabsContent && child.props.value === activeTab) {
          return child;
        }
        return null;
      })}
    </div>
  );
};

const TabsList = ({ children, activeTab, setActiveTab }) => (
  <div className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-6">
    {Children.map(children, (child) => {
      if (!isValidElement(child)) return null;
      return cloneElement(child, { activeTab, setActiveTab });
    })}
  </div>
);

const TabsTrigger = ({ value, children, activeTab, setActiveTab }) => (
  <button 
    onClick={() => setActiveTab(value)} 
    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === value ? '' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'}`}
    style={activeTab === value ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' } : {}}
    onMouseEnter={activeTab === value ? (e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; } : undefined}
    onMouseLeave={activeTab === value ? (e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; } : undefined}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children }) => (
  <div>{children}</div>
);

function AdminPage() {
  const { user, flags } = useAuth()
  const { t } = useI18n()

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="size-8" style={{ color: 'var(--theme-primary)' }} />
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-1">{t('admin.title')}</h2>
          <p className="text-zinc-400 text-sm md:text-base">{t('admin.description')}</p>
        </div>
      </div>

      <Tabs defaultValue="bans">
        <TabsList>
          <TabsTrigger value="bans">{t('admin.tabs.bans')}</TabsTrigger>
          <TabsTrigger value="mutes">{t('admin.tabs.mutes')}</TabsTrigger>
          <TabsTrigger value="playersearch">{t('admin.tabs.player_search')}</TabsTrigger>
          <TabsTrigger value="chatlogs">{t('admin.tabs.chat_logs')}</TabsTrigger>
          <TabsTrigger value="admins">{t('admin.tabs.admins')}</TabsTrigger>
          <TabsTrigger value="servers">{t('admin.tabs.servers')}</TabsTrigger>
        </TabsList>

        <TabsContent value="bans">
          <BansTab />
        </TabsContent>

        <TabsContent value="mutes">
          <MutesTab />
        </TabsContent>

        <TabsContent value="playersearch">
          <PlayerSearchTab />
        </TabsContent>

        <TabsContent value="chatlogs">
          <ChatLogsTab />
        </TabsContent>

        <TabsContent value="admins">
          <AdminsTab />
        </TabsContent>

        <TabsContent value="servers">
          <ServersTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default withAuth(AdminPage, "@web/access")