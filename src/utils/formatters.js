/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export function formatDuration(minutes) {
  if (!minutes || minutes === 0) return 'Permanente'
  if (minutes < 60) return `${minutes} minutos`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} horas`
  return `${Math.floor(minutes / 1440)} días`
}

/**
 * Format date to locale string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return 'N/A'
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options
  }
  
  return new Date(date).toLocaleString('es-AR', defaultOptions)
}

/**
 * Format date without time
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateOnly(date) {
  return formatDate(date, {
    hour: undefined,
    minute: undefined,
    second: undefined,
  })
}

/**
 * Format time from seconds to human-readable string
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (e.g., "5m", "1h 30m")
 */
export function formatTime(seconds) {
  if (!seconds || seconds === 0) return '0m'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return `${minutes}m`
}

/**
 * Format player count display
 * @param {number} current - Current player count
 * @param {number} max - Maximum player count
 * @returns {string} Formatted player count string
 */
export function formatPlayerCount(current, max) {
  return `${current || 0}/${max || 0}`
}