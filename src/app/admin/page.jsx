"use client"

import withAuth from "@/hooks/withAuth"
import { useAuth } from "@/contexts/AuthContext"
import { Shield, Flag, User } from "lucide-react"

function AdminPage() {
  const { user, flags } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">

        <div className="bg-zinc-900 border-zinc-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Información del visitante</h2>
              <p className="text-sm text-gray-400">Detalles de tu cuenta</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-400">Nombre:</span>
              <span className="text-white">{user?.displayName || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-400">Steam ID:</span>
              <span className="text-white font-mono text-sm">{user?.steamId || "N/A"}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border-zinc-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Flag className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Flags de Permisos</h2>
              <p className="text-sm text-gray-400">Flags asignados a tu cuenta</p>
            </div>
          </div>

          {flags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {flags.map((flag, index) => (
                <span key={index} className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">{flag}</span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No tienes flags asignados</p>
          )}
        </div>

      </div>
    </div>
  )
}

export default withAuth(AdminPage, "@web/root")