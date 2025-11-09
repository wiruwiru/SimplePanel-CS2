"use client"

import { useState } from 'react';
import { Shield } from "lucide-react"
import withAuth from "@/hooks/withAuth"
import { useAuth } from "@/contexts/AuthContext"
import { BansTab } from "@/components/Admin/BansTab"
import { MutesTab } from "@/components/Admin/MutesTab"
import { AdminsTab } from "@/components/Admin/AdminsTab"
import { ServersTab } from "@/components/Admin/ServersTab"
import { SettingsTab } from "@/components/Admin/SettingsTab"

const Tabs = ({ defaultValue, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className="w-full">
      {children.map((child, index) => {
        if (child.type.name === 'TabsList') {
          return <child.type {...child.props} activeTab={activeTab} setActiveTab={setActiveTab} key={`tabs-list-${index}`} />;
        }
        if (child.type.name === 'TabsContent' && child.props.value === activeTab) {
          return <div key={`tabs-content-${index}`}>{child}</div>;
        }
        return null;
      })}
    </div>
  );
};

const TabsList = ({ children, activeTab, setActiveTab }) => (
  <div className="grid w-full grid-cols-2 md:grid-cols-5 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-6">
    {children.map((child, index) => (
      <child.type {...child.props} activeTab={activeTab} setActiveTab={setActiveTab} key={`trigger-${index}`} />
    ))}
  </div>
);

const TabsTrigger = ({ value, children, activeTab, setActiveTab }) => (
  <button onClick={() => setActiveTab(value)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === value ? 'bg-[#FFB800] text-white' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'}`}>{children}</button>
);

const TabsContent = ({ value, children }) => (
  <div>{children}</div>
);

function AdminPage() {
  const { user, flags } = useAuth()

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="size-8 text-[#FFB800]" />
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-1">Panel de administración</h2>
          <p className="text-zinc-400 text-sm md:text-base">Añade nuevas sanciones, modifica las existentes o simplemente busca información de un jugador sancionado.</p>
        </div>
      </div>

      <Tabs defaultValue="bans">
        <TabsList>
          <TabsTrigger value="bans">Baneos</TabsTrigger>
          <TabsTrigger value="mutes">Muteos</TabsTrigger>
          <TabsTrigger value="admins">Administradores</TabsTrigger>
          <TabsTrigger value="servers">Servidores</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="bans">
          <BansTab />
        </TabsContent>

        <TabsContent value="mutes">
          <MutesTab />
        </TabsContent>

        <TabsContent value="admins">
          <AdminsTab />
        </TabsContent>

        <TabsContent value="servers">
          <ServersTab />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default withAuth(AdminPage, "@web/access")