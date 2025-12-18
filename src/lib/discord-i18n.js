import { readFile } from 'fs/promises'
import { join } from 'path'

export async function getDiscordTranslations() {
  try {
    const defaultLocale = process.env.DEFAULT_LANG || 'en-US'
    const langFile = join(process.cwd(), 'public', 'lang', `${defaultLocale}.json`)
    
    const fileContent = await readFile(langFile, 'utf-8')
    const translations = JSON.parse(fileContent)
    
    return translations.discord || {}
  } catch (error) {
    console.error('Error loading Discord translations:', error)
    return {
      actions: {
        create: 'created',
        update: 'modified',
        delete: 'deleted',
        unban: 'unbanned',
        unmute: 'unmuted'
      },
      types: {
        ban: 'Ban',
        mute: 'Mute'
      },
      fields: {
        player: '👤 Player',
        steamid: '🆔 SteamID',
        ip: '🌐 IP',
        reason: '📝 Reason',
        duration: '⏱️ Duration',
        expires: '📅 Expires',
        type: '🔇 Type',
        status: 'Status',
        administrator: '👨‍💼 Administrator',
        sanction_id: '🆔 Sanction ID',
        changes_made: '🔄 Changes made'
      },
      values: {
        unknown: 'Unknown',
        no_reason: 'No reason specified',
        root: 'Root',
        not_available: 'N/A'
      }
    }
  }
}