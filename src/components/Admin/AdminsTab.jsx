"use client"

import { useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext"
import { useI18n } from "@/contexts/I18nContext"
import { Card, CardContent } from "@/components/UI/card"
import { Spinner } from "@/components/UI/spinner"
import { useAdmins } from "@/hooks/useAdmins"
import { AdminsList } from "@/components/Admin/AdminsTab/AdminsList"
import { PermissionGroups } from "@/components/Admin/AdminsTab/PermissionGroups"
import { ServerGroups } from "@/components/Admin/AdminsTab/ServerGroups"
import { CustomFlags } from "@/components/Admin/AdminsTab/CustomFlags"

export function AdminsTab() {
  const { hasFlag } = useAuth()
  const { t } = useI18n()
  const canManage = hasFlag('@web/root')
  const { admins, permissionGroups, serverGroups, permissions, allServers, profiles, loading, fetchAllData } = useAdmins()

  useEffect(() => {
    if (canManage) {
      fetchAllData()
    }
  }, [canManage, fetchAllData])

  if (!canManage) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <Shield className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>{t('admin.admins.no_permissions')}</p>
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
            <Spinner className="size-8" style={{ color: 'var(--theme-primary)' }} />
            <span className="ml-3 text-zinc-400">{t('admin.admins.loading')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <AdminsList admins={admins} profiles={profiles} permissions={permissions} permissionGroups={permissionGroups} serverGroups={serverGroups} onRefresh={fetchAllData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PermissionGroups groups={permissionGroups} permissions={permissions} onRefresh={fetchAllData} />
        <ServerGroups groups={serverGroups} allServers={allServers} onRefresh={fetchAllData} />
      </div>

      <CustomFlags permissions={permissions} onRefresh={fetchAllData} />
    </div>
  )
}