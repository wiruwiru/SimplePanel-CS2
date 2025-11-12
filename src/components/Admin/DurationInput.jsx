"use client"

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
        <Input type="text" inputMode="numeric" placeholder="Minutos (ej: 60)" value={value === '0' ? '' : value} onChange={handleInputChange} className="bg-zinc-800 border-zinc-700 text-zinc-100 flex-1" />
        {allowPermanent && (
          <Button type="button" onClick={handlePermanentClick} variant={value === '0' ? 'default' : 'outline'} className={value === '0' ? 'bg-[#FFB800] hover:bg-[#ce9300] text-white' : 'bg-zinc-500 hover:bg-zinc-600 border-zinc-700 text-zinc-900'} >
            Permanente
          </Button>
        )}
      </div>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button key={preset.value} type="button" onClick={() => handlePresetClick(preset.value)} variant={value === String(preset.value) ? 'default' : 'outline'} size="sm" className={value === String(preset.value) ? 'bg-[#FFB800] hover:bg-[#ce9300] text-white' : 'bg-zinc-500 hover:bg-zinc-600 border-zinc-700 text-zinc-900 text-xs'} >
              {preset.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDuration(minutes) {
  if (!minutes || minutes === 0) return 'Permanente'
  if (minutes < 60) return `${minutes} minutos`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} horas`
  return `${Math.floor(minutes / 1440)} días`
}