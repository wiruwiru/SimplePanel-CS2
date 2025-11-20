"use client"

import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"
import { Button } from "@/components/UI/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"
import { DurationInput } from "@/components/Admin/DurationInput"
import { useI18n } from "@/contexts/I18nContext"

const Textarea = ({ placeholder, value, onChange, className = '' }) => (
  <textarea placeholder={placeholder} value={value} onChange={onChange} rows={4} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none w-full ${className}`} style={{ '--tw-ring-color': 'var(--theme-primary)' }} />
)

const Select = ({ value, onChange, children, className = '' }) => (
  <select value={value} onChange={onChange} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full ${className}`} style={{ '--tw-ring-color': 'var(--theme-primary)' }} >
    {children}
  </select>
)

export function MuteForm({ open, onOpenChange, formData, setFormData, onSubmit, onCancel }) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{t('mutes.create')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="steamId" className="text-zinc-300">SteamID64</Label>
            <Input id="steamId" placeholder="76561199074660131" value={formData.steamId} onChange={(e) => setFormData({ ...formData, steamId: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" required  />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className="text-zinc-300">{t('admin.mutes.mute_type')}</Label>
            <Select id="type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="MUTE">{t('admin.mutes.mute_type_voice')}</option>
              <option value="GAG">{t('admin.mutes.mute_type_chat')}</option>
              <option value="SILENCE">{t('admin.mutes.mute_type_both')}</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-zinc-300">{t('common.reason')}</Label>
            <Textarea id="reason" placeholder={t('mutes.reason_placeholder')} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-zinc-300">{t('common.duration')}</Label>
            <DurationInput value={formData.duration} onChange={(newValue) => setFormData({ ...formData, duration: newValue })} allowPermanent={true}
              presets={[
                { value: 30, label: t('duration.presets.30_min') },
                { value: 60, label: t('duration.presets.1_hour') },
                { value: 180, label: t('duration.presets.3_hours') },
                { value: 360, label: t('duration.presets.6_hours') },
                { value: 720, label: t('duration.presets.12_hours') },
                { value: 1440, label: t('duration.presets.1_day') },
                { value: 2880, label: t('duration.presets.2_days') },
                { value: 4320, label: t('duration.presets.3_days') },
                { value: 10080, label: t('duration.presets.1_week') },
                { value: 20160, label: t('duration.presets.2_weeks') },
                { value: 43200, label: t('duration.presets.1_month') },
                { value: 86400, label: t('duration.presets.2_months') }
              ]} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">{t('common.cancel')}</Button>
            <Button type="submit" className="hover:opacity-90" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; }}>{t('mutes.create_mute')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}