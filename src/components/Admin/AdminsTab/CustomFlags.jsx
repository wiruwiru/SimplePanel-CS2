"use client"

import { useState } from 'react'
import { Tag, Plus, Trash2 } from 'lucide-react'
import { addToast } from "@heroui/react"
import { useI18n } from "@/contexts/I18nContext"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/UI/alert-dialog"

export function CustomFlags({ permissions, onRefresh }) {
  const { t } = useI18n()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteAlert, setDeleteAlert] = useState({ open: false, flag: null })
  const [formData, setFormData] = useState({
    flag: '@custom/',
    description: ''
  })

  const customFlags = permissions.filter(p => p.isCustom)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/admins/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        addToast({ title: t('permissions.custom_flags.created_success'), color: 'success', variant: 'solid' })
        setDialogOpen(false)
        setFormData({ flag: '@custom/', description: '' })
        onRefresh()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error saving custom flag:', error)
      addToast({ title: t('permissions.custom_flags.create_error'), color: 'danger', variant: 'solid' })
    }
  }

  const handleDeleteClick = (flag) => {
    setDeleteAlert({ open: true, flag })
  }

  const handleDeleteConfirm = async () => {
    const flag = deleteAlert.flag
    try {
      const response = await fetch(`/api/admin/admins/permissions?flag=${encodeURIComponent(flag)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addToast({ title: t('permissions.custom_flags.delete_success'), color: 'success', variant: 'solid' })
        onRefresh()
      } else {
        const error = await response.json()
        addToast({ title: error.error || 'Error', color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error deleting custom flag:', error)
      addToast({ title: t('permissions.custom_flags.delete_error'), color: 'danger', variant: 'solid' })
    } finally {
      setDeleteAlert({ open: false, flag: null })
    }
  }

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Tag className="size-5" style={{ color: 'var(--theme-primary)' }} />
              {t('permissions.custom_flags.title')}
            </CardTitle>
            <Button onClick={() => setDialogOpen(true)} size="sm" className="hover:opacity-90" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
              <Plus className="size-4 mr-2" />
              {t('permissions.custom_flags.new_flag')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customFlags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {customFlags.map((flag) => (
                <div key={flag.flag} className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-zinc-100 font-medium text-sm mb-1 break-all">{flag.flag}</div>
                      <div className="text-zinc-400 text-xs wrap-break-words">{flag.description}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteClick(flag.flag)} className="bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-700 p-1.5 shrink-0" >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400">{t('permissions.custom_flags.no_flags')}</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">{t('permissions.custom_flags.create_flag')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customFlag" className="text-zinc-300">{t('permissions.custom_flags.flag')}</Label>
              <Input id="customFlag" placeholder={t('permissions.custom_flags.flag_placeholder')} value={formData.flag} onChange={(e) => setFormData({...formData, flag: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
              <p className="text-xs text-zinc-500">{t('permissions.custom_flags.flag_hint')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customFlagDesc" className="text-zinc-300">{t('permissions.server_groups.description')}</Label>
              <Input id="customFlagDesc" placeholder={t('permissions.custom_flags.description_placeholder')} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => {setDialogOpen(false); setFormData({ flag: '@custom/', description: '' })}} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" >{t('common.cancel')}</Button>
              <Button type="submit" className="hover:opacity-90" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>{t('permissions.custom_flags.new_flag')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteAlert.open} onOpenChange={(open) => setDeleteAlert({ open, flag: null })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">{t('permissions.custom_flags.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t('permissions.custom_flags.delete_confirm_description')} <strong className="text-zinc-200">{deleteAlert.flag}</strong>? {t('permissions.custom_flags.delete_confirm_warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ open: false, flag: null })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}