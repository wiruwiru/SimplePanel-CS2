"use client"

import { useI18n } from "@/contexts/I18nContext"
import { Input } from "@/components/UI/input"
import { Button } from "@/components/UI/button"

/**
 * @param {Object} props
 * @param {string} value - Current duration value in minutes
 * @param {Function} onChange - Change handler
 * @param {Array} presets - Array of preset options {value: number, label: string}
 * @param {boolean} allowPermanent - Whether to allow permanent (0) option
 */
export function DurationInput({ value, onChange, presets = [], allowPermanent = false }) {
  const { t } = useI18n()
  
  const handleInputChange = (e) => {
    const inputValue = e.target.value
    if (inputValue === '' || /^\d+$/.test(inputValue)) {
      onChange(inputValue)
    }
  }

  const handlePresetClick = (presetValue) => {
    onChange(String(presetValue))
  }

  const handlePermanentClick = () => {
    onChange('0')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input type="text" inputMode="numeric" placeholder={t('duration.minutes_placeholder')} value={value === '0' ? '' : value} onChange={handleInputChange} className="bg-zinc-800 border-zinc-700 text-zinc-100 flex-1" />
        {allowPermanent && (
          <Button type="button" onClick={handlePermanentClick} variant={value === '0' ? 'default' : 'outline'} style={value === '0' ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' } : {}} className={value === '0' ? 'hover:opacity-90' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'} onMouseEnter={value === '0' ? (e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; } : undefined} onMouseLeave={value === '0' ? (e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; } : undefined}>
            {t('duration.permanent')}
          </Button>
        )}
      </div>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button key={preset.value} type="button" onClick={() => handlePresetClick(preset.value)} variant={value === String(preset.value) ? 'default' : 'outline'} size="sm" style={value === String(preset.value) ? { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' } : {}} className={value === String(preset.value) ? 'hover:opacity-90 text-xs' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 text-xs'} onMouseEnter={value === String(preset.value) ? (e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; } : undefined} onMouseLeave={value === String(preset.value) ? (e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; } : undefined}>
              {preset.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDuration(minutes) {
  if (!minutes || minutes === 0) return 'Permanent'
  if (minutes < 60) return `${minutes} minutes`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`
  return `${Math.floor(minutes / 1440)} days`
}