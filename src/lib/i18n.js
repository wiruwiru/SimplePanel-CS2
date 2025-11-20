export const defaultLocale = 'en-US'

const localeNames = {
  'en-US': 'English',
  'en': 'English',
  'es-ES': 'Español',
  'es': 'Español',
  'fr-FR': 'Français',
  'fr': 'Français',
  'de-DE': 'Deutsch',
  'de': 'Deutsch',
  'it-IT': 'Italiano',
  'it': 'Italiano',
  'pt-BR': 'Português (Brasil)',
  'pt': 'Português',
}

export const getLocaleName = (locale) => {
  if (localeNames[locale]) {
    return localeNames[locale]
  }
  
  const langCode = locale.split('-')[0]
  if (localeNames[langCode]) {
    return localeNames[langCode]
  }
  
  return locale
}

export const getAvailableLocales = async () => {
  try {
    const response = await fetch('/api/locales', { cache: 'no-store' })
    if (!response.ok) {
      throw new Error('Failed to fetch locales')
    }
    const { locales } = await response.json()
    
    if (!locales || locales.length === 0) {
      return [{ code: defaultLocale, name: getLocaleName(defaultLocale) }]
    }
    
    return locales.map(locale => ({
      code: locale,
      name: getLocaleName(locale),
    }))
  } catch (error) {
    console.error('Error loading locales:', error)
    return [{ code: defaultLocale, name: getLocaleName(defaultLocale) }]
  }
}

export const getLocalesSync = () => {
  return [defaultLocale]
}

export const getDictionary = async (locale) => {
  const normalizedLocale = locale || defaultLocale
  
  try {
    const localesResponse = await fetch('/api/locales', { cache: 'no-store' })
    let availableLocales = [defaultLocale]
    
    if (localesResponse.ok) {
      const { locales } = await localesResponse.json()
      if (locales && locales.length > 0) {
        availableLocales = locales
      }
    }
    
    const localeKey = availableLocales.includes(normalizedLocale) ? normalizedLocale : defaultLocale
    
    const response = await fetch(`/lang/${localeKey}.json`, { cache: 'force-cache' })
    if (!response.ok) {
      throw new Error(`Failed to load locale: ${localeKey}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading dictionary:', error)
    if (normalizedLocale !== defaultLocale) {
      return getDictionary(defaultLocale)
    }
    return {}
  }
}